import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSupabaseTable } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Trash2, TrendingUp, TrendingDown, Loader2, Camera, Upload, ScanLine, Check } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Transactions() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const { data: transactions, loading, create, remove } = useSupabaseTable<any>("transactions");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ amount: "", description: "", type: "expense" as "income" | "expense", category: "General" });

  // Scan state
  const [showScan, setShowScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedTx, setScannedTx] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);

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

  const handleImageSelected = async (file: File) => {
    setScanning(true);
    setScannedTx([]);

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-receipt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image: base64 }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Scan failed");
      }

      const data = await response.json();
      if (data.transactions && data.transactions.length > 0) {
        setScannedTx(data.transactions);
        toast.success(t("scanSuccess").replace("{count}", String(data.transactions.length)));
      } else {
        toast.info(t("scanNoResults"));
      }
    } catch (e: any) {
      console.error("Scan error:", e);
      toast.error(t("scanError"));
    } finally {
      setScanning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelected(file);
    e.target.value = "";
  };

  const addScannedTransaction = async (tx: any, index: number) => {
    await create({
      amount: tx.amount,
      description: tx.description,
      type: tx.type,
      category: tx.category,
      transaction_date: tx.transaction_date || new Date().toISOString(),
    });
    toast.success(t("transactionAdded"));
    setScannedTx((prev) => prev.filter((_, i) => i !== index));
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
          <div className="flex gap-2">
            <Button onClick={() => { setShowScan(true); setScannedTx([]); }} size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10 transition-all duration-300">
              <ScanLine className="h-4 w-4 me-1" /> {t("scanReceipt")}
            </Button>
            <Button onClick={() => setShowForm(true)} size="sm" className="glow-button shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-500">
              <Plus className="h-4 w-4 me-1" /> {t("addTransaction")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="stat-card-success"><span className="text-xs text-muted-foreground">{t("income")}</span><p className="text-lg font-display font-bold text-success">{fmt(incomeTotal)}</p></div>
          <div className="stat-card-destructive"><span className="text-xs text-muted-foreground">{t("expense")}</span><p className="text-lg font-display font-bold text-destructive">{fmt(expenseTotal)}</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("net")}</span><p className={`text-lg font-display font-bold ${incomeTotal - expenseTotal >= 0 ? "text-success" : "text-destructive"}`}>{fmt(incomeTotal - expenseTotal)}</p></div>
        </div>

        {/* Scan Receipt Panel */}
        {showScan && (
          <div className="glass-card animate-slide-up" style={{ borderColor: "hsl(var(--accent) / 0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-accent" />
                <h3 className="font-display font-semibold">{t("scanReceipt")}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => { setShowScan(false); setScannedTx([]); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t("scanReceiptDesc")}</p>

            {scanning ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">{t("scanning")}</span>
              </div>
            ) : scannedTx.length === 0 ? (
              <div className="flex gap-3">
                <Button onClick={() => cameraInputRef.current?.click()} variant="outline" className="flex-1 h-20 flex-col gap-2 border-dashed border-accent/30 hover:bg-accent/5">
                  <Camera className="h-6 w-6 text-accent" />
                  <span className="text-xs">{t("takePhoto")}</span>
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 h-20 flex-col gap-2 border-dashed border-primary/30 hover:bg-primary/5">
                  <Upload className="h-6 w-6 text-primary" />
                  <span className="text-xs">{t("uploadImage")}</span>
                </Button>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="space-y-3">
                {scannedTx.map((tx, i) => (
                  <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className={tx.type === "income" ? "text-success" : "text-destructive"}>
                          {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                        </span>
                        <span>·</span>
                        <span>{tx.category}</span>
                        <span>·</span>
                        <span>{tx.transaction_date}</span>
                      </div>
                    </div>
                    <Button size="sm" className="glow-button w-full" onClick={() => addScannedTransaction(tx, i)}>
                      <Check className="h-3.5 w-3.5 me-1" /> {t("confirmAdd")}
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setScannedTx([]); }}>
                  <ScanLine className="h-4 w-4 me-1" /> {t("scanAnother")}
                </Button>
              </div>
            )}
          </div>
        )}

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
                <div key={tx.id} className="list-item cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedTx(tx)}>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={async (e) => { e.stopPropagation(); await remove(tx.id); toast.success(t("transactionDeletedSuccessfully")); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{t("transactionDetails")}</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${selectedTx.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                  {selectedTx.type === "income" ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
                </div>
                <div>
                  <p className="font-display font-semibold">{selectedTx.description || t("noData")}</p>
                  <span className={`text-lg font-display font-bold ${selectedTx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {selectedTx.type === "income" ? "+" : "-"}{fmt(Number(selectedTx.amount))}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">{t("type")}</span>
                  <span className="font-medium capitalize">{t(selectedTx.type)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">{t("category")}</span>
                  <span className="font-medium">{selectedTx.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/30">
                  <span className="text-muted-foreground">{t("date")}</span>
                  <span className="font-medium">{new Date(selectedTx.transaction_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">{t("createdAt")}</span>
                  <span className="font-medium">{new Date(selectedTx.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedTx(null)}>{t("close")}</Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={async () => { await remove(selectedTx.id); toast.success(t("transactionDeletedSuccessfully")); setSelectedTx(null); }}>
                  <Trash2 className="h-3.5 w-3.5 me-1" /> {t("delete")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
