import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, HelpCircle, BarChart3, Target, Play, Settings } from "lucide-react";

interface DashboardFooterProps {
  onNavigate: (path: string) => void;
}

export function DashboardFooter({ onNavigate }: DashboardFooterProps) {
  const helpLinks = [
    {
      title: "How to read these metrics",
      description: "Learn what each dashboard metric means",
      icon: BarChart3,
      path: "/help/metrics"
    },
    {
      title: "Beginner's guide to strategies",
      description: "Start with simple trading strategies",
      icon: Target,
      path: "/help/strategies"
    },
    {
      title: "Understanding backtesting",
      description: "Learn how to test your strategies",
      icon: Play,
      path: "/help/backtesting"
    },
    {
      title: "Platform settings guide",
      description: "Configure your trading preferences",
      icon: Settings,
      path: "/help/settings"
    }
  ];

  return (
    <Card className="bg-[#1F2937] border-[#374151] mt-8">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-[#3B82F6]" />
            <h3 className="text-lg font-semibold text-[#F9FAFB]">Need Help Getting Started?</h3>
          </div>
          <p className="text-[#9CA3AF] text-sm">
            New to trading? Check out these helpful guides to understand your dashboard and get the most out of Growmore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {helpLinks.map((link, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-4 flex flex-col items-start gap-3 text-left bg-[#374151]/30 hover:bg-[#374151]/50 text-[#F9FAFB] rounded-lg transition-all duration-200"
              onClick={() => onNavigate(link.path)}
            >
              <div className="p-2 rounded-lg bg-[#3B82F6]/20">
                <link.icon className="h-4 w-4 text-[#3B82F6]" />
              </div>
              <div className="space-y-1">
                <div className="font-medium text-sm">{link.title}</div>
                <div className="text-xs text-[#9CA3AF]">{link.description}</div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-[#374151] text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-[#9CA3AF]">
            <span>© 2024 Growmore Trading Platform</span>
            <span>•</span>
            <Button 
              variant="link" 
              className="text-[#3B82F6] hover:text-[#60A5FA] p-0 h-auto"
              onClick={() => onNavigate('/help')}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Help Center
            </Button>
            <span>•</span>
            <Button 
              variant="link" 
              className="text-[#3B82F6] hover:text-[#60A5FA] p-0 h-auto"
              onClick={() => onNavigate('/contact')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 