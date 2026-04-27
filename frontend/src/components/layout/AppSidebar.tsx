import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Settings,
  Home,
  TrendingUp,
  Bot,
  Library,
  TestTube,
  Brain,
  Target,
  Zap,
  PlayCircle,
  FileText,
  Download,
  User,
  Sparkles,
  MousePointer
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const getNavigation = (role: string | null) => {
  const baseNavigation = [
    { title: "Dashboard", url: role === "admin" ? "/admin-dashboard" : "/dashboard", icon: Home },
    { title: "Strategy Library", url: "/strategies", icon: Library },
    { title: "Backtesting", url: "/backtesting", icon: BarChart3 },
    { title: "Portfolio", url: "/portfolio", icon: Target },
    { title: "AI Assistant", url: "/ai-assistant", icon: Sparkles },
    { title: "Drag & Drop Builder", url: "/drag-drop-strategy-builder", icon: MousePointer },
    { title: "Paper Trading", url: "/paper-trading", icon: PlayCircle },
  ];

  return baseNavigation;
};

const getTools = (role: string | null) => {
  const baseTools = [
    // { title: " ", url: "/market-analysis", icon: TrendingUp },
    // { title: "", url: "/optimization", icon: Zap },
    // { title: " ", url: "/scenario-tester", icon: TestTube },
    // { title: "", url: "/reports", icon: FileText },
    // { title: "", url: "/export", icon: Download },
    { title: "Profile", url: "/profile", icon: User },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  if (role === "admin") {
    baseTools.unshift(
      { title: "User Management", url: "/user-management", icon: User },
      { title: "Data Management", url: "/data-management", icon: TrendingUp }
    );
  }

  return baseTools;
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role } = useAuth();

  const navigation = getNavigation(role);
  const allTools = getTools(role);

  // Hide these items on the home/dashboard page only
  const HOME_HIDDEN_TOOLS = ["Market Analysis", "Optimization", "Scenario Tester", "Reports", "Export"];
  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/admin-dashboard" || location.pathname === "/";
  const tools = isDashboard
    ? allTools.filter((t) => !HOME_HIDDEN_TOOLS.includes(t.title))
    : allTools;

  const isActive = (path: string) => location.pathname === path;
  const getNavClassName = (path: string) =>
    isActive(path)
      ? "bg-[#374151] text-[#F9FAFB] font-medium"
      : "hover:bg-[#374151]/50 text-[#9CA3AF] hover:text-[#F9FAFB]";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="bg-[#111827]">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#9CA3AF] uppercase tracking-wider text-xs">
            {!collapsed && "Trading Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[#9CA3AF] uppercase tracking-wider text-xs">
            {!collapsed && "Advanced Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}