import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // image should be a base64 data URL like "data:image/jpeg;base64,..."
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
            content: `You are a receipt/bill scanner. Extract transaction details from the receipt image.
Extract:
- amount (number, always positive)
- type: "expense" (most receipts are expenses) or "income" (if it's a payment received/refund)
- category: one of "General", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"
- description: brief description of what was purchased/paid
- transaction_date: ISO date string (YYYY-MM-DD), use today if not visible

If you cannot read the receipt or it's not a bill/receipt, return an empty transactions array.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract transaction details from this receipt/bill image." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "record_receipt",
              description: "Record extracted receipt transaction data",
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
                      additionalProperties: false,
                    },
                  },
                },
                required: ["transactions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "record_receipt" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI error:", response.status, text);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to process receipt" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ transactions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ transactions: parsed.transactions || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ transactions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("scan-receipt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
