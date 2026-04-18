// Fetches recent ADCB emails via Gmail API, parses them with Lovable AI (Gemini),
// and inserts new transactions into the user's transactions table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!resp.ok) throw new Error(`Refresh failed: ${await resp.text()}`);
  return await resp.json();
}

function decodeBase64Url(str: string): string {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
  } catch {
    return "";
  }
}

function extractEmailBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Url(part.body.data).replace(/<[^>]+>/g, " ");
      }
    }
    for (const part of payload.parts) {
      const nested = extractEmailBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

async function parseEmailWithAI(subject: string, body: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const prompt = `You are a transaction extractor for bank email alerts from ANY bank worldwide.
Extract the transaction details from the email below. Reply with ONLY a JSON object in this exact format:
{"is_transaction": true|false, "amount": number, "currency": "AED", "type": "expense"|"income", "merchant": "string", "date_iso": "YYYY-MM-DD", "category": "string"}

Rules:
- If this is NOT a transaction notification (e.g., promo, statement, OTP, marketing), set is_transaction=false and leave other fields null.
- Apple Pay / Google Pay / card purchases / POS / online purchase / debit = "expense".
- Salary, refund, transfer-in, deposit, credit = "income".
- category should be one of: Food, Shopping, Transport, Bills, Entertainment, Health, Travel, Groceries, Other.
- amount is the numeric value only (no currency symbol). Use the email's currency (default AED).

Subject: ${subject}
Body: ${body.slice(0, 3000)}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    console.error("AI parse failed:", await resp.text());
    return null;
  }
  const data = await resp.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Optional flags from query string OR request body
  const url = new URL(req.url);
  let fullScan = url.searchParams.get("fullScan") === "1";
  let resetFilters = url.searchParams.get("resetFilters") === "1";
  if (req.method === "POST") {
    try {
      const body = await req.clone().json();
      if (body?.fullScan) fullScan = true;
      if (body?.resetFilters) resetFilters = true;
    } catch { /* no body */ }
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: cfg } = await admin
      .from("gmail_sync_config")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!cfg || !cfg.refresh_token) {
      return new Response(JSON.stringify({ error: "Not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh token if expired
    let accessToken = cfg.access_token;
    const expired = !cfg.token_expires_at || new Date(cfg.token_expires_at) <= new Date(Date.now() + 60_000);
    if (expired) {
      const refreshed = await refreshAccessToken(cfg.refresh_token);
      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString();
      await admin
        .from("gmail_sync_config")
        .update({ access_token: accessToken, token_expires_at: newExpiry })
        .eq("id", cfg.id);
    }

    // If user requested resetFilters, clear the saved filter list now.
    if (resetFilters && cfg.email_filters && cfg.email_filters.length > 0) {
      await admin.from("gmail_sync_config").update({ email_filters: [] }).eq("id", cfg.id);
      cfg.email_filters = [];
    }

    // Build Gmail search window.
    // - Normal sync: from last_sync_at (only NEW emails since last run).
    // - fullScan: last 30 days only (user explicitly does NOT want old transactions).
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
    let sinceDate: Date;
    if (fullScan) {
      sinceDate = thirtyDaysAgo;
    } else if (cfg.last_sync_at) {
      // Use the more recent of last_sync_at vs 30 days ago — never look further back than 30 days.
      const last = new Date(cfg.last_sync_at);
      sinceDate = last > thirtyDaysAgo ? last : thirtyDaysAgo;
    } else {
      sinceDate = thirtyDaysAgo;
    }
    const afterEpoch = Math.floor(sinceDate.getTime() / 1000);

    // Match transaction emails from ANY bank. Users can override with custom email_filters.
    let filterClause: string;
    if (!fullScan && cfg.email_filters && cfg.email_filters.length > 0) {
      filterClause = "(" + cfg.email_filters.map((f: string) => `from:${f}`).join(" OR ") + ")";
    } else {
      filterClause =
        "(transaction OR purchase OR debited OR credited OR payment OR spent OR " +
        '"apple pay" OR "google pay" OR pos OR card OR ' +
        "from:bank OR from:adcb.com OR from:liv.me OR from:emiratesnbd.com OR from:emiratesnbd.ae OR " +
        "from:fab.ae OR from:mashreq.com OR from:hsbc OR from:citi OR from:rakbank OR " +
        "from:dib.ae OR from:adib.ae)";
    }
    const query = `${filterClause} after:${afterEpoch}`;
    console.log("Gmail query:", query, "fullScan:", fullScan);

    // Paginate Gmail list (cap low so the function fits in 150s).
    const messages: { id: string }[] = [];
    let pageToken: string | undefined = undefined;
    const MAX_MESSAGES = 60;
    do {
      const pageUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
      pageUrl.searchParams.set("q", query);
      pageUrl.searchParams.set("maxResults", "60");
      if (pageToken) pageUrl.searchParams.set("pageToken", pageToken);
      const listResp = await fetch(pageUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!listResp.ok) {
        const errText = await listResp.text();
        console.error("Gmail list failed:", errText);
        return new Response(JSON.stringify({ error: "Gmail API failed", details: errText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const listData = await listResp.json();
      const batch0 = listData.messages ?? [];
      messages.push(...batch0);
      pageToken = listData.nextPageToken;
      if (messages.length >= MAX_MESSAGES) break;
    } while (pageToken);
    console.log(`Gmail returned ${messages.length} messages`);

    // Pre-fetch already-imported gmail message ids in ONE query (avoids N round-trips per message).
    const { data: existingRows } = await admin
      .from("transactions")
      .select("notes")
      .eq("user_id", user.id)
      .ilike("notes", "%[gmail:%");
    const importedIds = new Set<string>();
    for (const row of existingRows ?? []) {
      const m = (row as any).notes?.match(/\[gmail:([^\]]+)\]/);
      if (m) importedIds.add(m[1]);
    }

    // Filter out already-imported BEFORE doing any expensive AI work.
    const toProcess = messages.filter((m) => !importedIds.has(m.id));
    const alreadySkipped = messages.length - toProcess.length;

    // Cap per-run processing so we never approach the 150s limit.
    const PROCESS_LIMIT = 25;
    const batch = toProcess.slice(0, PROCESS_LIMIT);
    const deferred = toProcess.length - batch.length;

    let created = 0;
    let skipped = alreadySkipped;
    const scanned = messages.length;

    // Process in parallel chunks of 5 to keep wall-clock low.
    const CHUNK = 5;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const chunk = batch.slice(i, i + CHUNK);
      const results = await Promise.all(chunk.map(async (msg) => {
        try {
          const msgResp = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!msgResp.ok) return { skipped: true };
          const msgData = await msgResp.json();
          const headers = msgData.payload?.headers ?? [];
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value ?? "";
          const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value;
          const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value ?? "";
          const body = extractEmailBody(msgData.payload);
          if (!body) return { skipped: true };

          const fromLower = fromHeader.toLowerCase();
          let bankName = "Bank";
          if (fromLower.includes("adcb")) bankName = "ADCB";
          else if (fromLower.includes("liv.me") || fromLower.includes("liv.ae")) bankName = "Liv";
          else if (fromLower.includes("emiratesnbd")) bankName = "Emirates NBD";
          else if (fromLower.includes("fab.ae")) bankName = "FAB";
          else if (fromLower.includes("mashreq")) bankName = "Mashreq";
          else if (fromLower.includes("hsbc")) bankName = "HSBC";
          else if (fromLower.includes("citi")) bankName = "Citi";
          else if (fromLower.includes("rakbank")) bankName = "RAKBANK";
          else if (fromLower.includes("dib.ae")) bankName = "DIB";
          else if (fromLower.includes("adib")) bankName = "ADIB";
          else {
            const m = fromLower.match(/@([a-z0-9.-]+)/);
            if (m) bankName = m[1].split(".")[0].toUpperCase();
          }

          const parsed = await parseEmailWithAI(subject, body);
          if (!parsed || !parsed.is_transaction || !parsed.amount) return { skipped: true };

          const txDate = parsed.date_iso
            ? new Date(parsed.date_iso).toISOString()
            : dateHeader
              ? new Date(dateHeader).toISOString()
              : new Date().toISOString();

          if (new Date(txDate) < thirtyDaysAgo) return { skipped: true };

          const noteTag = `[gmail:${msg.id}]`;
          await admin.from("transactions").insert({
            user_id: user.id,
            amount: Number(parsed.amount),
            type: parsed.type === "income" ? "income" : "expense",
            description: parsed.merchant || subject || `${bankName} transaction`,
            category: parsed.category || "Other",
            transaction_date: txDate,
            notes: `Bank: ${bankName} • Auto-imported from Gmail ${noteTag}`,
          });
          return { created: true };
        } catch (e) {
          console.error("msg processing error:", e);
          return { skipped: true };
        }
      }));
      for (const r of results) {
        if (r.created) created++;
        else skipped++;
      }
    }

    await admin
      .from("gmail_sync_config")
      .update({
        last_sync_at: new Date().toISOString(),
        sync_count: (cfg.sync_count ?? 0) + 1,
      })
      .eq("id", cfg.id);

    return new Response(
      JSON.stringify({ success: true, scanned, created, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-gmail-transactions error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
