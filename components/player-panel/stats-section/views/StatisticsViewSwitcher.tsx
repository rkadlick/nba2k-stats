// StatsViewSwitcher.tsx
import { PlayerStatsViewMode } from '@/lib/types';
import React from 'react';

interface StatsViewSwitcherProps {
  viewMode: PlayerStatsViewMode;
  onChange: (
    mode: PlayerStatsViewMode
  ) => void;
  allowedViews: readonly PlayerStatsViewMode[]
}

export function StatsViewSwitcher({
  viewMode,
  onChange,
  allowedViews,
}: StatsViewSwitcherProps) {

  const allOptions = [
    { label: 'Full', value: 'full' },
    { label: 'Season', value: 'season' },
    { label: 'Playoffs', value: 'playoffs' },
    { label: 'Key Games', value: 'key-games' },
    { label: 'Home/Away', value: 'home-away' },
    { label: 'Win/Loss', value: 'win-loss' },
    { label: 'NBA Cup', value: 'nba-cup' },
    { label: 'Overtime', value: 'overtime' },
    { label: 'Simulated', value: 'simulated' },
    { label: 'Roster', value: 'roster' },
    { label: 'League Awards', value: 'league-awards' },
  ];

  const visibleOptions = allOptions.filter((opt) =>
    allowedViews.includes(opt.value as PlayerStatsViewMode)
  );

  return (
    <div className="mb-3 text-xs">
      <span className="font-bold text-[color:var(--color-text)]">View:</span>{' '}
      {visibleOptions.map((opt, i) => (
        <React.Fragment key={opt.value}>
          <button
            onClick={() => onChange(opt.value as PlayerStatsViewMode)}
            className={
              viewMode === opt.value
                ? 'text-blue-600 font-semibold underline'
                : 'text-blue-500 hover:text-blue-700 cursor-pointer'
            }
          >
            {opt.label}
          </button>
          {i < visibleOptions.length - 1 && (
            <span className="text-[color:var(--color-text-muted)] mx-1">•</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}