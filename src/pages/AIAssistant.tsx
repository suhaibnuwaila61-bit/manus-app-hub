import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSupabaseTable } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Lightbulb, Loader2, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessage { id: string; role: "user" | "assistant"; content: string; timestamp: Date; }

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-advisor`;

export default function AIAssistant() {
  const { t, language } = useLanguage();
  const { fmt } = useCurrency();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: transactions } = useSupabaseTable<any>("transactions");
  const { data: investments } = useSupabaseTable<any>("investments");
  const { data: goals } = useSupabaseTable<any>("savings_goals");
  const { data: budgets } = useSupabaseTable<any>("budgets");
  const { data: lendings } = useSupabaseTable<any>("lendings");

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const buildFinancialContext = () => {
    const totalIncome = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const totalExpenses = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
    const portfolioValue = investments.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.current_price), 0);

    const categoryMap: Record<string, number> = {};
    transactions.filter((t: any) => t.type === "expense").forEach((t: any) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
    });
    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    const assetTypeBreakdown: Record<string, number> = {};
    investments.forEach((i: any) => {
      const val = Number(i.quantity) * Number(i.current_price);
      assetTypeBreakdown[i.asset_type] = (assetTypeBreakdown[i.asset_type] || 0) + val;
    });

    return {
      totalIncome, totalExpenses, savingsRate, portfolioValue,
      topCategories, assetTypeBreakdown,
      investments: investments.map((i: any) => ({
        symbol: i.symbol, name: i.name, asset_type: i.asset_type,
        quantity: Number(i.quantity), current_price: Number(i.current_price), purchase_price: Number(i.purchase_price),
      })),
      goals: goals.map((g: any) => ({
        name: g.name, target_amount: Number(g.target_amount), current_amount: Number(g.current_amount), deadline: g.deadline,
      })),
      budgets: budgets.map((b: any) => ({
        name: b.name, category: b.category, limit_amount: Number(b.limit_amount), spent: Number(b.spent), alert_threshold: Number(b.alert_threshold),
      })),
      lendings: lendings.map((l: any) => ({
        person_name: l.person_name, type: l.type, amount: Number(l.amount), amount_repaid: Number(l.amount_repaid), status: l.status,
      })),
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    const financialContext = buildFinancialContext();

    let assistantContent = "";
    const assistantId = (Date.now() + 1).toString();

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, financialContext, language }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Something went wrong" }));
        setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: `⚠️ ${err.error || "Failed to get response. Please try again."}`, timestamp: new Date() }]);
        setIsLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const snapshot = assistantContent;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: snapshot } : m));
            }
          } catch { /* partial JSON, wait for more */ }
        }
      }
    } catch (e) {
      console.error("Stream error:", e);
      if (!assistantContent) {
        setMessages(prev => [...prev.filter(m => m.id !== assistantId), { id: assistantId, role: "assistant", content: "⚠️ Connection error. Please try again.", timestamp: new Date() }]);
      }
    }

    setIsLoading(false);
  };

  // Insights calculations
  const totalIncome = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpenses = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

  const insights: { type: string; icon: any; title: string; message: string }[] = [];
  if (savingsRate < 20) insights.push({ type: "warning", icon: AlertTriangle, title: "Low Savings Rate", message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20%.` });
  else insights.push({ type: "success", icon: CheckCircle2, title: "Good Savings Rate", message: `${savingsRate.toFixed(1)}% savings rate — keep it up!` });
  if (investments.length === 0) insights.push({ type: "tip", icon: Lightbulb, title: "Start Investing", message: "Consider diversifying through stocks, bonds, or ETFs." });
  if (goals.length === 0) insights.push({ type: "tip", icon: Lightbulb, title: "Set Goals", message: "Specific savings goals help track progress." });
  if (budgets.length === 0) insights.push({ type: "tip", icon: Lightbulb, title: "Create Budgets", message: "Start with your largest expense categories." });

  const topCategory = (() => {
    const g: Record<string, number> = {};
    transactions.filter((t: any) => t.type === "expense").forEach((t: any) => { g[t.category] = (g[t.category] || 0) + Number(t.amount); });
    const s = Object.entries(g).sort((a, b) => b[1] - a[1]);
    return s[0];
  })();
  if (topCategory) insights.push({ type: "info", icon: TrendingUp, title: "Top Expense", message: `"${topCategory[0]}" at ${fmt(topCategory[1])}. Look for optimization.` });

  const suggestedQuestions = language === "ar"
    ? ["💡 هل يجب أن أسدد ديوني أم أستثمر؟", "📊 ما مستوى المخاطرة في محفظتي؟", "🎯 هل أنا على المسار الصحيح لتحقيق أهدافي؟"]
    : ["💡 Should I pay off debt or invest first?", "📊 What's my portfolio risk level?", "🎯 Am I on track for my savings goals?"];

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
                        {suggestedQuestions.map((q, i) => (
                          <button key={i} onClick={() => { setInput(q.replace(/[💬📊💡🎯"]/g, "").trim()); }} className="block w-full text-start px-4 py-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300">
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
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-card border border-border/50"
                        }`}>
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                              <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                          <p className="text-[10px] opacity-50 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex justify-start animate-slide-up">
                        <div className="bg-card border border-border/50 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">{language === "ar" ? "جاري التفكير..." : "Thinking..."}</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              <div className="p-3 border-t border-border/50 relative">
                <div className="absolute inset-x-3 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="flex gap-2">
                  <input type="text" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !isLoading && handleSend()}
                    placeholder={t("askAboutFinances")}
                    className="flex-1 input-field"
                    disabled={isLoading} />
                  <Button size="sm" onClick={handleSend} disabled={isLoading || !input.trim()} className="glow-button shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 px-4">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
              <div className="stat-card"><span className="text-xs text-muted-foreground">{t("portfolioValue")}</span><p className="text-lg font-display font-bold">{fmt(investments.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.current_price), 0))}</p></div>
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
