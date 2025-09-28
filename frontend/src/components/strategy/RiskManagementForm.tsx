import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Shield, DollarSign, Percent } from "lucide-react";
import { RiskManagementDef, StopTakeDef } from "@/types/strategy";

interface RiskManagementFormProps {
  riskManagement: RiskManagementDef;
  onChange: (riskManagement: RiskManagementDef) => void;
}

export default function RiskManagementForm({ riskManagement, onChange }: RiskManagementFormProps) {
  const updateStopLoss = (updates: Partial<StopTakeDef>) => {
    onChange({
      ...riskManagement,
      stopLoss: { ...riskManagement.stopLoss, ...updates }
    });
  };

  const updateTakeProfit = (updates: Partial<StopTakeDef>) => {
    onChange({
      ...riskManagement,
      takeProfit: { ...riskManagement.takeProfit, ...updates }
    });
  };

  const updatePositionSize = (positionSize: "fixed" | "percent_of_equity") => {
    onChange({
      ...riskManagement,
      positionSize,
      positionValue: positionSize === "percent_of_equity" ? 10 : 1000 // Default values
    });
  };

  const getStopLossLabel = () => {
    return riskManagement.stopLoss.type === "percentage" ? "Stop Loss (%)" : "Stop Loss ($)";
  };

  const getTakeProfitLabel = () => {
    return riskManagement.takeProfit.type === "percentage" ? "Take Profit (%)" : "Take Profit ($)";
  };

  const getPositionValueLabel = () => {
    return riskManagement.positionSize === "percent_of_equity" 
      ? "Position Size (%)" 
      : "Position Size ($)";
  };

  const getPositionValuePlaceholder = () => {
    return riskManagement.positionSize === "percent_of_equity" 
      ? "e.g., 10" 
      : "e.g., 1000";
  };

  const getPositionValueMax = () => {
    return riskManagement.positionSize === "percent_of_equity" ? 100 : undefined;
  };

  const getPositionValueMin = () => {
    return riskManagement.positionSize === "percent_of_equity" ? 0.1 : 1;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure stop loss, take profit, and position sizing
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stop Loss and Take Profit */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Stop Loss & Take Profit</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Stop Loss */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stop Loss</Label>
              <div className="space-y-2">
                <Select
                  value={riskManagement.stopLoss.type}
                  onValueChange={(value: "percentage" | "fixed") => updateStopLoss({ type: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3" />
                        Percentage
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        Fixed Amount
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Input
                    type="number"
                    value={riskManagement.stopLoss.value}
                    onChange={(e) => updateStopLoss({ value: Number(e.target.value) })}
                    placeholder={riskManagement.stopLoss.type === "percentage" ? "e.g., 5" : "e.g., 100"}
                    className="h-8"
                    min="0"
                    step={riskManagement.stopLoss.type === "percentage" ? "0.1" : "1"}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    {riskManagement.stopLoss.type === "percentage" ? "%" : "$"}
                  </div>
                </div>
              </div>
            </div>

            {/* Take Profit */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Take Profit</Label>
              <div className="space-y-2">
                <Select
                  value={riskManagement.takeProfit.type}
                  onValueChange={(value: "percentage" | "fixed") => updateTakeProfit({ type: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-3 w-3" />
                        Percentage
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3" />
                        Fixed Amount
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Input
                    type="number"
                    value={riskManagement.takeProfit.value}
                    onChange={(e) => updateTakeProfit({ value: Number(e.target.value) })}
                    placeholder={riskManagement.takeProfit.type === "percentage" ? "e.g., 10" : "e.g., 200"}
                    className="h-8"
                    min="0"
                    step={riskManagement.takeProfit.type === "percentage" ? "0.1" : "1"}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    {riskManagement.takeProfit.type === "percentage" ? "%" : "$"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Capital and Position Sizing */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Capital & Position Sizing</h4>
          
          <div className="space-y-4">
            {/* Capital */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Starting Capital</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={riskManagement.capital}
                  onChange={(e) => onChange({ ...riskManagement, capital: Number(e.target.value) })}
                  placeholder="e.g., 10000"
                  className="h-8"
                  min="1"
                  step="1"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </div>
              </div>
            </div>

            {/* Position Sizing */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Position Sizing Method</Label>
              <Select
                value={riskManagement.positionSize}
                onValueChange={updatePositionSize}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      Fixed Amount
                    </div>
                  </SelectItem>
                  <SelectItem value="percent_of_equity">
                    <div className="flex items-center gap-2">
                      <Percent className="h-3 w-3" />
                      Percentage of Equity
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Position Value */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{getPositionValueLabel()}</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={riskManagement.positionValue}
                  onChange={(e) => onChange({ ...riskManagement, positionValue: Number(e.target.value) })}
                  placeholder={getPositionValuePlaceholder()}
                  className="h-8"
                  min={getPositionValueMin()}
                  max={getPositionValueMax()}
                  step={riskManagement.positionSize === "percent_of_equity" ? "0.1" : "1"}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                  {riskManagement.positionSize === "percent_of_equity" ? "%" : "$"}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {riskManagement.positionSize === "percent_of_equity" 
                  ? "Percentage of available capital to risk per trade"
                  : "Fixed dollar amount to risk per trade"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <h4 className="text-sm font-medium">Risk Summary</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <span className="font-medium">Stop Loss:</span> {riskManagement.stopLoss.value}
              {riskManagement.stopLoss.type === "percentage" ? "%" : "$"}
            </div>
            <div>
              <span className="font-medium">Take Profit:</span> {riskManagement.takeProfit.value}
              {riskManagement.takeProfit.type === "percentage" ? "%" : "$"}
            </div>
            <div>
              <span className="font-medium">Capital:</span> ${riskManagement.capital.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Position Size:</span> {riskManagement.positionValue}
              {riskManagement.positionSize === "percent_of_equity" ? "%" : "$"}
              {riskManagement.positionSize === "percent_of_equity" && (
                <span> (${Math.round((riskManagement.capital * riskManagement.positionValue) / 100).toLocaleString()})</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}