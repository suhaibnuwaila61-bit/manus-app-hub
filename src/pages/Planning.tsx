import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { savingsGoalsStore, budgetsStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Trash2, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";

export default function Planning() {
  const { t } = useLanguage();
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);

  // Savings form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: "" });

  // Budget form
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ name: "", limitAmount: "", category: "General", period: "monthly", alertThreshold: "80" });

  const goals = savingsGoalsStore.list();
  const budgets = budgetsStore.list();
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.deadline) { toast.error(t("pleaseFillAllFields")); return; }
    savingsGoalsStore.create({ name: goalForm.name, targetAmount: goalForm.targetAmount, currentAmount: goalForm.currentAmount || "0", deadline: goalForm.deadline });
    toast.success(t("savingsGoalAdded"));
    setGoalForm({ name: "", targetAmount: "", currentAmount: "0", deadline: "" });
    setShowGoalForm(false);
    refresh();
  };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.name || !budgetForm.limitAmount) { toast.error(t("pleaseFillAllFields")); return; }
    budgetsStore.create({ name: budgetForm.name, limitAmount: budgetForm.limitAmount, spent: "0", period: budgetForm.period, category: budgetForm.category, alertThreshold: parseInt(budgetForm.alertThreshold), isActive: true });
    toast.success(t("budgetAdded"));
    setBudgetForm({ name: "", limitAmount: "", category: "General", period: "monthly", alertThreshold: "80" });
    setShowBudgetForm(false);
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("planning")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("savingsGoalsSubtitle")}</p>
        </div>

        <Tabs defaultValue="goals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="goals">{t("savingsGoals")}</TabsTrigger>
            <TabsTrigger value="budgets">{t("budgets")}</TabsTrigger>
          </TabsList>

          {/* SAVINGS GOALS */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowGoalForm(true)}><Plus className="h-4 w-4 me-1" /> {t("addSavingsGoal")}</Button>
            </div>

            {showGoalForm && (
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between">
                  <CardTitle className="text-base">{t("addSavingsGoal")}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowGoalForm(false)}><X className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" placeholder={t("goalName")} value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <input type="number" step="0.01" placeholder={t("targetAmount")} value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <input type="number" step="0.01" placeholder={t("currentAmount")} value={goalForm.currentAmount} onChange={e => setGoalForm({...goalForm, currentAmount: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <input type="date" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <div className="sm:col-span-2 flex gap-2">
                      <Button type="submit" size="sm" className="flex-1">{t("submit")}</Button>
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowGoalForm(false)}>{t("cancel")}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {goals.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">{t("noSavingsGoals")}</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const pct = Math.min((parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100, 100);
                  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
                  const done = pct >= 100;
                  return (
                    <Card key={goal.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{goal.name}</p>
                            <p className="text-xs text-muted-foreground">{daysLeft > 0 ? `${daysLeft} ${t("daysRemaining")}` : t("deadline")}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {done && <span className="text-xs font-medium text-success px-2 py-0.5 rounded-full bg-success/10">✓</span>}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { savingsGoalsStore.delete(goal.id); refresh(); toast.success(t("savingsGoalDeletedSuccessfully")); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{fmt(parseFloat(goal.currentAmount))}</span>
                          <span>{fmt(parseFloat(goal.targetAmount))}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* BUDGETS */}
          <TabsContent value="budgets" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowBudgetForm(true)}><Plus className="h-4 w-4 me-1" /> {t("addBudget")}</Button>
            </div>

            {showBudgetForm && (
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between">
                  <CardTitle className="text-base">{t("addBudget")}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowBudgetForm(false)}><X className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddBudget} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" placeholder={t("budgetName")} value={budgetForm.name} onChange={e => setBudgetForm({...budgetForm, name: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <input type="number" step="0.01" placeholder={t("limitAmount")} value={budgetForm.limitAmount} onChange={e => setBudgetForm({...budgetForm, limitAmount: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <select value={budgetForm.period} onChange={e => setBudgetForm({...budgetForm, period: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="daily">{t("daily")}</option>
                      <option value="weekly">{t("weekly")}</option>
                      <option value="monthly">{t("monthly")}</option>
                      <option value="yearly">{t("yearly")}</option>
                    </select>
                    <input type="number" placeholder="Alert %" value={budgetForm.alertThreshold} onChange={e => setBudgetForm({...budgetForm, alertThreshold: e.target.value})} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                    <div className="sm:col-span-2 flex gap-2">
                      <Button type="submit" size="sm" className="flex-1">{t("submit")}</Button>
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowBudgetForm(false)}>{t("cancel")}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {budgets.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><p className="text-sm text-muted-foreground">{t("noBudgets")}</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgets.map(budget => {
                  const spent = parseFloat(budget.spent);
                  const limit = parseFloat(budget.limitAmount);
                  const pct = limit > 0 ? (spent / limit) * 100 : 0;
                  const isOver = pct >= 100;
                  const isAlert = pct >= budget.alertThreshold;
                  return (
                    <Card key={budget.id} className={isOver ? "border-destructive/50" : isAlert ? "border-warning/50" : ""}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{budget.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { budgetsStore.delete(budget.id); refresh(); toast.success(t("budgetDeletedSuccessfully")); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Progress value={Math.min(pct, 100)} className={`h-2 ${isOver ? "[&>div]:bg-destructive" : isAlert ? "[&>div]:bg-warning" : "[&>div]:bg-success"}`} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{fmt(spent)} {t("spent")}</span>
                          <span>{fmt(limit)}</span>
                        </div>
                      </CardContent>
                    </Card>
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
