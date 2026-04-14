import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${text}`);
  }

  return res.json();
}

async function fetchGmailMessages(accessToken: string, query: string, afterDate?: string) {
  let q = query;
  if (afterDate) q += ` after:${afterDate}`;

  const searchRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!searchRes.ok) {
    const text = await searchRes.text();
    throw new Error(`Gmail search failed: ${text}`);
  }

  const searchData = await searchRes.json();
  if (!searchData.messages || searchData.messages.length === 0) return [];

  const messages = [];
  for (const msg of searchData.messages.slice(0, 20)) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (msgRes.ok) {
      messages.push(await msgRes.json());
    }
  }

  return messages;
}

function extractEmailContent(message: any): { subject: string; from: string; body: string; date: string } {
  const headers = message.payload?.headers || [];
  const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
  const from = headers.find((h: any) => h.name === "From")?.value || "";
  const date = headers.find((h: any) => h.name === "Date")?.value || "";

  let body = "";
  const parts = message.payload?.parts || [];
  if (parts.length > 0) {
    const textPart = parts.find((p: any) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      body = atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }
  } else if (message.payload?.body?.data) {
    body = atob(message.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
  }

  // Truncate body to avoid token limits
  if (body.length > 2000) body = body.substring(0, 2000);

  return { subject, from, body, date };
}

async function parseTransactionsWithAI(emails: { subject: string; from: string; body: string; date: string }[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const emailsText = emails.map((e, i) =>
    `--- Email ${i + 1} ---\nFrom: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nBody:\n${e.body}`
  ).join("\n\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a financial email parser. Extract transaction details from bank notification emails. 
For each email that contains a transaction, extract:
- amount (number, always positive)
- type: "income" or "expense"
- category: one of "General", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Salary", "Transfer", "Other"
- description: brief description of the transaction
- transaction_date: ISO date string (YYYY-MM-DD)

Skip emails that are not transaction notifications (marketing, OTP, etc).`
        },
        {
          role: "user",
          content: `Parse these emails and extract transactions:\n\n${emailsText}`
        }
      ],
      tools: [{
        type: "function",
        function: {
          name: "record_transactions",
          description: "Record extracted transactions from emails",
          parameters: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    amount: { type: "number" },
                    type: { type: "string", enum: ["income", "expense"] },
                    category: { type: "string" },
                    description: { type: "string" },
                    transaction_date: { type: "string" },
                  },
                  required: ["amount", "type", "category", "description", "transaction_date"],
                  additionalProperties: false
                }
              }
            },
            required: ["transactions"],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "record_transactions" } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("AI parsing error:", response.status, text);
    throw new Error(`AI parsing failed: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return [];

  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    return parsed.transactions || [];
  } catch {
    console.error("Failed to parse AI response");
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Return OAuth URL
    if (action === "get_auth_url") {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
      const redirectUri = body.redirect_uri || "";
      const scopes = "https://www.googleapis.com/auth/gmail.readonly";
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=gmail_oauth`;
      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
      const { code, redirect_uri } = await req.json().catch(() => ({ code: null, redirect_uri: null }));
      // Actually re-parse
      const body = await req.clone().json();
      const exchangeCode = body.code;
      const exchangeRedirect = body.redirect_uri;

      if (!exchangeCode) {
        return new Response(JSON.stringify({ error: "Missing code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
          code: exchangeCode,
          grant_type: "authorization_code",
          redirect_uri: exchangeRedirect || "",
        }),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        return new Response(JSON.stringify({ error: `Token exchange failed: ${text}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenRes.json();

      const { error: upsertError } = await supabase
        .from("gmail_sync_config")
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || "",
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_active: true,
        }, { onConflict: "user_id" });

      if (upsertError) throw upsertError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle sync
    const { data: config, error: configError } = await supabase
      .from("gmail_sync_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: "Gmail not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if token needs refresh
    let accessToken = config.access_token;
    if (config.token_expires_at && new Date(config.token_expires_at) < new Date()) {
      if (!config.refresh_token) {
        return new Response(JSON.stringify({ error: "Token expired, please reconnect Gmail" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const refreshed = await refreshGoogleToken(config.refresh_token);
      accessToken = refreshed.access_token;

      await supabase.from("gmail_sync_config").update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      }).eq("user_id", user.id);
    }

    // Build search query from email filters
    const filters = config.email_filters || [];
    let query = "subject:(transaction OR payment OR debit OR credit OR transfer OR receipt OR purchase)";
    if (filters.length > 0) {
      query = filters.map((f: string) => `from:${f}`).join(" OR ");
    }

    // Fetch emails since last sync
    const afterDate = config.last_sync_at
      ? new Date(config.last_sync_at).toISOString().split("T")[0].replace(/-/g, "/")
      : undefined;

    const messages = await fetchGmailMessages(accessToken, query, afterDate);

    if (messages.length === 0) {
      return new Response(JSON.stringify({ synced: 0, message: "No new emails found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract email content
    const emailContents = messages.map(extractEmailContent);

    // Parse with AI
    const transactions = await parseTransactionsWithAI(emailContents);

    // Insert transactions
    let insertedCount = 0;
    for (const tx of transactions) {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        description: `[Gmail] ${tx.description}`,
        transaction_date: tx.transaction_date,
      });
      if (!error) insertedCount++;
    }

    // Update sync metadata
    await supabase.from("gmail_sync_config").update({
      last_sync_at: new Date().toISOString(),
      sync_count: (config.sync_count || 0) + insertedCount,
    }).eq("user_id", user.id);

    return new Response(JSON.stringify({
      synced: insertedCount,
      total_emails: messages.length,
      parsed: transactions.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("sync-gmail error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
