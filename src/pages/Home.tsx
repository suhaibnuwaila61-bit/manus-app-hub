import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, BarChart3, Shield, Sparkles, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isArabic } = useLanguage();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const handleGetStarted = () => {
    navigate(user ? "/dashboard" : "/auth");
  };

  const features = [
    { icon: Wallet, title: t("trackEverything"), desc: t("trackEverythingDesc"), color: "primary" },
    { icon: BarChart3, title: t("visualAnalytics"), desc: t("visualAnalyticsDesc"), color: "accent" },
    { icon: Shield, title: t("planBudget"), desc: t("planBudgetDesc"), color: "success" },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen bg-background orb-glow overflow-x-hidden">
      <nav className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-display font-bold gradient-text">Financial Nexus</span>
          <Button onClick={handleGetStarted} className="glow-button shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-500">
            {user ? t("openDashboard") : t("signIn")} <ArrowIcon className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      <section className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 text-center max-w-3xl animate-fade-in relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[300px] sm:h-[400px] rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, hsl(250 85% 65% / 0.2), hsl(270 75% 65% / 0.1), transparent 70%)" }} />
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 animate-pulse-soft" /> {t("smartFinancial")}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight mb-6 leading-[1.1]">
            {t("homeTitle")}
            <br />
            <span className="gradient-text">{t("homeTitleHighlight")}</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            {t("homeSubtitle")}
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="glow-button text-base px-8 h-12 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-500 hover:-translate-y-1">
              <Zap className="h-5 w-5 me-2" /> {t("getStarted")}
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {features.map((f, i) => (
            <div key={i} className="glass-card p-5 sm:p-6 text-start group cursor-default">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 ${
                f.color === "accent" ? "bg-accent/10" : f.color === "success" ? "bg-success/10" : "bg-primary/10"
              }`}>
                <f.icon className={`h-6 w-6 ${
                  f.color === "accent" ? "text-accent" : f.color === "success" ? "text-success" : "text-primary"
                }`} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors underline-offset-4 hover:underline">{t("privacyPolicy")}</button>
            <span className="text-border">|</span>
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors underline-offset-4 hover:underline">{t("termsOfService")}</button>
          </div>
          <p>{t("footerText")}</p>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
}