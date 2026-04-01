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
  useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LayoutDashboard, Wallet, TrendingUp, Target, Handshake, Bot, Settings, PanelLeft, Moon, Sun, Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, labelKey: "dashboard" as const, path: "/dashboard" },
  { icon: Wallet, labelKey: "transactions" as const, path: "/transactions" },
  { icon: TrendingUp, labelKey: "investments" as const, path: "/investments" },
  { icon: Target, labelKey: "planning" as const, path: "/planning" },
  { icon: Handshake, labelKey: "lendings" as const, path: "/lendings" },
  { icon: Bot, labelKey: "aiAssistant" as const, path: "/ai-assistant" },
  { icon: Settings, labelKey: "settings" as const, path: "/settings" },
];

function SidebarNav() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 justify-center">
        <div className="flex items-center gap-3 px-2">
          <button onClick={toggleSidebar} className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors shrink-0">
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          {!isCollapsed && (
            <span className="font-bold text-base tracking-tight truncate">
              Financial Nexus
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                onClick={() => navigate(item.path)}
                isActive={location.pathname === item.path}
                tooltip={t(item.labelKey)}
                className="rounded-lg h-10"
              >
                <item.icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      {!isCollapsed && (
        <div className="p-3 border-t border-sidebar-border mt-auto flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>
            <Globe className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarNav />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ms-1" />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
