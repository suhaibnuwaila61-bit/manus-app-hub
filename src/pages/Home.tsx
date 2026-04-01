import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Shield, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold">Financial Nexus</span>
          <Button onClick={() => navigate("/dashboard")}>
            Open Dashboard <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" /> Smart Financial Management
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Take control of your finances with clarity
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Track expenses, manage investments, set goals, and get AI-powered insights — all in one simple, beautiful app.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={() => navigate("/dashboard")}>
            Get Started <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Wallet, title: "Track Everything", desc: "Transactions, investments, loans — all organized in one place." },
            { icon: BarChart3, title: "Visual Analytics", desc: "Beautiful charts and insights to understand your spending." },
            { icon: Shield, title: "Plan & Budget", desc: "Set savings goals, create budgets, and stay on track." },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 text-start">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Financial Nexus
        </div>
      </footer>
    </div>
  );
}
