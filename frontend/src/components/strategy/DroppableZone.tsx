import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Parameter } from "@/pages/DragDropStrategyBuilder";
import SortableParameter from "./SortableParameter";

interface DroppableZoneProps {
  id: string;
  parameters: Parameter[];
  onRemoveParameter: (parameterId: string) => void;
}

export default function DroppableZone({ id, parameters, onRemoveParameter }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] transition-all duration-200",
        isOver && "ring-2 ring-primary/50 bg-primary/5",
        parameters.length === 0 && "border-dashed border-2 border-border/50"
      )}
    >
      <CardContent className="p-4">
        {parameters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-muted-foreground">
            <Plus className="h-6 w-6 mb-2 opacity-50" />
            <p className="text-sm">Drop parameters here</p>
          </div>
        ) : (
          <SortableContext items={parameters.map(p => `parameter-${id}-${p.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {parameters.map((parameter, index) => (
                <div key={`parameter-${id}-${parameter.id}`} className="flex items-center gap-2">
                  {index > 0 && (
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      AND
                    </Badge>
                  )}
                  <div className="flex-1">
                    <SortableParameter 
                      parameter={parameter} 
                      id={`parameter-${id}-${parameter.id}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveParameter(parameter.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
} 