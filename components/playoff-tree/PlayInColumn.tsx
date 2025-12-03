import React from 'react';
import { PlayoffSeriesWithGames } from '@/hooks/usePlayoffSeries';
import { MatchupCard } from './MatchupCard';

interface PlayInColumnProps {
  playInSeries: PlayoffSeriesWithGames[];
}

export function PlayInColumn({ playInSeries }: PlayInColumnProps) {
  return (
    <div className="flex flex-col gap-2 w-32">
      <div className="text-center mb-1">
        <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
          Play-In
        </div>
        <div className="h-px bg-gray-300 w-full mt-0.5"></div>
      </div>
      <div className="flex flex-col gap-1.5">
        {playInSeries.length > 0 ? (
          playInSeries.map((series) => (
            <MatchupCard
              key={series.id}
              series={series}
              isHighlighted={false}
            />
          ))
        ) : (
          <div className="text-[10px] text-gray-400 text-center py-2">
            No games entered
          </div>
        )}
      </div>
    </div>
  );
}
