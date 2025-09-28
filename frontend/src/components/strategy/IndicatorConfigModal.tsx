import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndicatorDef, IndicatorTemplate } from "@/types/strategy";

interface Props {
  open: boolean;
  template: IndicatorTemplate | null;
  existingIds: string[];
  onClose: () => void;
  onConfirm: (indicator: IndicatorDef) => void;
}

export default function IndicatorConfigModal({ open, template, existingIds, onClose, onConfirm }: Props) {
  const [id, setId] = useState("");
  const [params, setParams] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      const base = template.id.toLowerCase();
      let n = 1;
      let candidate = `${base}${n}`;
      while (existingIds.includes(candidate)) {
        n += 1; candidate = `${base}${n}`;
      }
      setId(candidate);
      setParams(template.defaultParams);
      setError(null);
    }
  }, [template, open]);

  const submit = () => {
    if (!template) return;
    if (!id) return setError("ID is required");
    if (existingIds.includes(id)) return setError("ID already exists");
    onConfirm({ id, type: template.id, params });
  };

  const renderParam = (key: string, value: any) => {
    if (key === "source") {
      return (
        <Select value={value} onValueChange={(v) => setParams(p => ({ ...p, [key]: v }))}>
          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
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
    if (typeof value === "number") {
      return (
        <Input type="number" value={value} onChange={(e) => setParams(p => ({ ...p, [key]: Number(e.target.value) }))} className="h-8" />
      );
    }
    return (
      <Input value={value} onChange={(e) => setParams(p => ({ ...p, [key]: e.target.value }))} className="h-8" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Indicator</DialogTitle>
        </DialogHeader>
        {template && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">ID</Label>
              <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g., rsi1" className="h-8" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Parameters</Label>
              {Object.entries(params).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 items-center gap-2">
                  <Label className="text-xs capitalize">{k}</Label>
                  <div className="col-span-2">{renderParam(k, v)}</div>
                </div>
              ))}
            </div>
            {error && <div className="text-xs text-destructive">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={submit}>Add</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

