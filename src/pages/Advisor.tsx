import DashboardLayout from "@/components/DashboardLayout";
import { transactionsStore, investmentsStore, savingsGoalsStore, budgetsStore } from "@/lib/store";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

export default function Advisor() {
  const transactions = transactionsStore.list();
  const investments = investmentsStore.list();
  const goals = savingsGoalsStore.list();
  const budgets = budgetsStore.list();

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
  const portfolioValue = investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.currentPrice), 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const insights = [];

  if (savingsRate < 20) {
    insights.push({ type: "warning", icon: AlertTriangle, title: "Low Savings Rate", message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% of your income.` });
  } else {
    insights.push({ type: "success", icon: CheckCircle2, title: "Good Savings Rate", message: `Your savings rate of ${savingsRate.toFixed(1)}% is healthy! Keep it up.` });
  }

  if (investments.length === 0) {
    insights.push({ type: "tip", icon: Lightbulb, title: "Start Investing", message: "Consider diversifying your wealth through stocks, bonds, or ETFs." });
  } else if (investments.length < 5) {
    insights.push({ type: "tip", icon: Lightbulb, title: "Diversify Portfolio", message: `You have ${investments.length} investments. Consider diversifying across more asset classes.` });
  }

  if (goals.length === 0) {
    insights.push({ type: "tip", icon: Lightbulb, title: "Set Savings Goals", message: "Setting specific goals helps you stay motivated and track progress." });
  }

  if (budgets.length === 0) {
    insights.push({ type: "tip", icon: Lightbulb, title: "Create Budgets", message: "Budgets help control spending. Start with your largest expense categories." });
  }

  const topExpenseCategory = (() => {
    const grouped: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + parseFloat(t.amount); });
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    return sorted[0];
  })();

  if (topExpenseCategory) {
    insights.push({ type: "info", icon: TrendingUp, title: "Top Expense Category", message: `"${topExpenseCategory[0]}" is your largest expense at ${fmt(topExpenseCategory[1])}. Look for ways to optimize.` });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="border-b-2 border-destructive/30 pb-6">
          <h1 className="text-3xl font-bold neon-text-pink flex items-center gap-3">
            <Brain className="w-8 h-8" /> AI FINANCIAL ADVISOR
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Personalized insights based on your financial data</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-neon p-4"><div className="hud-stat-label">Income</div><div className="text-xl font-bold text-secondary">{fmt(totalIncome)}</div></div>
          <div className="card-neon p-4"><div className="hud-stat-label">Expenses</div><div className="text-xl font-bold text-destructive">{fmt(totalExpenses)}</div></div>
          <div className="card-neon p-4"><div className="hud-stat-label">Savings Rate</div><div className={`text-xl font-bold ${savingsRate >= 20 ? 'text-secondary' : 'text-destructive'}`}>{savingsRate.toFixed(1)}%</div></div>
          <div className="card-neon p-4"><div className="hud-stat-label">Portfolio</div><div className="text-xl font-bold text-primary">{fmt(portfolioValue)}</div></div>
        </div>

        {/* Insights */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Insights & Recommendations</h2>
          {insights.length === 0 ? (
            <div className="card-neon p-8 text-center text-muted-foreground">Add some financial data to get personalized insights!</div>
          ) : insights.map((insight, idx) => (
            <div key={idx} className={`rounded-lg border p-6 ${
              insight.type === "warning" ? "bg-destructive/5 border-destructive/30" :
              insight.type === "success" ? "bg-secondary/5 border-secondary/30" :
              "bg-primary/5 border-primary/30"
            }`}>
              <div className="flex items-start gap-4">
                <insight.icon className={`w-6 h-6 mt-1 ${
                  insight.type === "warning" ? "text-destructive" :
                  insight.type === "success" ? "text-secondary" :
                  "text-primary"
                }`} />
                <div>
                  <h3 className="font-bold text-lg mb-1">{insight.title}</h3>
                  <p className="text-muted-foreground">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
