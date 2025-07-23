import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Bell, User } from "lucide-react";
import "../../../styles.css";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="app-container">
        <AppSidebar />
        
        <div className="main-content">
          {/* Header */}
          <header className="header">
            <div className="header-left">
              <SidebarTrigger className="sidebar-trigger" />
              <h1 className="header-title">TradingEdge Pro</h1>
            </div>
            
            <div className="header-right">
              <button className="btn btn-ghost btn-icon relative">
                <Bell className="icon" />
                <span className="notification-badge"></span>
              </button>
              <button className="btn btn-ghost btn-icon">
                <User className="icon" />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="main-section">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}