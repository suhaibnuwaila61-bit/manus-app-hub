import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSupabaseTable } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Trash2, Handshake, Loader2, CalendarIcon, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Lendings() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const { data: lendings, loading, create, update, remove } = useSupabaseTable<any>("lendings");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    personName: "", type: "lent" as "lent" | "borrowed", amount: "", description: "",
    startDate: new Date(), dueDate: undefined as Date | undefined, interestRate: ""
  });

  const totalLent = lendings.filter((l: any) => l.type === "lent").reduce((s: number, l: any) => s + Number(l.amount), 0);
  const totalBorrowed = lendings.filter((l: any) => l.type === "borrowed").reduce((s: number, l: any) => s + Number(l.amount), 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personName || !form.amount) { toast.error(t("pleaseFillAllFields")); return; }
    await create({
      person_name: form.personName, type: form.type, amount: parseFloat(form.amount),
      amount_repaid: 0, description: form.description, status: "pending",
      start_date: form.startDate.toISOString(),
      due_date: form.dueDate ? form.dueDate.toISOString() : null,
      interest_rate: form.interestRate ? parseFloat(form.interestRate) : 0
    });
    toast.success(t("addRecord"));
    setForm({ personName: "", type: "lent", amount: "", description: "", startDate: new Date(), dueDate: undefined, interestRate: "" });
    setShowForm(false);
  };

  const handleRepayment = async (id: string, amount: string, lending: any) => {
    const newRepaid = Number(lending.amount_repaid) + parseFloat(amount);
    await update(id, { amount_repaid: newRepaid, status: newRepaid >= Number(lending.amount) ? "repaid" : "partial" });
    toast.success(t("repayment"));
  };

  const getDeadlineInfo = (lending: any) => {
    if (!lending.due_date) return null;
    const days = differenceInDays(new Date(lending.due_date), new Date());
    if (days < 0) return { text: `${Math.abs(days)} ${t("daysOverdue")}`, color: "text-muted-foreground", bg: "bg-muted" };
    if (days <= 7) return { text: `${days} ${t("daysLeft")}`, color: "text-destructive", bg: "bg-destructive/10" };
    if (days <= 30) return { text: `${days} ${t("daysLeft")}`, color: "text-warning", bg: "bg-warning/10" };
    return { text: `${days} ${t("daysLeft")}`, color: "text-success", bg: "bg-success/10" };
  };

  const calcAccruedInterest = (lending: any) => {
    if (!lending.interest_rate || Number(lending.interest_rate) === 0) return 0;
    const outstanding = Number(lending.amount) - Number(lending.amount_repaid);
    const daysSinceStart = differenceInDays(new Date(), new Date(lending.start_date));
    return outstanding * (Number(lending.interest_rate) / 100) * (daysSinceStart / 365);
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="stat-card-success"><span className="text-xs text-muted-foreground">{t("totalLent")}</span><p className="text-lg font-display font-bold text-success">{fmt(totalLent)}</p></div>
          <div className="stat-card-destructive"><span className="text-xs text-muted-foreground">{t("totalBorrowed")}</span><p className="text-lg font-display font-bold text-destructive">{fmt(totalBorrowed)}</p></div>
          <div className="stat-card"><span className="text-xs text-muted-foreground">{t("netPosition")}</span><p className={`text-lg font-display font-bold ${totalLent - totalBorrowed >= 0 ? "text-success" : "text-destructive"}`}>{fmt(totalLent - totalBorrowed)}</p></div>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[600px] border-border/50 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="font-display">{t("addRecord")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder={t("personName")} value={form.personName} onChange={e => setForm({...form, personName: e.target.value})} className="input-field" />
              <Select value={form.type} onValueChange={(v) => setForm({...form, type: v as any})}>
                <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                  <SelectItem value="lent">{t("lent")}</SelectItem>
                  <SelectItem value="borrowed">{t("borrowed")}</SelectItem>
                </SelectContent>
              </Select>
              <input type="number" step="0.01" placeholder={t("amount")} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-field" />
              <input type="text" placeholder={t("description")} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
              <input type="number" step="0.01" placeholder={t("interestRate")} value={form.interestRate} onChange={e => setForm({...form, interestRate: e.target.value})} className="input-field" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-10 justify-start text-left font-normal border-border/50 bg-background/50")}>
                    <CalendarIcon className="h-4 w-4 me-2 text-muted-foreground" />
                    {form.startDate ? format(form.startDate, "PPP") : t("startDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.startDate} onSelect={(d) => d && setForm({...form, startDate: d})} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("h-10 justify-start text-left font-normal border-border/50 bg-background/50", !form.dueDate && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 me-2" />
                    {form.dueDate ? format(form.dueDate, "PPP") : t("dueDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.dueDate} onSelect={(d) => setForm({...form, dueDate: d})} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" size="sm" className="flex-1 glow-button shadow-md shadow-primary/20">{t("submit")}</Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {lendings.length === 0 ? (
          <div className="glass-card py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Handshake className="h-7 w-7 text-primary animate-pulse-soft" />
            </div>
            <p className="text-sm text-muted-foreground">{t("noLendings")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lendings.map((lending: any) => {
              const outstanding = Number(lending.amount) - Number(lending.amount_repaid);
              const deadlineInfo = getDeadlineInfo(lending);
              const accrued = calcAccruedInterest(lending);
              return (
                <div key={lending.id} className="glass-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-display font-semibold">{lending.person_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lending.type === "lent" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {t(lending.type)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${lending.status === "repaid" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {lending.status === "repaid" ? t("repaid") : lending.status}
                        </span>
                        {deadlineInfo && lending.status !== "repaid" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${deadlineInfo.bg} ${deadlineInfo.color}`}>
                            {deadlineInfo.text}
                          </span>
                        )}
                      </div>
                      {lending.description && <p className="text-xs text-muted-foreground">{lending.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={async () => { await remove(lending.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">{t("amount")}</p><p className="font-display font-medium">{fmt(Number(lending.amount))}</p></div>
                    <div><p className="text-xs text-muted-foreground">{t("repaid")}</p><p className="font-display font-medium">{fmt(Number(lending.amount_repaid))}</p></div>
                    <div><p className="text-xs text-muted-foreground">{t("outstanding")}</p><p className={`font-display font-medium ${outstanding > 0 ? "text-warning" : "text-success"}`}>{fmt(outstanding)}</p></div>
                    {accrued > 0 && (
                      <div><p className="text-xs text-muted-foreground">{t("accruedInterest")}</p><p className="font-display font-medium text-warning">{fmt(accrued)}</p></div>
                    )}
                  </div>

                  {/* Dates row */}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    {lending.start_date && <span>{t("startDate")}: {format(new Date(lending.start_date), "MMM d, yyyy")}</span>}
                    {lending.due_date && <span>{t("dueDate")}: {format(new Date(lending.due_date), "MMM d, yyyy")}</span>}
                    {lending.interest_rate > 0 && <span>{t("interestRate")}: {lending.interest_rate}%</span>}
                  </div>

                  {outstanding > 0 && lending.status !== "repaid" && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                      <input type="number" step="0.01" placeholder={t("amount")} id={`repay-${lending.id}`} className="flex-1 h-8 input-field" />
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                        const input = document.getElementById(`repay-${lending.id}`) as HTMLInputElement;
                        if (input.value) { handleRepayment(lending.id, input.value, lending); input.value = ""; }
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
