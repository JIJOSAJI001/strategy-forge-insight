import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import DragDropStrategyBuilder from "./pages/DragDropStrategyBuilder";
import Backtesting from "./pages/Backtesting";
import StrategyLibrary from "./pages/StrategyLibrary";
import PaperTrading from "./pages/PaperTrading";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/admin-dashboard" element={<AdminRoute><AppLayout hideSidebar hideTopNavLinks><ErrorBoundary><AdminDashboard /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/user-management" element={<AdminRoute><AppLayout hideSidebar hideTopNavLinks><ErrorBoundary><UserManagement /></ErrorBoundary></AppLayout></AdminRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><AppLayout><ErrorBoundary><Dashboard /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/drag-drop-strategy-builder" element={<ProtectedRoute><AppLayout><ErrorBoundary><DragDropStrategyBuilder /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/backtesting" element={<ProtectedRoute><AppLayout><ErrorBoundary><Backtesting /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/strategies" element={<ProtectedRoute><AppLayout><ErrorBoundary><StrategyLibrary /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/paper-trading" element={<ProtectedRoute><AppLayout><ErrorBoundary><PaperTrading /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><AppLayout><ErrorBoundary><Profile /></ErrorBoundary></AppLayout></ProtectedRoute>} />
                {/* Coming Soon Routes - Temporarily Disabled */}
                {/* 
                <Route path="/optimization" element={<ProtectedRoute><AppLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Parameter Optimization</h1><p className="text-muted-foreground">Coming soon...</p></div></AppLayout></ProtectedRoute>} />
                <Route path="/market-analysis" element={<ProtectedRoute><AppLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Market Regime Analysis</h1><p className="text-muted-foreground">Coming soon...</p></div></AppLayout></ProtectedRoute>} />
                <Route path="/portfolio" element={<ProtectedRoute><AppLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Portfolio Simulator</h1><p className="text-muted-foreground">Coming soon...</p></div></AppLayout></ProtectedRoute>} />
                <Route path="/scenario-tester" element={<ProtectedRoute><AppLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Scenario Tester</h1><p className="text-muted-foreground">Coming soon...</p></div></AppLayout></ProtectedRoute>} />
                <Route path="/ai-assistant" element={<ProtectedRoute><AppLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">AI Assistant</h1><p className="text-muted-foreground">Coming soon...</p></div></AppLayout></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><AppLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Reports & Analytics</h1><p className="text-muted-foreground">Coming soon...</p></div></AppLayout></ProtectedRoute>} />
                <Route path="/export" element={<ProtectedRoute><AppLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Export Center</h1><p className="text-muted-foreground">Coming soon...</p></div></AppLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppLayout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Coming soon...</p></div></AppLayout></ProtectedRoute>} />
                */}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
