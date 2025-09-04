import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Download, 
  Copy,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { strategyService } from "@/services/strategy.service";
import DraggableParameter from "@/components/strategy/DraggableParameter";
import DroppableZone from "@/components/strategy/DroppableZone";
import ParameterLibrary from "@/components/strategy/ParameterLibrary";
import StrategyPreview from "@/components/strategy/StrategyPreview";

// Types
export interface Parameter {
  id: string;
  type: 'indicator' | 'condition' | 'action';
  name: string;
  category: string;
  description: string;
  config: Record<string, any>;
  icon: React.ReactNode;
}

export interface StrategyCondition {
  id: string;
  parameters: Parameter[];
  logic: 'AND' | 'OR';
}

export interface Strategy {
  name: string;
  description: string;
  timeframe: string;
  conditions: StrategyCondition[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    maxPositions: number;
    riskPerTrade: number;
  };
}

// Sample parameters library
const PARAMETER_LIBRARY: Parameter[] = [
  // Indicators
  {
    id: 'rsi',
    type: 'indicator',
    name: 'RSI',
    category: 'Momentum',
    description: 'Relative Strength Index',
    config: { period: 14, overbought: 70, oversold: 30 },
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'sma',
    type: 'indicator',
    name: 'SMA',
    category: 'Trend',
    description: 'Simple Moving Average',
    config: { period: 20 },
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'ema',
    type: 'indicator',
    name: 'EMA',
    category: 'Trend',
    description: 'Exponential Moving Average',
    config: { period: 20 },
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'macd',
    type: 'indicator',
    name: 'MACD',
    category: 'Momentum',
    description: 'Moving Average Convergence Divergence',
    config: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'bollinger',
    type: 'indicator',
    name: 'Bollinger Bands',
    category: 'Volatility',
    description: 'Bollinger Bands',
    config: { period: 20, stdDev: 2 },
    icon: <Target className="h-4 w-4" />
  },
  
  // Conditions
  {
    id: 'greater_than',
    type: 'condition',
    name: 'Greater Than',
    category: 'Comparison',
    description: 'Value is greater than threshold',
    config: { threshold: 0 },
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'less_than',
    type: 'condition',
    name: 'Less Than',
    category: 'Comparison',
    description: 'Value is less than threshold',
    config: { threshold: 0 },
    icon: <TrendingDown className="h-4 w-4" />
  },
  {
    id: 'crosses_above',
    type: 'condition',
    name: 'Crosses Above',
    category: 'Crossover',
    description: 'Line crosses above another line',
    config: {},
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'crosses_below',
    type: 'condition',
    name: 'Crosses Below',
    category: 'Crossover',
    description: 'Line crosses below another line',
    config: {},
    icon: <TrendingDown className="h-4 w-4" />
  },
  
  // Actions
  {
    id: 'buy',
    type: 'action',
    name: 'Buy',
    category: 'Entry',
    description: 'Open long position',
    config: {},
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'sell',
    type: 'action',
    name: 'Sell',
    category: 'Exit',
    description: 'Close position',
    config: {},
    icon: <TrendingDown className="h-4 w-4" />
  },
  {
    id: 'stop_loss',
    type: 'action',
    name: 'Stop Loss',
    category: 'Risk',
    description: 'Set stop loss',
    config: { percentage: 5 },
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'take_profit',
    type: 'action',
    name: 'Take Profit',
    category: 'Risk',
    description: 'Set take profit',
    config: { percentage: 10 },
    icon: <Target className="h-4 w-4" />
  }
];

export default function DragDropStrategyBuilder() {
  const [strategy, setStrategy] = useState<Strategy>({
    name: '',
    description: '',
    timeframe: '1h',
    conditions: [],
    riskManagement: {
      stopLoss: 5,
      takeProfit: 10,
      positionSize: 10,
      maxPositions: 5,
      riskPerTrade: 2
    }
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Handle dropping parameters into conditions
    if (overId.startsWith('condition-')) {
      const conditionId = overId.replace('condition-', '');
      const parameter = PARAMETER_LIBRARY.find(p => p.id === activeId);
      
      if (parameter) {
        setStrategy(prev => ({
          ...prev,
          conditions: prev.conditions.map(condition => 
            condition.id === conditionId 
              ? { ...condition, parameters: [...condition.parameters, parameter] }
              : condition
          )
        }));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      setActiveId(null);
      return;
    }

    // Handle reordering within the same condition
    if (overId.startsWith('parameter-') && activeId.startsWith('parameter-')) {
      const activeConditionId = activeId.split('-')[1];
      const overConditionId = overId.split('-')[1];
      
      if (activeConditionId === overConditionId) {
        setStrategy(prev => ({
          ...prev,
          conditions: prev.conditions.map(condition => {
            if (condition.id === activeConditionId) {
              const oldIndex = condition.parameters.findIndex(p => p.id === activeId.split('-')[2]);
              const newIndex = condition.parameters.findIndex(p => p.id === overId.split('-')[2]);
              
              return {
                ...condition,
                parameters: arrayMove(condition.parameters, oldIndex, newIndex)
              };
            }
            return condition;
          })
        }));
      }
    }

    setActiveId(null);
  };

  const addCondition = () => {
    const newCondition: StrategyCondition = {
      id: `condition-${Date.now()}`,
      parameters: [],
      logic: 'AND'
    };
    
    setStrategy(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const removeCondition = (conditionId: string) => {
    setStrategy(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== conditionId)
    }));
  };

  const removeParameter = (conditionId: string, parameterId: string) => {
    setStrategy(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition => 
        condition.id === conditionId 
          ? { ...condition, parameters: condition.parameters.filter(p => p.id !== parameterId) }
          : condition
      )
    }));
  };

  const updateConditionLogic = (conditionId: string, logic: 'AND' | 'OR') => {
    setStrategy(prev => ({
      ...prev,
      conditions: prev.conditions.map(condition => 
        condition.id === conditionId 
          ? { ...condition, logic }
          : condition
      )
    }));
  };

  const saveStrategy = async () => {
    try {
      if (!strategy.name.trim()) {
        toast.error("Please enter a strategy name");
        return;
      }
      
      if (strategy.conditions.length === 0) {
        toast.error("Please add at least one condition");
        return;
      }

      await strategyService.saveStrategy(strategy);
      toast.success("Strategy saved successfully!");
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast.error("Failed to save strategy");
    }
  };

  const generatePineScript = async () => {
    try {
      if (!strategy.name.trim()) {
        toast.error("Please enter a strategy name");
        return;
      }
      
      if (strategy.conditions.length === 0) {
        toast.error("Please add at least one condition");
        return;
      }

      const response = await strategyService.generatePineScript(strategy);
      
      // Copy to clipboard
      navigator.clipboard.writeText(response.code);
      toast.success("Pine Script copied to clipboard!");
    } catch (error) {
      console.error('Error generating Pine Script:', error);
      toast.error("Failed to generate Pine Script");
    }
  };

  const downloadPineScript = () => {
    const pineScript = `// Generated Strategy: ${strategy.name}
//@version=5
strategy("${strategy.name}", overlay=true)

// Entry conditions
${strategy.conditions.map(condition => 
  condition.parameters.map(param => {
    switch(param.id) {
      case 'rsi':
        return `rsi = ta.rsi(close, ${param.config.period})`;
      case 'sma':
        return `sma = ta.sma(close, ${param.config.period})`;
      case 'ema':
        return `ema = ta.ema(close, ${param.config.period})`;
      default:
        return `// ${param.name} implementation`;
    }
  }).join('\n')
).join('\n')}

// Strategy logic
if (${strategy.conditions.map(condition => 
  condition.parameters.map(param => {
    switch(param.id) {
      case 'greater_than':
        return `rsi > ${param.config.threshold}`;
      case 'less_than':
        return `rsi < ${param.config.threshold}`;
      default:
        return `true`;
    }
  }).join(` ${condition.logic} `)
).join(' and ')})
    strategy.entry("Long", strategy.long)

// Exit conditions
strategy.exit("Exit", "Long", stop=strategy.position_avg_price * (1 - ${strategy.riskManagement.stopLoss / 100}), limit=strategy.position_avg_price * (1 + ${strategy.riskManagement.takeProfit / 100}))`;

    const blob = new Blob([pineScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${strategy.name || 'strategy'}.pine`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Pine Script downloaded!");
  };

  const activeParameter = PARAMETER_LIBRARY.find(p => p.id === activeId);

  return (
    <div className="min-h-screen bg-background">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Drag & Drop Strategy Builder</h1>
              <p className="text-muted-foreground">Build trading strategies with visual drag-and-drop interface</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={saveStrategy}>
                <Save className="h-4 w-4 mr-2" />
                Save Strategy
              </Button>
              <Button variant="outline" size="sm" onClick={generatePineScript}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Pine Script
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPineScript}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="trading" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Backtest
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Parameter Library */}
            <div className="lg:col-span-1">
              <ParameterLibrary parameters={PARAMETER_LIBRARY} />
            </div>

            {/* Strategy Builder Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Strategy Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Strategy Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="strategy-name">Strategy Name</Label>
                      <Input 
                        id="strategy-name" 
                        placeholder="My RSI Strategy"
                        value={strategy.name}
                        onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeframe">Timeframe</Label>
                      <Select 
                        value={strategy.timeframe}
                        onValueChange={(value) => setStrategy(prev => ({ ...prev, timeframe: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1m">1 Minute</SelectItem>
                          <SelectItem value="5m">5 Minutes</SelectItem>
                          <SelectItem value="15m">15 Minutes</SelectItem>
                          <SelectItem value="1h">1 Hour</SelectItem>
                          <SelectItem value="4h">4 Hours</SelectItem>
                          <SelectItem value="1d">1 Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe your trading strategy..."
                      rows={3}
                      value={strategy.description}
                      onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Conditions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Strategy Conditions</CardTitle>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {strategy.conditions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Drag parameters from the library to create your first condition</p>
                    </div>
                  ) : (
                    strategy.conditions.map((condition, index) => (
                      <div key={condition.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Condition {index + 1}</Badge>
                            <Select 
                              value={condition.logic}
                              onValueChange={(value: 'AND' | 'OR') => updateConditionLogic(condition.id, value)}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">AND</SelectItem>
                                <SelectItem value="OR">OR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeCondition(condition.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <DroppableZone 
                          id={`condition-${condition.id}`}
                          parameters={condition.parameters}
                          onRemoveParameter={(parameterId) => removeParameter(condition.id, parameterId)}
                        />
                        
                        {index < strategy.conditions.length - 1 && <Separator />}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                      <Input 
                        id="stop-loss" 
                        type="number" 
                        value={strategy.riskManagement.stopLoss}
                        onChange={(e) => setStrategy(prev => ({ 
                          ...prev, 
                          riskManagement: { ...prev.riskManagement, stopLoss: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="take-profit">Take Profit (%)</Label>
                      <Input 
                        id="take-profit" 
                        type="number" 
                        value={strategy.riskManagement.takeProfit}
                        onChange={(e) => setStrategy(prev => ({ 
                          ...prev, 
                          riskManagement: { ...prev.riskManagement, takeProfit: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="position-size">Position Size (%)</Label>
                      <Input 
                        id="position-size" 
                        type="number" 
                        value={strategy.riskManagement.positionSize}
                        onChange={(e) => setStrategy(prev => ({ 
                          ...prev, 
                          riskManagement: { ...prev.riskManagement, positionSize: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-positions">Max Positions</Label>
                      <Input 
                        id="max-positions" 
                        type="number" 
                        value={strategy.riskManagement.maxPositions}
                        onChange={(e) => setStrategy(prev => ({ 
                          ...prev, 
                          riskManagement: { ...prev.riskManagement, maxPositions: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="risk-per-trade">Risk per Trade (%)</Label>
                      <Input 
                        id="risk-per-trade" 
                        type="number" 
                        value={strategy.riskManagement.riskPerTrade}
                        onChange={(e) => setStrategy(prev => ({ 
                          ...prev, 
                          riskManagement: { ...prev.riskManagement, riskPerTrade: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-1">
              <StrategyPreview strategy={strategy} />
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeParameter ? (
            <DraggableParameter parameter={activeParameter} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 