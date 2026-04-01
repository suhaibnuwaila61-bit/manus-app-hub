import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { lendingsStore } from "@/lib/store";
import { useState } from "react";
import { Plus, X, Trash2, Handshake } from "lucide-react";
import { toast } from "sonner";

export default function Lendings() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ personName: "", type: "lent" as "lent" | "borrowed", amount: "", description: "" });

  const lendings = lendingsStore.list();
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const totalLent = lendings.filter(l => l.type === "lent").reduce((s, l) => s + parseFloat(l.amount), 0);
  const totalBorrowed = lendings.filter(l => l.type === "borrowed").reduce((s, l) => s + parseFloat(l.amount), 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personName || !form.amount) { toast.error(t("pleaseFillAllFields")); return; }
    lendingsStore.create({ ...form, amountRepaid: "0", status: "pending" });
    toast.success("Lending record added!");
    setForm({ personName: "", type: "lent", amount: "", description: "" });
    setShowAddForm(false);
    refresh();
  };

  const handleRepayment = (id: number, amount: string) => {
    const lending = lendings.find(l => l.id === id);
    if (!lending) return;
    const newRepaid = parseFloat(lending.amountRepaid) + parseFloat(amount);
    const status = newRepaid >= parseFloat(lending.amount) ? "repaid" : "partial";
    lendingsStore.update(id, { amountRepaid: newRepaid.toString(), status });
    toast.success("Repayment recorded!");
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b-2 border-destructive/30 pb-6">
          <div>
            <h1 className="text-3xl font-bold neon-text-pink">LENDINGS & BORROWINGS</h1>
            <p className="text-muted-foreground text-sm mt-1">Track money lent and borrowed</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="btn-neon-cyan flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-neon p-6"><div className="hud-stat-label">Total Lent</div><div className="hud-stat-value text-secondary">{fmt(totalLent)}</div></div>
          <div className="card-neon p-6"><div className="hud-stat-label">Total Borrowed</div><div className="hud-stat-value text-destructive">{fmt(totalBorrowed)}</div></div>
          <div className="card-neon p-6"><div className="hud-stat-label">Net Position</div><div className={`hud-stat-value ${totalLent - totalBorrowed >= 0 ? 'text-secondary' : 'text-destructive'}`}>{fmt(totalLent - totalBorrowed)}</div></div>
        </div>

        {showAddForm && (
          <div className="card-neon-pink p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-destructive uppercase">Add Record</h3>
              <button onClick={() => setShowAddForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Person Name" value={form.personName} onChange={e => setForm({...form, personName: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background">
                <option value="lent">Lent (I gave)</option>
                <option value="borrowed">Borrowed (I received)</option>
              </select>
              <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="flex-1 btn-neon-cyan">{t("submit")}</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-border">{t("cancel")}</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {lendings.length === 0 ? (
            <div className="card-neon p-8 text-center text-muted-foreground">
              <Handshake className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No lending or borrowing records yet</p>
            </div>
          ) : lendings.map(lending => {
            const outstanding = parseFloat(lending.amount) - parseFloat(lending.amountRepaid);
            return (
              <div key={lending.id} className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{lending.personName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${lending.type === 'lent' ? 'bg-secondary/20 text-secondary' : 'bg-destructive/20 text-destructive'}`}>
                        {lending.type === 'lent' ? 'Lent' : 'Borrowed'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${lending.status === 'repaid' ? 'bg-primary/20 text-primary' : lending.status === 'partial' ? 'bg-chart-3/20 text-chart-3' : 'bg-muted text-muted-foreground'}`}>
                        {lending.status.charAt(0).toUpperCase() + lending.status.slice(1)}
                      </span>
                    </div>
                    {lending.description && <p className="text-sm text-muted-foreground mb-2">{lending.description}</p>}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><p className="text-muted-foreground">Total</p><p className="font-semibold">{fmt(parseFloat(lending.amount))}</p></div>
                      <div><p className="text-muted-foreground">Repaid</p><p className="font-semibold">{fmt(parseFloat(lending.amountRepaid))}</p></div>
                      <div><p className="text-muted-foreground">Outstanding</p><p className={`font-semibold ${outstanding > 0 ? 'text-chart-3' : 'text-secondary'}`}>{fmt(outstanding)}</p></div>
                    </div>
                  </div>
                  <button onClick={() => { lendingsStore.delete(lending.id); refresh(); }} className="p-2 text-muted-foreground hover:text-foreground">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                {outstanding > 0 && lending.status !== 'repaid' && (
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <input type="number" step="0.01" placeholder="Repayment amount" id={`repay-${lending.id}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                    <button onClick={() => {
                      const input = document.getElementById(`repay-${lending.id}`) as HTMLInputElement;
                      if (input.value) { handleRepayment(lending.id, input.value); input.value = ''; }
                    }} className="px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
                      Record Repayment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
