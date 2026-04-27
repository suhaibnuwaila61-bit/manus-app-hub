import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) throw new Error("FINNHUB_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: investments, error } = await admin
      .from("investments")
      .select("id, symbol, asset_type, current_price")
      .eq("user_id", user.id);
    if (error) throw error;

    const results: any[] = [];
    let updated = 0, failed = 0;

    for (const inv of investments || []) {
      try {
        let newPrice: number | null = null;
        const symbol = String(inv.symbol).trim().toUpperCase();

        if (inv.asset_type === "crypto") {
          // CoinGecko (no key) — symbol mapping is approximate; user can edit
          const id = symbol.toLowerCase();
          const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
          const j = await r.json();
          newPrice = j?.[id]?.usd ?? null;
        } else {
          // Finnhub stock quote
          const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
          const j = await r.json();
          newPrice = typeof j?.c === "number" && j.c > 0 ? j.c : null;
        }

        if (newPrice && newPrice > 0) {
          await admin.from("investments").update({ current_price: newPrice }).eq("id", inv.id);
          results.push({ symbol, oldPrice: Number(inv.current_price), newPrice, status: "updated" });
          updated++;
        } else {
          results.push({ symbol, status: "no-price" });
          failed++;
        }
      } catch (e) {
        results.push({ symbol: inv.symbol, status: "error", error: String(e) });
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ updated, failed, total: investments?.length ?? 0, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("refresh-investment-prices error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
