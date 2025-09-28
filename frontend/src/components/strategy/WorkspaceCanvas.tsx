import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Edit, Copy, Trash2, Layers } from "lucide-react";
import { IndicatorDef, ConditionDef } from "@/types/strategy";

interface WorkspaceCanvasProps {
  indicators: IndicatorDef[];
  conditions: ConditionDef[];
  onEditIndicator: (id: string) => void;
  onDuplicateIndicator: (id: string) => void;
  onDeleteIndicator: (id: string) => void;
  onEditCondition: (id: string) => void;
  onDuplicateCondition: (id: string) => void;
  onDeleteCondition: (id: string) => void;
}

function DropZone() {
  const { isOver, setNodeRef } = useDroppable({ id: "workspace-dropzone" });
  return (
    <div
      ref={setNodeRef}
      className={`h-[420px] rounded-lg border-2 border-dashed relative overflow-hidden ${
        isOver ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 transition-opacity ${isOver ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-primary/10 animate-pulse" />
          <div className="absolute -inset-1 border-2 border-primary/30 rounded-lg blur-sm" />
        </div>
      </div>
      <div className="h-full w-full flex items-center justify-center relative z-[1]">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Drag indicators and conditions here
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceCanvas({
  indicators,
  conditions,
  onEditIndicator,
  onDuplicateIndicator,
  onDeleteIndicator,
  onEditCondition,
  onDuplicateCondition,
  onDeleteCondition,
}: WorkspaceCanvasProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">Workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <DropZone />
        <div className="space-y-3">
          {indicators.length + conditions.length > 0 && (
            <>
              <Separator />
              <ScrollArea className="h-[360px] pr-3">
                <div className="space-y-2">
                  {indicators.map(indicator => (
                    <div key={indicator.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">Indicator</Badge>
                          <span className="font-medium text-sm">{indicator.id}</span>
                          <Badge variant="secondary" className="text-xs">{indicator.type}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => onDuplicateIndicator(indicator.id)}><Copy className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => onEditIndicator(indicator.id)}><Edit className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDeleteIndicator(indicator.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {Object.entries(indicator.params).map(([k, v]) => (
                          <span key={k} className="mr-3">{k}: {String(v)}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {conditions.map(condition => (
                    <div key={condition.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{condition.type}</Badge>
                          <span className="font-medium text-sm">{condition.id}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => onDuplicateCondition(condition.id)}><Copy className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => onEditCondition(condition.id)}><Edit className="h-3 w-3" /></Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDeleteCondition(condition.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <div>IF ({condition.expression.left} {condition.expression.operator} {"value" in condition.expression.right ? condition.expression.right.value : condition.expression.right.indicator}) → {condition.type === 'entry' ? `BUY (${condition.action.side}, entryName: ${condition.action.entryName})` : `EXIT (exitFrom: ${condition.action.exitFrom})`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

