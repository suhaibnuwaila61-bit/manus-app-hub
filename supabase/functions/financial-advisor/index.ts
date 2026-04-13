import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, financialContext, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ctx = financialContext || {};
    const lang = language === "ar" ? "Arabic" : "English";

    const systemPrompt = `You are an expert financial advisor AI assistant. You provide personalized, data-driven financial advice based on the user's actual financial data. Always respond in ${lang}.

## USER'S FINANCIAL SNAPSHOT

### Income & Expenses
- Total Income: ${ctx.totalIncome ?? 0}
- Total Expenses: ${ctx.totalExpenses ?? 0}
- Savings Rate: ${ctx.savingsRate?.toFixed(1) ?? 0}%
- Net Savings: ${(ctx.totalIncome ?? 0) - (ctx.totalExpenses ?? 0)}

### Top Expense Categories
${ctx.topCategories?.map((c: any) => `- ${c.category}: ${c.amount}`).join("\n") || "No expense data available"}

### Investment Portfolio
- Total Portfolio Value: ${ctx.portfolioValue ?? 0}
- Number of Holdings: ${ctx.investments?.length ?? 0}
${ctx.investments?.map((i: any) => `- ${i.symbol} (${i.asset_type}): ${i.quantity} units @ ${i.current_price} (bought @ ${i.purchase_price})`).join("\n") || "No investments"}
- Asset Type Breakdown: ${JSON.stringify(ctx.assetTypeBreakdown ?? {})}

### Savings Goals
${ctx.goals?.map((g: any) => `- "${g.name}": ${g.current_amount}/${g.target_amount} (${((g.current_amount / g.target_amount) * 100).toFixed(0)}%)${g.deadline ? ` — deadline: ${g.deadline}` : ""}`).join("\n") || "No savings goals set"}

### Budgets
${ctx.budgets?.map((b: any) => `- ${b.name} (${b.category}): ${b.spent}/${b.limit_amount} (${((b.spent / b.limit_amount) * 100).toFixed(0)}% used, alert at ${b.alert_threshold}%)`).join("\n") || "No budgets set"}

### Lendings & Borrowings
${ctx.lendings?.map((l: any) => `- ${l.type === "lent" ? "Lent to" : "Borrowed from"} ${l.person_name}: ${l.amount} (repaid: ${l.amount_repaid}, status: ${l.status})`).join("\n") || "No lending/borrowing records"}

## ADVISOR RULES
1. Base ALL advice on the user's actual data above — never guess or assume.
2. Assess risk: check portfolio concentration, savings buffer (aim 3-6 months expenses), debt levels.
3. Flag overexposure to single sectors or asset types.
4. When comparing "invest vs pay debt", consider implied interest rates and opportunity cost.
5. Give specific, actionable steps with numbers — not generic platitudes.
6. If data is missing (e.g., no investments), suggest the user add that data for better advice.
7. Always include a brief disclaimer that you are an AI assistant, not a licensed financial advisor.
8. Be encouraging but honest about financial health.
9. You MUST be fluent in both English and Arabic. Respond in ${lang}. If responding in Arabic, use proper Arabic financial terminology and natural Arabic phrasing.

## RESPONSE FORMAT (CRITICAL — follow strictly)
- Start with a **1-2 sentence summary** of the key takeaway.
- Use **## headers** and **### sub-headers** to organize sections.
- Use **bullet points** (- ) for lists and recommendations.
- Use **numbered lists** (1. 2. 3.) for sequential steps or priorities.
- **Bold** all key numbers, percentages, and important terms.
- Use **tables** when comparing options (e.g. invest vs pay debt).
- Keep paragraphs to 2-3 sentences max. No walls of text.
- End every response with a clear **Next Steps** section with numbered action items.
- Use these emojis for clarity: ✅ good, ⚠️ warning, 📊 data, 💡 tip, 🎯 goal.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("financial-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
