// StatsViewSwitcher.tsx
import React from 'react';

interface StatsViewSwitcherProps {
  viewMode: string;
  onChange: (mode: "full" | "home-away" | "key-games" | "league-awards") => void;
  show: boolean;
}

export function StatsViewSwitcher({
  viewMode,
  onChange,
  show,
}: StatsViewSwitcherProps) {
  if (!show) return null;

  const options = [
    { label: 'Full', value: 'full' },
    { label: 'Home/Away', value: 'home-away' },
    { label: 'Key Games', value: 'key-games' },
    { label: 'League Awards', value: 'league-awards' },
  ];

  return (
    <div className="mb-3 text-xs">
      <span className="font-bold text-gray-900">View:</span>{' '}
      {options.map((opt, i) => (
        <React.Fragment key={opt.value}>
          <button
            onClick={() => onChange(opt.value as "full" | "home-away" | "key-games" | "league-awards")}
            className={
              viewMode === opt.value
                ? 'text-blue-600 font-semibold underline'
                : 'text-blue-500 hover:text-blue-700 cursor-pointer'
            }
          >
            {opt.label}
          </button>
          {i < options.length - 1 && (
            <span className="text-gray-400 mx-1">•</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}