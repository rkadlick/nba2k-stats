import React from 'react';
import { PlayoffSeriesWithGames } from '@/hooks/usePlayoffSeries';
import { RoundColumn } from './RoundColumn';
import { PlayInColumn } from './PlayInColumn';

interface ConferenceSectionProps {
  conference: 'East' | 'West';
  roundSeries: Record<number, PlayoffSeriesWithGames[]>;
  playInSeries: PlayoffSeriesWithGames[];
}

export function ConferenceSection({
  conference,
  roundSeries,
  playInSeries
}: ConferenceSectionProps) {
  const isEast = conference === 'East';
  const conferenceColors = {
    East: 'text-blue-600',
    West: 'text-red-600'
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="text-center mb-3">
        <div className={`text-sm font-bold ${conferenceColors[conference as keyof typeof conferenceColors]} mb-0.5`}>
          {conference}ern Conference
        </div>
        <div className="h-px bg-gray-300 w-20 mx-auto"></div>
      </div>

      {/* Bracket Rounds - Full Width */}
      <div className={`flex flex-row gap-4 flex-1 ${isEast ? 'justify-end' : 'justify-start'}`}>
        {isEast ? (
          <>
            {/* Eastern Conference - MIRRORED: Conference Finals → Semifinals → Round 1 → Play-In */}
            {[3, 2, 1].map(roundNum => {
              const series = roundSeries[roundNum] || [];
              const roundName = series[0]?.round_name || '';
              return (
                <div key={`${conference.toLowerCase()}-${roundNum}`}>
                  <RoundColumn
                    roundSeries={series}
                    roundName={roundName}
                    roundNumber={roundNum}
                    conference={conference}
                    showEmpty={roundNum === 1}
                  />
                </div>
              );
            })}
            {/* Play-In (furthest right - outside) */}
            <PlayInColumn playInSeries={playInSeries} />
          </>
        ) : (
          <>
            {/* Western Conference: Play-In → Round 1 → Semifinals → Conference Finals */}
            <PlayInColumn playInSeries={playInSeries} />
            {[1, 2, 3].map(roundNum => {
              const series = roundSeries[roundNum] || [];
              const roundName = series[0]?.round_name || '';
              return (
                <div key={`${conference.toLowerCase()}-${roundNum}`}>
                  <RoundColumn
                    roundSeries={series}
                    roundName={roundName}
                    roundNumber={roundNum}
                    conference={conference}
                    showEmpty={roundNum === 1}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
