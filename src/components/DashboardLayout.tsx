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
import { LayoutDashboard, Wallet, TrendingUp, Target, Users, Handshake, MessageCircle, Brain, BarChart3, Settings, PanelLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboard, labelKey: "dashboard" as const, path: "/dashboard" },
  { icon: BarChart3, labelKey: "analytics" as const, path: "/analytics" },
  { icon: Wallet, labelKey: "transactions" as const, path: "/transactions" },
  { icon: TrendingUp, labelKey: "investments" as const, path: "/investments" },
  { icon: Target, labelKey: "savingsGoals" as const, path: "/savings-goals" },
  { icon: Users, labelKey: "budgets" as const, path: "/budgets" },
  { icon: Handshake, labelKey: "lendings" as const, path: "/lendings" },
  { icon: MessageCircle, labelKey: "aiChat" as const, path: "/ai-chat" },
  { icon: Brain, labelKey: "aiAdvisor" as const, path: "/advisor" },
  { icon: Settings, labelKey: "settings" as const, path: "/settings" },
];

function SidebarNav() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-16 justify-center">
        <div className="flex items-center gap-3 px-2">
          <button onClick={toggleSidebar} className="h-8 w-8 flex items-center justify-center hover:bg-accent/20 rounded-lg transition-colors shrink-0">
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          {!isCollapsed && <span className="font-semibold tracking-tight truncate">⚡ Financial Nexus</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                onClick={() => navigate(item.path)}
                isActive={location.pathname === item.path}
                tooltip={t(item.labelKey)}
              >
                <item.icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
