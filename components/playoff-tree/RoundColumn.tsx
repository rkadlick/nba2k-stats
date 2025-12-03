import React, { useState } from 'react';
import { PlayoffSeriesWithGames } from '@/hooks/usePlayoffSeries';
import { MatchupCard } from './MatchupCard';

interface RoundColumnProps {
  roundSeries: PlayoffSeriesWithGames[];
  roundName: string;
  roundNumber: number;
  conference: 'East' | 'West';
  showEmpty?: boolean;
  onSeriesSelect: (seriesId: string) => void;
  selectedSeriesId: string | null;
}

const roundLabels: Record<number, string> = {
  1: 'Round 1',
  2: 'Semifinals',
  3: 'Conf. Finals',
};

const columnWidths: Record<number, string> = {
  1: 'w-32', // Round 1
  2: 'w-32', // Semifinals
  3: 'w-32', // Conference Finals
};



export function RoundColumn({
  roundSeries,
  roundName,
  roundNumber,
  conference,
  showEmpty = false,
  onSeriesSelect,
  selectedSeriesId
}: RoundColumnProps) {

  return (
    <div className={`flex flex-col gap-2 ${columnWidths[roundNumber] || 'w-32'}`}>
      <div className="text-center mb-1">
        <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
          {roundLabels[roundNumber] || roundName}
        </div>
        <div className="h-px bg-gray-300 w-full mt-0.5"></div>
      </div>
      <div className="flex flex-col gap-1.5">
        {roundSeries.length > 0 ? (
          roundSeries.map((series) => (
            <MatchupCard
              key={series.id}
              series={series}
              isSelected={selectedSeriesId === series.id}
              onClick={() => onSeriesSelect(series.id)}
            />
          ))
        ) : showEmpty ? (
          <div className="text-[10px] text-gray-400 text-center py-2">
            No games entered
          </div>
        ) : null}
      </div>
    </div>
  );
}
