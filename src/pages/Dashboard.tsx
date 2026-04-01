import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { transactionsStore, investmentsStore, savingsGoalsStore, lendingsStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Wallet, Target, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["hsl(230, 80%, 56%)", "hsl(152, 69%, 41%)", "hsl(38, 92%, 50%)", "hsl(270, 67%, 58%)", "hsl(0, 72%, 51%)", "hsl(190, 90%, 50%)"];

export default function Dashboard() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", amount: "", description: "", category: "General" });

  const transactions = transactionsStore.list();
  const investments = investmentsStore.list();
  const savingsGoals = savingsGoalsStore.list();
  const lendings = lendingsStore.list();

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
  const portfolioValue = investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.currentPrice), 0);
  const totalSavings = savingsGoals.reduce((s, g) => s + parseFloat(g.currentAmount), 0);
  const netWorth = totalIncome + totalSavings + portfolioValue - totalExpenses;

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) { toast.error(t("pleaseFillAllFields")); return; }
    transactionsStore.create({ amount: form.amount, description: form.description, type: form.type as "income" | "expense", category: form.category, transactionDate: new Date().toISOString() });
    toast.success(t("transactionAdded"));
    setForm({ type: "expense", amount: "", description: "", category: "General" });
    setShowForm(false);
    refresh();
  };

  // Analytics data
  const last30 = transactions.filter(tx => new Date(tx.transactionDate) >= new Date(Date.now() - 30 * 86400000));
  const incomeVsExpenses = (() => {
    const grouped: Record<string, { income: number; expenses: number }> = {};
    last30.forEach(tx => {
      const d = new Date(tx.transactionDate).toLocaleDateString();
      if (!grouped[d]) grouped[d] = { income: 0, expenses: 0 };
      if (tx.type === "income") grouped[d].income += parseFloat(tx.amount);
      else grouped[d].expenses += parseFloat(tx.amount);
    });
    return Object.entries(grouped).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  const expensesByCategory = (() => {
    const grouped: Record<string, number> = {};
    last30.filter(t => t.type === "expense").forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + parseFloat(t.amount); });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  })();

  const stats = [
    { label: t("netWorth"), value: fmt(netWorth), icon: Wallet, trend: netWorth >= 0 ? "up" : "down" },
    { label: t("totalIncome"), value: fmt(totalIncome), icon: TrendingUp, trend: "up" as const },
    { label: t("totalExpenses"), value: fmt(totalExpenses), icon: TrendingDown, trend: "down" as const },
    { label: t("portfolioValue"), value: fmt(portfolioValue), icon: Target, trend: "up" as const },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("financialDashboard")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("overview")}</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 me-1" /> {t("addEntry")}
          </Button>
        </div>

        {/* Quick Add */}
        {showForm && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">{t("addEntry")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="expense">{t("expense")}</option>
                  <option value="income">{t("income")}</option>
                </select>
                <input type="number" step="0.01" placeholder={t("amount")} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <input type="text" placeholder={t("description")} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {["General", "Food", "Transport", "Entertainment", "Shopping", "Bills", "Health", "Savings", "Salary"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">{t("submit")}</Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
            <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                      <s.icon className={`h-4 w-4 ${s.trend === "up" ? "text-success" : "text-destructive"}`} />
                    </div>
                    <p className="text-xl font-bold">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("transactions")}</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{t("noTransactions")}</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(-5).reverse().map(tx => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${tx.type === "income" ? "bg-success" : "bg-destructive"}`} />
                          <div>
                            <p className="text-sm font-medium">{tx.description || tx.category}</p>
                            <p className="text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                          {tx.type === "income" ? "+" : "-"}{fmt(parseFloat(tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">{t("incomeVsExpenses")}</CardTitle></CardHeader>
                <CardContent>
                  {incomeVsExpenses.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={incomeVsExpenses}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="income" fill="hsl(152, 69%, 41%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-sm text-muted-foreground py-12">{t("noData")}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">{t("expensesByCategory")}</CardTitle></CardHeader>
                <CardContent>
                  {expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={expensesByCategory} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                          {expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-sm text-muted-foreground py-12">{t("noData")}</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
