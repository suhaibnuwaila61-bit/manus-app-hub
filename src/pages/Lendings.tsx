import DashboardLayout from "@/components/DashboardLayout";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { lendingsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Trash2, Handshake } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Lendings() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ personName: "", type: "lent" as "lent" | "borrowed", amount: "", description: "" });

  const lendings = lendingsStore.list();
  const totalLent = lendings.filter(l => l.type === "lent").reduce((s, l) => s + parseFloat(l.amount), 0);
  const totalBorrowed = lendings.filter(l => l.type === "borrowed").reduce((s, l) => s + parseFloat(l.amount), 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personName || !form.amount) { toast.error(t("pleaseFillAllFields")); return; }
    lendingsStore.create({ ...form, amountRepaid: "0", status: "pending" });
    toast.success(t("addRecord"));
    setForm({ personName: "", type: "lent", amount: "", description: "" });
    setShowForm(false);
    refresh();
  };

  const handleRepayment = (id: number, amount: string) => {
    const lending = lendings.find(l => l.id === id);
    if (!lending) return;
    const newRepaid = parseFloat(lending.amountRepaid) + parseFloat(amount);
    lendingsStore.update(id, { amountRepaid: newRepaid.toString(), status: newRepaid >= parseFloat(lending.amount) ? "repaid" : "partial" });
    toast.success(t("repayment"));
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">{t("lendingsTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("lendingsSubtitle")}</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm" className="glow-button shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-500">
            <Plus className="h-4 w-4 me-1" /> {t("addRecord")}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card-success"><span className="text-xs text-muted-foreground">{t("totalLent")}</span><p className="text-lg font-display font-bold text-success">{fmt(totalLent)}</p></div>
          <div className="stat-card-destructive"><span className="text-xs text-muted-foreground">{t("totalBorrowed")}</span><p className="text-lg font-display font-bold text-destructive">{fmt(totalBorrowed)}</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("netPosition")}</span><p className={`text-lg font-display font-bold ${totalLent - totalBorrowed >= 0 ? "text-success" : "text-destructive"}`}>{fmt(totalLent - totalBorrowed)}</p></div>
        </div>

        {showForm && (
          <div className="glass-card animate-slide-up" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">{t("addRecord")}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder={t("personName")} value={form.personName} onChange={e => setForm({...form, personName: e.target.value})} className="input-field" />
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v as any})}>
                <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm focus:ring-primary/30 focus:border-primary/50 transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl shadow-xl shadow-primary/10">
                  <SelectItem value="lent" className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t("lent")}</SelectItem>
                  <SelectItem value="borrowed" className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t("borrowed")}</SelectItem>
                </SelectContent>
              </Select>
              <input type="number" step="0.01" placeholder={t("amount")} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-field" />
              <input type="text" placeholder={t("description")} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" size="sm" className="flex-1 glow-button shadow-md shadow-primary/20">{t("submit")}</Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              </div>
            </form>
          </div>
        )}

        {lendings.length === 0 ? (
          <div className="glass-card py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Handshake className="h-7 w-7 text-primary animate-pulse-soft" />
            </div>
            <p className="text-sm text-muted-foreground">{t("noLendings")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lendings.map(lending => {
              const outstanding = parseFloat(lending.amount) - parseFloat(lending.amountRepaid);
              return (
                <div key={lending.id} className="glass-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-semibold">{lending.personName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lending.type === "lent" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {t(lending.type)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${lending.status === "repaid" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {lending.status === "repaid" ? t("repaid") : lending.status}
                        </span>
                      </div>
                      {lending.description && <p className="text-xs text-muted-foreground">{lending.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={() => { lendingsStore.delete(lending.id); refresh(); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><p className="text-xs text-muted-foreground">{t("amount")}</p><p className="font-display font-medium">{fmt(parseFloat(lending.amount))}</p></div>
                    <div><p className="text-xs text-muted-foreground">{t("repaid")}</p><p className="font-display font-medium">{fmt(parseFloat(lending.amountRepaid))}</p></div>
                    <div><p className="text-xs text-muted-foreground">{t("outstanding")}</p><p className={`font-display font-medium ${outstanding > 0 ? "text-warning" : "text-success"}`}>{fmt(outstanding)}</p></div>
                  </div>
                  {outstanding > 0 && lending.status !== "repaid" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                      <input type="number" step="0.01" placeholder={t("amount")} id={`repay-${lending.id}`} className="flex-1 h-8 input-field" />
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                        const input = document.getElementById(`repay-${lending.id}`) as HTMLInputElement;
                        if (input.value) { handleRepayment(lending.id, input.value); input.value = ""; }
                      }}>{t("repayment")}</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
