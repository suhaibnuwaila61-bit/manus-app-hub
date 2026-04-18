// Public webhook: receives a phone notification (iOS Shortcut, MacroDroid, etc.),
// validates the per-user token, parses the text with Lovable AI, and inserts a transaction.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function parseWithAI(text: string, title: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const prompt = `You extract bank transaction data from phone notifications.
Reply with ONLY a JSON object in this exact format:
{"is_transaction": true|false, "amount": number, "currency": "AED", "type": "expense"|"income", "merchant": "string", "category": "string"}

Rules:
- If this is NOT a transaction (e.g., OTP, login alert, marketing), set is_transaction=false.
- Card purchase / Apple Pay / POS / online purchase / withdrawal = "expense".
- Salary, refund, transfer-in, deposit = "income".
- category: Food, Shopping, Transport, Bills, Entertainment, Health, Travel, Groceries, Other.
- amount = numeric value only.

Title: ${title}
Body: ${text.slice(0, 2000)}`;

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
    console.error("AI failed:", await resp.text());
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
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const token: string | undefined = body.token || req.headers.get("x-webhook-token") || undefined;
    const text: string = (body.text || body.body || body.message || "").toString();
    const title: string = (body.title || body.subject || "").toString();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!text || text.length < 5) {
      return new Response(JSON.stringify({ error: "Missing notification text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: hook } = await admin
      .from("notification_webhooks")
      .select("id, user_id, is_active, total_received, total_imported")
      .eq("token", token)
      .maybeSingle();

    if (!hook || !hook.is_active) {
      return new Response(JSON.stringify({ error: "Invalid or inactive token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = await parseWithAI(text, title);
    let created = false;

    if (parsed && parsed.is_transaction && parsed.amount) {
      await admin.from("transactions").insert({
        user_id: hook.user_id,
        amount: Number(parsed.amount),
        type: parsed.type === "income" ? "income" : "expense",
        description: parsed.merchant || title || "Bank notification",
        category: parsed.category || "Other",
        transaction_date: new Date().toISOString(),
        notes: `Auto-imported from phone notification`,
      });
      created = true;
    }

    await admin
      .from("notification_webhooks")
      .update({
        total_received: (hook.total_received ?? 0) + 1,
        total_imported: (hook.total_imported ?? 0) + (created ? 1 : 0),
        last_received_at: new Date().toISOString(),
      })
      .eq("id", hook.id);

    return new Response(
      JSON.stringify({ success: true, imported: created, parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ingest-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
