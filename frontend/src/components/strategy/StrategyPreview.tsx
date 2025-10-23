import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Parameter {
  id: string;
  name: string;
  type: 'indicator' | 'condition' | 'action' | string;
  category?: string;
}

interface Condition {
  id: string;
  logic: string;
  parameters: Parameter[];
}

interface RiskManagement {
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  maxPositions: number;
  riskPerTrade: number;
}

interface Strategy {
  conditions: Condition[];
  timeframe: string;
  riskManagement: RiskManagement;
}

interface StrategyPreviewProps {
  strategy: Strategy;
}

export default function StrategyPreview({ strategy }: StrategyPreviewProps) {
  const getParameterIcon = (type: string) => {
    switch (type) {
      case 'indicator':
        return <BarChart3 className="h-4 w-4" />;
      case 'condition':
        return <TrendingUp className="h-4 w-4" />;
      case 'action':
        return <Target className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getParameterColor = (type: string) => {
    switch (type) {
      case 'indicator':
        return 'text-blue-600 dark:text-blue-400';
      case 'condition':
        return 'text-green-600 dark:text-green-400';
      case 'action':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const calculateStrategyComplexity = () => {
    const totalParameters = strategy.conditions.reduce((acc, condition) => 
      acc + condition.parameters.length, 0
    );
    const totalConditions = strategy.conditions.length;
    
    if (totalParameters === 0) return 0;
    if (totalParameters <= 3 && totalConditions <= 1) return 25;
    if (totalParameters <= 6 && totalConditions <= 2) return 50;
    if (totalParameters <= 10 && totalConditions <= 3) return 75;
    return 100;
  };

  const getStrategyStatus = () => {
    if (strategy.conditions.length === 0) {
      return { status: 'incomplete', message: 'No conditions defined', icon: <XCircle className="h-4 w-4" /> };
    }
    
    const hasIndicators = strategy.conditions.some(condition => 
      condition.parameters.some(param => param.type === 'indicator')
    );
    const hasConditions = strategy.conditions.some(condition => 
      condition.parameters.some(param => param.type === 'condition')
    );
    const hasActions = strategy.conditions.some(condition => 
      condition.parameters.some(param => param.type === 'action')
    );

    if (!hasIndicators) {
      return { status: 'warning', message: 'Missing indicators', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (!hasConditions) {
      return { status: 'warning', message: 'Missing conditions', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    if (!hasActions) {
      return { status: 'warning', message: 'Missing actions', icon: <AlertTriangle className="h-4 w-4" /> };
    }
    
    return { status: 'complete', message: 'Strategy ready', icon: <CheckCircle className="h-4 w-4" /> };
  };

  const strategyStatus = getStrategyStatus();
  const complexity = calculateStrategyComplexity();

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Strategy Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <div className="flex items-center gap-2">
                {strategyStatus.icon}
                <span className="text-sm">{strategyStatus.message}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Complexity</span>
              <span className="text-sm">{complexity}%</span>
            </div>
            <Progress value={complexity} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Conditions:</span>
              <span className="ml-2 font-medium">{strategy.conditions.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Parameters:</span>
              <span className="ml-2 font-medium">
                {strategy.conditions.reduce((acc, condition) => acc + condition.parameters.length, 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Timeframe:</span>
              <span className="ml-2 font-medium">{strategy.timeframe}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Real-time</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Logic Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Strategy Logic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategy.conditions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conditions defined yet</p>
            </div>
          ) : (
            strategy.conditions.map((condition, index) => (
              <div key={condition.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Condition {index + 1}</Badge>
                  <Badge variant="secondary">{condition.logic}</Badge>
                </div>
                
                {condition.parameters.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">
                    No parameters added
                  </div>
                ) : (
                  <div className="space-y-1">
                    {condition.parameters.map((parameter, paramIndex) => (
                      <div key={parameter.id} className="flex items-center gap-2 text-sm">
                        {paramIndex > 0 && (
                          <span className="text-muted-foreground text-xs">AND</span>
                        )}
                        <div className={`flex items-center gap-1 ${getParameterColor(parameter.type)}`}>
                          {getParameterIcon(parameter.type)}
                          <span className="font-medium">{parameter.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {parameter.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Risk Management Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Stop Loss:</span>
              <span className="ml-2 font-medium text-red-600">{strategy.riskManagement.stopLoss}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Take Profit:</span>
              <span className="ml-2 font-medium text-green-600">{strategy.riskManagement.takeProfit}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Position Size:</span>
              <span className="ml-2 font-medium">{strategy.riskManagement.positionSize}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max Positions:</span>
              <span className="ml-2 font-medium">{strategy.riskManagement.maxPositions}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Risk per Trade:</span>
              <span className="font-medium text-amber-600">{strategy.riskManagement.riskPerTrade}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Risk/Reward Ratio:</span>
            <span className="font-medium">
              {strategy.riskManagement.takeProfit / strategy.riskManagement.stopLoss}:1
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Risk:</span>
            <span className="font-medium">
              {strategy.riskManagement.riskPerTrade * strategy.riskManagement.maxPositions}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Strategy Type:</span>
            <span className="font-medium">
              {strategy.conditions.length === 0 ? 'Not defined' : 
               strategy.conditions.length === 1 ? 'Simple' : 'Complex'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 