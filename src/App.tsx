import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import StrategyBuilder from "./pages/StrategyBuilder";
import Backtesting from "./pages/Backtesting";
import StrategyLibrary from "./pages/StrategyLibrary";
import PaperTrading from "./pages/PaperTrading";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/strategy-builder" element={<StrategyBuilder />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/strategies" element={<StrategyLibrary />} />
            <Route path="/optimization" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Parameter Optimization</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/market-analysis" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Market Regime Analysis</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/portfolio" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Portfolio Simulator</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/paper-trading" element={<PaperTrading />} />
            <Route path="/scenario-tester" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Scenario Tester</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/ai-assistant" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">AI Assistant</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/reports" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Reports & Analytics</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/export" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Export Center</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/settings" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
