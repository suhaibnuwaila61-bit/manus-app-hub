import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Shield, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold">Financial Nexus</span>
          <Button onClick={() => navigate("/dashboard")} className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
            Open Dashboard <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center max-w-3xl animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 shadow-sm shadow-primary/10">
          <Sparkles className="h-4 w-4 animate-pulse-soft" /> Smart Financial Management
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
          Take control of your finances with <span className="text-primary">clarity</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          Track expenses, manage investments, set goals, and get AI-powered insights — all in one simple, beautiful app.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" onClick={() => navigate("/dashboard")} className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5">
            Get Started <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Wallet, title: "Track Everything", desc: "Transactions, investments, loans — all organized in one place.", color: "primary" },
            { icon: BarChart3, title: "Visual Analytics", desc: "Beautiful charts and insights to understand your spending.", color: "success" },
            { icon: Shield, title: "Plan & Budget", desc: "Set savings goals, create budgets, and stay on track.", color: "warning" },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 text-start transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 group">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${
                f.color === "success" ? "bg-success/10" : f.color === "warning" ? "bg-warning/10" : "bg-primary/10"
              }`}>
                <f.icon className={`h-5 w-5 ${
                  f.color === "success" ? "text-success" : f.color === "warning" ? "text-warning" : "text-primary"
                }`} />
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
