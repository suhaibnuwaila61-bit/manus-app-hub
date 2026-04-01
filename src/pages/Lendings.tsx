import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { lendingsStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2, Handshake } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Lendings() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ personName: "", type: "lent" as "lent" | "borrowed", amount: "", description: "" });

  const lendings = lendingsStore.list();
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("lendingsTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("lendingsSubtitle")}</p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm"><Plus className="h-4 w-4 me-1" /> {t("addRecord")}</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><span className="text-xs text-muted-foreground">{t("totalLent")}</span><p className="text-lg font-bold text-success">{fmt(totalLent)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><span className="text-xs text-muted-foreground">{t("totalBorrowed")}</span><p className="text-lg font-bold text-destructive">{fmt(totalBorrowed)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><span className="text-xs text-muted-foreground">{t("netPosition")}</span><p className={`text-lg font-bold ${totalLent - totalBorrowed >= 0 ? "text-success" : "text-destructive"}`}>{fmt(totalLent - totalBorrowed)}</p></CardContent></Card>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">{t("addRecord")}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder={t("personName")} value={form.personName} onChange={e => setForm({...form, personName: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="lent">{t("lent")}</option>
                  <option value="borrowed">{t("borrowed")}</option>
                </select>
                <input type="number" step="0.01" placeholder={t("amount")} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <input type="text" placeholder={t("description")} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">{t("submit")}</Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {lendings.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><Handshake className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">{t("noLendings")}</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {lendings.map(lending => {
              const outstanding = parseFloat(lending.amount) - parseFloat(lending.amountRepaid);
              return (
                <Card key={lending.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{lending.personName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${lending.type === "lent" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {t(lending.type)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${lending.status === "repaid" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {lending.status === "repaid" ? t("repaid") : lending.status}
                          </span>
                        </div>
                        {lending.description && <p className="text-xs text-muted-foreground">{lending.description}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { lendingsStore.delete(lending.id); refresh(); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><p className="text-xs text-muted-foreground">{t("amount")}</p><p className="font-medium">{fmt(parseFloat(lending.amount))}</p></div>
                      <div><p className="text-xs text-muted-foreground">{t("repaid")}</p><p className="font-medium">{fmt(parseFloat(lending.amountRepaid))}</p></div>
                      <div><p className="text-xs text-muted-foreground">{t("outstanding")}</p><p className={`font-medium ${outstanding > 0 ? "text-warning" : "text-success"}`}>{fmt(outstanding)}</p></div>
                    </div>
                    {outstanding > 0 && lending.status !== "repaid" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <input type="number" step="0.01" placeholder={t("amount")} id={`repay-${lending.id}`} className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm" />
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                          const input = document.getElementById(`repay-${lending.id}`) as HTMLInputElement;
                          if (input.value) { handleRepayment(lending.id, input.value); input.value = ""; }
                        }}>{t("repayment")}</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
