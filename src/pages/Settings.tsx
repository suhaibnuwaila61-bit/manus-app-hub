import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Globe, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { language, setLanguage, isArabic, isEnglish } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto space-y-8 py-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>

        {/* Language */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Language</h2>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setLanguage("en")} variant={isEnglish ? "default" : "outline"} className="flex-1">English</Button>
            <Button onClick={() => setLanguage("ar")} variant={isArabic ? "default" : "outline"} className="flex-1">العربية</Button>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            <h2 className="text-xl font-semibold">Theme</h2>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setTheme?.("light")} variant={theme === "light" ? "default" : "outline"} className="flex-1 flex items-center justify-center gap-2">
              <Sun className="w-4 h-4" /> Light Mode
            </Button>
            <Button onClick={() => setTheme?.("dark")} variant={theme === "dark" ? "default" : "outline"} className="flex-1 flex items-center justify-center gap-2">
              <Moon className="w-4 h-4" /> Dark Mode
            </Button>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Your Preferences</h3>
          <p className="text-sm text-muted-foreground">Preferences are saved automatically and remembered between visits.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
