import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { investmentsStore } from "@/lib/store";
import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Investments() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", assetType: "stock", quantity: "", purchasePrice: "", currentPrice: "", name: "" });

  const investments = investmentsStore.list();
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const portfolioValue = investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.currentPrice), 0);
  const totalCost = investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.purchasePrice), 0);
  const totalGain = portfolioValue - totalCost;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symbol || !form.quantity || !form.purchasePrice || !form.currentPrice) {
      toast.error(t("pleaseFillAllFields")); return;
    }
    investmentsStore.create({
      symbol: form.symbol.toUpperCase(),
      assetType: form.assetType,
      quantity: form.quantity,
      purchasePrice: form.purchasePrice,
      currentPrice: form.currentPrice,
      name: form.name || form.symbol.toUpperCase(),
    });
    toast.success(t("investmentAdded"));
    setForm({ symbol: "", assetType: "stock", quantity: "", purchasePrice: "", currentPrice: "", name: "" });
    setShowAddForm(false);
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold neon-text">{t("investmentPortfolioTitle")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("investmentPortfolioSubtitle")}</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="btn-neon-cyan flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> {t("addInvestment")}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-neon p-4"><div className="hud-stat-label">Total Value</div><div className="text-xl font-bold text-primary">{fmt(portfolioValue)}</div></div>
          <div className="card-neon p-4"><div className="hud-stat-label">Total Cost</div><div className="text-xl font-bold text-primary">{fmt(totalCost)}</div></div>
          <div className={`card-neon p-4`}><div className="hud-stat-label">Gain/Loss</div><div className={`text-xl font-bold ${totalGain >= 0 ? 'text-secondary' : 'text-destructive'}`}>{fmt(totalGain)}</div></div>
          <div className="card-neon p-4"><div className="hud-stat-label">Assets</div><div className="text-xl font-bold text-primary">{investments.length}</div></div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="card-neon-pink p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-destructive uppercase">{t("addInvestment")}</h3>
              <button onClick={() => setShowAddForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder={t("symbol")} value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="text" placeholder={t("name")} value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <select value={form.assetType} onChange={e => setForm({...form, assetType: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background">
                {["stock", "crypto", "bond", "etf", "mutual", "commodity", "other"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <input type="number" step="0.01" placeholder={t("quantity")} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="number" step="0.01" placeholder={t("purchasePrice")} value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="number" step="0.01" placeholder={t("currentPrice")} value={form.currentPrice} onChange={e => setForm({...form, currentPrice: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="flex-1 btn-neon-cyan">{t("submit")}</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border">{t("cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {/* Investment List */}
        {investments.length === 0 ? (
          <div className="card-neon p-8 text-center text-muted-foreground">{t("noInvestments")}</div>
        ) : (
          <div className="space-y-3">
            {investments.map(inv => {
              const value = parseFloat(inv.quantity) * parseFloat(inv.currentPrice);
              const cost = parseFloat(inv.quantity) * parseFloat(inv.purchasePrice);
              const gain = value - cost;
              const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
              return (
                <div key={inv.id} className="card-neon p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary text-lg">{inv.symbol}</span>
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{inv.assetType}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {inv.quantity} units × {fmt(parseFloat(inv.currentPrice))} = {fmt(value)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`font-bold ${gain >= 0 ? 'text-secondary' : 'text-destructive'}`}>{fmt(gain)}</div>
                      <div className={`text-xs ${gain >= 0 ? 'text-secondary' : 'text-destructive'}`}>{gainPct.toFixed(2)}%</div>
                    </div>
                    <button onClick={() => { investmentsStore.delete(inv.id); refresh(); toast.success(t("investmentDeletedSuccessfully")); }}
                      className="text-destructive hover:text-destructive/70"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
