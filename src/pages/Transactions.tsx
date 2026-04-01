import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { transactionsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Transactions() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ amount: "", description: "", type: "expense" as "income" | "expense", category: "General" });

  const transactions = transactionsStore.list();
  const expenseTotal = transactions.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
  const incomeTotal = transactions.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) { toast.error(t("pleaseFillAllFields")); return; }
    transactionsStore.create({ ...formData, transactionDate: new Date().toISOString() });
    toast.success(t("transactionAdded"));
    setFormData({ amount: "", description: "", type: "expense", category: "General" });
    setShowForm(false);
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">{t("transactionHistory")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("trackAllTransactions")}</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm" className="glow-button shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-500">
            <Plus className="h-4 w-4 me-1" /> {t("addTransaction")}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card-success"><span className="text-xs text-muted-foreground">{t("income")}</span><p className="text-lg font-display font-bold text-success">{fmt(incomeTotal)}</p></div>
          <div className="stat-card-destructive"><span className="text-xs text-muted-foreground">{t("expense")}</span><p className="text-lg font-display font-bold text-destructive">{fmt(expenseTotal)}</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("net")}</span><p className={`text-lg font-display font-bold ${incomeTotal - expenseTotal >= 0 ? "text-success" : "text-destructive"}`}>{fmt(incomeTotal - expenseTotal)}</p></div>
        </div>

        {showForm && (
          <div className="glass-card animate-slide-up" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">{t("addTransaction")}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="input-field">
                <option value="expense">{t("expense")}</option>
                <option value="income">{t("income")}</option>
              </select>
              <input type="number" step="0.01" placeholder={t("amount")} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-field" />
              <input type="text" placeholder={t("description")} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field" />
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
                {["General", "Food", "Transport", "Entertainment", "Shopping", "Bills", "Health", "Savings"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" size="sm" className="flex-1 glow-button shadow-md shadow-primary/20">{t("submit")}</Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-card p-0 overflow-hidden">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">{t("noTransactions")}</p>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()).map(tx => (
                <div key={tx.id} className="list-item">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tx.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {tx.type === "income" ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || t("noData")}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{tx.category}</span>
                        <span>·</span>
                        <span>{new Date(tx.transactionDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ms-3">
                    <span className={`text-sm font-display font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}{fmt(parseFloat(tx.amount))}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={() => { transactionsStore.delete(tx.id); refresh(); toast.success(t("transactionDeletedSuccessfully")); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
