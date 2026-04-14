import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency, currencies } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun, Coins, Check, LogOut, User, Mail, RefreshCw, X, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const GOOGLE_GMAIL_SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

export default function Settings() {
  const { language, setLanguage, isArabic, isEnglish, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [gmailConfig, setGmailConfig] = useState<any>(null);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newFilter, setNewFilter] = useState("");

  const fetchGmailConfig = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("gmail_sync_config")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setGmailConfig(data);
  }, [user]);

  useEffect(() => {
    fetchGmailConfig();
  }, [fetchGmailConfig]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state === "gmail_oauth") {
      window.history.replaceState({}, "", window.location.pathname);
      exchangeGmailCode(code);
    }
  }, []);

  const exchangeGmailCode = async (code: string) => {
    setGmailLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-gmail-transactions", {
        body: { action: "exchange_code", code, redirect_uri: window.location.origin + "/settings" },
      });
      if (error) throw error;
      toast.success(t("gmailConnectedSuccess"));
      await fetchGmailConfig();
    } catch (e: any) {
      toast.error(e.message || "Failed to connect Gmail");
    }
    setGmailLoading(false);
  };

  const handleConnectGmail = async () => {
    // We need GOOGLE_CLIENT_ID from the edge function, but we'll use a simpler approach:
    // Fetch client ID from an edge function or store it.
    // For now, we'll call the edge function to get the OAuth URL
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      // Fallback: prompt via edge function
      toast.error("Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID.");
      return;
    }
    const redirectUri = window.location.origin + "/settings";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(GOOGLE_GMAIL_SCOPES)}&access_type=offline&prompt=consent&state=gmail_oauth`;
    window.location.href = authUrl;
  };

  const handleDisconnectGmail = async () => {
    if (!user) return;
    await supabase.from("gmail_sync_config").delete().eq("user_id", user.id);
    setGmailConfig(null);
    toast.success(t("gmailDisconnected"));
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-gmail-transactions", {
        body: { action: "sync" },
      });
      if (error) throw error;
      if (data?.synced > 0) {
        toast.success(`${t("syncSuccess")} ${data.synced} ${t("transactionsSynced")}`);
      } else {
        toast.info(t("noNewEmails"));
      }
      await fetchGmailConfig();
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    }
    setSyncing(false);
  };

  const addEmailFilter = async () => {
    if (!newFilter.trim() || !user || !gmailConfig) return;
    const updatedFilters = [...(gmailConfig.email_filters || []), newFilter.trim()];
    await supabase.from("gmail_sync_config").update({ email_filters: updatedFilters }).eq("user_id", user.id);
    setGmailConfig({ ...gmailConfig, email_filters: updatedFilters });
    setNewFilter("");
  };

  const removeEmailFilter = async (filter: string) => {
    if (!user || !gmailConfig) return;
    const updatedFilters = (gmailConfig.email_filters || []).filter((f: string) => f !== filter);
    await supabase.from("gmail_sync_config").update({ email_filters: updatedFilters }).eq("user_id", user.id);
    setGmailConfig({ ...gmailConfig, email_filters: updatedFilters });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6 py-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">{t("settings")}</h1>
        </div>

        {/* Account */}
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-semibold">{t("account")}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("email")}</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" size="sm">
              <LogOut className="h-4 w-4 me-2" /> {t("signOut")}
            </Button>
          </div>
        </div>

        {/* Gmail Sync */}
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-display font-semibold">{t("gmailSync")}</span>
              <p className="text-xs text-muted-foreground">{t("gmailSetupInfo")}</p>
            </div>
          </div>

          {!gmailConfig ? (
            <Button onClick={handleConnectGmail} disabled={gmailLoading} className="w-full glow-button" size="sm">
              {gmailLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Mail className="h-4 w-4 me-2" />}
              {t("connectGmail")}
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-green-500">{t("gmailConnected")}</span>
                </div>
                <Button onClick={handleDisconnectGmail} variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs h-7">
                  {t("disconnectGmail")}
                </Button>
              </div>

              {/* Sync info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("lastSynced")}: {gmailConfig.last_sync_at ? new Date(gmailConfig.last_sync_at).toLocaleString() : t("never")}</span>
                <span>{gmailConfig.sync_count || 0} {t("transactionsSynced")}</span>
              </div>

              {/* Email filters */}
              <div>
                <label className="text-sm font-medium mb-1 block">{t("emailFilters")}</label>
                <p className="text-xs text-muted-foreground mb-2">{t("emailFiltersHint")}</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={newFilter}
                    onChange={e => setNewFilter(e.target.value)}
                    placeholder={t("enterEmailFilter")}
                    className="input-field flex-1 h-8 text-sm"
                    onKeyDown={e => e.key === "Enter" && addEmailFilter()}
                  />
                  <Button onClick={addEmailFilter} size="sm" variant="outline" className="h-8">
                    <Plus className="h-3 w-3 me-1" /> {t("addFilter")}
                  </Button>
                </div>
                {gmailConfig.email_filters?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {gmailConfig.email_filters.map((f: string) => (
                      <span key={f} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                        {f}
                        <button onClick={() => removeEmailFilter(f)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Sync button */}
              <Button onClick={handleSyncNow} disabled={syncing} className="w-full glow-button" size="sm">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <RefreshCw className="h-4 w-4 me-2" />}
                {syncing ? t("syncing") : t("syncNow")}
              </Button>
            </div>
          )}
        </div>

        {/* Language */}
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-semibold">{t("language")}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLanguage("en")} variant={isEnglish ? "default" : "outline"} className={`flex-1 transition-all duration-300 ${isEnglish ? "glow-button shadow-md shadow-primary/20" : ""}`} size="sm">English</Button>
            <Button onClick={() => setLanguage("ar")} variant={isArabic ? "default" : "outline"} className={`flex-1 transition-all duration-300 ${isArabic ? "glow-button shadow-md shadow-primary/20" : ""}`} size="sm">العربية</Button>
          </div>
        </div>

        {/* Theme */}
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            </div>
            <span className="font-display font-semibold">{t("theme")}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setTheme?.("light")} variant={theme === "light" ? "default" : "outline"} className={`flex-1 transition-all duration-300 ${theme === "light" ? "glow-button shadow-md shadow-primary/20" : ""}`} size="sm">
              <Sun className="h-4 w-4 me-1" /> {t("light")}
            </Button>
            <Button onClick={() => setTheme?.("dark")} variant={theme === "dark" ? "default" : "outline"} className={`flex-1 transition-all duration-300 ${theme === "dark" ? "glow-button shadow-md shadow-primary/20" : ""}`} size="sm">
              <Moon className="h-4 w-4 me-1" /> {t("dark")}
            </Button>
          </div>
        </div>

        {/* Currency */}
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Coins className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-semibold">{t("currency")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {currencies.map(c => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all duration-300 ${
                  currency === c.code
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-background/50 border-border/50 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.code}</span>
                  <span className={`text-xs ${currency === c.code ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {isArabic ? c.nameAr : c.name}
                  </span>
                </div>
                {currency === c.code && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
