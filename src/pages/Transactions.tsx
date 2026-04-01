import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { transactionsStore } from "@/lib/store";
import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

type TimeRange = "daily" | "weekly" | "monthly";

export default function Transactions() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [timeRange, setTimeRange] = useState<TimeRange>("monthly");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ amount: "", description: "", type: "expense" as "income" | "expense", category: "General" });

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    if (timeRange === "daily") start.setHours(0, 0, 0, 0);
    else if (timeRange === "weekly") { start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); }
    else start.setDate(1);
    return { start, end: now };
  };

  const { start, end } = getDateRange();
  const allTransactions = transactionsStore.list();
  const transactions = allTransactions.filter(t => {
    const d = new Date(t.transactionDate);
    return d >= start && d <= end;
  });

  const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) { toast.error(t("pleaseFillAllFields")); return; }
    transactionsStore.create({ ...formData, transactionDate: new Date().toISOString() });
    toast.success(t("transactionAdded"));
    setFormData({ amount: "", description: "", type: "expense", category: "General" });
    setShowAddForm(false);
    refresh();
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    transactionsStore.delete(id);
    toast.success(t("transactionDeletedSuccessfully"));
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b-2 border-destructive/30 pb-6">
          <div>
            <h1 className="text-3xl font-bold neon-text-pink">{t("transactionHistory").toUpperCase()}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("trackAllTransactions")}</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="btn-neon-cyan flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> {t("addTransaction")}
          </button>
        </div>

        {/* Time Range */}
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as TimeRange[]).map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              className={`px-4 py-2 rounded-lg font-medium uppercase text-xs transition-all ${
                timeRange === r ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'
              }`}>{r}</button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card-neon p-4">
            <div className="hud-stat-label">{t("income")}</div>
            <div className="text-xl font-bold text-secondary">{fmt(incomeTotal)}</div>
          </div>
          <div className="card-neon p-4">
            <div className="hud-stat-label">{t("expenses")}</div>
            <div className="text-xl font-bold text-destructive">{fmt(expenseTotal)}</div>
          </div>
          <div className="card-neon p-4">
            <div className="hud-stat-label">{t("net")}</div>
            <div className={`text-xl font-bold ${incomeTotal - expenseTotal >= 0 ? 'text-secondary' : 'text-destructive'}`}>{fmt(incomeTotal - expenseTotal)}</div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="card-neon-pink p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-destructive uppercase">{t("addTransaction")}</h3>
              <button onClick={() => setShowAddForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background">
                <option value="expense">{t("expense")}</option>
                <option value="income">{t("income")}</option>
              </select>
              <input type="number" step="0.01" placeholder={t("amount")} value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="text" placeholder={t("description")} value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background">
                {["General", "Food", "Transport", "Entertainment", "Shopping", "Bills", "Health", "Savings"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="flex-1 btn-neon-cyan">{t("submit")}</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border">{t("cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {/* Transaction List */}
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="card-neon p-8 text-center text-muted-foreground">{t("noTransactions")}</div>
          ) : (
            transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()).map(tx => (
              <div key={tx.id} className="card-neon p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'income' ? 'bg-secondary/20 text-secondary' : 'bg-destructive/20 text-destructive'}`}>
                      {tx.type.toUpperCase()}
                    </span>
                    <span className="font-medium">{tx.description || "No description"}</span>
                    <span className="text-xs text-muted-foreground">{tx.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(tx.transactionDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${tx.type === 'income' ? 'text-secondary' : 'text-destructive'}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(parseFloat(tx.amount))}
                  </span>
                  <button onClick={() => handleDelete(tx.id)} className="text-destructive hover:text-destructive/70">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
