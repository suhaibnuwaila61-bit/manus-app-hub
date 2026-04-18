import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency, currencies } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, Moon, Sun, Coins, Check, LogOut, User, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import GmailSyncCard from "@/components/GmailSyncCard";

export default function Settings() {
  const { language, setLanguage, isArabic, isEnglish, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [resetStep, setResetStep] = useState(0); // 0=closed, 1=first confirm, 2=second confirm
  const [resetting, setResetting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success(t("signOut"));
  };

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    try {
      const tables = ["transactions", "investments", "investment_transactions", "lendings", "budgets", "savings_goals"] as const;
      for (const table of tables) {
        await (supabase as any).from(table).delete().eq("user_id", user.id);
      }
      toast.success(t("resetSuccess"));
      setResetStep(0);
    } catch {
      toast.error("Reset failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-display font-bold">{t("settings")}</h1>

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

        {/* Gmail Auto-Sync */}
        <GmailSyncCard />

        {/* Danger Zone - Reset */}
        <div className="glass-card border-destructive/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <span className="font-display font-semibold text-destructive">{t("resetAllData")}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t("resetWarning")}</p>
          <Button onClick={() => setResetStep(1)} variant="destructive" className="w-full" size="sm">
            <AlertTriangle className="h-4 w-4 me-2" /> {t("resetAllData")}
          </Button>
        </div>
      </div>

      {/* First Confirmation */}
      <Dialog open={resetStep === 1} onOpenChange={(open) => !open && setResetStep(0)}>
        <DialogContent className="border-destructive/30 bg-card/95 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> {t("areYouSure")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("resetWarning")}</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setResetStep(0)}>{t("cancel")}</Button>
            <Button variant="destructive" className="flex-1" onClick={() => setResetStep(2)}>{t("confirmReset")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Second Confirmation */}
      <Dialog open={resetStep === 2} onOpenChange={(open) => !open && setResetStep(0)}>
        <DialogContent className="border-destructive/50 bg-card/95 backdrop-blur-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5 animate-pulse" /> {t("areYouSure")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium text-destructive">{t("resetWarning")}</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setResetStep(0)}>{t("cancel")}</Button>
            <Button variant="destructive" className="flex-1" disabled={resetting} onClick={handleReset}>
              {resetting ? <span className="animate-spin me-2">⏳</span> : <AlertTriangle className="h-4 w-4 me-1" />}
              {t("confirmReset")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
