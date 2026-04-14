import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSupabaseTable } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Trash2, Loader2, TrendingUp, TrendingDown, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Investments() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const { data: investments, loading, create, update, remove } = useSupabaseTable<any>("investments");
  const { data: txns, create: createTxn } = useSupabaseTable<any>("investment_transactions");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", asset_type: "stock", quantity: "", purchase_price: "", current_price: "", name: "", sector: "other", purchase_date: new Date(), notes: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sellForm, setSellForm] = useState<{ id: string; quantity: string; price: string; fees: string } | null>(null);
  const [buyMoreForm, setBuyMoreForm] = useState<{ id: string; quantity: string; price: string; fees: string } | null>(null);

  // Calculator state
  const [roiCalc, setRoiCalc] = useState({ buyPrice: "", sellPrice: "", quantity: "", fees: "" });
  const [compoundCalc, setCompoundCalc] = useState({ principal: "", rate: "", years: "" });

  const portfolioValue = investments.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.current_price), 0);
  const totalCost = investments.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.purchase_price), 0);
  const unrealizedGain = portfolioValue - totalCost;

  // Realized gains from sell transactions
  const realizedGain = txns
    .filter((tx: any) => tx.action === "sell")
    .reduce((s: number, tx: any) => {
      const inv = investments.find((i: any) => i.id === tx.investment_id);
      if (!inv) return s;
      return s + (Number(tx.price_per_unit) - Number(inv.purchase_price)) * Number(tx.quantity) - Number(tx.fees);
    }, 0);

  const totalReturn = totalCost > 0 ? ((unrealizedGain + realizedGain) / totalCost) * 100 : 0;

  // Best/worst performer
  const performers = investments.map((i: any) => {
    const gain = (Number(i.current_price) - Number(i.purchase_price)) / Number(i.purchase_price) * 100;
    return { symbol: i.symbol, gain };
  }).sort((a: any, b: any) => b.gain - a.gain);

  const best = performers[0];
  const worst = performers[performers.length - 1];

  // Allocation by type
  const allocationMap: Record<string, number> = {};
  investments.forEach((i: any) => {
    const val = Number(i.quantity) * Number(i.current_price);
    allocationMap[i.asset_type] = (allocationMap[i.asset_type] || 0) + val;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symbol || !form.quantity || !form.purchase_price || !form.current_price) { toast.error(t("pleaseFillAllFields")); return; }
    const inv = await create({
      symbol: form.symbol.toUpperCase(), asset_type: form.asset_type, quantity: parseFloat(form.quantity),
      purchase_price: parseFloat(form.purchase_price), current_price: parseFloat(form.current_price),
      name: form.name || form.symbol.toUpperCase(), sector: form.sector,
      purchase_date: form.purchase_date.toISOString(), notes: form.notes
    });
    if (inv) {
      await createTxn({
        investment_id: inv.id, action: "buy", quantity: parseFloat(form.quantity),
        price_per_unit: parseFloat(form.purchase_price),
        total_amount: parseFloat(form.quantity) * parseFloat(form.purchase_price),
        fees: 0, notes: "Initial purchase", transaction_date: form.purchase_date.toISOString()
      });
    }
    toast.success(t("investmentAdded"));
    setForm({ symbol: "", asset_type: "stock", quantity: "", purchase_price: "", current_price: "", name: "", sector: "other", purchase_date: new Date(), notes: "" });
    setShowForm(false);
  };

  const handleSell = async () => {
    if (!sellForm) return;
    const inv = investments.find((i: any) => i.id === sellForm.id);
    if (!inv) return;
    const qty = parseFloat(sellForm.quantity);
    const price = parseFloat(sellForm.price);
    const fees = parseFloat(sellForm.fees || "0");
    if (!qty || !price || qty > Number(inv.quantity)) { toast.error(t("pleaseFillAllFields")); return; }

    await createTxn({
      investment_id: inv.id, action: "sell", quantity: qty, price_per_unit: price,
      total_amount: qty * price, fees, notes: "", transaction_date: new Date().toISOString()
    });

    const newQty = Number(inv.quantity) - qty;
    if (newQty <= 0) {
      await remove(inv.id);
    } else {
      await update(inv.id, { quantity: newQty });
    }
    toast.success(t("sellInvestment"));
    setSellForm(null);
  };

  // ROI calculation
  const roiResult = (() => {
    const b = parseFloat(roiCalc.buyPrice), s = parseFloat(roiCalc.sellPrice), q = parseFloat(roiCalc.quantity), f = parseFloat(roiCalc.fees || "0");
    if (!b || !s || !q) return null;
    const cost = b * q + f;
    const revenue = s * q;
    const profit = revenue - cost;
    const roi = (profit / cost) * 100;
    return { profit, roi };
  })();

  // Compound growth
  const compoundResult = (() => {
    const p = parseFloat(compoundCalc.principal), r = parseFloat(compoundCalc.rate), y = parseFloat(compoundCalc.years);
    if (!p || !r || !y) return null;
    const value = p * Math.pow(1 + r / 100, y);
    return { value, gain: value - p };
  })();

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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("totalValue")}</span><p className="text-lg font-display font-bold">{fmt(portfolioValue)}</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("totalCost")}</span><p className="text-lg font-display font-bold">{fmt(totalCost)}</p></div>
          <div className={unrealizedGain >= 0 ? "stat-card-success" : "stat-card-destructive"}><span className="text-xs text-muted-foreground">{t("unrealizedGain")}</span><p className={`text-lg font-display font-bold ${unrealizedGain >= 0 ? "text-success" : "text-destructive"}`}>{fmt(unrealizedGain)}</p></div>
          <div className={realizedGain >= 0 ? "stat-card-success" : "stat-card-destructive"}><span className="text-xs text-muted-foreground">{t("realizedGain")}</span><p className={`text-lg font-display font-bold ${realizedGain >= 0 ? "text-success" : "text-destructive"}`}>{fmt(realizedGain)}</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("totalReturn")}</span><p className={`text-lg font-display font-bold ${totalReturn >= 0 ? "text-success" : "text-destructive"}`}>{totalReturn.toFixed(1)}%</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("assets")}</span><p className="text-lg font-display font-bold">{investments.length}</p></div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="glass-card animate-slide-up" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">{t("addInvestment")}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input type="text" placeholder={t("symbol")} value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value})} className="input-field" />
              <input type="text" placeholder={t("name")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" />
              <Select value={form.asset_type} onValueChange={(v) => setForm({...form, asset_type: v})}>
                <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                  {["stock", "crypto", "bond", "etf", "mutual", "commodity", "other"].map(type => (
                    <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.sector} onValueChange={(v) => setForm({...form, sector: v})}>
                <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                  {["technology", "healthcare", "finance", "energy", "consumer", "industrial", "real_estate", "other"].map(s => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="number" step="0.01" placeholder={t("quantity")} value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("purchasePrice")} value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("currentPrice")} value={form.current_price} onChange={e => setForm({...form, current_price: e.target.value})} className="input-field" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-10 justify-start text-left font-normal border-border/50 bg-background/50", !form.purchase_date && "text-muted-foreground")}>
                    {form.purchase_date ? format(form.purchase_date, "PPP") : t("purchaseDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.purchase_date} onSelect={(d) => d && setForm({...form, purchase_date: d})} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <input type="text" placeholder={t("notes")} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-field" />
              <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit" size="sm" className="flex-1 glow-button shadow-md shadow-primary/20">{t("submit")}</Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              </div>
            </form>
          </div>
        )}

        {/* Sell Form Modal */}
        {sellForm && (
          <div className="glass-card animate-slide-up" style={{ borderColor: "hsl(var(--destructive) / 0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-destructive">{t("sellInvestment")} — {investments.find((i: any) => i.id === sellForm.id)?.symbol}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSellForm(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="number" step="0.01" placeholder={t("quantity")} value={sellForm.quantity} onChange={e => setSellForm({...sellForm, quantity: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("sellPrice")} value={sellForm.price} onChange={e => setSellForm({...sellForm, price: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("fees")} value={sellForm.fees} onChange={e => setSellForm({...sellForm, fees: e.target.value})} className="input-field" />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="destructive" className="flex-1" onClick={handleSell}>{t("recordSell")}</Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setSellForm(null)}>{t("cancel")}</Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="portfolio">{t("portfolio")}</TabsTrigger>
            <TabsTrigger value="calculator"><Calculator className="h-4 w-4 me-1 inline" />{t("calculator")}</TabsTrigger>
            <TabsTrigger value="history">{t("history")}</TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4 mt-4">
            {/* Allocation + Performers */}
            {investments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Allocation */}
                <div className="glass-card">
                  <h4 className="text-sm font-display font-semibold mb-3">{t("allocationByType")}</h4>
                  <div className="space-y-2">
                    {Object.entries(allocationMap).map(([type, val]) => (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span className="capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${portfolioValue > 0 ? (val / portfolioValue) * 100 : 0}%` }} />
                          </div>
                          <span className="text-muted-foreground w-10 text-end">{portfolioValue > 0 ? ((val / portfolioValue) * 100).toFixed(0) : 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Best */}
                {best && (
                  <div className="stat-card-success">
                    <span className="text-xs text-muted-foreground">{t("bestPerformer")}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="font-display font-bold">{best.symbol}</span>
                      <span className="text-success text-sm">+{best.gain.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
                {/* Worst */}
                {worst && investments.length > 1 && (
                  <div className="stat-card-destructive">
                    <span className="text-xs text-muted-foreground">{t("worstPerformer")}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="font-display font-bold">{worst.symbol}</span>
                      <span className="text-destructive text-sm">{worst.gain.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Investment List */}
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
                    const isExpanded = expandedId === inv.id;
                    const invTxns = txns.filter((tx: any) => tx.investment_id === inv.id);
                    return (
                      <div key={inv.id}>
                        <div className="list-item cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : inv.id)}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-semibold">{inv.symbol}</span>
                              {inv.name && inv.name !== inv.symbol && <span className="text-xs text-muted-foreground">{inv.name}</span>}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{inv.asset_type}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{inv.sector}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {inv.quantity} × {fmt(Number(inv.current_price))}
                              {inv.purchase_date && ` · ${format(new Date(inv.purchase_date), "MMM d, yyyy")}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ms-3">
                            <div className="text-end">
                              <p className="text-sm font-display font-semibold">{fmt(value)}</p>
                              <p className={`text-xs ${gain >= 0 ? "text-success" : "text-destructive"}`}>{gain >= 0 ? "+" : ""}{fmt(gain)} ({pct.toFixed(1)}%)</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-warning" onClick={(e) => { e.stopPropagation(); setSellForm({ id: inv.id, quantity: "", price: "", fees: "" }); }}>
                              <TrendingDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={async (e) => { e.stopPropagation(); await remove(inv.id); toast.success(t("investmentDeletedSuccessfully")); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                        {/* Expanded: transaction history */}
                        {isExpanded && (
                          <div className="px-4 pb-4 bg-muted/30">
                            {inv.notes && <p className="text-xs text-muted-foreground mb-2 italic">{inv.notes}</p>}
                            <h5 className="text-xs font-semibold text-muted-foreground mb-2">{t("transactionHistoryInv")}</h5>
                            {invTxns.length === 0 ? (
                              <p className="text-xs text-muted-foreground">{t("noTransactionsInv")}</p>
                            ) : (
                              <div className="space-y-1">
                                {invTxns.map((tx: any) => (
                                  <div key={tx.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${tx.action === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                                        {t(tx.action)}
                                      </span>
                                      <span>{tx.quantity} × {fmt(Number(tx.price_per_unit))}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      {tx.fees > 0 && <span>{t("fees")}: {fmt(Number(tx.fees))}</span>}
                                      <span>{format(new Date(tx.transaction_date), "MMM d, yyyy")}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ROI Calculator */}
              <div className="glass-card">
                <h3 className="font-display font-semibold mb-4">{t("roiCalculator")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.01" placeholder={t("buyPrice")} value={roiCalc.buyPrice} onChange={e => setRoiCalc({...roiCalc, buyPrice: e.target.value})} className="input-field" />
                  <input type="number" step="0.01" placeholder={t("sellPrice")} value={roiCalc.sellPrice} onChange={e => setRoiCalc({...roiCalc, sellPrice: e.target.value})} className="input-field" />
                  <input type="number" step="0.01" placeholder={t("quantity")} value={roiCalc.quantity} onChange={e => setRoiCalc({...roiCalc, quantity: e.target.value})} className="input-field" />
                  <input type="number" step="0.01" placeholder={t("fees")} value={roiCalc.fees} onChange={e => setRoiCalc({...roiCalc, fees: e.target.value})} className="input-field" />
                </div>
                {roiResult && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("netProfit")}</span><span className={`font-display font-bold ${roiResult.profit >= 0 ? "text-success" : "text-destructive"}`}>{fmt(roiResult.profit)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("roi")}</span><span className={`font-display font-bold ${roiResult.roi >= 0 ? "text-success" : "text-destructive"}`}>{roiResult.roi.toFixed(2)}%</span></div>
                  </div>
                )}
              </div>

              {/* Compound Growth */}
              <div className="glass-card">
                <h3 className="font-display font-semibold mb-4">{t("compoundGrowth")}</h3>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" step="0.01" placeholder={t("principal")} value={compoundCalc.principal} onChange={e => setCompoundCalc({...compoundCalc, principal: e.target.value})} className="input-field" />
                  <input type="number" step="0.01" placeholder={t("rate")} value={compoundCalc.rate} onChange={e => setCompoundCalc({...compoundCalc, rate: e.target.value})} className="input-field" />
                  <input type="number" step="1" placeholder={t("years")} value={compoundCalc.years} onChange={e => setCompoundCalc({...compoundCalc, years: e.target.value})} className="input-field" />
                </div>
                {compoundResult && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("projectedValue")}</span><span className="font-display font-bold text-primary">{fmt(compoundResult.value)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("totalGain")}</span><span className="font-display font-bold text-success">{fmt(compoundResult.gain)}</span></div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <div className="glass-card p-0 overflow-hidden">
              {txns.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">{t("noTransactionsInv")}</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {txns.map((tx: any) => {
                    const inv = investments.find((i: any) => i.id === tx.investment_id);
                    return (
                      <div key={tx.id} className="list-item">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tx.action === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                              {t(tx.action)}
                            </span>
                            <span className="font-display font-semibold">{inv?.symbol || "—"}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{tx.quantity} × {fmt(Number(tx.price_per_unit))}</p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-sm font-display font-semibold">{fmt(Number(tx.total_amount))}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(tx.transaction_date), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
