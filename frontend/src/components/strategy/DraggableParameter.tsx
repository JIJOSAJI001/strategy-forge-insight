import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Parameter } from "@/pages/DragDropStrategyBuilder";

interface DraggableParameterProps {
  parameter: Parameter;
  isOverlay?: boolean;
}

export default function DraggableParameter({ parameter, isOverlay = false }: DraggableParameterProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: parameter.id,
    data: parameter,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'indicator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'condition':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'action':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Momentum':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Trend':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'Volatility':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Comparison':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Crossover':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'Entry':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'Exit':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'Risk':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md",
        isOverlay && "shadow-lg scale-105 rotate-2",
        "border-2 border-dashed border-border hover:border-primary/50"
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary">
              {parameter.icon}
            </div>
            <span className="font-medium text-sm">{parameter.name}</span>
          </div>
          <Badge 
            variant="secondary" 
            className={cn("text-xs", getTypeColor(parameter.type))}
          >
            {parameter.type}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <Badge 
            variant="outline" 
            className={cn("text-xs", getCategoryColor(parameter.category))}
          >
            {parameter.category}
          </Badge>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {parameter.description}
          </p>
        </div>

        {Object.keys(parameter.config).length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Config: {Object.entries(parameter.config).map(([key, value]) => `${key}: ${value}`).join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 