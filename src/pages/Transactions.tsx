import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { transactionsStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Transactions() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ amount: "", description: "", type: "expense" as "income" | "expense", category: "General" });

  const transactions = transactionsStore.list();
  const expenseTotal = transactions.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
  const incomeTotal = transactions.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("transactionHistory")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("trackAllTransactions")}</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 me-1" /> {t("addTransaction")}
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><span className="text-xs text-muted-foreground">{t("income")}</span><p className="text-lg font-bold text-success">{fmt(incomeTotal)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><span className="text-xs text-muted-foreground">{t("expense")}</span><p className="text-lg font-bold text-destructive">{fmt(expenseTotal)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><span className="text-xs text-muted-foreground">{t("net")}</span><p className={`text-lg font-bold ${incomeTotal - expenseTotal >= 0 ? "text-success" : "text-destructive"}`}>{fmt(incomeTotal - expenseTotal)}</p></CardContent></Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">{t("addTransaction")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="expense">{t("expense")}</option>
                  <option value="income">{t("income")}</option>
                </select>
                <input type="number" step="0.01" placeholder={t("amount")} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <input type="text" placeholder={t("description")} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {["General", "Food", "Transport", "Entertainment", "Shopping", "Bills", "Health", "Savings"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">{t("submit")}</Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <Card>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">{t("noTransactions")}</p>
            ) : (
              <div className="divide-y divide-border">
                {transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${tx.type === "income" ? "bg-success" : "bg-destructive"}`} />
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
                      <span className={`text-sm font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "-"}{fmt(parseFloat(tx.amount))}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { transactionsStore.delete(tx.id); refresh(); toast.success(t("transactionDeletedSuccessfully")); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
