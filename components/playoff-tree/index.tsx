'use client';

import { Season, PlayerGameStatsWithDetails, Team } from '@/lib/types';
import { usePlayoffSeries } from '@/hooks/filter/usePlayoffSeries';
import { PlayInColumn } from './PlayInColumn';
import { RoundColumn } from './RoundColumn';
import { FinalsSection } from './FinalsSection';
import { useState } from 'react';

interface PlayoffTreeProps {
  season: Season;
  playerId: string; // Required to filter playoff series by player
  playerStats?: PlayerGameStatsWithDetails[];
  playerTeamName?: string;
  playerName?: string;
  teams?: Team[];
}

export default function PlayoffTree({
  season,
  playerId,
  playerStats = [],
  playerTeamName,
  playerName,
}: PlayoffTreeProps) {
	const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const { organizedBracket, loading } = usePlayoffSeries(
    season,
    playerId,
    playerStats,
    playerTeamName,
  );

  const handleSeriesSelect = (seriesId: string) => {
    setSelectedSeriesId(selectedSeriesId === seriesId ? null : seriesId);
  };

  if (loading) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
        <div className="text-gray-500 text-sm">Loading playoff bracket...</div>
      </div>
    );
  }

  if (Object.keys(organizedBracket.west).length === 0 &&
      Object.keys(organizedBracket.east).length === 0 &&
      organizedBracket.finals.length === 0) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-700 font-medium mb-1 text-sm">No playoff data available</div>
        <div className="text-gray-500 text-xs">Season: {season.year_start}–{season.year_end}</div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header - Compact */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-0.5">
          Playoff Bracket
        </h3>
        {playerName && (
          <div className="text-sm font-semibold text-gray-700 mb-0.5">
            {playerName}
          </div>
        )}
        <div className="text-xs text-gray-600">
          {season.year_start}–{season.year_end} Season
        </div>
      </div>

      {/* Responsive Tournament Bracket Layout */}
      <div className="w-full min-h-[400px] px-2">
        {/* Mobile: Vertical Stack (default) */}
        <div className="sm:hidden flex flex-col gap-6 items-center">
          {/* Western Conference */}
          <div className="w-full">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-red-600">WESTERN CONFERENCE</div>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4 justify-start min-w-max">
                <PlayInColumn playInSeries={organizedBracket.westPlayIn} onSeriesSelect={handleSeriesSelect} selectedSeriesId={selectedSeriesId} />
                {[1, 2, 3].map(roundNum => {
                  const series = organizedBracket.west[roundNum] || [];
                  const roundName = series[0]?.round_name || '';
                  return (
                    <RoundColumn
                      key={`west-${roundNum}`}
                      roundSeries={series}
                      roundName={roundName}
                      roundNumber={roundNum}
                      conference="West"
                      showEmpty={roundNum === 1}
                      onSeriesSelect={handleSeriesSelect}
					  selectedSeriesId={selectedSeriesId}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* NBA Finals - Championship Round */}
          <div className="flex justify-center">
            <FinalsSection finalsSeries={organizedBracket.finals} />
          </div>

          {/* Eastern Conference */}
          <div className="w-full">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-blue-600">EASTERN CONFERENCE</div>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4 justify-start min-w-max">
                <PlayInColumn playInSeries={organizedBracket.eastPlayIn} onSeriesSelect={handleSeriesSelect} selectedSeriesId={selectedSeriesId} />
                {[1, 2, 3].map(roundNum => {
                  const series = organizedBracket.east[roundNum] || [];
                  const roundName = series[0]?.round_name || '';
                  return (
                    <RoundColumn
                      key={`east-${roundNum}`}
                      roundSeries={series}
                      roundName={roundName}
                      roundNumber={roundNum}
                      conference="East"
                      showEmpty={roundNum === 1}
                      onSeriesSelect={handleSeriesSelect}
                      selectedSeriesId={selectedSeriesId}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Medium: Horizontal Scrollable Bracket */}
        <div className="hidden sm:flex lg:hidden w-full overflow-x-auto">
          <div className="flex gap-4 items-start justify-start px-4" style={{ minWidth: 'max-content' }}>
            {/* Western Conference */}
            <div className="flex flex-col">
              <div className="text-center mb-3">
                <div className="text-sm font-bold text-red-600">WESTERN CONFERENCE</div>
              </div>
              <div className="flex gap-4">
                <PlayInColumn playInSeries={organizedBracket.westPlayIn} onSeriesSelect={handleSeriesSelect} selectedSeriesId={selectedSeriesId} />
                {[1, 2, 3].map(roundNum => {
                  const series = organizedBracket.west[roundNum] || [];
                  const roundName = series[0]?.round_name || '';
                  return (
                    <RoundColumn
                      key={`west-${roundNum}`}
                      roundSeries={series}
                      roundName={roundName}
                      roundNumber={roundNum}
                      conference="West"
                      showEmpty={roundNum === 1}
                      onSeriesSelect={handleSeriesSelect}
                      selectedSeriesId={selectedSeriesId}
                    />
                  );
                })}
              </div>
            </div>

            {/* NBA Finals - Championship Round */}
            <div className="flex flex-col justify-center px-4">
              <FinalsSection finalsSeries={organizedBracket.finals} />
            </div>

            {/* Eastern Conference */}
            <div className="flex flex-col">
              <div className="text-center mb-3">
                <div className="text-sm font-bold text-blue-600">EASTERN CONFERENCE</div>
              </div>
              <div className="flex gap-4">
                
                {[3, 2, 1].map(roundNum => {
                  const series = organizedBracket.east[roundNum] || [];
                  const roundName = series[0]?.round_name || '';
                  return (
                    <RoundColumn
                      key={`east-${roundNum}`}
                      roundSeries={series}
                      roundName={roundName}
                      roundNumber={roundNum}
                      conference="East"
                      showEmpty={roundNum === 1}
                      onSeriesSelect={handleSeriesSelect}
                      selectedSeriesId={selectedSeriesId}
                    />
                  );
                })}
				<PlayInColumn playInSeries={organizedBracket.eastPlayIn} onSeriesSelect={handleSeriesSelect} selectedSeriesId={selectedSeriesId} />
              </div>
            </div>
          </div>
        </div>

        {/* Large: Full Horizontal Bracket with Mirroring */}
        <div className="hidden lg:flex w-full gap-4 items-start justify-between overflow-x-auto">
          {/* Western Conference */}
          <div className="flex-1 flex flex-col">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-red-600">WESTERN CONFERENCE</div>
            </div>
            <div className="flex gap-4 justify-start">
              <PlayInColumn playInSeries={organizedBracket.westPlayIn} onSeriesSelect={handleSeriesSelect} selectedSeriesId={selectedSeriesId} />
              {[1, 2, 3].map(roundNum => {
                const series = organizedBracket.west[roundNum] || [];
                const roundName = series[0]?.round_name || '';
                return (
                  <RoundColumn
                    key={`west-${roundNum}`}
                    roundSeries={series}
                    roundName={roundName}
                    roundNumber={roundNum}
                    conference="West"
                    showEmpty={roundNum === 1}
                    onSeriesSelect={handleSeriesSelect}
                    selectedSeriesId={selectedSeriesId}
                  />
                );
              })}
            </div>
          </div>

          {/* NBA Finals - Championship Round */}
          <div className="flex-shrink-0 px-2 flex justify-center">
            <FinalsSection finalsSeries={organizedBracket.finals} />
          </div>

          {/* Eastern Conference - Mirrored */}
          <div className="flex-1 flex flex-col">
            <div className="text-center mb-3">
              <div className="text-sm font-bold text-blue-600">EASTERN CONFERENCE</div>
            </div>
            <div className="flex gap-4 justify-end">
              {[3, 2, 1].map(roundNum => {
                const series = organizedBracket.east[roundNum] || [];
                const roundName = series[0]?.round_name || '';
                return (
                  <RoundColumn
                    key={`east-${roundNum}`}
                    roundSeries={series}
                    roundName={roundName}
                    roundNumber={roundNum}
                    conference="East"
                    showEmpty={roundNum === 1}
                    onSeriesSelect={handleSeriesSelect}
                    selectedSeriesId={selectedSeriesId}
                  />
                );
              })}
              <PlayInColumn playInSeries={organizedBracket.eastPlayIn} onSeriesSelect={handleSeriesSelect} selectedSeriesId={selectedSeriesId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}