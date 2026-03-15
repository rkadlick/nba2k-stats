'use client';

import React, { useMemo, useState } from 'react';
import { Player, Season, Team } from '@/lib/types';
import { useCareerStandings, AggregatedStanding } from '@/hooks/data/useCareerStandings';
import { getTeamsByConference, getTeamLogoUrl } from '@/lib/teams';

interface CareerStandingsViewProps {
  player: Player;
  seasons: Season[];
  playerTeamColor: string;
}

interface StandingsRow {
  team: Team;
  wins: number;
  losses: number;
  pct: number;
  seed: number;
  isPlayerTeam: boolean;
}

function formatPct(pct: number): string {
  if (!isFinite(pct)) return '.000';
  return pct.toFixed(3).replace(/^0/, '');
}

function buildConferenceRows(
  teams: Team[],
  aggregatedMap: Record<string, AggregatedStanding>,
  playerTeamId: string | undefined
): StandingsRow[] {
  const rows: StandingsRow[] = teams
    .filter((team) => aggregatedMap[team.id])
    .map((team) => {
      const agg = aggregatedMap[team.id];
      return {
        team,
        wins: agg.wins,
        losses: agg.losses,
        pct: agg.pct,
        seed: 0,
        isPlayerTeam: team.id === playerTeamId,
      };
    });

  rows.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pct - a.pct;
  });

  rows.forEach((row, i) => { row.seed = i + 1; });

  return rows;
}

function renderTeamCell(row: StandingsRow) {
  return (
    <div className="flex items-center gap-2">
      {getTeamLogoUrl(row.team.id) && (
        <img
          src={getTeamLogoUrl(row.team.id)!}
          alt={row.team.abbreviation}
          className="w-5 h-5 object-contain flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <span className="hidden lg:inline truncate">{row.team.fullName}</span>
      <span className="lg:hidden font-medium">{row.team.abbreviation}</span>
    </div>
  );
}

const RANGE_DROPDOWN_CLASS =
  'bg-transparent border-0 border-b-2 border-gray-300 rounded-none px-2 py-1 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors cursor-pointer';

/** Past seasons only: same as main dropdown minus the current (most recent) season */
function getPastSeasons(seasons: Season[]): Season[] {
  if (seasons.length <= 1) return [];
  const sorted = [...seasons].sort((a, b) => b.year_end - a.year_end);
  return sorted.slice(1); // exclude current (most recent)
}

export function CareerStandingsView({
  player,
  seasons,
  playerTeamColor,
}: CareerStandingsViewProps) {
  const pastSeasons = useMemo(() => getPastSeasons(seasons), [seasons]);
  const { loading, sortedSeasons, getAggregatedStandings, hasAnyStandings } =
    useCareerStandings({ playerId: player.id, seasons: pastSeasons });

  const [fromSeasonId, setFromSeasonId] = useState<string>('');
  const [toSeasonId, setToSeasonId] = useState<string>('');

  React.useEffect(() => {
    if (sortedSeasons.length > 0) {
      setFromSeasonId((prev) => prev || sortedSeasons[0].id);
      setToSeasonId((prev) => prev || sortedSeasons[sortedSeasons.length - 1].id);
    }
  }, [sortedSeasons]);

  const aggregated = useMemo(() => {
    if (!fromSeasonId || !toSeasonId) return [];
    return getAggregatedStandings(fromSeasonId, toSeasonId);
  }, [fromSeasonId, toSeasonId, getAggregatedStandings]);

  const aggregatedMap = useMemo(() => {
    const map: Record<string, AggregatedStanding> = {};
    aggregated.forEach((a) => { map[a.team_id] = a; });
    return map;
  }, [aggregated]);

  const eastTeams = useMemo(() => getTeamsByConference('East'), []);
  const westTeams = useMemo(() => getTeamsByConference('West'), []);

  const playerTeamId = player.team_id;

  const eastRows = useMemo(
    () => buildConferenceRows(eastTeams, aggregatedMap, playerTeamId),
    [eastTeams, aggregatedMap, playerTeamId]
  );

  const westRows = useMemo(
    () => buildConferenceRows(westTeams, aggregatedMap, playerTeamId),
    [westTeams, aggregatedMap, playerTeamId]
  );

  if (loading) {
    return (
      <div className="text-xs text-[color:var(--color-text-muted)]">
        Loading standings...
      </div>
    );
  }

  if (!hasAnyStandings || sortedSeasons.length === 0) {
    return (
      <div className="text-xs text-[color:var(--color-text-muted)]">
        No standings data available. Add standings in the Edit Statistics modal for each season.
      </div>
    );
  }

  const renderTable = (rows: StandingsRow[], conferenceLabel: string) => (
    <div className="flex-1 min-w-[280px] rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-sm">
      <div
        className="text-sm font-bold px-4 py-3 uppercase tracking-wide border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]"
        style={{ color: playerTeamColor }}
      >
        {conferenceLabel}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[color:var(--color-text-muted)] p-4">No data in range</p>
      ) : (
        <div className="p-3 overflow-x-auto">
          <div className="min-w-max">
          <table className="w-full">
            <thead>
              <tr className="text-[color:var(--color-text-muted)] border-b border-[color:var(--color-border)] text-xs font-medium">
                <th className="w-8" />
                <th className="text-left pl-2" />
                <th className="text-right pb-2 pt-1 w-10">W</th>
                <th className="text-right pb-2 pt-1 w-10">L</th>
                <th className="text-right pb-2 pt-1 w-12">PCT</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.team.id}
                  className={`border-b border-[color:var(--color-border)] last:border-0 ${
                    row.isPlayerTeam ? 'font-bold bg-[color:var(--color-row-hover)]' : ''
                  }`}
                >
                  <td className="py-2 text-sm text-[color:var(--color-text-muted)] w-8">{row.seed}</td>
                  <td className="py-2 pl-2 text-sm text-[color:var(--color-text)] whitespace-nowrap">
                    {renderTeamCell(row)}
                  </td>
                  <td className="py-2 text-right text-sm w-10 whitespace-nowrap">{row.wins}</td>
                  <td className="py-2 text-right text-sm w-10 whitespace-nowrap">{row.losses}</td>
                  <td className="py-2 text-right text-sm w-12 whitespace-nowrap">{formatPct(row.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-w-0">
      <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-2">
        Career Standings
      </h3>
      <p className="text-sm text-[color:var(--color-text-muted)] mb-4">
        Aggregated wins and losses across the selected season range.
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[color:var(--color-text-muted)]">From</label>
          <select
            value={fromSeasonId}
            onChange={(e) => setFromSeasonId(e.target.value)}
            className={RANGE_DROPDOWN_CLASS}
          >
            {sortedSeasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.year_start}–{s.year_end}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[color:var(--color-text-muted)]">To</label>
          <select
            value={toSeasonId}
            onChange={(e) => setToSeasonId(e.target.value)}
            className={RANGE_DROPDOWN_CLASS}
          >
            {sortedSeasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.year_start}–{s.year_end}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-6 flex-wrap">
        {renderTable(eastRows, 'Eastern Conference')}
        {renderTable(westRows, 'Western Conference')}
      </div>
    </div>
  );
}
