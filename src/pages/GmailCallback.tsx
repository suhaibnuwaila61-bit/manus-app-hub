import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function GmailCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error");
    if (error) {
      setErrorMsg(error);
      setStatus("error");
      return;
    }
    if (!code) {
      setErrorMsg("Missing authorization code");
      setStatus("error");
      return;
    }

    (async () => {
      try {
        const redirectUri = `${window.location.origin}/gmail-callback`;
        const { data, error: fnError } = await supabase.functions.invoke("gmail-oauth-exchange", {
          body: { code, redirect_uri: redirectUri },
        });
        if (fnError || (data && data.error)) {
          setErrorMsg(fnError?.message || data?.error || "Exchange failed");
          setStatus("error");
          return;
        }
        setStatus("success");
        toast.success(t("gmailConnected") || "Gmail connected!");
        setTimeout(() => navigate("/settings"), 1500);
      } catch (e: any) {
        setErrorMsg(e?.message || "Unknown error");
        setStatus("error");
      }
    })();
  }, [params, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-card max-w-sm w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-lg font-display font-semibold mb-2">
              {t("connectingGmail") || "Connecting Gmail…"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("pleaseWait") || "Please wait a moment."}
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-4" />
            <h1 className="text-lg font-display font-semibold mb-2">
              {t("gmailConnected") || "Gmail Connected"}
            </h1>
            <p className="text-sm text-muted-foreground">{t("redirecting") || "Redirecting…"}</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h1 className="text-lg font-display font-semibold mb-2 text-destructive">
              {t("connectionFailed") || "Connection failed"}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">{errorMsg}</p>
            <button
              onClick={() => navigate("/settings")}
              className="text-sm text-primary hover:underline"
            >
              {t("backToSettings") || "Back to Settings"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
