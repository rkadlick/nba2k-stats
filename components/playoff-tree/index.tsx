'use client';

import { Season, PlayerGameStatsWithDetails, Team } from '@/lib/types';
import { usePlayoffSeries } from '@/hooks/usePlayoffSeries';
import { ConferenceSection } from './ConferenceSection';
import { FinalsSection } from './FinalsSection';

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
  teams = []
}: PlayoffTreeProps) {
  const { organizedBracket, loading } = usePlayoffSeries(
    season,
    playerId,
    playerStats,
    playerTeamName,
    teams
  );

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

      {/* Bracket Layout - Mirrored */}
      {/* Layout: West (left) → Finals (center) ← East (right) */}
      {/* Rounds face inwards: West goes left-to-right, East goes right-to-left (mirrored) */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start overflow-scroll">
        {/* Western Conference - LEFT SIDE */}
        <ConferenceSection
          conference="West"
          roundSeries={organizedBracket.west}
          playInSeries={organizedBracket.westPlayIn}
        />

        {/* Finals - Centered */}
        <div className="flex-shrink-0 lg:px-4">
          <FinalsSection finalsSeries={organizedBracket.finals} />
        </div>

        {/* Eastern Conference - RIGHT SIDE - MIRRORED */}
        <ConferenceSection
          conference="East"
          roundSeries={organizedBracket.east}
          playInSeries={organizedBracket.eastPlayIn}
        />
      </div>
    </div>
  );
}
