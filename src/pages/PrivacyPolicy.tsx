import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-display font-bold text-foreground mb-8">{t("privacyPolicy")}</h1>
          
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p className="text-sm text-muted-foreground/70">{t("privacyLastUpdated")}: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacyIntroTitle")}</h2>
              <p>{t("privacyIntroText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacyDataTitle")}</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>{t("privacyDataEmail")}</li>
                <li>{t("privacyDataFinancial")}</li>
                <li>{t("privacyDataGmail")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacyUseTitle")}</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>{t("privacyUse1")}</li>
                <li>{t("privacyUse2")}</li>
                <li>{t("privacyUse3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacyGmailTitle")}</h2>
              <p>{t("privacyGmailText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacySecurityTitle")}</h2>
              <p>{t("privacySecurityText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacyContactTitle")}</h2>
              <p>{t("privacyContactText")}</p>
            </section>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
