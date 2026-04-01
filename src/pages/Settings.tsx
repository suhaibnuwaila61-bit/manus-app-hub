import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useCurrency, currencies } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun, Coins, Check } from "lucide-react";

export default function Settings() {
  const { language, setLanguage, isArabic, isEnglish, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6 py-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{t("settings")}</h1>
        </div>

        {/* Language */}
        <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-3.5 w-3.5 text-primary" />
              </div>
              Language
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => setLanguage("en")} variant={isEnglish ? "default" : "outline"} className="flex-1 transition-all duration-200" size="sm">English</Button>
            <Button onClick={() => setLanguage("ar")} variant={isArabic ? "default" : "outline"} className="flex-1 transition-all duration-200" size="sm">العربية</Button>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                {theme === "dark" ? <Moon className="h-3.5 w-3.5 text-primary" /> : <Sun className="h-3.5 w-3.5 text-primary" />}
              </div>
              Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => setTheme?.("light")} variant={theme === "light" ? "default" : "outline"} className="flex-1 transition-all duration-200" size="sm">
              <Sun className="h-4 w-4 me-1" /> Light
            </Button>
            <Button onClick={() => setTheme?.("dark")} variant={theme === "dark" ? "default" : "outline"} className="flex-1 transition-all duration-200" size="sm">
              <Moon className="h-4 w-4 me-1" /> Dark
            </Button>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Coins className="h-3.5 w-3.5 text-primary" />
              </div>
              {isArabic ? "العملة" : "Currency"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {currencies.map(c => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 ${
                    currency === c.code
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-background border-input hover:border-primary/30 hover:bg-muted/50"
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
