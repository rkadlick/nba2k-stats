import React, { useMemo } from 'react';
import { Player, Team, TeamStandings } from '@/lib/types';
import { useStandings } from '@/hooks/data/useStandings';
import { getTeamsByConference, getTeamLogoUrl } from '@/lib/teams';

interface StandingsViewProps {
  playerId: string;
  seasonId: string;
  playerTeamColor: string;
  player?: Player | null;
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
  standingsMap: Record<string, TeamStandings>,
  playerTeamId: string | undefined
): StandingsRow[] {
  const rows: StandingsRow[] = teams
    .filter((team) => standingsMap[team.id])
    .map((team) => {
      const record = standingsMap[team.id];
      const total = record.wins + record.losses;
      return {
        team,
        wins: record.wins,
        losses: record.losses,
        pct: total > 0 ? record.wins / total : 0,
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

/** Split rows into Playoffs (1-6), Play-in (7-10), Eliminated (11-15) */
function splitIntoGroups(rows: StandingsRow[]) {
  const playoffs = rows.filter((r) => r.seed >= 1 && r.seed <= 6);
  const playIn = rows.filter((r) => r.seed >= 7 && r.seed <= 10);
  const eliminated = rows.filter((r) => r.seed >= 11 && r.seed <= 15);
  return { playoffs, playIn, eliminated };
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

export function StandingsView({ playerId, seasonId, playerTeamColor, player }: StandingsViewProps) {
  const { standings, loadingStandings } = useStandings({
    selectedSeason: seasonId,
    playerId,
  });

  const eastTeams = useMemo(() => getTeamsByConference('East'), []);
  const westTeams = useMemo(() => getTeamsByConference('West'), []);

  const standingsMap = useMemo(() => {
    const map: Record<string, TeamStandings> = {};
    standings.forEach((s) => { map[s.team_id] = s; });
    return map;
  }, [standings]);

  const playerTeamId = player?.team_id;

  const eastRows = useMemo(
    () => buildConferenceRows(eastTeams, standingsMap, playerTeamId),
    [eastTeams, standingsMap, playerTeamId]
  );

  const westRows = useMemo(
    () => buildConferenceRows(westTeams, standingsMap, playerTeamId),
    [westTeams, standingsMap, playerTeamId]
  );

  if (loadingStandings) {
    return (
      <div className="text-xs text-[color:var(--color-text-muted)]">
        Loading standings...
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-xs text-[color:var(--color-text-muted)]">
        No standings data available
      </div>
    );
  }

  const renderRow = (row: StandingsRow) => (
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
  );

  const renderGroupHeader = (label: string, color: string) => (
    <tr key={`header-${label}`}>
      <td
        colSpan={5}
        className="text-xs font-semibold uppercase tracking-wider py-2 pt-4 first:pt-2 px-2"
        style={{ color }}
      >
        {label}
      </td>
    </tr>
  );

  const renderConferenceTable = (rows: StandingsRow[], conferenceLabel: string) => {
    const { playoffs, playIn, eliminated } = splitIntoGroups(rows);
    return (
      <div className="flex-1 min-w-[280px] rounded-xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-sm">
        <div
        className="text-sm font-bold px-4 py-3 uppercase tracking-wide border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]"
        style={{ color: playerTeamColor }}
        >
          {conferenceLabel}
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-[color:var(--color-text-muted)] p-4">No data</p>
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
                {playoffs.length > 0 && (
                  <>
                    {renderGroupHeader('Playoffs', '#16a34a')}
                    {playoffs.map(renderRow)}
                  </>
                )}
                {playIn.length > 0 && (
                  <>
                    {renderGroupHeader('Play-in', '#ca8a04')}
                    {playIn.map(renderRow)}
                  </>
                )}
                {eliminated.length > 0 && (
                  <>
                    {renderGroupHeader('Out', '#6b7280')}
                    {eliminated.map(renderRow)}
                  </>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-w-0">
      <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-2">
        Standings
      </h3>
      <div className="mt-4 flex gap-6 flex-wrap">
        {renderConferenceTable(eastRows, 'Eastern Conference')}
        {renderConferenceTable(westRows, 'Western Conference')}
      </div>
    </div>
  );
}
