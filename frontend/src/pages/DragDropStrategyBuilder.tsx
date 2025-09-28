import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  Play, 
  Download, 
  Copy,
  BarChart3,
  Target,
  Shield,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { strategyService } from "@/services/strategy.service";
import { 
  StrategyDefinition, 
  IndicatorDef, 
  ConditionDef, 
  RiskManagementDef,
  ValidationError 
} from "@/types/strategy";
import RiskManagementForm from "@/components/strategy/RiskManagementForm";
import IndicatorLibrary from "@/components/strategy/IndicatorLibrary";
import ConditionLibrary from "@/components/strategy/ConditionLibrary";
import WorkspaceCanvas from "@/components/strategy/WorkspaceCanvas";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import IndicatorConfigModal from "@/components/strategy/IndicatorConfigModal";
import ConditionEditorModal from "@/components/strategy/ConditionEditorModal";

// Default strategy definition
const DEFAULT_STRATEGY: StrategyDefinition = {
  name: '',
  description: '',
  ownerId: 'anonymous', // TODO: Get from auth context
  visibility: 'private',
  timeframe: '1h',
  indicators: [],
  conditions: [],
  riskManagement: {
    stopLoss: { type: 'percentage', value: 5 },
    takeProfit: { type: 'percentage', value: 10 },
    capital: 10000,
    positionSize: 'percent_of_equity',
    positionValue: 10
  },
  pineScriptCode: null
};

export default function DragDropStrategyBuilder() {
  const [strategy, setStrategy] = useState<StrategyDefinition>(DEFAULT_STRATEGY);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [indicatorTemplate, setIndicatorTemplate] = useState<any | null>(null);
  const [conditionPreset, setConditionPreset] = useState<string | undefined>(undefined);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [activeDrag, setActiveDrag] = useState<any | null>(null);

  // Indicator management
  const addIndicator = (indicator: IndicatorDef) => {
    setStrategy(prev => ({
      ...prev,
      indicators: [...prev.indicators, indicator]
    }));
  };

  const updateIndicator = (id: string, indicator: IndicatorDef) => {
    setStrategy(prev => ({
      ...prev,
      indicators: prev.indicators.map(ind => ind.id === id ? indicator : ind)
    }));
  };

  const removeIndicator = (id: string) => {
    setStrategy(prev => ({
      ...prev,
      indicators: prev.indicators.filter(ind => ind.id !== id),
      conditions: prev.conditions.filter(cond => 
        cond.expression.left !== id && 
        cond.expression.right.indicator !== id
      )
    }));
  };

  const duplicateIndicator = (indicator: IndicatorDef) => {
    let counter = 1;
    let newId = `${indicator.id}_copy${counter}`;
    while (strategy.indicators.some(i => i.id === newId)) { counter++; newId = `${indicator.id}_copy${counter}`; }
    addIndicator({ ...indicator, id: newId });
  };

  // Condition management
  const addCondition = (condition: ConditionDef) => {
    setStrategy(prev => ({
      ...prev,
      conditions: [...prev.conditions, condition]
    }));
  };

  const updateCondition = (id: string, condition: ConditionDef) => {
    setStrategy(prev => ({
      ...prev,
      conditions: prev.conditions.map(cond => cond.id === id ? condition : cond)
    }));
  };

  const removeCondition = (id: string) => {
    setStrategy(prev => ({
      ...prev,
      conditions: prev.conditions.filter(cond => cond.id !== id)
    }));
  };

  const duplicateCondition = (condition: ConditionDef) => {
    let counter = 1;
    let newId = `${condition.id}_copy${counter}`;
    while (strategy.conditions.some(c => c.id === newId)) { counter++; newId = `${condition.id}_copy${counter}`; }
    addCondition({ ...condition, id: newId });
  };

  // DnD handlers
  // DnD scope for whole page
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as any;
    if (data) setActiveDrag(data);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id;
    if (!overId || overId !== 'workspace-dropzone') return;
    const data = event.active.data.current as any;
    if (!data) return;
    if (data.type === 'indicator') {
      setIndicatorTemplate(data.template);
      setIndicatorModalOpen(true);
    } else if (data.type === 'condition') {
      setConditionPreset(data.template?.operator);
      setConditionModalOpen(true);
    }
    setActiveDrag(null);
  };

  const existingEntryNames = strategy.conditions.filter(c => c.type === 'entry' && c.action.entryName).map(c => c.action.entryName!)
    .filter((v, i, a) => a.indexOf(v) === i);

  // Risk management
  const updateRiskManagement = (riskManagement: RiskManagementDef) => {
    setStrategy(prev => ({
      ...prev,
      riskManagement
    }));
  };

  // Validation
  const validateStrategy = async () => {
    setIsValidating(true);
    try {
      const result = await strategyService.validateStrategyDefinition(strategy);
      setValidationErrors(result.errors);
      return result.isValid;
    } catch (error) {
      console.error('Error validating strategy:', error);
      toast.error("Failed to validate strategy");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Save strategy
  const saveStrategy = async () => {
    setIsSaving(true);
    try {
      const isValid = await validateStrategy();
      if (!isValid) {
        toast.error("Please fix validation errors before saving");
        return;
      }

      if (strategy.id) {
        await strategyService.updateStrategyDefinition(strategy.id, strategy);
        toast.success("Strategy updated successfully!");
      } else {
        const savedStrategy = await strategyService.createStrategyDefinition(strategy);
        setStrategy(savedStrategy);
        toast.success("Strategy saved successfully!");
      }
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast.error("Failed to save strategy");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Pine Script (optional export)
  const generatePineScript = () => {
    // Simple Pine Script generation for demonstration
    const pineScript = `// Generated Strategy: ${strategy.name}
//@version=5
strategy("${strategy.name}", overlay=true)

// Indicators
${strategy.indicators.map(ind => {
  switch(ind.type) {
    case 'RSI':
      return `rsi_${ind.id} = ta.rsi(${ind.params.source}, ${ind.params.length})`;
    case 'SMA':
      return `sma_${ind.id} = ta.sma(${ind.params.source}, ${ind.params.length})`;
    case 'EMA':
      return `ema_${ind.id} = ta.ema(${ind.params.source}, ${ind.params.length})`;
    case 'MACD':
      return `[macd_${ind.id}, signal_${ind.id}, hist_${ind.id}] = ta.macd(${ind.params.source}, ${ind.params.fastPeriod}, ${ind.params.slowPeriod}, ${ind.params.signalPeriod})`;
    default:
      return `// ${ind.type} implementation`;
  }
}).join('\n')}

// Strategy logic
${strategy.conditions.map(cond => {
  if (cond.type === 'entry') {
    const left = cond.expression.left;
    const operator = cond.expression.operator;
    const right = cond.expression.right.value !== undefined ? cond.expression.right.value : `indicator_${cond.expression.right.indicator}`;
    return `if (${left} ${operator} ${right})
    strategy.entry("${cond.action.entryName}", strategy.${cond.action.side})`;
  }
  return '';
}).join('\n')}

// Exit conditions
${strategy.conditions.filter(cond => cond.type === 'exit').map(cond => {
  const left = cond.expression.left;
  const operator = cond.expression.operator;
  const right = cond.expression.right.value !== undefined ? cond.expression.right.value : `indicator_${cond.expression.right.indicator}`;
  return `if (${left} ${operator} ${right})
    strategy.close("${cond.action.exitFrom}")`;
}).join('\n')}

// Risk management
strategy.exit("StopLoss", "Long", stop=strategy.position_avg_price * (1 - ${strategy.riskManagement.stopLoss.value / 100}), limit=strategy.position_avg_price * (1 + ${strategy.riskManagement.takeProfit.value / 100}))`;

    return pineScript;
  };

  const downloadPineScript = () => {
    const pineScript = generatePineScript();
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

  const copyPineScript = () => {
    const pineScript = generatePineScript();
    navigator.clipboard.writeText(pineScript);
    toast.success("Pine Script copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Compact top bar */}
        <div className="flex items-center gap-3">
          <Input placeholder="Strategy Name" value={strategy.name} onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))} className="h-8 max-w-xs" />
          <Select value={strategy.timeframe} onValueChange={(value) => setStrategy(prev => ({ ...prev, timeframe: value }))}>
            <SelectTrigger className="h-8 w-28"><SelectValue placeholder="TF" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="1d">1d</SelectItem>
            </SelectContent>
          </Select>
          <Select value={strategy.visibility} onValueChange={(value: "private" | "public") => setStrategy(prev => ({ ...prev, visibility: value }))}>
            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => setShowDesc(s => !s)}>Description</Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={validateStrategy} disabled={isValidating}>
              {isValidating ? <AlertCircle className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}Validate
            </Button>
            <Button variant="outline" size="sm" onClick={copyPineScript}><Copy className="h-4 w-4 mr-2" />Export PS</Button>
            <Button variant="outline" size="sm" onClick={downloadPineScript}><Download className="h-4 w-4 mr-2" />Download</Button>
            <Button variant="default" size="sm" onClick={saveStrategy} disabled={isSaving || validationErrors.length > 0}><Save className="h-4 w-4 mr-2" />{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button variant="trading" size="sm"><Play className="h-4 w-4 mr-2" />Backtest</Button>
          </div>
        </div>

        {showDesc && (
          <Card>
            <CardContent className="pt-6">
              <Textarea rows={3} placeholder="Description..." value={strategy.description} onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))} />
            </CardContent>
          </Card>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">Validation Errors</span>
              </div>
              <ul className="text-sm text-destructive space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error.message}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Three-column layout with workspace center */}
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-1">
              <IndicatorLibrary />
            </div>
            <div className="lg:col-span-3">
              <WorkspaceCanvas
                indicators={strategy.indicators}
                conditions={strategy.conditions}
                onEditIndicator={(id) => {
                  const found = strategy.indicators.find(i => i.id === id);
                  if (!found) return;
                  setIndicatorTemplate({ id: found.type, defaultParams: found.params, name: found.type, category: "", description: "" });
                  setIndicatorModalOpen(true);
                }}
                onDuplicateIndicator={(id) => {
                  const found = strategy.indicators.find(i => i.id === id);
                  if (found) duplicateIndicator(found);
                }}
                onDeleteIndicator={removeIndicator}
                onEditCondition={(id) => {
                  setConditionPreset(undefined);
                  setConditionModalOpen(true);
                }}
                onDuplicateCondition={(id) => {
                  const found = strategy.conditions.find(c => c.id === id);
                  if (found) duplicateCondition(found);
                }}
                onDeleteCondition={removeCondition}
              />
            </div>
            <div className="lg:col-span-1">
              <ConditionLibrary />
            </div>
          </div>
          <DragOverlay>
            {activeDrag?.type === 'indicator' && (
              <div className="p-3 rounded-lg border bg-card shadow-2xl ring-2 ring-primary/40 scale-[1.03]">
                <div className="text-sm font-medium">{activeDrag.template?.name || activeDrag.template?.id}</div>
                <div className="text-xs text-muted-foreground">{activeDrag.template?.category}</div>
              </div>
            )}
            {activeDrag?.type === 'condition' && (
              <div className="p-3 rounded-lg border bg-card shadow-2xl ring-2 ring-primary/40 scale-[1.03]">
                <div className="text-sm font-medium">{activeDrag.template?.name}</div>
                <div className="text-xs text-muted-foreground">{activeDrag.template?.category}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Bottom Risk Management */}
        <RiskManagementForm riskManagement={strategy.riskManagement} onChange={updateRiskManagement} />

        {/* Modals */}
        <IndicatorConfigModal
          open={indicatorModalOpen}
          template={indicatorTemplate}
          existingIds={strategy.indicators.map(i => i.id)}
          onClose={() => setIndicatorModalOpen(false)}
          onConfirm={(indicator) => { addIndicator(indicator); setIndicatorModalOpen(false); }}
        />
        <ConditionEditorModal
          open={conditionModalOpen}
          presetOperator={conditionPreset}
          indicators={strategy.indicators}
          existingIds={strategy.conditions.map(c => c.id)}
          entriesForExit={existingEntryNames}
          onClose={() => setConditionModalOpen(false)}
          onConfirm={(condition) => { addCondition(condition); setConditionModalOpen(false); }}
        />
      </div>
    </div>
  );
} 