import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Edit, TrendingUp, TrendingDown, Target, Shield } from "lucide-react";
import { ConditionDef, IndicatorDef, ExpressionDef, ActionDef } from "@/types/strategy";

interface ConditionBuilderProps {
  conditions: ConditionDef[];
  indicators: IndicatorDef[];
  onAddCondition: (condition: ConditionDef) => void;
  onUpdateCondition: (id: string, condition: ConditionDef) => void;
  onRemoveCondition: (id: string) => void;
  onDuplicateCondition: (condition: ConditionDef) => void;
}

const OPERATORS = [
  { value: ">", label: "Greater Than" },
  { value: "<", label: "Less Than" },
  { value: ">=", label: "Greater or Equal" },
  { value: "<=", label: "Less or Equal" },
  { value: "==", label: "Equal" },
  { value: "crosses_above", label: "Crosses Above" },
  { value: "crosses_below", label: "Crosses Below" }
];

const OHLCV_FIELDS = [
  { value: "open", label: "Open" },
  { value: "high", label: "High" },
  { value: "low", label: "Low" },
  { value: "close", label: "Close" },
  { value: "volume", label: "Volume" }
];

const getConditionIcon = (type: string) => {
  switch (type) {
    case 'entry':
      return <TrendingUp className="h-4 w-4" />;
    case 'exit':
      return <TrendingDown className="h-4 w-4" />;
    default:
      return <Target className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'entry':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'exit':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export default function ConditionBuilder({
  conditions,
  indicators,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onDuplicateCondition
}: ConditionBuilderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCondition, setNewCondition] = useState<Partial<ConditionDef>>({
    id: '',
    type: 'entry',
    expression: {
      left: '',
      operator: '>',
      right: { value: 0 }
    },
    action: {}
  });

  const generateUniqueId = (type: string) => {
    const baseId = type === 'entry' ? 'entry' : 'exit';
    let counter = 1;
    let id = `${baseId}${counter}`;
    
    while (conditions.some(cond => cond.id === id)) {
      counter++;
      id = `${baseId}${counter}`;
    }
    
    return id;
  };

  const getAvailableEntryNames = () => {
    return conditions
      .filter(cond => cond.type === 'entry' && cond.action.entryName)
      .map(cond => cond.action.entryName!)
      .filter((name, index, arr) => arr.indexOf(name) === index);
  };

  const handleAddCondition = () => {
    if (!newCondition.type || !newCondition.expression?.left || !newCondition.expression?.operator) return;

    const condition: ConditionDef = {
      id: newCondition.id || generateUniqueId(newCondition.type),
      type: newCondition.type as "entry" | "exit",
      expression: newCondition.expression as ExpressionDef,
      action: newCondition.action as ActionDef
    };

    onAddCondition(condition);
    setNewCondition({
      id: '',
      type: 'entry',
      expression: { left: '', operator: '>', right: { value: 0 } },
      action: {}
    });
    setIsAdding(false);
  };

  const handleUpdateCondition = (id: string) => {
    const condition = conditions.find(cond => cond.id === id);
    if (!condition) return;

    onUpdateCondition(id, {
      ...condition,
      ...newCondition,
      id: condition.id // Don't allow changing the ID
    });

    setEditingId(null);
    setNewCondition({
      id: '',
      type: 'entry',
      expression: { left: '', operator: '>', right: { value: 0 } },
      action: {}
    });
  };

  const startEdit = (condition: ConditionDef) => {
    setEditingId(condition.id);
    setNewCondition(condition);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewCondition({
      id: '',
      type: 'entry',
      expression: { left: '', operator: '>', right: { value: 0 } },
      action: {}
    });
  };

  const getLeftOptions = () => {
    const indicatorOptions = indicators.map(ind => ({
      value: ind.id,
      label: `${ind.id} (${ind.type})`
    }));
    
    return [...indicatorOptions, ...OHLCV_FIELDS];
  };

  const getRightOptions = () => {
    const indicatorOptions = indicators.map(ind => ({
      value: ind.id,
      label: `${ind.id} (${ind.type})`
    }));
    
    return indicatorOptions;
  };

  const isRightValue = () => {
    return newCondition.expression?.right && 'value' in newCondition.expression.right;
  };

  const isRightIndicator = () => {
    return newCondition.expression?.right && 'indicator' in newCondition.expression.right;
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Condition Builder
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Define entry and exit conditions
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <Select
                  value={newCondition.type}
                  onValueChange={(value) => {
                    setNewCondition({
                      ...newCondition,
                      type: value as "entry" | "exit",
                      action: value === 'entry' ? { side: 'long', entryName: '' } : { exitFrom: '' }
                    });
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry</SelectItem>
                    <SelectItem value="exit">Exit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">ID</Label>
                <Input
                  value={newCondition.id || ''}
                  onChange={(e) => setNewCondition({ ...newCondition, id: e.target.value })}
                  placeholder="e.g., entry1, exit1"
                  className="h-8"
                />
              </div>
            </div>

            {/* Expression */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Expression</Label>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Left</Label>
                  <Select
                    value={newCondition.expression?.left || ''}
                    onValueChange={(value) => {
                      setNewCondition({
                        ...newCondition,
                        expression: {
                          ...newCondition.expression!,
                          left: value
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getLeftOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={newCondition.expression?.operator || ''}
                    onValueChange={(value) => {
                      setNewCondition({
                        ...newCondition,
                        expression: {
                          ...newCondition.expression!,
                          operator: value
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Right</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={isRightValue() ? "default" : "outline"}
                      onClick={() => {
                        setNewCondition({
                          ...newCondition,
                          expression: {
                            ...newCondition.expression!,
                            right: { value: 0 }
                          }
                        });
                      }}
                      className="h-8 px-2"
                    >
                      Value
                    </Button>
                    <Button
                      size="sm"
                      variant={isRightIndicator() ? "default" : "outline"}
                      onClick={() => {
                        setNewCondition({
                          ...newCondition,
                          expression: {
                            ...newCondition.expression!,
                            right: { indicator: '' }
                          }
                        });
                      }}
                      className="h-8 px-2"
                    >
                      Indicator
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Value Input */}
              {isRightValue() && (
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    type="number"
                    value={newCondition.expression?.right?.value || 0}
                    onChange={(e) => {
                      setNewCondition({
                        ...newCondition,
                        expression: {
                          ...newCondition.expression!,
                          right: { value: Number(e.target.value) }
                        }
                      });
                    }}
                    className="h-8"
                  />
                </div>
              )}

              {/* Right Indicator Input */}
              {isRightIndicator() && (
                <div>
                  <Label className="text-xs">Indicator</Label>
                  <Select
                    value={newCondition.expression?.right?.indicator || ''}
                    onValueChange={(value) => {
                      setNewCondition({
                        ...newCondition,
                        expression: {
                          ...newCondition.expression!,
                          right: { indicator: value }
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select indicator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getRightOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Action</Label>
              
              {newCondition.type === 'entry' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Side</Label>
                    <Select
                      value={newCondition.action?.side || ''}
                      onValueChange={(value) => {
                        setNewCondition({
                          ...newCondition,
                          action: {
                            ...newCondition.action!,
                            side: value as "long" | "short"
                          }
                        });
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select side..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Entry Name</Label>
                    <Input
                      value={newCondition.action?.entryName || ''}
                      onChange={(e) => {
                        setNewCondition({
                          ...newCondition,
                          action: {
                            ...newCondition.action!,
                            entryName: e.target.value
                          }
                        });
                      }}
                      placeholder="e.g., LongEntry"
                      className="h-8"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs">Exit From</Label>
                  <Select
                    value={newCondition.action?.exitFrom || ''}
                    onValueChange={(value) => {
                      setNewCondition({
                        ...newCondition,
                        action: {
                          ...newCondition.action!,
                          exitFrom: value
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select entry to exit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableEntryNames().map(name => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={isAdding ? handleAddCondition : () => handleUpdateCondition(editingId!)}
                disabled={!newCondition.type || !newCondition.expression?.left || !newCondition.expression?.operator}
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

        {/* Conditions List */}
        <div className="space-y-2">
          {conditions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conditions added yet</p>
            </div>
          ) : (
            conditions.map((condition) => (
              <div key={condition.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getConditionIcon(condition.type)}
                    <span className="font-medium text-sm">{condition.id}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTypeColor(condition.type)}`}
                    >
                      {condition.type}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDuplicateCondition(condition)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(condition)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveCondition(condition.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{condition.expression.left}</span>
                    <span>{condition.expression.operator}</span>
                    <span>
                      {condition.expression.right.value !== undefined 
                        ? condition.expression.right.value 
                        : condition.expression.right.indicator
                      }
                    </span>
                  </div>
                  <div className="mt-1">
                    {condition.type === 'entry' ? (
                      <span>
                        {condition.action.side} - {condition.action.entryName}
                      </span>
                    ) : (
                      <span>Exit from: {condition.action.exitFrom}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}