import DashboardLayout from "@/components/DashboardLayout";
import { useState, useRef, useEffect } from "react";
import { Send, Lightbulb, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulated AI response (will be replaced with Lovable Cloud edge function)
    setTimeout(() => {
      const responses = [
        "Based on your spending patterns, I recommend allocating 50% to needs, 30% to wants, and 20% to savings.",
        "Your investment portfolio shows good diversification. Consider increasing your bond allocation for stability.",
        "I notice you've been spending more on dining out recently. Would you like me to create a budget for that category?",
        "Great question! Emergency funds should cover 3-6 months of expenses. Based on your spending, aim for $15,000-$30,000.",
        "Your savings goals are on track! You're ahead of schedule on your vacation fund.",
      ];
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, reply]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-10rem)] flex flex-col space-y-4">
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold">AI Financial Assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">Chat naturally about your finances</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 bg-card rounded-lg border border-border p-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Start a conversation about your finances</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>💬 "I earn $5000 a month and want to save $1000"</p>
                  <p>📊 "Tell me about my spending patterns"</p>
                  <p>💡 "How much should I invest monthly?"</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border border-border"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-lg flex items-center gap-2 border border-border">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && !isLoading && handleSend()}
            placeholder="Ask about your finances..."
            className="flex-1 px-4 py-3 rounded-lg border border-border bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading} />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}
            className="btn-neon-cyan flex items-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
