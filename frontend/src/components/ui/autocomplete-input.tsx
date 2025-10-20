import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface AutocompleteSuggestion {
  value: string;
  label: string;
  icon?: string;
  category?: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: AutocompleteSuggestion[];
  placeholder?: string;
  className?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = suggestions.filter(
      (s) =>
        s.value.toLowerCase().includes(value.toLowerCase()) ||
        s.label.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(filtered);
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.value);
    setIsOpen(false);
  };

  // Group suggestions by category
  const groupedSuggestions = filteredSuggestions.reduce((acc, suggestion) => {
    const category = suggestion.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(suggestion);
    return acc;
  }, {} as Record<string, AutocompleteSuggestion[]>);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full"
      />

      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-auto">
          {Object.entries(groupedSuggestions).map(([category, items]) => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 sticky top-0">
                {category}
              </div>
              {items.map((suggestion) => (
                <button
                  key={suggestion.value}
                  onClick={() => handleSelect(suggestion)}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors',
                    value === suggestion.value && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  {suggestion.icon && (
                    <span className="text-lg">{suggestion.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{suggestion.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.value}
                    </div>
                  </div>
                  {value === suggestion.value && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
