import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PortfolioHealthCardProps {
  score: number; // 0-100
  trend: 'up' | 'down' | 'neutral';
  change: string;
  period: string;
}

export function PortfolioHealthCard({ score, trend, change, period }: PortfolioHealthCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#10B981]'; // Green
    if (score >= 60) return 'text-[#3B82F6]'; // Blue
    if (score >= 40) return 'text-[#F59E0B]'; // Yellow
    return 'text-[#EF4444]'; // Red
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-[#10B981]/10'; // Green
    if (score >= 60) return 'bg-[#3B82F6]/10'; // Blue
    if (score >= 40) return 'bg-[#F59E0B]/10'; // Yellow
    return 'bg-[#EF4444]/10'; // Red
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-[#10B981]" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-[#EF4444]" />;
      default:
        return <Minus className="h-4 w-4 text-[#9CA3AF]" />;
    }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <Card className="bg-[#1F2937] border-[#374151]">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#F9FAFB] text-lg font-semibold">Portfolio Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Circular Progress */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#374151"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444'}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </div>
                <div className="text-xs text-[#9CA3AF]">Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Label */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </div>
        </div>

        {/* Trend Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getTrendIcon(trend)}
            <span className="text-[#9CA3AF]">vs {period}</span>
          </div>
          <span className={`font-semibold ${trend === 'up' ? 'text-[#10B981]' : trend === 'down' ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
            {change}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#9CA3AF]">
            <span>Risk Level</span>
            <span>{score >= 80 ? 'Low' : score >= 60 ? 'Moderate' : score >= 40 ? 'High' : 'Very High'}</span>
          </div>
          <Progress 
            value={score} 
            className="h-2 bg-[#374151]"
            indicatorClassName={score >= 80 ? 'bg-[#10B981]' : score >= 60 ? 'bg-[#3B82F6]' : score >= 40 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}
          />
        </div>
      </CardContent>
    </Card>
  );
} 