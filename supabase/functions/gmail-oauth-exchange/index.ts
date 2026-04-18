// Exchanges Google OAuth authorization code for access + refresh tokens.
// Stores tokens in gmail_sync_config keyed by user_id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json();
    const { code, redirect_uri } = body;
    if (!code || !redirect_uri) {
      return new Response(JSON.stringify({ error: "Missing code or redirect_uri" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) {
      console.error("Token exchange failed:", tokenData);
      return new Response(JSON.stringify({ error: "Token exchange failed", details: tokenData }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString();

    const adminClient = createClient(supabaseUrl, serviceKey);
    // Upsert (one row per user)
    const { data: existing } = await adminClient
      .from("gmail_sync_config")
      .select("id, refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    const refreshToken = tokenData.refresh_token || existing?.refresh_token || "";

    if (existing) {
      await adminClient
        .from("gmail_sync_config")
        .update({
          access_token: tokenData.access_token,
          refresh_token: refreshToken,
          token_expires_at: expiresAt,
          is_active: true,
          email_filters: ["adcb.com"],
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await adminClient.from("gmail_sync_config").insert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        is_active: true,
        email_filters: ["adcb.com"],
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gmail-oauth-exchange error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
