import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, ChevronDown, LogOut, Settings, Sparkles } from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, loading, displayName } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          {/* Dark Navy Navigation Bar */}
          <header className="h-16 bg-[#111827] border-b border-[#374151] flex items-center justify-between px-6 shadow-lg">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-bold text-[#F9FAFB]">Growmore</h1>
              </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                className="text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151] font-medium"
                onClick={() => navigate('/')}
              >
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                className="text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151] font-medium"
                onClick={() => navigate('/strategies')}
              >
                Strategy Library
              </Button>
              <Button 
                variant="ghost" 
                className="text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151] font-medium"
                onClick={() => navigate('/backtesting')}
              >
                Backtesting
              </Button>
              <Button 
                variant="ghost" 
                className="text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151] font-medium"
                onClick={() => navigate('/portfolio')}
              >
                Portfolio
              </Button>
              <Button 
                variant="ghost" 
                className="text-[#3B82F6] hover:text-[#60A5FA] hover:bg-[#374151] font-medium"
                onClick={() => navigate('/ai-assistant')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </nav>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-[#EF4444] rounded-full text-xs"></span>
              </Button>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]">
                      <span className="text-sm text-[#F9FAFB] font-semibold">
                        {displayName || user.email}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#1F2937] border-[#374151]">
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="text-[#F9FAFB] hover:bg-[#374151]">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="text-[#F9FAFB] hover:bg-[#374151]">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="text-[#F9FAFB] hover:bg-[#374151]">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <AuthDialog trigger={<Button variant="ghost" size="icon" className="text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]"><User className="h-5 w-5" /></Button>} />
              )}
            </div>
          </header>
          {/* Main Content */}
          <main className="flex-1 p-6 bg-[#111827]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}