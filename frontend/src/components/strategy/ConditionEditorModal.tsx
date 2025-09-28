import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConditionDef, ExpressionDef, ActionDef, IndicatorDef } from "@/types/strategy";

const OPERATORS = [">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"] as const;
const OHLCV = ["open", "high", "low", "close", "volume"] as const;

interface Props {
  open: boolean;
  presetOperator?: string;
  indicators: IndicatorDef[];
  existingIds: string[];
  entriesForExit: string[];
  onClose: () => void;
  onConfirm: (condition: ConditionDef) => void;
}

export default function ConditionEditorModal({ open, presetOperator, indicators, existingIds, entriesForExit, onClose, onConfirm }: Props) {
  const [id, setId] = useState("");
  const [type, setType] = useState<"entry" | "exit">("entry");
  const [expression, setExpression] = useState<ExpressionDef>({ left: "", operator: presetOperator || ">", right: { value: 0 } });
  const [action, setAction] = useState<ActionDef>({ side: "long", entryName: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setId("");
      setType("entry");
      setExpression({ left: "", operator: presetOperator || ">", right: { value: 0 } });
      setAction({ side: "long", entryName: "" });
      setError(null);
    }
  }, [open, presetOperator]);

  const submit = () => {
    if (!id) return setError("ID is required");
    if (existingIds.includes(id)) return setError("ID already exists");
    if (!expression.left) return setError("Left side is required");
    if (!expression.operator) return setError("Operator is required");
    if (type === "entry" && (!action.entryName || !action.side)) return setError("Entry action incomplete");
    if (type === "exit" && !action.exitFrom) return setError("Exit target required");
    onConfirm({ id, type, expression, action });
  };

  const leftOptions = [
    ...indicators.map(i => ({ value: i.id, label: `${i.id} (${i.type})` })),
    ...OHLCV.map(v => ({ value: v, label: v }))
  ];
  const rightIndicatorOptions = indicators.map(i => ({ value: i.id, label: `${i.id} (${i.type})` }));

  const isRightValue = (expr: ExpressionDef) => Object.prototype.hasOwnProperty.call(expr.right, "value");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Define Condition</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v: any) => { setType(v); setAction(v === 'entry' ? { side: 'long', entryName: '' } : { exitFrom: '' }); }}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="exit">Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">ID</Label>
              <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., entry1" className="h-8" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Left</Label>
              <Select value={expression.left} onValueChange={(v) => setExpression(e => ({ ...e, left: v }))}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {leftOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Operator</Label>
              <Select value={expression.operator} onValueChange={(v) => setExpression(e => ({ ...e, operator: v }))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPERATORS.map(op => (<SelectItem key={op} value={op}>{op}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Right</Label>
              <div className="flex gap-1">
                <Button size="sm" variant={isRightValue(expression) ? "default" : "outline"} className="h-8 px-2" onClick={() => setExpression(e => ({ ...e, right: { value: 0 } }))}>Value</Button>
                <Button size="sm" variant={!isRightValue(expression) ? "default" : "outline"} className="h-8 px-2" onClick={() => setExpression(e => ({ ...e, right: { indicator: "" } }))}>Indicator</Button>
              </div>
            </div>
          </div>

          {isRightValue(expression) ? (
            <div>
              <Label className="text-xs">Value</Label>
              <Input type="number" value={(expression.right as any).value ?? 0} onChange={(e) => setExpression(ex => ({ ...ex, right: { value: Number(e.target.value) } }))} className="h-8" />
            </div>
          ) : (
            <div>
              <Label className="text-xs">Indicator</Label>
              <Select value={(expression.right as any).indicator ?? ""} onValueChange={(v) => setExpression(ex => ({ ...ex, right: { indicator: v } }))}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select indicator..." /></SelectTrigger>
                <SelectContent>
                  {rightIndicatorOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'entry' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Side</Label>
                <Select value={action.side} onValueChange={(v: any) => setAction(a => ({ ...a, side: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Entry Name</Label>
                <Input value={action.entryName || ""} onChange={(e) => setAction(a => ({ ...a, entryName: e.target.value }))} placeholder="e.g., buy1" className="h-8" />
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs">Exit From</Label>
              <Select value={action.exitFrom} onValueChange={(v: any) => setAction(a => ({ ...a, exitFrom: v }))}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select entry..." /></SelectTrigger>
                <SelectContent>
                  {entriesForExit.map(n => (<SelectItem key={n} value={n}>{n}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <div className="text-xs text-destructive">{error}</div>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={submit}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

