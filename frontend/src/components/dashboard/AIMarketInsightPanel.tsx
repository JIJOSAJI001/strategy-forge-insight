import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, TrendingUp, AlertTriangle, Info } from "lucide-react";

interface AIMarketInsightPanelProps {
  insight: string;
  marketCondition: 'bullish' | 'bearish' | 'neutral';
  recommendation: string;
  suggestedStrategies: string[];
}

export function AIMarketInsightPanel({ insight, marketCondition, recommendation, suggestedStrategies }: AIMarketInsightPanelProps) {
  const getMarketIcon = (condition: 'bullish' | 'bearish' | 'neutral') => {
    switch (condition) {
      case 'bullish':
        return <TrendingUp className="h-5 w-5 text-[#10B981]" />;
      case 'bearish':
        return <AlertTriangle className="h-5 w-5 text-[#EF4444]" />;
      default:
        return <Info className="h-5 w-5 text-[#3B82F6]" />;
    }
  };

  const getMarketColor = (condition: 'bullish' | 'bearish' | 'neutral') => {
    switch (condition) {
      case 'bullish':
        return 'text-[#10B981]';
      case 'bearish':
        return 'text-[#EF4444]';
      default:
        return 'text-[#3B82F6]';
    }
  };

  const getMarketBgColor = (condition: 'bullish' | 'bearish' | 'neutral') => {
    switch (condition) {
      case 'bullish':
        return 'bg-[#10B981]/10 border-[#10B981]/20';
      case 'bearish':
        return 'bg-[#EF4444]/10 border-[#EF4444]/20';
      default:
        return 'bg-[#3B82F6]/10 border-[#3B82F6]/20';
    }
  };

  return (
    <Card className={`bg-[#1F2937] border-[#374151] ${getMarketBgColor(marketCondition)}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-[#F9FAFB]">
          <Sparkles className="h-5 w-5 text-[#3B82F6]" />
          AI Market Insight
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Condition */}
        <div className="flex items-center gap-3 p-3 bg-[#374151]/50 rounded-lg">
          {getMarketIcon(marketCondition)}
          <div>
            <div className={`font-semibold capitalize ${getMarketColor(marketCondition)}`}>
              Market is {marketCondition}
            </div>
            <div className="text-sm text-[#9CA3AF]">
              {insight}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-3 bg-[#374151]/30 rounded-lg">
          <div className="text-sm text-[#F9FAFB] font-medium mb-2">Recommendation:</div>
          <div className="text-sm text-[#9CA3AF] leading-relaxed">
            {recommendation}
          </div>
        </div>

        {/* Suggested Strategies */}
        {suggestedStrategies.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-[#F9FAFB] font-medium">Suggested Strategies:</div>
            <div className="flex flex-wrap gap-2">
              {suggestedStrategies.map((strategy, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-[#374151] text-[#9CA3AF] text-xs rounded-md"
                >
                  {strategy}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <Button 
          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium"
          onClick={() => window.location.href = '/strategies'}
        >
          View Suggested Strategies
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
} 