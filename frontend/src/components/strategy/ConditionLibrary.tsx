import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Target } from "lucide-react";

interface ConditionTemplateTileProps {
  template: { id: string; name: string; description: string; category: string; operator: string };
}

function ConditionTemplateTile({ template }: ConditionTemplateTileProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `condition-${template.id}`,
    data: { type: "condition", template },
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
        <div className="text-sm font-medium">{template.name}</div>
        <Badge variant="outline" className="text-xs">{template.category}</Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.description}</div>
    </div>
  );
}

const CONDITION_TEMPLATES = [
  { id: "gt", name: "Greater Than", description: "Left > Right", category: "Comparison", operator: ">" },
  { id: "lt", name: "Less Than", description: "Left < Right", category: "Comparison", operator: "<" },
  { id: "ge", name: "Greater or Equal", description: "Left >= Right", category: "Comparison", operator: ">=" },
  { id: "le", name: "Less or Equal", description: "Left <= Right", category: "Comparison", operator: "<=" },
  { id: "eq", name: "Equals", description: "Left == Right", category: "Comparison", operator: "==" },
  { id: "x_above", name: "Crosses Above", description: "Left crosses above Right", category: "Crossover", operator: "crosses_above" },
  { id: "x_below", name: "Crosses Below", description: "Left crosses below Right", category: "Crossover", operator: "crosses_below" },
];

export default function ConditionLibrary() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONDITION_TEMPLATES;
    return CONDITION_TEMPLATES.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [query]);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Condition Library
        </CardTitle>
        <Input placeholder="Search conditions..." value={query} onChange={(e) => setQuery(e.target.value)} className="h-8" />
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="mb-3" />
        <ScrollArea className="h-[520px] pr-3">
          <div className="grid grid-cols-1 gap-2">
            {filtered.map(t => (
              <ConditionTemplateTile key={t.id} template={t} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

