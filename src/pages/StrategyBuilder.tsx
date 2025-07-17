import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Play } from "lucide-react";

export default function StrategyBuilder() {
  const [conditions, setConditions] = useState([
    { id: 1, indicator: "RSI", operator: "<", value: "30" }
  ]);

  const addCondition = () => {
    setConditions([...conditions, { 
      id: Date.now(), 
      indicator: "", 
      operator: "", 
      value: "" 
    }]);
  };

  const removeCondition = (id: number) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Strategy Builder</h1>
          <p className="text-muted-foreground">Create and configure your trading strategies</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="trading" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Backtest Strategy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strategy-name">Strategy Name</Label>
                  <Input id="strategy-name" placeholder="My RSI Strategy" />
                </div>
                <div>
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your trading strategy..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Entry Conditions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Entry Conditions</CardTitle>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  {index > 0 && (
                    <Badge variant="outline" className="text-xs">AND</Badge>
                  )}
                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Indicator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rsi">RSI</SelectItem>
                      <SelectItem value="sma">SMA</SelectItem>
                      <SelectItem value="ema">EMA</SelectItem>
                      <SelectItem value="macd">MACD</SelectItem>
                      <SelectItem value="bb">Bollinger Bands</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Op" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">">&gt;</SelectItem>
                      <SelectItem value="<">&lt;</SelectItem>
                      <SelectItem value=">=">&gt;=</SelectItem>
                      <SelectItem value="<=">&lt;=</SelectItem>
                      <SelectItem value="=">=</SelectItem>
                      <SelectItem value="crosses_above">Crosses Above</SelectItem>
                      <SelectItem value="crosses_below">Crosses Below</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Value" className="w-24" />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeCondition(condition.id)}
                    className="text-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Exit Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stop-loss">Stop Loss (%)</Label>
                  <Input id="stop-loss" placeholder="5" type="number" />
                </div>
                <div>
                  <Label htmlFor="take-profit">Take Profit (%)</Label>
                  <Input id="take-profit" placeholder="10" type="number" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Settings */}
        <div className="space-y-6">
          {/* Strategy Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm">Entry Logic</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Buy when RSI &lt; 30
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm">Exit Logic</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stop Loss: 5%<br />
                    Take Profit: 10%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="position-size">Position Size (%)</Label>
                <Input id="position-size" placeholder="10" type="number" />
              </div>
              <div>
                <Label htmlFor="max-positions">Max Positions</Label>
                <Input id="max-positions" placeholder="5" type="number" />
              </div>
              <div>
                <Label htmlFor="risk-per-trade">Risk per Trade (%)</Label>
                <Input id="risk-per-trade" placeholder="2" type="number" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}