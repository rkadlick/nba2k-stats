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

  const renderTable = (rows: StandingsRow[], conferenceLabel: string) => (
    <div className="flex-1 min-w-0">
      <div
        className="text-sm font-bold mb-2 uppercase tracking-wide"
        style={{ color: playerTeamColor }}
      >
        {conferenceLabel}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-[color:var(--color-text-muted)]">No data</p>
      ) : (
        <table className="w-full text-xs text-[color:var(--color-text)]">
          <thead>
            <tr className="text-[color:var(--color-text-muted)] border-b border-[color:var(--color-border)]">
              <th className="text-left pb-1 w-6">#</th>
              <th className="text-left pb-1 pl-1">Team</th>
              <th className="text-right pb-1 w-8">W</th>
              <th className="text-right pb-1 w-8">L</th>
              <th className="text-right pb-1 w-10">PCT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.team.id}
                className={`border-b border-[color:var(--color-border)] last:border-0 ${
                  row.isPlayerTeam ? 'font-bold' : ''
                }`}
              >
                <td className="py-1 text-[color:var(--color-text-muted)] w-6">{row.seed}</td>
                <td className="py-1 pl-1">
                  <div className="flex items-center gap-1.5">
                    {getTeamLogoUrl(row.team.id) && (
                      <img
                        src={getTeamLogoUrl(row.team.id)!}
                        alt={row.team.abbreviation}
                        className="w-4 h-4 object-contain flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <span className="truncate">{row.team.fullName}</span>
                  </div>
                </td>
                <td className="py-1 text-right w-8">{row.wins}</td>
                <td className="py-1 text-right w-8">{row.losses}</td>
                <td className="py-1 text-right w-10">{formatPct(row.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div>
      <h3 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">
        Standings
      </h3>
      <div className="mt-4 flex gap-8 flex-wrap">
        {renderTable(eastRows, 'Eastern Conference')}
        {renderTable(westRows, 'Western Conference')}
      </div>
    </div>
  );
}
