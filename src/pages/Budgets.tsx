import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { budgetsStore } from "@/lib/store";
import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Budgets() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", limitAmount: "", category: "General", period: "monthly", alertThreshold: "80" });

  const budgets = budgetsStore.list();
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.limitAmount) { toast.error(t("pleaseFillAllFields")); return; }
    budgetsStore.create({
      name: form.name, limitAmount: form.limitAmount, spent: "0",
      period: form.period, category: form.category,
      alertThreshold: parseInt(form.alertThreshold), isActive: true,
    });
    toast.success(t("budgetAdded"));
    setForm({ name: "", limitAmount: "", category: "General", period: "monthly", alertThreshold: "80" });
    setShowAddForm(false);
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b-2 border-destructive/30 pb-6">
          <div>
            <h1 className="text-3xl font-bold neon-text-pink">{t("budgetManagementTitle").toUpperCase()}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("budgetManagementSubtitle")}</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="btn-neon-cyan flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> {t("addBudget")}
          </button>
        </div>

        {showAddForm && (
          <div className="card-neon-pink p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-destructive uppercase">{t("addBudget")}</h3>
              <button onClick={() => setShowAddForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder={t("budgetName")} value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="number" step="0.01" placeholder={t("limitAmount")} value={form.limitAmount} onChange={e => setForm({...form, limitAmount: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <select value={form.period} onChange={e => setForm({...form, period: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background">
                <option value="daily">{t("daily")}</option>
                <option value="weekly">{t("weekly")}</option>
                <option value="monthly">{t("monthly")}</option>
                <option value="yearly">{t("yearly")}</option>
              </select>
              <input type="number" placeholder="Alert Threshold (%)" value={form.alertThreshold} onChange={e => setForm({...form, alertThreshold: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="flex-1 btn-neon-cyan">{t("submit")}</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border">{t("cancel")}</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.length === 0 ? (
            <div className="col-span-full card-neon p-8 text-center text-muted-foreground">{t("noBudgets")}</div>
          ) : budgets.map(budget => {
            const spent = parseFloat(budget.spent);
            const limit = parseFloat(budget.limitAmount);
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const isOver = pct >= 100;
            const isAlert = pct >= budget.alertThreshold;
            return (
              <div key={budget.id} className={`card-neon p-6 ${isOver ? 'border-destructive' : isAlert ? 'border-chart-3' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{budget.name}</h3>
                    <span className="text-xs text-muted-foreground uppercase">{budget.period}</span>
                  </div>
                  <button onClick={() => { budgetsStore.delete(budget.id); refresh(); toast.success(t("budgetDeletedSuccessfully")); }}
                    className="text-destructive hover:text-destructive/70"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>{fmt(spent)}</span><span className="text-muted-foreground">{fmt(limit)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isOver ? 'bg-destructive' : isAlert ? 'bg-chart-3' : 'bg-secondary'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className={`text-right mt-2 font-bold text-sm ${isOver ? 'text-destructive' : isAlert ? 'text-chart-3' : 'text-secondary'}`}>
                  {pct.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
