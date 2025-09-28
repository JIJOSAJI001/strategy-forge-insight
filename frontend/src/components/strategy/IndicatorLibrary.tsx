import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart3, TrendingUp, Target } from "lucide-react";
import { IndicatorTemplate } from "@/types/strategy";

interface LibraryTileProps {
  template: IndicatorTemplate;
}

function LibraryTile({ template }: LibraryTileProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `indicator-${template.id}`,
    data: { type: "indicator", template },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg border transition cursor-grab active:cursor-grabbing bg-card ${
        isDragging ? "shadow-lg ring-1 ring-primary/40 scale-[1.02]" : "hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-primary">{template.icon}</div>
          <div className="text-sm font-medium">{template.name}</div>
        </div>
        <Badge variant="outline" className="text-xs">
          {template.category}
        </Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
        {template.description}
      </div>
    </div>
  );
}

const INDICATOR_TEMPLATES: IndicatorTemplate[] = [
  // Moving averages
  { id: "MA", name: "Moving Average (MA)", category: "Trend", description: "Simple moving average (generic)", defaultParams: { period: 20 }, icon: <TrendingUp className="h-4 w-4" /> },
  { id: "SMA", name: "SMA", category: "Trend", description: "Simple Moving Average", defaultParams: { source: "close", length: 20 }, icon: <TrendingUp className="h-4 w-4" /> },
  { id: "EMA", name: "EMA", category: "Trend", description: "Exponential Moving Average", defaultParams: { source: "close", length: 20 }, icon: <TrendingUp className="h-4 w-4" /> },

  // Momentum
  { id: "RSI", name: "RSI", category: "Momentum", description: "Relative Strength Index", defaultParams: { source: "close", length: 14, overbought: 70, oversold: 30 }, icon: <BarChart3 className="h-4 w-4" /> },
  { id: "MACD", name: "MACD", category: "Momentum", description: "Moving Average Convergence Divergence", defaultParams: { source: "close", fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }, icon: <BarChart3 className="h-4 w-4" /> },
  { id: "STOCH", name: "Stochastic Oscillator", category: "Momentum", description: "Stochastic %K/%D", defaultParams: { kPeriod: 14, dPeriod: 3 }, icon: <BarChart3 className="h-4 w-4" /> },
  { id: "ADX", name: "ADX", category: "Momentum", description: "Average Directional Index", defaultParams: { period: 14 }, icon: <BarChart3 className="h-4 w-4" /> },
  { id: "MFI", name: "MFI", category: "Momentum", description: "Money Flow Index", defaultParams: { period: 14 }, icon: <BarChart3 className="h-4 w-4" /> },

  // Volume / volatility
  { id: "OBV", name: "OBV", category: "Volume", description: "On Balance Volume", defaultParams: { }, icon: <Target className="h-4 w-4" /> },
  { id: "BOLL", name: "Bollinger Bands", category: "Volatility", description: "Bollinger Bands", defaultParams: { source: "close", period: 20, stdDev: 2 }, icon: <Target className="h-4 w-4" /> },
  { id: "PSAR", name: "Parabolic SAR", category: "Volatility", description: "Parabolic SAR", defaultParams: { step: 0.02, maxStep: 0.2 }, icon: <Target className="h-4 w-4" /> },
];

export default function IndicatorLibrary() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDICATOR_TEMPLATES;
    return INDICATOR_TEMPLATES.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [query]);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Indicator Library
        </CardTitle>
        <Input placeholder="Search indicators..." value={query} onChange={(e) => setQuery(e.target.value)} className="h-8" />
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="mb-3" />
        <ScrollArea className="h-[520px] pr-3">
          <div className="grid grid-cols-1 gap-2">
            {filtered.map(t => (
              <LibraryTile key={t.id} template={t} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

