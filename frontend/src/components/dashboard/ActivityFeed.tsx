import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Play, BarChart3, AlertTriangle, Settings, Users } from "lucide-react";

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'create' | 'backtest' | 'optimize' | 'alert' | 'compare' | 'settings';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActionIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return <Plus className="h-4 w-4 text-[#10B981]" />;
      case 'backtest':
        return <Play className="h-4 w-4 text-[#3B82F6]" />;
      case 'optimize':
        return <Settings className="h-4 w-4 text-[#F59E0B]" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-[#EF4444]" />;
      case 'compare':
        return <BarChart3 className="h-4 w-4 text-[#8B5CF6]" />;
      default:
        return <Users className="h-4 w-4 text-[#9CA3AF]" />;
    }
  };

  const getActionColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
      case 'backtest':
        return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
      case 'optimize':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
      case 'alert':
        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
      case 'compare':
        return 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20';
      default:
        return 'bg-[#9CA3AF]/10 text-[#9CA3AF] border-[#9CA3AF]/20';
    }
  };

  return (
    <Card className="bg-[#1F2937] border-[#374151]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-[#F9FAFB]">
          <Clock className="h-5 w-5 text-[#3B82F6]" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 pr-2">
          <div className="space-y-4">
            {activities.map((item, index) => (
              <div key={item.id} className="relative">
                {/* Timeline Line */}
                {index < activities.length - 1 && (
                  <div className="absolute left-6 top-8 w-0.5 h-12 bg-[#374151]"></div>
                )}
                
                {/* Activity Item */}
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#374151]/50 transition-colors">
                  {/* Icon with background */}
                  <div className={`p-2 rounded-full ${getActionColor(item.type)}`}>
                    {getActionIcon(item.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[#F9FAFB] text-sm">{item.user}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getActionColor(item.type)}`}
                      >
                        {item.action}
                      </Badge>
                    </div>
                    <div className="text-sm text-[#9CA3AF] mb-1">
                      {item.target}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 