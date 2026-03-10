'use client';

import React, { useState } from 'react';
import { PlayerWithTeam, PlayerGameStatsWithDetails } from '@/lib/types';
import StatTable from '@/components/player-panel/stats-section/stat-table';
import {
  useCareerPlayoffData,
  PLAYOFF_ROUND_OPTIONS,
  PlayoffRoundFilter,
  TeamPlayoffRecord,
} from '@/hooks/data/useCareerPlayoffData';
import { getTeamLogoUrl } from '@/lib/teams';
import Image from 'next/image';

interface PlayoffViewProps {
  player: PlayerWithTeam;
  allStats: PlayerGameStatsWithDetails[];
  isEditMode?: boolean;
  onEditGame?: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame?: (gameId: string) => void;
  playerTeamColor?: string;
}

function TeamRecordRow({ record }: { record: TeamPlayoffRecord }) {
  if (record.games === 0) return null;

  const logoUrl = getTeamLogoUrl(record.teamId);
  return (
    <div
      key={record.teamId}
      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 text-sm"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Image
          src={logoUrl || ''}
          alt={record.teamName}
          width={20}
          height={20}
          className="shrink-0"
        />
        <span className="font-medium text-gray-800 truncate">{record.abbreviation}</span>
      </div>
      <span className="text-gray-600 font-semibold shrink-0 ml-2">
        {record.wins}-{record.losses}
      </span>
    </div>
  );
}

function ConferenceTeamRecords({
  title,
  teams,
}: {
  title: string;
  teams: TeamPlayoffRecord[];
}) {
  const teamsWithGames = teams.filter((t) => t.games > 0);
  if (teamsWithGames.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 px-2">
        {title}
      </div>
      <div className="space-y-0.5">
        {teamsWithGames.map((record) => (
          <TeamRecordRow key={record.teamId} record={record} />
        ))}
      </div>
    </div>
  );
}

export default function PlayoffView({
  player,
  allStats,
  isEditMode = false,
  onEditGame,
  onDeleteGame,
  playerTeamColor = '#6B7280',
}: PlayoffViewProps) {
  const [roundFilter, setRoundFilter] = useState<PlayoffRoundFilter>('all');
  const {
    playoffGames,
    gamesByRound,
    eastTeams,
    westTeams,
    recordsByTeam,
    loading,
  } = useCareerPlayoffData(player.id, allStats, player.team?.id ?? player.team_id);

  const visibleRoundOptions = PLAYOFF_ROUND_OPTIONS.filter((opt) => gamesByRound[opt.value].length > 0);
  const effectiveRoundFilter = visibleRoundOptions.some((opt) => opt.value === roundFilter)
    ? roundFilter
    : visibleRoundOptions[0]?.value ?? 'all';
  const displayGames = gamesByRound[effectiveRoundFilter];

  const hasRecordsFromGames = playoffGames.length > 0;
  const hasRecordsFromSeries = recordsByTeam.some((r) => r.games > 0);
  const hasAnyPlayoffData = hasRecordsFromGames || hasRecordsFromSeries;

  const totalWins = recordsByTeam.reduce((sum, r) => sum + r.wins, 0);
  const totalLosses = recordsByTeam.reduce((sum, r) => sum + r.losses, 0);
  const totalGames = totalWins + totalLosses;

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Loading playoff data...
      </div>
    );
  }

  if (!hasAnyPlayoffData) {
    return (
      <div className="text-center py-8 text-gray-500 italic">
        No playoff games or series recorded for this player.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Playoff record summary */}
      <div className="text-sm text-gray-600">
        Career playoff record: <span className="font-semibold">{totalWins}-{totalLosses}</span>{' '}
        ({totalGames} game{totalGames !== 1 ? 's' : ''}
        {hasRecordsFromSeries && !hasRecordsFromGames && ' from series data'})
      </div>

      {/* Eastern & Western conference team records */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">
          Playoff Record vs. Teams
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <ConferenceTeamRecords title="Western Conference" teams={westTeams} />
          <ConferenceTeamRecords title="Eastern Conference" teams={eastTeams} />
        </div>
      </div>

      {/* Round switcher - only show rounds that have games */}
      {hasRecordsFromGames && (
      <div className="flex flex-wrap gap-1">
        {visibleRoundOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoundFilter(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              effectiveRoundFilter === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      )}

      {/* Stat table for selected round - only when we have game stats */}
      {hasRecordsFromGames ? (
        <div>
          {displayGames.length > 0 ? (
            <StatTable
              stats={displayGames}
              isEditMode={isEditMode}
              onEditGame={onEditGame ?? (() => {})}
              onDeleteGame={onDeleteGame ?? (() => {})}
              seasonTotals={null}
              playerTeamColor={playerTeamColor}
              showKeyGames={false}
            />
          ) : (
            <div className="text-center py-6 text-gray-500 italic text-sm">
              No games in this round.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm">
          Game stats are not available for older seasons. Records above are from playoff series data.
        </div>
      )}
    </div>
  );
}
