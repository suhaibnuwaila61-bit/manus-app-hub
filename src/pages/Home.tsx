import { useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp, Target, Wallet } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="border-b-2 border-destructive/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚡</div>
              <h1 className="text-2xl font-bold neon-text-pink">FINANCIAL NEXUS</h1>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate("/demo")} className="btn-neon-cyan text-sm">View Demo</button>
              <button onClick={() => navigate("/dashboard")} className="btn-neon text-sm">Dashboard</button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <div className="flex-1 container mx-auto px-4 py-20 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="neon-text-pink">COMMAND</span><br />
                <span className="neon-text">YOUR WEALTH</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Take control of your financial future with AI-powered insights, real-time market data, and comprehensive portfolio management.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={() => navigate("/dashboard")} className="btn-neon flex items-center justify-center gap-2 text-lg px-8 py-4">
                Start Now <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate("/demo")} className="btn-neon-cyan flex items-center justify-center gap-2 text-lg px-8 py-4">
                View Demo
              </button>
            </div>
            <div className="pt-8 border-t border-primary/20">
              <p className="text-muted-foreground text-sm uppercase tracking-widest mb-4">Trusted by financial enthusiasts</p>
              <div className="flex gap-6 text-muted-foreground text-sm">
                <div>🔒 Bank-Level Security</div>
                <div>📊 Real-Time Data</div>
                <div>🤖 AI Insights</div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="flex-1 relative h-96 lg:h-full min-h-96">
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 card-neon p-6 shadow-2xl" style={{ animation: 'float 6s ease-in-out infinite' }}>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                  <span className="text-secondary font-bold">Portfolio</span>
                </div>
                <div className="text-3xl font-bold text-destructive mb-2">$47,250</div>
                <div className="text-primary text-sm">+12.5% this month</div>
              </div>
              <div className="absolute top-32 left-0 w-64 card-neon-pink p-6 shadow-2xl" style={{ animation: 'float 8s ease-in-out infinite 1s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-destructive" />
                  <span className="text-destructive font-bold">Goals</span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">$12,500</div>
                <div className="text-destructive text-sm">Savings accumulated</div>
              </div>
              <div className="absolute bottom-0 right-12 w-64 card-neon p-6 shadow-2xl" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Wallet className="w-6 h-6 text-primary" />
                  <span className="text-primary font-bold">Budget</span>
                </div>
                <div className="text-3xl font-bold text-secondary mb-2">$3,200</div>
                <div className="text-primary text-sm">Spent this month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="border-t-2 border-destructive/30 py-20">
          <div className="container mx-auto px-4">
            <h3 className="text-4xl font-bold neon-text-pink mb-12 text-center">ADVANCED FEATURES</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "📊", title: "Expense Tracking", description: "Track daily, weekly, and monthly expenses with detailed categorization" },
                { icon: "💼", title: "Portfolio Management", description: "Manage stocks, crypto, and other assets with real-time valuations" },
                { icon: "🎯", title: "Savings Goals", description: "Set targets and visualize your progress toward financial milestones" },
                { icon: "🤖", title: "AI Advisor", description: "Get personalized financial insights and investment recommendations" },
                { icon: "📈", title: "Market Data", description: "Real-time stock prices and cryptocurrency rates" },
                { icon: "🔔", title: "Smart Alerts", description: "Notifications for budget limits and portfolio changes" },
                { icon: "💰", title: "Budget Tools", description: "Set spending limits and monitor category budgets" },
                { icon: "📉", title: "Analytics", description: "Visualize trends and analyze your financial patterns" },
              ].map((feature, idx) => (
                <div key={idx} className="card-neon p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                  <h4 className="text-destructive font-bold mb-2">{feature.title}</h4>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-destructive/30 py-8 mt-auto">
          <div className="container mx-auto px-4 flex items-center justify-between text-muted-foreground text-sm">
            <div>© 2026 Financial Nexus. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
