import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSupabaseTable } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Trash2, Target, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";

export default function Planning() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const { data: goals, loading: goalsLoading, create: createGoal, remove: removeGoal } = useSupabaseTable<any>("savings_goals");
  const { data: budgets, loading: budgetsLoading, create: createBudget, remove: removeBudget } = useSupabaseTable<any>("budgets");

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: "" });
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ name: "", limitAmount: "", category: "General", period: "monthly", alertThreshold: "80" });

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.deadline) { toast.error(t("pleaseFillAllFields")); return; }
    await createGoal({ name: goalForm.name, target_amount: parseFloat(goalForm.targetAmount), current_amount: parseFloat(goalForm.currentAmount) || 0, deadline: goalForm.deadline });
    toast.success(t("savingsGoalAdded"));
    setGoalForm({ name: "", targetAmount: "", currentAmount: "0", deadline: "" });
    setShowGoalForm(false);
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.name || !budgetForm.limitAmount) { toast.error(t("pleaseFillAllFields")); return; }
    await createBudget({ name: budgetForm.name, limit_amount: parseFloat(budgetForm.limitAmount), spent: 0, period: budgetForm.period, category: budgetForm.category, alert_threshold: parseInt(budgetForm.alertThreshold), is_active: true });
    toast.success(t("budgetAdded"));
    setBudgetForm({ name: "", limitAmount: "", category: "General", period: "monthly", alertThreshold: "80" });
    setShowBudgetForm(false);
  };

  if (goalsLoading || budgetsLoading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">{t("planning")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("savingsGoalsSubtitle")}</p>
        </div>

        <Tabs defaultValue="goals" className="space-y-4">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="goals">{t("savingsGoals")}</TabsTrigger>
            <TabsTrigger value="budgets">{t("budgets")}</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowGoalForm(true)} className="glow-button shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-500">
                <Plus className="h-4 w-4 me-1" /> {t("addSavingsGoal")}
              </Button>
            </div>

            {showGoalForm && (
              <div className="glass-card animate-slide-up" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">{t("addSavingsGoal")}</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => setShowGoalForm(false)}><X className="h-4 w-4" /></Button>
                </div>
                <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder={t("goalName")} value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} className="input-field" />
                  <input type="number" step="0.01" placeholder={t("targetAmount")} value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} className="input-field" />
                  <input type="number" step="0.01" placeholder={t("currentAmount")} value={goalForm.currentAmount} onChange={e => setGoalForm({...goalForm, currentAmount: e.target.value})} className="input-field" />
                  <input type="date" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} className="input-field" />
                  <div className="sm:col-span-2 flex gap-2">
                    <Button type="submit" size="sm" className="flex-1 glow-button shadow-md shadow-primary/20">{t("submit")}</Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowGoalForm(false)}>{t("cancel")}</Button>
                  </div>
                </form>
              </div>
            )}

            {goals.length === 0 ? (
              <div className="glass-card py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Target className="h-7 w-7 text-primary animate-pulse-soft" />
                </div>
                <p className="text-sm text-muted-foreground">{t("noSavingsGoals")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal: any) => {
                  const pct = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
                  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
                  const done = pct >= 100;
                  return (
                    <div key={goal.id} className={`glass-card space-y-3 ${done ? "hover:!border-success/40" : ""}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-display font-semibold">{goal.name}</p>
                          <p className="text-xs text-muted-foreground">{daysLeft > 0 ? `${daysLeft} ${t("daysRemaining")}` : t("deadline")}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {done && <span className="text-xs font-medium text-success px-2 py-0.5 rounded-full bg-success/10">✓</span>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={async () => { await removeGoal(goal.id); toast.success(t("savingsGoalDeletedSuccessfully")); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{fmt(Number(goal.current_amount))}</span>
                        <span>{fmt(Number(goal.target_amount))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowBudgetForm(true)} className="glow-button shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-500">
                <Plus className="h-4 w-4 me-1" /> {t("addBudget")}
              </Button>
            </div>

            {showBudgetForm && (
              <div className="glass-card animate-slide-up" style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">{t("addBudget")}</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10" onClick={() => setShowBudgetForm(false)}><X className="h-4 w-4" /></Button>
                </div>
                <form onSubmit={handleAddBudget} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder={t("budgetName")} value={budgetForm.name} onChange={e => setBudgetForm({...budgetForm, name: e.target.value})} className="input-field" />
                  <input type="number" step="0.01" placeholder={t("limitAmount")} value={budgetForm.limitAmount} onChange={e => setBudgetForm({...budgetForm, limitAmount: e.target.value})} className="input-field" />
                  <Select value={budgetForm.period} onValueChange={(v) => setBudgetForm({...budgetForm, period: v})}>
                    <SelectTrigger className="h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl shadow-xl shadow-primary/10">
                      <SelectItem value="daily" className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t("daily")}</SelectItem>
                      <SelectItem value="weekly" className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t("weekly")}</SelectItem>
                      <SelectItem value="monthly" className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t("monthly")}</SelectItem>
                      <SelectItem value="yearly" className="focus:bg-primary/10 focus:text-foreground cursor-pointer">{t("yearly")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="number" placeholder="Alert %" value={budgetForm.alertThreshold} onChange={e => setBudgetForm({...budgetForm, alertThreshold: e.target.value})} className="input-field" />
                  <div className="sm:col-span-2 flex gap-2">
                    <Button type="submit" size="sm" className="flex-1 glow-button shadow-md shadow-primary/20">{t("submit")}</Button>
                    <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowBudgetForm(false)}>{t("cancel")}</Button>
                  </div>
                </form>
              </div>
            )}

            {budgets.length === 0 ? (
              <div className="glass-card py-12 text-center">
                <p className="text-sm text-muted-foreground">{t("noBudgets")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgets.map((budget: any) => {
                  const spent = Number(budget.spent);
                  const limit = Number(budget.limit_amount);
                  const pct = limit > 0 ? (spent / limit) * 100 : 0;
                  const isOver = pct >= 100;
                  const isAlert = pct >= budget.alert_threshold;
                  return (
                    <div key={budget.id} className={`glass-card space-y-3 ${isOver ? "hover:!border-destructive/40" : isAlert ? "hover:!border-warning/40" : ""}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-display font-semibold">{budget.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={async () => { await removeBudget(budget.id); toast.success(t("budgetDeletedSuccessfully")); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Progress value={Math.min(pct, 100)} className={`h-2 ${isOver ? "[&>div]:bg-destructive" : isAlert ? "[&>div]:bg-warning" : "[&>div]:bg-success"}`} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{fmt(spent)} {t("spent")}</span>
                        <span>{fmt(limit)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
