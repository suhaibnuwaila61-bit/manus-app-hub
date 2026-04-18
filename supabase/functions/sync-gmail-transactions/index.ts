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
  const prompt = `You are a transaction extractor for ADCB (Abu Dhabi Commercial Bank) email alerts.
Extract the transaction details from the email below. Reply with ONLY a JSON object in this exact format:
{"is_transaction": true|false, "amount": number, "currency": "AED", "type": "expense"|"income", "merchant": "string", "date_iso": "YYYY-MM-DD", "category": "string"}

Rules:
- If this is NOT a transaction notification (e.g., promo, statement, OTP), set is_transaction=false and leave other fields null.
- Apple Pay / Google Pay / card purchases / POS / online purchase = "expense".
- Salary, refund, transfer-in, deposit = "income".
- category should be one of: Food, Shopping, Transport, Bills, Entertainment, Health, Travel, Groceries, Other.
- amount is the numeric value only (no currency symbol).

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

    // Build Gmail search query — ADCB transactions in last 7 days (or since last sync)
    const sinceDate = cfg.last_sync_at
      ? new Date(cfg.last_sync_at)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const afterEpoch = Math.floor(sinceDate.getTime() / 1000);
    // Default banks: ADCB + Liv (Emirates NBD). Users can override via email_filters.
    const defaultSenders = [
      "adcb.com",
      "liv.me",
      "emiratesnbd.com",
      "emiratesnbd.ae",
    ];
    const senders =
      cfg.email_filters && cfg.email_filters.length > 0 ? cfg.email_filters : defaultSenders;
    const filterClause = "(" + senders.map((f: string) => `from:${f}`).join(" OR ") + ")";
    const query = `${filterClause} after:${afterEpoch}`;

    const listResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!listResp.ok) {
      const errText = await listResp.text();
      console.error("Gmail list failed:", errText);
      return new Response(JSON.stringify({ error: "Gmail API failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const listData = await listResp.json();
    const messages = listData.messages ?? [];

    let created = 0;
    let scanned = 0;
    let skipped = 0;

    for (const msg of messages) {
      scanned++;
      const msgResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!msgResp.ok) continue;
      const msgData = await msgResp.json();
      const headers = msgData.payload?.headers ?? [];
      const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value ?? "";
      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value;
      const body = extractEmailBody(msgData.payload);
      if (!body) {
        skipped++;
        continue;
      }

      // Idempotency: check if we've already imported this gmail message id
      const noteTag = `[gmail:${msg.id}]`;
      const { data: existing } = await admin
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
        .ilike("notes", `%${noteTag}%`)
        .maybeSingle();
      if (existing) {
        skipped++;
        continue;
      }

      const parsed = await parseEmailWithAI(subject, body);
      if (!parsed || !parsed.is_transaction || !parsed.amount) {
        skipped++;
        continue;
      }

      const txDate = parsed.date_iso
        ? new Date(parsed.date_iso).toISOString()
        : dateHeader
          ? new Date(dateHeader).toISOString()
          : new Date().toISOString();

      await admin.from("transactions").insert({
        user_id: user.id,
        amount: Number(parsed.amount),
        type: parsed.type === "income" ? "income" : "expense",
        description: parsed.merchant || subject || "ADCB transaction",
        category: parsed.category || "Other",
        transaction_date: txDate,
        notes: `Auto-imported from Gmail ${noteTag}`,
      });
      created++;
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
