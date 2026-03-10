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
  const seriesDisplay = (record.seriesByYear || [])
    .map((s) => (
      <span key={s.year}>
        <span className="font-bold">{s.year}</span>: {s.wins}-{s.losses}
      </span>
    ))
    .reduce<React.ReactNode[]>((acc, el, i) => (i === 0 ? [el] : [...acc, ' | ', el]), []);

  const seriesDisplayText = (record.seriesByYear || [])
    .map((s) => `${s.year}: ${s.wins}-${s.losses}`)
    .join(' | ');

  return (
    <div
      key={record.teamId}
      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-100 text-sm gap-2"
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
      <div className="text-right shrink-0 min-w-0">
        <div className="text-gray-600 font-semibold">{record.wins}-{record.losses}</div>
        {seriesDisplay.length > 0 && (
          <div className="text-xs text-gray-500 truncate" title={seriesDisplayText}>
            {seriesDisplay}
          </div>
        )}
      </div>
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
    recordsByRound,
    recordsByTeam,
    loading,
  } = useCareerPlayoffData(player.id, allStats, player.team?.id ?? player.team_id);

  const effectiveRoundFilter = PLAYOFF_ROUND_OPTIONS.some((opt) => opt.value === roundFilter)
    ? roundFilter
    : 'all';
  const displayGames = gamesByRound[effectiveRoundFilter];

  const filteredRecords = recordsByRound[effectiveRoundFilter];
  const { eastTeams, westTeams } = filteredRecords;

  const hasRecordsFromGames = playoffGames.length > 0;
  const hasRecordsFromSeries = recordsByTeam.some((r) => r.games > 0);
  const hasAnyPlayoffData = hasRecordsFromGames || hasRecordsFromSeries;

  const totalWins = filteredRecords.recordsByTeam.reduce((sum, r) => sum + r.wins, 0);
  const totalLosses = filteredRecords.recordsByTeam.reduce((sum, r) => sum + r.losses, 0);
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
      {/* Round filter - at top, always show all options (series data may exist without game stats) */}
      <div className="flex flex-wrap gap-1">
        {PLAYOFF_ROUND_OPTIONS.map((opt) => (
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

      {/* Playoff record summary - filtered by selected round */}
      <div className="text-sm text-gray-600">
        {effectiveRoundFilter === 'all' ? 'Career' : PLAYOFF_ROUND_OPTIONS.find((o) => o.value === effectiveRoundFilter)?.label ?? 'Playoff'} record:{' '}
        <span className="font-semibold">{totalWins}-{totalLosses}</span>{' '}
        ({totalGames} game{totalGames !== 1 ? 's' : ''}
        {hasRecordsFromSeries && !hasRecordsFromGames && ' from series data'})
      </div>

      {/* Eastern & Western conference team records - filtered by selected round */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">
          Playoff Record vs. Teams
        </h4>
        {totalGames > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            <ConferenceTeamRecords title="Western Conference" teams={westTeams} />
            <ConferenceTeamRecords title="Eastern Conference" teams={eastTeams} />
          </div>
        ) : (
          <p className="text-center py-6 text-gray-500 italic text-sm">
            No games recorded
          </p>
        )}
      </div>

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
              showYearInDate={true}
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
