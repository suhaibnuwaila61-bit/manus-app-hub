import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { transactionsStore, investmentsStore, savingsGoalsStore, lendingsStore } from "@/lib/store";
import { TrendingUp, TrendingDown, Target, Wallet, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);

  const transactions = transactionsStore.list();
  const investments = investmentsStore.list();
  const savingsGoals = savingsGoalsStore.list();
  const lendings = lendingsStore.list();

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
  const portfolioValue = investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.currentPrice), 0);
  const totalSavings = savingsGoals.reduce((s, g) => s + parseFloat(g.currentAmount), 0);
  const totalLent = lendings.filter(l => l.type === "lent").reduce((s, l) => s + parseFloat(l.amount), 0);
  const totalBorrowed = lendings.filter(l => l.type === "borrowed").reduce((s, l) => s + parseFloat(l.amount), 0);
  const netWorth = totalIncome + totalSavings + portfolioValue - totalExpenses - totalBorrowed;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", amount: "", description: "", category: "General" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) { toast.error(t("pleaseFillAllFields")); return; }
    transactionsStore.create({
      amount: form.amount,
      description: form.description,
      type: form.type as "income" | "expense",
      category: form.category,
      transactionDate: new Date().toISOString(),
    });
    toast.success(t("transactionAdded"));
    setForm({ type: "expense", amount: "", description: "", category: "General" });
    setShowForm(false);
    refresh();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{t("financialDashboard")}</h1>
            <p className="text-muted-foreground text-sm mt-1">Your financial overview at a glance</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-neon-cyan flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> {t("addEntry")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-neon p-6">
            <div className="hud-stat-label">{t("netWorth")}</div>
            <div className={`hud-stat-value ${netWorth >= 0 ? 'text-secondary' : 'text-destructive'}`}>{fmt(netWorth)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("totalAssetsMinusTotalLiabilities")}</p>
          </div>
          <div className="card-neon p-6">
            <div className="hud-stat-label">{t("totalIncome")}</div>
            <div className="hud-stat-value text-secondary flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> {fmt(totalIncome)}
            </div>
          </div>
          <div className="card-neon p-6">
            <div className="hud-stat-label">{t("totalExpenses")}</div>
            <div className="hud-stat-value text-destructive flex items-center gap-2">
              <TrendingDown className="w-5 h-5" /> {fmt(totalExpenses)}
            </div>
          </div>
          <div className="card-neon p-6">
            <div className="hud-stat-label">{t("portfolioValue")}</div>
            <div className="hud-stat-value text-primary flex items-center gap-2">
              <Wallet className="w-5 h-5" /> {fmt(portfolioValue)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-neon p-6">
            <div className="hud-stat-label">{t("totalSavings")}</div>
            <div className="hud-stat-value text-primary flex items-center gap-2">
              <Target className="w-5 h-5" /> {fmt(totalSavings)}
            </div>
          </div>
          <div className="card-neon p-6">
            <div className="hud-stat-label">Total Lent</div>
            <div className="hud-stat-value text-secondary">{fmt(totalLent)}</div>
          </div>
          <div className="card-neon p-6">
            <div className="hud-stat-label">Total Borrowed</div>
            <div className="hud-stat-value text-destructive">{fmt(totalBorrowed)}</div>
          </div>
        </div>

        {/* Quick add form */}
        {showForm && (
          <div className="card-neon-pink p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-destructive font-bold uppercase tracking-wider">{t("addEntry")}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground">
                <option value="expense">{t("expense")}</option>
                <option value="income">{t("income")}</option>
              </select>
              <input type="number" step="0.01" placeholder="Amount" value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground" />
              <input type="text" placeholder="Description" value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground" />
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground">
                {["General", "Food", "Transport", "Entertainment", "Shopping", "Bills", "Health", "Savings", "Salary", "Freelance"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="flex-1 btn-neon-cyan">{t("submit")}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border">{t("cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {/* Quick Nav */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-bold mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "View Transactions", path: "/transactions" },
              { label: "Manage Investments", path: "/investments" },
              { label: "Savings Goals", path: "/savings-goals" },
              { label: "Budgets", path: "/budgets" },
              { label: "Lendings", path: "/lendings" },
              { label: "AI Advisor", path: "/advisor" },
            ].map(item => (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-all text-sm font-medium">
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
