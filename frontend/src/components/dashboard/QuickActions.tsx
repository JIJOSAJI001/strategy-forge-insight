import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Play, BarChart3, Target, Sparkles, Settings } from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'outline';
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const getButtonVariant = (variant: QuickAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-[#3B82F6] hover:bg-[#2563EB] text-white';
      case 'secondary':
        return 'bg-[#374151] hover:bg-[#4B5563] text-[#F9FAFB]';
      case 'outline':
        return 'bg-transparent border-[#374151] hover:bg-[#374151] text-[#F9FAFB]';
      default:
        return 'bg-[#3B82F6] hover:bg-[#2563EB] text-white';
    }
  };

  return (
    <Card className="bg-[#1F2937] border-[#374151]">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#F9FAFB] text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`h-auto p-4 flex flex-col items-start gap-3 text-left ${getButtonVariant(action.variant)} rounded-lg transition-all duration-200 hover:scale-105`}
              onClick={action.onClick}
            >
              <div className="p-2 rounded-lg bg-white/10">
                <action.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-sm">{action.title}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 