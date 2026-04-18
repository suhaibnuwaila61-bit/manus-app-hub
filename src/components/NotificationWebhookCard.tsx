import { useEffect, useState } from "react";
import { Smartphone, Copy, RefreshCw, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const WEBHOOK_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/ingest-notification`;

function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function NotificationWebhookCard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState({ received: 0, imported: 0, lastAt: null as string | null });
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [showShortcut, setShowShortcut] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("notification_webhooks")
      .select("token, total_received, total_imported, last_received_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setToken(data.token);
      setStats({
        received: data.total_received ?? 0,
        imported: data.total_imported ?? 0,
        lastAt: data.last_received_at,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const ensureToken = async () => {
    if (!user) return;
    const newToken = generateToken();
    const { error } = await (supabase as any)
      .from("notification_webhooks")
      .upsert({ user_id: user.id, token: newToken, is_active: true }, { onConflict: "user_id" });
    if (error) {
      toast.error("Failed to generate token");
      return;
    }
    setToken(newToken);
    setShowToken(true);
    toast.success("New token generated");
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <span className="font-display font-semibold">Phone Notification Sync</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-import transactions from your phone's bank notifications
          </p>
        </div>
        {token && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-10 animate-pulse bg-muted/30 rounded-lg" />
      ) : !token ? (
        <Button onClick={ensureToken} className="w-full" size="sm">
          Generate Webhook Token
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-background/50 border border-border/50 p-2.5">
              <div className="text-muted-foreground">Received</div>
              <div className="text-lg font-semibold">{stats.received}</div>
            </div>
            <div className="rounded-lg bg-background/50 border border-border/50 p-2.5">
              <div className="text-muted-foreground">Imported</div>
              <div className="text-lg font-semibold text-primary">{stats.imported}</div>
            </div>
          </div>
          {stats.lastAt && (
            <p className="text-xs text-muted-foreground text-center">
              Last: {new Date(stats.lastAt).toLocaleString()}
            </p>
          )}

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Webhook URL</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={WEBHOOK_URL}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-background/50 border border-border/50 font-mono"
                onFocus={(e) => e.target.select()}
              />
              <Button onClick={() => copy(WEBHOOK_URL, "URL")} variant="outline" size="sm">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Token */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Secret Token</label>
            <div className="flex gap-2">
              <input
                readOnly
                type={showToken ? "text" : "password"}
                value={token}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-background/50 border border-border/50 font-mono"
                onFocus={(e) => e.target.select()}
              />
              <Button onClick={() => setShowToken((v) => !v)} variant="outline" size="sm">
                {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button onClick={() => copy(token, "Token")} variant="outline" size="sm">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setShowShortcut((v) => !v)} variant="outline" size="sm" className="flex-1">
              {showShortcut ? "Hide" : "Show"} iOS Setup
            </Button>
            <Button onClick={ensureToken} variant="outline" size="sm">
              <RefreshCw className="h-3.5 w-3.5 me-1.5" /> Regenerate
            </Button>
          </div>

          {/* iOS Shortcut Instructions */}
          {showShortcut && (
            <div className="rounded-lg bg-background/40 border border-border/50 p-3 space-y-3 text-xs">
              <div>
                <p className="font-semibold text-foreground mb-1">📱 iOS Setup (Pushcut – recommended)</p>
                <p className="text-muted-foreground mb-2">
                  iOS Shortcuts can't trigger automatically on bank-app notifications, so use{" "}
                  <span className="font-medium">Pushcut</span> (free) which can.
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                  <li>Install <span className="font-medium text-foreground">Pushcut</span> from the App Store.</li>
                  <li>Open Pushcut → <span className="font-medium">Automations</span> → <span className="font-medium">+</span> → <span className="font-medium">When a notification is received</span>.</li>
                  <li>Filter by app: <span className="font-medium text-foreground">ADCB</span> (or your bank app).</li>
                  <li>Add action → <span className="font-medium">Web Request</span>.</li>
                  <li>URL: paste the Webhook URL above.</li>
                  <li>Method: <span className="font-medium">POST</span>, Content-Type: <span className="font-medium">application/json</span>.</li>
                  <li>Body (JSON):</li>
                </ol>
                <pre className="mt-2 p-2 rounded bg-background/60 border border-border/50 overflow-x-auto text-[10px] leading-relaxed">{`{
  "token": "${showToken ? token : "YOUR_TOKEN_HERE"}",
  "title": "{{NotificationTitle}}",
  "text": "{{NotificationBody}}"
}`}</pre>
                <p className="text-muted-foreground mt-2">
                  Save → enable the automation. Done! Every ADCB notification is now auto-imported.
                </p>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="font-semibold text-foreground mb-1">Alternative: Apple Shortcuts (manual)</p>
                <p className="text-muted-foreground">
                  Create a Shortcut with <span className="font-medium">Get Contents of URL</span> → POST to the URL
                  above with body <span className="font-mono">{`{ "token": "...", "text": "Shortcut Input" }`}</span>.
                  Trigger it via Share Sheet from any notification.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
