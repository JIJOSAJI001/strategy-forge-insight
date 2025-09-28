import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Edit, BarChart3, TrendingUp, Target, Shield } from "lucide-react";
import { IndicatorDef, IndicatorTemplate } from "@/types/strategy";

interface IndicatorRegistryProps {
  indicators: IndicatorDef[];
  onAddIndicator: (indicator: IndicatorDef) => void;
  onUpdateIndicator: (id: string, indicator: IndicatorDef) => void;
  onRemoveIndicator: (id: string) => void;
  onDuplicateIndicator: (indicator: IndicatorDef) => void;
}

const INDICATOR_TEMPLATES: IndicatorTemplate[] = [
  {
    id: 'rsi',
    name: 'RSI',
    category: 'Momentum',
    description: 'Relative Strength Index',
    defaultParams: { source: 'close', length: 14 },
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'sma',
    name: 'SMA',
    category: 'Trend',
    description: 'Simple Moving Average',
    defaultParams: { source: 'close', length: 20 },
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'ema',
    name: 'EMA',
    category: 'Trend',
    description: 'Exponential Moving Average',
    defaultParams: { source: 'close', length: 20 },
    icon: <TrendingUp className="h-4 w-4" />
  },
  {
    id: 'macd',
    name: 'MACD',
    category: 'Momentum',
    description: 'Moving Average Convergence Divergence',
    defaultParams: { source: 'close', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'bollinger',
    name: 'Bollinger Bands',
    category: 'Volatility',
    description: 'Bollinger Bands',
    defaultParams: { source: 'close', period: 20, stdDev: 2 },
    icon: <Target className="h-4 w-4" />
  },
  {
    id: 'stoch',
    name: 'Stochastic',
    category: 'Momentum',
    description: 'Stochastic Oscillator',
    defaultParams: { kPeriod: 14, dPeriod: 3, smoothK: 3 },
    icon: <BarChart3 className="h-4 w-4" />
  }
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Momentum':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'Trend':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    case 'Volatility':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getIndicatorIcon = (type: string) => {
  const template = INDICATOR_TEMPLATES.find(t => t.id === type);
  return template?.icon || <BarChart3 className="h-4 w-4" />;
};

const getIndicatorCategory = (type: string) => {
  const template = INDICATOR_TEMPLATES.find(t => t.id === type);
  return template?.category || 'Unknown';
};

export default function IndicatorRegistry({
  indicators,
  onAddIndicator,
  onUpdateIndicator,
  onRemoveIndicator,
  onDuplicateIndicator
}: IndicatorRegistryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newIndicator, setNewIndicator] = useState<Partial<IndicatorDef>>({
    id: '',
    type: '',
    params: {}
  });

  const generateUniqueId = (type: string) => {
    const baseId = type.toLowerCase();
    let counter = 1;
    let id = `${baseId}${counter}`;
    
    while (indicators.some(ind => ind.id === id)) {
      counter++;
      id = `${baseId}${counter}`;
    }
    
    return id;
  };

  const handleAddIndicator = () => {
    if (!newIndicator.type) return;
    
    const template = INDICATOR_TEMPLATES.find(t => t.id === newIndicator.type);
    if (!template) return;

    const indicator: IndicatorDef = {
      id: newIndicator.id || generateUniqueId(newIndicator.type),
      type: newIndicator.type,
      params: { ...template.defaultParams, ...newIndicator.params }
    };

    onAddIndicator(indicator);
    setNewIndicator({ id: '', type: '', params: {} });
    setIsAdding(false);
  };

  const handleUpdateIndicator = (id: string) => {
    const indicator = indicators.find(ind => ind.id === id);
    if (!indicator) return;

    onUpdateIndicator(id, {
      ...indicator,
      ...newIndicator,
      id: indicator.id // Don't allow changing the ID
    });

    setEditingId(null);
    setNewIndicator({ id: '', type: '', params: {} });
  };

  const startEdit = (indicator: IndicatorDef) => {
    setEditingId(indicator.id);
    setNewIndicator(indicator);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewIndicator({ id: '', type: '', params: {} });
  };

  const getParamInput = (key: string, value: any, onChange: (value: any) => void) => {
    if (typeof value === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8"
        />
      );
    }
    
    if (key === 'source') {
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="close">Close</SelectItem>
            <SelectItem value="volume">Volume</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
      />
    );
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Indicator Registry
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage indicators used in your strategy
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Indicator
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Type</Label>
              <Select
                value={newIndicator.type}
                onValueChange={(value) => {
                  const template = INDICATOR_TEMPLATES.find(t => t.id === value);
                  setNewIndicator({
                    ...newIndicator,
                    type: value,
                    params: template?.defaultParams || {}
                  });
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select indicator type" />
                </SelectTrigger>
                <SelectContent>
                  {INDICATOR_TEMPLATES.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        {template.icon}
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">ID</Label>
              <Input
                value={newIndicator.id || ''}
                onChange={(e) => setNewIndicator({ ...newIndicator, id: e.target.value })}
                placeholder="e.g., rsi1, sma1"
                className="h-8"
              />
            </div>

            {/* Dynamic Parameters */}
            {newIndicator.type && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Parameters</Label>
                {Object.entries(newIndicator.params || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Label className="text-xs w-20 capitalize">{key}</Label>
                    {getParamInput(key, value, (newValue) => {
                      setNewIndicator({
                        ...newIndicator,
                        params: { ...newIndicator.params, [key]: newValue }
                      });
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={isAdding ? handleAddIndicator : () => handleUpdateIndicator(editingId!)}
                disabled={!newIndicator.type}
              >
                {isAdding ? 'Add' : 'Update'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Indicators List */}
        <div className="space-y-2">
          {indicators.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No indicators added yet</p>
            </div>
          ) : (
            indicators.map((indicator) => (
              <div key={indicator.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIndicatorIcon(indicator.type)}
                    <span className="font-medium text-sm">{indicator.id}</span>
                    <Badge variant="outline" className="text-xs">
                      {indicator.type}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getCategoryColor(getIndicatorCategory(indicator.type))}`}
                    >
                      {getIndicatorCategory(indicator.type)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDuplicateIndicator(indicator)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(indicator)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveIndicator(indicator.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {Object.entries(indicator.params).map(([key, value]) => (
                    <span key={key} className="mr-3">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}