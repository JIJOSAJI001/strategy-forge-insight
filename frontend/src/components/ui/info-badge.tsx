import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoBadgeProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export const InfoBadge: React.FC<InfoBadgeProps> = ({
  icon,
  label,
  value,
  tooltip,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg border',
        variantStyles[variant],
        className
      )}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {value}
        </p>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export default InfoBadge;
