import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { transactionsStore, investmentsStore } from "@/lib/store";
import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type DateRange = "week" | "month" | "year";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(160, 84%, 39%)", "hsl(38, 92%, 50%)", "hsl(258, 90%, 66%)", "hsl(0, 84%, 60%)", "hsl(190, 90%, 50%)"];

export default function Analytics() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange>("month");

  const transactions = transactionsStore.list();
  const investments = investmentsStore.list();

  const getDays = () => dateRange === "week" ? 7 : dateRange === "month" ? 30 : 365;
  const start = new Date(Date.now() - getDays() * 86400000);

  const filtered = transactions.filter(tx => new Date(tx.transactionDate) >= start);
  const totalExpenses = filtered.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const portfolioValue = investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.currentPrice), 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  // Group by date
  const incomeVsExpenses = (() => {
    const grouped: Record<string, { income: number; expenses: number }> = {};
    filtered.forEach(tx => {
      const d = new Date(tx.transactionDate).toLocaleDateString();
      if (!grouped[d]) grouped[d] = { income: 0, expenses: 0 };
      if (tx.type === "income") grouped[d].income += parseFloat(tx.amount);
      else grouped[d].expenses += parseFloat(tx.amount);
    });
    return Object.entries(grouped).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  // Expenses by category
  const expensesByCategory = (() => {
    const grouped: Record<string, number> = {};
    filtered.filter(t => t.type === "expense").forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + parseFloat(t.amount); });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  })();

  // Portfolio breakdown
  const portfolioBreakdown = investments.map(inv => ({
    name: inv.symbol,
    value: parseFloat(inv.quantity) * parseFloat(inv.currentPrice),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b-2 border-primary pb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <BarChart3 className="w-8 h-8" /> {t("analyticsInsights")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{t("visualizeFinancialData")}</p>
          </div>
          <div className="flex gap-2">
            {(["week", "month", "year"] as DateRange[]).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-4 py-2 rounded-lg font-medium uppercase text-xs transition-all ${
                  dateRange === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}>{r}</button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-neon p-6"><div className="hud-stat-label">{t("totalIncome")}</div><div className="hud-stat-value text-secondary">{fmt(totalIncome)}</div></div>
          <div className="card-neon p-6"><div className="hud-stat-label">{t("totalExpenses")}</div><div className="hud-stat-value text-destructive">{fmt(totalExpenses)}</div></div>
          <div className="card-neon p-6"><div className="hud-stat-label">{t("portfolioValue")}</div><div className="hud-stat-value text-primary">{fmt(portfolioValue)}</div></div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses */}
          <div className="card-neon p-6">
            <h3 className="text-lg font-bold mb-4">Income vs Expenses</h3>
            {incomeVsExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="income" fill="hsl(160, 84%, 39%)" />
                  <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">{t("noData")}</p>}
          </div>

          {/* Expenses by Category */}
          <div className="card-neon p-6">
            <h3 className="text-lg font-bold mb-4">Expenses by Category</h3>
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expensesByCategory} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">{t("noData")}</p>}
          </div>

          {/* Portfolio */}
          <div className="card-neon p-6 lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Portfolio Breakdown</h3>
            {portfolioBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portfolioBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="hsl(217, 91%, 60%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">{t("noData")}</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
