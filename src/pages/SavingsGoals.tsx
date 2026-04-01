import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { savingsGoalsStore } from "@/lib/store";
import { useState } from "react";
import { Plus, X, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SavingsGoals() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: "" });

  const goals = savingsGoalsStore.list();
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.targetAmount), 0);
  const totalSaved = goals.reduce((s, g) => s + parseFloat(g.currentAmount), 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.targetAmount || !form.deadline) { toast.error(t("pleaseFillAllFields")); return; }
    savingsGoalsStore.create({ name: form.name, targetAmount: form.targetAmount, currentAmount: form.currentAmount || "0", deadline: form.deadline });
    toast.success(t("savingsGoalAdded"));
    setForm({ name: "", targetAmount: "", currentAmount: "0", deadline: "" });
    setShowAddForm(false);
    refresh();
  };

  const getProgress = (c: string, t: string) => Math.min((parseFloat(c) / parseFloat(t)) * 100, 100);
  const getDaysLeft = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b-2 border-destructive/30 pb-6">
          <div>
            <h1 className="text-3xl font-bold neon-text-pink">{t("savingsGoalsTitle").toUpperCase()}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("savingsGoalsSubtitle")}</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="btn-neon-cyan flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> {t("addSavingsGoal")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-neon p-6"><div className="hud-stat-label">Total Target</div><div className="hud-stat-value text-primary">{fmt(totalTarget)}</div></div>
          <div className="card-neon p-6"><div className="hud-stat-label">Total Saved</div><div className="hud-stat-value text-secondary">{fmt(totalSaved)}</div></div>
          <div className="card-neon p-6"><div className="hud-stat-label">Active Goals</div><div className="hud-stat-value text-destructive">{goals.length}</div></div>
        </div>

        {showAddForm && (
          <div className="card-neon-pink p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-destructive uppercase">Create New Goal</h3>
              <button onClick={() => setShowAddForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <input type="text" placeholder="Goal Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="number" step="0.01" placeholder="Target Amount" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="number" step="0.01" placeholder="Current Amount" value={form.currentAmount} onChange={e => setForm({...form, currentAmount: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background" />
              <button type="submit" className="w-full btn-neon-cyan">{t("submit")}</button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="card-neon p-8 text-center text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("noSavingsGoals")}</p>
            </div>
          ) : goals.map(goal => {
            const progress = getProgress(goal.currentAmount, goal.targetAmount);
            const daysLeft = getDaysLeft(goal.deadline);
            const completed = parseFloat(goal.currentAmount) >= parseFloat(goal.targetAmount);
            return (
              <div key={goal.id} className={`card-neon p-6 ${completed ? 'border-secondary' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-destructive font-bold text-lg">{goal.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      Target: {new Date(goal.deadline).toLocaleDateString()} ({daysLeft > 0 ? `${daysLeft} days left` : 'Passed'})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {completed && <span className="text-secondary text-xs uppercase px-3 py-1 border border-secondary rounded font-bold">✓ Completed</span>}
                    <button onClick={() => { savingsGoalsStore.delete(goal.id); refresh(); toast.success(t("savingsGoalDeletedSuccessfully")); }}
                      className="text-destructive hover:text-destructive/70 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>{fmt(parseFloat(goal.currentAmount))}</span>
                  <span className="text-muted-foreground">{fmt(parseFloat(goal.targetAmount))}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${completed ? 'bg-secondary' : progress > 75 ? 'bg-primary' : 'bg-primary/60'}`}
                    style={{ width: `${progress}%` }} />
                </div>
                <div className="text-right mt-2 text-sm font-bold text-primary">{progress.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
