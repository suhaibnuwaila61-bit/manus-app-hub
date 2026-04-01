import DashboardLayout from "@/components/DashboardLayout";

import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { transactionsStore, investmentsStore, savingsGoalsStore, budgetsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Lightbulb, Loader2, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ChatMessage { id: string; role: "user" | "assistant"; content: string; timestamp: Date; }

export default function AIAssistant() {
  const { t } = useLanguage();
  const { fmt } = useCurrency();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: input, timestamp: new Date() }]);
    setInput("");
    setIsLoading(true);
    setTimeout(() => {
      const responses = [
        "Based on your spending patterns, I recommend the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
        "Your portfolio diversification looks healthy. Consider rebalancing quarterly.",
        "I notice increased dining expenses. Consider setting a budget limit for that category.",
        "Emergency funds should cover 3-6 months of expenses. Let me calculate your target.",
        "Your savings goals are progressing well. You're ahead of schedule!",
      ];
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: responses[Math.floor(Math.random() * responses.length)], timestamp: new Date() }]);
      setIsLoading(false);
    }, 1200);
  };

  const transactions = transactionsStore.list();
  const investments = investmentsStore.list();
  const goals = savingsGoalsStore.list();
  const budgets = budgetsStore.list();
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

  const insights: { type: string; icon: any; title: string; message: string }[] = [];
  if (savingsRate < 20) insights.push({ type: "warning", icon: AlertTriangle, title: "Low Savings Rate", message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20%.` });
  else insights.push({ type: "success", icon: CheckCircle2, title: "Good Savings Rate", message: `${savingsRate.toFixed(1)}% savings rate — keep it up!` });
  if (investments.length === 0) insights.push({ type: "tip", icon: Lightbulb, title: "Start Investing", message: "Consider diversifying through stocks, bonds, or ETFs." });
  if (goals.length === 0) insights.push({ type: "tip", icon: Lightbulb, title: "Set Goals", message: "Specific savings goals help track progress." });
  if (budgets.length === 0) insights.push({ type: "tip", icon: Lightbulb, title: "Create Budgets", message: "Start with your largest expense categories." });

  const topCategory = (() => {
    const g: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => { g[t.category] = (g[t.category] || 0) + parseFloat(t.amount); });
    const s = Object.entries(g).sort((a, b) => b[1] - a[1]);
    return s[0];
  })();
  if (topCategory) insights.push({ type: "info", icon: TrendingUp, title: "Top Expense", message: `"${topCategory[0]}" at ${fmt(topCategory[1])}. Look for optimization.` });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold">{t("aiAssistantTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("insightsRecommendations")}</p>
        </div>

        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="chat">{t("chat")}</TabsTrigger>
            <TabsTrigger value="insights">{t("insights")}</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <div className="glass-card flex flex-col p-0 overflow-hidden" style={{ height: "calc(100vh - 16rem)" }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="space-y-4">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Lightbulb className="h-8 w-8 text-primary animate-pulse-soft" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t("startConversation")}</p>
                      <div className="space-y-2 text-xs text-muted-foreground max-w-xs mx-auto">
                        {["💬 \"How should I allocate my salary?\"", "📊 \"Analyze my spending patterns\"", "💡 \"How much should I invest monthly?\""].map((q, i) => (
                          <button key={i} onClick={() => { setInput(q.replace(/[💬📊💡"]/g, "").trim()); }} className="block w-full text-start px-4 py-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-card border border-border/50"
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-[10px] opacity-50 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start animate-slide-up">
                        <div className="bg-card border border-border/50 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              {/* Chat input with glow effect inspired by reference */}
              <div className="p-3 border-t border-border/50 relative">
                <div className="absolute inset-x-3 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="flex gap-2">
                  <input type="text" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !isLoading && handleSend()}
                    placeholder={t("askAboutFinances")}
                    className="flex-1 input-field"
                    disabled={isLoading} />
                  <Button size="sm" onClick={handleSend} disabled={isLoading || !input.trim()} className="glow-button shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 px-4">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card-success"><span className="text-xs text-muted-foreground">{t("totalIncome")}</span><p className="text-lg font-display font-bold text-success">{fmt(totalIncome)}</p></div>
              <div className="stat-card-destructive"><span className="text-xs text-muted-foreground">{t("totalExpenses")}</span><p className="text-lg font-display font-bold text-destructive">{fmt(totalExpenses)}</p></div>
              <div className="stat-card"><span className="text-xs text-muted-foreground">{t("savingsRate")}</span><p className={`text-lg font-display font-bold ${savingsRate >= 20 ? "text-success" : "text-destructive"}`}>{savingsRate.toFixed(1)}%</p></div>
              <div className="stat-card"><span className="text-xs text-muted-foreground">{t("portfolioValue")}</span><p className="text-lg font-display font-bold">{fmt(investments.reduce((s, i) => s + parseFloat(i.quantity) * parseFloat(i.currentPrice), 0))}</p></div>
            </div>

            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className={`glass-card flex items-start gap-3 ${
                  insight.type === "warning" ? "hover:!border-destructive/30" : insight.type === "success" ? "hover:!border-success/30" : ""
                }`}>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    insight.type === "warning" ? "bg-destructive/10" : insight.type === "success" ? "bg-success/10" : "bg-primary/10"
                  }`}>
                    <insight.icon className={`h-4 w-4 ${insight.type === "warning" ? "text-destructive" : insight.type === "success" ? "text-success" : "text-primary"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
