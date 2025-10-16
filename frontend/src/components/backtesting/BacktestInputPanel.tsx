import React, { useMemo } from 'react';
import { Play, Loader, TrendingUp, Clock, Database, Layers, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InfoBadge } from '@/components/ui/info-badge';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';

interface Strategy {
  _id: string;
  name: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
}

interface BacktestInputPanelProps {
  selectedStrategy: string | null;
  setSelectedStrategy: (id: string | null) => void;
  symbol: string;
  setSymbol: (symbol: string) => void;
  timeframe: string;
  setTimeframe: (timeframe: string) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  strategies: Strategy[];
  strategiesLoading: boolean;
  isFormValid: boolean;
  isRunning: boolean;
  onRunBacktest: () => void;
}

const BacktestInputPanel: React.FC<BacktestInputPanelProps> = ({
  selectedStrategy,
  setSelectedStrategy,
  symbol,
  setSymbol,
  timeframe,
  setTimeframe,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  strategies,
  strategiesLoading,
  isFormValid,
  isRunning,
  onRunBacktest,
}) => {
  // Symbol suggestions
  const symbolSuggestions = [
    { value: 'NIFTY', label: 'NIFTY 50', icon: '🇮🇳', category: 'Index' },
    { value: 'BANKNIFTY', label: 'BANK NIFTY', icon: '🏦', category: 'Index' },
    { value: 'SENSEX', label: 'SENSEX', icon: '📈', category: 'Index' },
    { value: 'RELIANCE.NS', label: 'Reliance Industries', icon: '🏢', category: 'Stock' },
    { value: 'INFY.NS', label: 'Infosys', icon: '💻', category: 'Stock' },
    { value: 'TCS.NS', label: 'Tata Consultancy', icon: '🏢', category: 'Stock' },
    { value: 'HDFCBANK.NS', label: 'HDFC Bank', icon: '🏦', category: 'Stock' },
    { value: 'ICICIBANK.NS', label: 'ICICI Bank', icon: '🏦', category: 'Stock' },
    { value: 'SBIN.NS', label: 'State Bank of India', icon: '🏦', category: 'Stock' },
    { value: 'WIPRO.NS', label: 'Wipro', icon: '💻', category: 'Stock' },
  ];

  // Timeframe options
  const timeframes = [
    { value: '1d', label: '1 Day', recommended: true },
    { value: '1h', label: '1 Hour' },
    { value: '30m', label: '30 Minutes' },
    { value: '15m', label: '15 Minutes' },
  ];

  // Group strategies by ownership
  const { ownedStrategies, publicStrategies } = useMemo(() => {
    const owned = strategies.filter((s) => !s.isPublic);
    const publicStrats = strategies.filter((s) => s.isPublic);
    return { ownedStrategies: owned, publicStrategies: publicStrats };
  }, [strategies]);

  // Strategy options for dropdown
  const strategyOptions = useMemo(() => {
    const options: any[] = [];
    
    if (ownedStrategies.length > 0) {
      options.push({
        label: `My Strategies (${ownedStrategies.length})`,
        options: ownedStrategies.map((s) => ({
          value: s._id,
          label: `📈 ${s.name}`,
          isPublic: false,
        })),
      });
    }
    
    if (publicStrategies.length > 0) {
      options.push({
        label: `Public Strategies (${publicStrategies.length})`,
        options: publicStrategies.map((s) => ({
          value: s._id,
          label: `⭐ ${s.name}`,
          isPublic: true,
        })),
      });
    }
    
    return options;
  }, [ownedStrategies, publicStrategies]);

  // Date presets
  const datePresets = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 3 Months', days: 90 },
    { label: 'Last 6 Months', days: 180 },
    { label: 'Last 1 Year', days: 365 },
    { label: 'Year to Date', ytd: true },
  ];

  const handlePresetClick = (preset: any) => {
    const end = new Date();
    let start = new Date();
    
    if (preset.ytd) {
      start = new Date(end.getFullYear(), 0, 1);
    } else {
      start.setDate(end.getDate() - preset.days);
    }
    
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Configure Backtest
      </h2>

      {/* Strategy Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Layers className="inline w-4 h-4 mr-1" />
          Select Strategy *
        </label>
        <Select value={selectedStrategy || ''} onValueChange={setSelectedStrategy}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a strategy..." />
          </SelectTrigger>
          <SelectContent>
            {strategiesLoading ? (
              <SelectItem value="loading" disabled>
                <Loader className="w-4 h-4 animate-spin inline mr-2" />
                Loading strategies...
              </SelectItem>
            ) : (
              <>
                {ownedStrategies.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>My Strategies ({ownedStrategies.length})</SelectLabel>
                    {ownedStrategies.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        📈 {s.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {publicStrategies.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Public Strategies ({publicStrategies.length})</SelectLabel>
                    {publicStrategies.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        ⭐ {s.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </>
            )}
          </SelectContent>
        </Select>
        {selectedStrategy && (
          <p className="mt-2 text-xs text-gray-500">
            Strategy selected. Ready to backtest.
          </p>
        )}
      </div>

      {/* Symbol Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <TrendingUp className="inline w-4 h-4 mr-1" />
          Symbol *
        </label>
        <AutocompleteInput
          value={symbol}
          onChange={setSymbol}
          suggestions={symbolSuggestions}
          placeholder="e.g., NIFTY, RELIANCE.NS"
          className="w-full"
        />
        <p className="mt-2 text-xs text-gray-500">
          Enter stock symbol or index name
        </p>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Clock className="inline w-4 h-4 mr-1" />
          Timeframe *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`
                px-4 py-2 rounded-lg border-2 transition-all
                ${
                  timeframe === tf.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }
                ${tf.recommended ? 'relative' : ''}
              `}
            >
              {tf.label}
              {tf.recommended && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  ⭐
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Calendar className="inline w-4 h-4 mr-1" />
          Backtest Period *
        </label>
        
        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {datePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset)}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
            <Input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</label>
            <Input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>
        </div>
        
        {startDate && endDate && (
          <p className="mt-2 text-xs text-gray-500">
            Duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
        )}
      </div>

      {/* Data Source Info */}
      <div className="mb-6">
        <InfoBadge
          icon={<Database className="w-4 h-4" />}
          label="Data Source"
          value="Yahoo Finance (Live Fetch)"
          tooltip="Data is fetched from Yahoo Finance and cached for faster future requests"
          variant="info"
        />
      </div>

      {/* Validation Messages */}
      {!isFormValid && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Please fill in all required fields to run backtest
          </p>
        </div>
      )}

      {/* Run Button */}
      <Button
        onClick={onRunBacktest}
        disabled={!isFormValid || isRunning}
        size="lg"
        className="w-full"
        variant="default"
      >
        {isRunning ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Running Backtest...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            Run Backtest
          </>
        )}
      </Button>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Start with 1d timeframe for faster results. Intraday data may take longer to fetch.
        </p>
      </div>
    </div>
  );
};

export default BacktestInputPanel;
