import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Play, 
  Settings, 
  Copy,
  MoreVertical 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StrategyCardProps {
  name: string;
  status: "running" | "paused" | "backtesting" | "paper-trading";
  performance: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  lastUpdated: string;
  onRun?: () => void;
  onEdit?: () => void;
  onClone?: () => void;
}

export function StrategyCard({
  name,
  status,
  performance,
  sharpe,
  maxDrawdown,
  winRate,
  lastUpdated,
  onRun,
  onEdit,
  onClone,
}: StrategyCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-success text-success-foreground";
      case "paused":
        return "bg-muted text-muted-foreground";
      case "backtesting":
        return "bg-primary text-primary-foreground";
      case "paper-trading":
        return "bg-chart-3 text-background";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatPerformance = (perf: number) => {
    return perf >= 0 ? `+${perf.toFixed(1)}%` : `${perf.toFixed(1)}%`;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-border hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)} variant="secondary">
              {status.replace("-", " ")}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Strategy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClone}>
                  <Copy className="h-4 w-4 mr-2" />
                  Clone Strategy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRun}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Performance</span>
              <div className="flex items-center gap-1">
                {performance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
                <span className={`font-medium ${performance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatPerformance(performance)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="font-medium text-foreground">{winRate.toFixed(1)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
              <span className="font-medium text-foreground">{sharpe.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
              <span className="font-medium text-danger">{maxDrawdown.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button 
            variant="trading" 
            size="sm" 
            className="flex-1"
            onClick={onRun}
          >
            <Play className="h-4 w-4 mr-1" />
            Run Backtest
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEdit}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}