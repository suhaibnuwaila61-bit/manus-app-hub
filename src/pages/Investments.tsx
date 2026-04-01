import DashboardLayout from "@/components/DashboardLayout";
import PageTransition from "@/components/PageTransition";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { investmentsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Investments() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", assetType: "stock", quantity: "", purchasePrice: "", currentPrice: "", name: "" });

  const investments = investmentsStore.list();
  const portfolioValue = investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.currentPrice), 0);
  const totalCost = investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.purchasePrice), 0);
  const totalGain = portfolioValue - totalCost;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symbol || !form.quantity || !form.purchasePrice || !form.currentPrice) { toast.error(t("pleaseFillAllFields")); return; }
    investmentsStore.create({ symbol: form.symbol.toUpperCase(), assetType: form.assetType, quantity: form.quantity, purchasePrice: form.purchasePrice, currentPrice: form.currentPrice, name: form.name || form.symbol.toUpperCase() });
    toast.success(t("investmentAdded"));
    setForm({ symbol: "", assetType: "stock", quantity: "", purchasePrice: "", currentPrice: "", name: "" });
    setShowForm(false);
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">{t("investmentPortfolioTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("investmentPortfolioSubtitle")}</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm" className="glow-button shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-500">
            <Plus className="h-4 w-4 me-1" /> {t("addInvestment")}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("totalValue")}</span><p className="text-lg font-display font-bold">{fmt(portfolioValue)}</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("totalCost")}</span><p className="text-lg font-display font-bold">{fmt(totalCost)}</p></div>
          <div className={totalGain >= 0 ? "stat-card-success" : "stat-card-destructive"}><span className="text-xs text-muted-foreground">{t("totalGain")}</span><p className={`text-lg font-display font-bold ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>{fmt(totalGain)}</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("assets")}</span><p className="text-lg font-display font-bold">{investments.length}</p></div>
        </div>

        {showForm && (
          <div className="glass-card animate-slide-up" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">{t("addInvestment")}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder={t("symbol")} value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value})} className="input-field" />
              <input type="text" placeholder={t("name")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
              <select value={form.assetType} onChange={e => setForm({...form, assetType: e.target.value})} className="input-field">
                {["stock", "crypto", "bond", "etf", "mutual", "commodity", "other"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <input type="number" step="0.01" placeholder={t("quantity")} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("purchasePrice")} value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("currentPrice")} value={form.currentPrice} onChange={e => setForm({...form, currentPrice: e.target.value})} className="input-field" />
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" size="sm" className="flex-1 glow-button shadow-md shadow-primary/20">{t("submit")}</Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              </div>
            </form>
          </div>
        )}

        <div className="glass-card p-0 overflow-hidden">
          {investments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">{t("noInvestments")}</p>
          ) : (
            <div className="divide-y divide-border/50">
              {investments.map(inv => {
                const value = parseFloat(inv.quantity) * parseFloat(inv.currentPrice);
                const cost = parseFloat(inv.quantity) * parseFloat(inv.purchasePrice);
                const gain = value - cost;
                const pct = cost > 0 ? (gain / cost) * 100 : 0;
                return (
                  <div key={inv.id} className="list-item">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold">{inv.symbol}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{inv.assetType}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{inv.quantity} × {fmt(parseFloat(inv.currentPrice))}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ms-3">
                      <div className="text-end">
                        <p className="text-sm font-display font-semibold">{fmt(value)}</p>
                        <p className={`text-xs ${gain >= 0 ? "text-success" : "text-destructive"}`}>{gain >= 0 ? "+" : ""}{fmt(gain)} ({pct.toFixed(1)}%)</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={() => { investmentsStore.delete(inv.id); refresh(); toast.success(t("investmentDeletedSuccessfully")); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
