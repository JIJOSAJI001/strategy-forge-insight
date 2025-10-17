import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BacktestInputPanel from '@/components/backtesting/BacktestInputPanel';
import BacktestResultsPanel from '@/components/backtesting/BacktestResultsPanel';
import { useBacktest } from '@/hooks/useBacktest';
import { useStrategies } from '@/hooks/useStrategies';
import { useToast } from '@/components/ui/use-toast';

export default function Backtesting() {
  // State management
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Custom hooks
  const { strategies, isLoading: strategiesLoading } = useStrategies();
  const { 
    runBacktest, 
    result, 
    isLoading: backtestLoading, 
    error 
  } = useBacktest();
  const { toast } = useToast();

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      selectedStrategy &&
      symbol.trim() !== '' &&
      timeframe &&
      startDate &&
      endDate &&
      startDate < endDate
    );
  }, [selectedStrategy, symbol, timeframe, startDate, endDate]);

  // Handle backtest execution
  const handleRunBacktest = async () => {
    if (!isFormValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const params = {
      strategy_id: selectedStrategy!,
      symbol: symbol.toUpperCase().trim(),
      timeframe,
      start_date: startDate!.toISOString().split('T')[0],
      end_date: endDate!.toISOString().split('T')[0],
    };

    try {
      await runBacktest(params);
      toast({
        title: 'Success',
        description: 'Backtest completed successfully!',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Backtest failed. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle export actions
  const handleExportCSV = () => {
    if (!result) return;
    // Implementation in utility function
    toast({
      title: 'Success',
      description: 'Exported as CSV',
    });
  };

  const handleExportJSON = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backtest-${result.backtest_id}-${Date.now()}.json`;
    link.click();
    toast({
      title: 'Success',
      description: 'Exported as JSON',
    });
  };

  const handleExportPDF = () => {
    if (!result) return;
    // Implementation with jsPDF
    toast({
      title: 'Success',
      description: 'Exported as PDF',
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F9FAFB]">Strategy Backtester</h1>
          <p className="text-[#9CA3AF]">Run your saved or public strategies on real historical market data</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-[#374151] text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel - Left Side (30%) */}
          <div className="lg:col-span-4">
            <BacktestInputPanel
              selectedStrategy={selectedStrategy}
              setSelectedStrategy={setSelectedStrategy}
              symbol={symbol}
              setSymbol={setSymbol}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              strategies={strategies}
              strategiesLoading={strategiesLoading}
              isFormValid={isFormValid}
              isRunning={backtestLoading}
              onRunBacktest={handleRunBacktest}
            />
          </div>

          {/* Results Panel - Right Side (70%) */}
          <div className="lg:col-span-8">
            <BacktestResultsPanel
              result={result}
              isLoading={backtestLoading}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50">
            {/* History sidebar implementation */}
          </div>
        )}
      </div>
    );
  }
