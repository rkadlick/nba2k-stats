import React from 'react';
import { PlayoffSeriesWithGames } from '@/hooks/usePlayoffSeries';
import { MatchupCard } from './MatchupCard';

interface FinalsSectionProps {
  finalsSeries: PlayoffSeriesWithGames[];
}

export function FinalsSection({ finalsSeries }: FinalsSectionProps) {
  if (finalsSeries.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-center mb-1">
        <div className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          NBA Finals
        </div>
        <div className="h-px bg-gray-300 w-full max-w-xs mt-0.5"></div>
      </div>
      {finalsSeries.map((series) => (
        <MatchupCard
          key={series.id}
          series={series}
          isHighlighted={true}
        />
      ))}
    </div>
  );
}
