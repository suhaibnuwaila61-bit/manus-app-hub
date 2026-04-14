import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsOfService() {
  const navigate = useNavigate();
  const { t, isArabic } = useLanguage();

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-lg font-display font-bold gradient-text">Financial Nexus</span>
          </div>
        </nav>

        <main className="container mx-auto px-4 sm:px-6 py-12 max-w-3xl" dir={isArabic ? "rtl" : "ltr"}>
          <h1 className="text-3xl font-display font-bold text-foreground mb-8">{t("termsOfService")}</h1>
          
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="text-sm text-muted-foreground/70">{t("termsLastUpdated")}: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("termsAcceptTitle")}</h2>
              <p>{t("termsAcceptText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("termsServiceTitle")}</h2>
              <p>{t("termsServiceText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("termsAccountTitle")}</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>{t("termsAccount1")}</li>
                <li>{t("termsAccount2")}</li>
                <li>{t("termsAccount3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("termsGmailTitle")}</h2>
              <p>{t("termsGmailText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("termsDisclaimerTitle")}</h2>
              <p>{t("termsDisclaimerText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("termsLiabilityTitle")}</h2>
              <p>{t("termsLiabilityText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("termsChangesTitle")}</h2>
              <p>{t("termsChangesText")}</p>
            </section>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
