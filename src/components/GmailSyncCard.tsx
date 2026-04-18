import { useEffect, useState } from "react";
import { Mail, RefreshCw, Link2, Link2Off, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = "1050723120730-lv76cb32mh9ge2grsv6bpkcphvj7cp01.apps.googleusercontent.com";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export default function GmailSyncCard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncCount, setSyncCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("gmail_sync_config")
      .select("refresh_token, last_sync_at, sync_count, is_active")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data && data.refresh_token && data.is_active) {
      setConnected(true);
      setLastSync(data.last_sync_at);
      setSyncCount(data.sync_count ?? 0);
    } else {
      setConnected(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, [user]);

  const handleConnect = () => {
    const redirectUri = `${window.location.origin}/gmail-callback`;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GMAIL_SCOPE,
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const handleDisconnect = async () => {
    if (!user) return;
    await (supabase as any).from("gmail_sync_config").delete().eq("user_id", user.id);
    setConnected(false);
    setLastSync(null);
    setSyncCount(0);
    toast.success(t("gmailDisconnected") || "Gmail disconnected");
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-gmail-transactions");
      if (error || (data && data.error)) {
        toast.error(error?.message || data?.error || "Sync failed");
      } else {
        toast.success(
          `${t("syncComplete") || "Sync complete"}: ${data.created} ${t("imported") || "imported"}, ${data.skipped} ${t("skipped") || "skipped"}`
        );
        loadStatus();
      }
    } catch (e: any) {
      toast.error(e?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Mail className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <span className="font-display font-semibold">{t("gmailSync") || "Gmail Auto-Sync"}</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("gmailSyncDesc") || "Auto-import ADCB transactions from your inbox"}
          </p>
        </div>
        {connected && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{t("connected") || "Connected"}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-10 animate-pulse bg-muted/30 rounded-lg" />
      ) : connected ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("lastSync") || "Last sync"}</span>
            <span>{lastSync ? new Date(lastSync).toLocaleString() : t("never") || "Never"}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("totalSyncs") || "Total syncs"}</span>
            <span>{syncCount}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSync} disabled={syncing} size="sm" className="flex-1">
              <RefreshCw className={`h-4 w-4 me-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? t("syncing") || "Syncing…" : t("syncNow") || "Sync Now"}
            </Button>
            <Button onClick={handleDisconnect} variant="outline" size="sm">
              <Link2Off className="h-4 w-4 me-2" />
              {t("disconnect") || "Disconnect"}
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={handleConnect} className="w-full" size="sm">
          <Link2 className="h-4 w-4 me-2" />
          {t("connectGmail") || "Connect Gmail"}
        </Button>
      )}
    </div>
  );
}
