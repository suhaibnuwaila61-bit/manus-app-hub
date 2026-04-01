import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { language, setLanguage, isArabic, isEnglish, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">{t("settings")}</h1>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Language
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => setLanguage("en")} variant={isEnglish ? "default" : "outline"} className="flex-1" size="sm">English</Button>
            <Button onClick={() => setLanguage("ar")} variant={isArabic ? "default" : "outline"} className="flex-1" size="sm">العربية</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />} Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => setTheme?.("light")} variant={theme === "light" ? "default" : "outline"} className="flex-1" size="sm">
              <Sun className="h-4 w-4 me-1" /> Light
            </Button>
            <Button onClick={() => setTheme?.("dark")} variant={theme === "dark" ? "default" : "outline"} className="flex-1" size="sm">
              <Moon className="h-4 w-4 me-1" /> Dark
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
