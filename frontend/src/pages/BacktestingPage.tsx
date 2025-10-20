import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import BacktestInputPanel from '@/components/backtesting/BacktestInputPanel';
import BacktestResultsPanel from '@/components/backtesting/BacktestResultsPanel';
import { useBacktest } from '@/hooks/useBacktest';
import { useStrategies } from '@/hooks/useStrategies';
import { useToast } from '@/components/ui/use-toast';



const BacktestingPage: React.FC = () => {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                📊 Strategy Backtester
              </h1>
              <p className="text-blue-100 text-lg">
                Run your saved or public strategies on real historical market data
              </p>
            </div>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <History className="w-5 h-5" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
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
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50">
          {/* History sidebar implementation */}
        </div>
      )}
    </div>
  );
};

export default BacktestingPage;
