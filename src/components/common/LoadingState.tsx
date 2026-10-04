import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  rows = 3,
}) => {
  return (
    <div className="space-y-3 py-6 px-4" role="status" aria-live="polite">
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-semibold mb-4">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        <span>{message}</span>
      </div>

      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-16 w-full bg-slate-100/80 rounded-xl animate-pulse"
        />
      ))}
    </div>
  );
};
