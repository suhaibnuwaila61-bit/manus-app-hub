import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";

const features = [
  { id: "dashboard", icon: "📊", title: "Financial Dashboard", description: "Real-time overview of your net worth, assets, and liabilities", details: "View comprehensive financial summaries including total income, expenses, savings, and portfolio values." },
  { id: "transactions", icon: "💳", title: "Transaction Management", description: "Track income, expenses, and categorize every transaction", details: "Add transactions with categorization, dates, and descriptions." },
  { id: "ai-chat", icon: "🤖", title: "AI Financial Assistant", description: "Chat with AI about your finances", details: "Get AI-powered financial advice and insights." },
  { id: "savings", icon: "🎯", title: "Savings Goals", description: "Set financial targets and track progress", details: "Create multiple savings goals with target amounts and deadlines." },
  { id: "investments", icon: "📈", title: "Investment Portfolio", description: "Manage stocks, crypto, and other investments", details: "Track investment performance and portfolio value." },
  { id: "budgets", icon: "💰", title: "Budget Planning", description: "Set spending limits and monitor budgets", details: "Create budgets for different categories and track spending." },
  { id: "lending", icon: "🤝", title: "Lending & Borrowing", description: "Track money lent or borrowed", details: "Keep track of loans with amounts, dates, and status." },
  { id: "advisor", icon: "💡", title: "Financial Advisor", description: "Get personalized financial insights", details: "Receive AI-powered advice based on your financial patterns." },
];

export default function Demo() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10">
        <nav className="border-b border-destructive/30 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="text-2xl">⚡</div>
              <h1 className="text-xl font-bold neon-text-pink">FINANCIAL NEXUS</h1>
            </div>
            <button onClick={() => navigate("/dashboard")} className="btn-neon-cyan px-6 py-2 text-sm">Go to Dashboard</button>
          </div>
        </nav>

        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
              <span className="neon-text-pink">EXPLORE</span><br />
              <span className="neon-text">POWERFUL FEATURES</span>
            </h2>
            <p className="text-lg text-muted-foreground">Discover how Financial Nexus helps you take complete control of your finances.</p>
            <button onClick={() => navigate("/dashboard")} className="btn-neon flex items-center justify-center gap-2 text-lg px-8 py-4 mx-auto">
              Try It Now <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-4">
            {features.map(f => (
              <div key={f.id} className="card-neon p-6 cursor-pointer" onClick={() => setExpanded(expanded === f.id ? null : f.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{f.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expanded === f.id ? 'rotate-180' : ''}`} />
                </div>
                {expanded === f.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-muted-foreground">{f.details}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-destructive/30 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
            © 2026 Financial Nexus. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
