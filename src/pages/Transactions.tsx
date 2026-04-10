import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSupabaseTable } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Trash2, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Transactions() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const { data: transactions, loading, create, remove } = useSupabaseTable<any>("transactions");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ amount: "", description: "", type: "expense" as "income" | "expense", category: "General" });

  const expenseTotal = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const incomeTotal = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) { toast.error(t("pleaseFillAllFields")); return; }
    await create({ amount: parseFloat(formData.amount), description: formData.description, type: formData.type, category: formData.category, transaction_date: new Date().toISOString() });
    toast.success(t("transactionAdded"));
    setFormData({ amount: "", description: "", type: "expense", category: "General" });
    setShowForm(false);
  };

  const categories = ["General", "Food", "Transport", "Entertainment", "Shopping", "Bills", "Health", "Savings"];

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v as "income" | "expense"})}>
                <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl shadow-xl shadow-primary/10">
                  <SelectItem value="expense" className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t("expense")}</SelectItem>
                  <SelectItem value="income" className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t("income")}</SelectItem>
                </SelectContent>
              </Select>
              <input type="number" step="0.01" placeholder={t("amount")} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-field" />
              <input type="text" placeholder={t("description")} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field" />
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl shadow-xl shadow-primary/10">
                  {categories.map(c => (
                    <SelectItem key={c} value={c} className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {[...transactions].sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()).map((tx: any) => (
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
                        <span>{new Date(tx.transaction_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ms-3">
                    <span className={`text-sm font-display font-semibold ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}{fmt(Number(tx.amount))}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={async () => { await remove(tx.id); toast.success(t("transactionDeletedSuccessfully")); }}>
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
