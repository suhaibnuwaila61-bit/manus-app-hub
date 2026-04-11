import PageTransition from "@/components/PageTransition";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LayoutDashboard, Wallet, TrendingUp, Target, Handshake, Bot, Settings, Moon, Sun, Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";

const menuItems = [
  { icon: LayoutDashboard, labelKey: "dashboard" as const, path: "/dashboard" },
  { icon: Wallet, labelKey: "transactions" as const, path: "/transactions" },
  { icon: TrendingUp, labelKey: "investments" as const, path: "/investments" },
  { icon: Target, labelKey: "planning" as const, path: "/planning" },
  { icon: Handshake, labelKey: "lendings" as const, path: "/lendings" },
  { icon: Bot, labelKey: "aiAssistant" as const, path: "/ai-assistant" },
  { icon: Settings, labelKey: "settings" as const, path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage, isArabic } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full overflow-x-clip">
        <Sidebar
          side={isArabic ? "right" : "left"}
          collapsible="icon"
          className={`${isArabic ? "border-l" : "border-r"} border-sidebar-border/50 backdrop-blur-xl bg-sidebar-background/80`}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2">
              <span className="font-display font-bold text-base tracking-tight truncate gradient-text group-data-[collapsible=icon]:hidden">
                Financial Nexus
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={isActive}
                      tooltip={t(item.labelKey)}
                      className={`rounded-lg h-10 transition-all duration-300 ${
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "hover:bg-primary/5"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      <span className={isActive ? "font-medium" : ""}>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <div className="p-3 border-t border-sidebar-border/50 mt-auto flex gap-2 group-data-[collapsible=icon]:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-all duration-300" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-all duration-300" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </Sidebar>
        <SidebarInset className="overflow-x-hidden">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/50 px-4 backdrop-blur-sm bg-background/80">
            <SidebarTrigger className="-ms-1" />
          </header>
          <main ref={contentRef} className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 orb-glow overscroll-y-none">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
