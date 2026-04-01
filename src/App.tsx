import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Investments from "./pages/Investments";
import SavingsGoals from "./pages/SavingsGoals";
import Budgets from "./pages/Budgets";
import Lendings from "./pages/Lendings";
import AIChat from "./pages/AIChat";
import Advisor from "./pages/Advisor";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/savings-goals" element={<SavingsGoals />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/lendings" element={<Lendings />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
