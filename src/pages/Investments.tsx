import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSupabaseTable } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Investments() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const { data: investments, loading, create, remove } = useSupabaseTable<any>("investments");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", asset_type: "stock", quantity: "", purchase_price: "", current_price: "", name: "" });

  const portfolioValue = investments.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.current_price), 0);
  const totalCost = investments.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.purchase_price), 0);
  const totalGain = portfolioValue - totalCost;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symbol || !form.quantity || !form.purchase_price || !form.current_price) { toast.error(t("pleaseFillAllFields")); return; }
    await create({ symbol: form.symbol.toUpperCase(), asset_type: form.asset_type, quantity: parseFloat(form.quantity), purchase_price: parseFloat(form.purchase_price), current_price: parseFloat(form.current_price), name: form.name || form.symbol.toUpperCase() });
    toast.success(t("investmentAdded"));
    setForm({ symbol: "", asset_type: "stock", quantity: "", purchase_price: "", current_price: "", name: "" });
    setShowForm(false);
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

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
              <Select value={form.asset_type} onValueChange={(v) => setForm({...form, asset_type: v})}>
                <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl shadow-xl shadow-primary/10">
                  {["stock", "crypto", "bond", "etf", "mutual", "commodity", "other"].map(t => (
                    <SelectItem key={t} value={t} className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="number" step="0.01" placeholder={t("quantity")} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("purchasePrice")} value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("currentPrice")} value={form.current_price} onChange={e => setForm({...form, current_price: e.target.value})} className="input-field" />
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
              {investments.map((inv: any) => {
                const value = Number(inv.quantity) * Number(inv.current_price);
                const cost = Number(inv.quantity) * Number(inv.purchase_price);
                const gain = value - cost;
                const pct = cost > 0 ? (gain / cost) * 100 : 0;
                return (
                  <div key={inv.id} className="list-item">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold">{inv.symbol}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{inv.asset_type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{inv.quantity} × {fmt(Number(inv.current_price))}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ms-3">
                      <div className="text-end">
                        <p className="text-sm font-display font-semibold">{fmt(value)}</p>
                        <p className={`text-xs ${gain >= 0 ? "text-success" : "text-destructive"}`}>{gain >= 0 ? "+" : ""}{fmt(gain)} ({pct.toFixed(1)}%)</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={async () => { await remove(inv.id); toast.success(t("investmentDeletedSuccessfully")); }}>
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
