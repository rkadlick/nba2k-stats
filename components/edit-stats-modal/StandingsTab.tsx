'use client';

import React, { useState, useMemo } from 'react';
import { Player, PlayerGameStatsWithDetails, Team, TeamStandings } from '@/lib/types';
import { getTeamsByConference, getTeamLogoUrl } from '@/lib/teams';

interface StandingsTabProps {
  standings: TeamStandings[];
  seasonGames: PlayerGameStatsWithDetails[];
  currentUserPlayer: Player | null;
  onUpsert: (teamId: string, wins: number, losses: number) => void;
  onDelete: (id: string) => void;
}

interface DraftRow {
  wins: string;
  losses: string;
}

export default function StandingsTab({
  standings,
  seasonGames,
  currentUserPlayer,
  onUpsert,
  onDelete,
}: StandingsTabProps) {
  const [editingTeams, setEditingTeams] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});

  const eastTeams = useMemo(() => getTeamsByConference('East'), []);
  const westTeams = useMemo(() => getTeamsByConference('West'), []);

  const userTeamId = currentUserPlayer?.team_id;

  // Compute user's team W/L from non-playoff game stats
  const computedRecord = useMemo(() => {
    const regularGames = seasonGames.filter((g) => !g.is_playoff_game);
    const wins = regularGames.filter((g) => g.is_win).length;
    const losses = regularGames.filter((g) => !g.is_win).length;
    return { wins, losses };
  }, [seasonGames]);

  const standingsMap = useMemo(() => {
    const map: Record<string, TeamStandings> = {};
    standings.forEach((s) => { map[s.team_id] = s; });
    return map;
  }, [standings]);

  const startEditing = (teamId: string, currentWins: number, currentLosses: number) => {
    setDrafts((prev) => ({
      ...prev,
      [teamId]: { wins: String(currentWins), losses: String(currentLosses) },
    }));
    setEditingTeams((prev) => ({ ...prev, [teamId]: true }));
  };

  const cancelEditing = (teamId: string) => {
    setEditingTeams((prev) => { const n = { ...prev }; delete n[teamId]; return n; });
    setDrafts((prev) => { const n = { ...prev }; delete n[teamId]; return n; });
  };

  const handleSave = (teamId: string) => {
    const draft = drafts[teamId];
    if (!draft) return;
    const wins = parseInt(draft.wins, 10);
    const losses = parseInt(draft.losses, 10);
    if (isNaN(wins) || isNaN(losses) || wins < 0 || losses < 0) return;
    onUpsert(teamId, wins, losses);
    cancelEditing(teamId);
  };

  const renderTeamRow = (team: Team) => {
    const { id: teamId } = team;
    const isUserTeam = teamId === userTeamId;
    const dbRecord = standingsMap[teamId];
    const isEditing = editingTeams[teamId] ?? false;
    const draft = drafts[teamId];

    let displayWins: number;
    let displayLosses: number;
    let hasRecord: boolean;

    if (dbRecord) {
      displayWins = dbRecord.wins;
      displayLosses = dbRecord.losses;
      hasRecord = true;
    } else if (isUserTeam) {
      displayWins = computedRecord.wins;
      displayLosses = computedRecord.losses;
      hasRecord = false;
    } else {
      displayWins = 0;
      displayLosses = 0;
      hasRecord = false;
    }

    return (
      <div
        key={teamId}
        className={`flex items-center gap-3 py-1.5 px-2 rounded ${isUserTeam ? 'bg-blue-50' : ''}`}
      >
        {getTeamLogoUrl(teamId) && (
          <img
            src={getTeamLogoUrl(teamId)!}
            alt={team.abbreviation}
            className="w-6 h-6 object-contain flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        <span className={`text-sm w-44 truncate ${isUserTeam ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
          {team.fullName}
        </span>

        {isEditing ? (
          <>
            <input
              type="number"
              min="0"
              max="82"
              value={draft?.wins ?? ''}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [teamId]: { ...prev[teamId], wins: e.target.value } }))
              }
              className="w-14 text-sm px-2 py-1 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
              placeholder="W"
            />
            <span className="text-gray-400 text-sm">-</span>
            <input
              type="number"
              min="0"
              max="82"
              value={draft?.losses ?? ''}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [teamId]: { ...prev[teamId], losses: e.target.value } }))
              }
              className="w-14 text-sm px-2 py-1 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
              placeholder="L"
            />
            <button
              onClick={() => handleSave(teamId)}
              className="text-xs text-green-600 hover:underline"
            >
              Save
            </button>
            <button
              onClick={() => cancelEditing(teamId)}
              className="text-xs text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className={`text-sm w-14 text-center ${hasRecord || isUserTeam ? 'text-gray-800' : 'text-gray-300'}`}>
              {hasRecord || isUserTeam ? displayWins : '—'}
            </span>
            <span className="text-gray-400 text-sm">-</span>
            <span className={`text-sm w-14 text-center ${hasRecord || isUserTeam ? 'text-gray-800' : 'text-gray-300'}`}>
              {hasRecord || isUserTeam ? displayLosses : '—'}
            </span>

            <div className="flex items-center gap-2 ml-1">
              {isUserTeam && !hasRecord && (
                <span className="text-xs text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">
                  auto
                </span>
              )}
              <button
                onClick={() => startEditing(teamId, displayWins, displayLosses)}
                className="text-xs text-blue-600 hover:underline"
              >
                {hasRecord ? 'Edit' : 'Add'}
              </button>
              {hasRecord && (
                <button
                  onClick={() => onDelete(dbRecord.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderConference = (teams: Team[], label: string) => (
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">{label}</h4>
      <div className="flex items-center gap-3 px-2 mb-1">
        <div className="w-6" />
        <span className="text-xs text-gray-400 w-44">Team</span>
        <span className="text-xs text-gray-400 w-14 text-center">W</span>
        <span className="text-xs text-gray-400 w-4 text-center">-</span>
        <span className="text-xs text-gray-400 w-14 text-center">L</span>
      </div>
      <div className="space-y-0.5">
        {teams.map((team) => renderTeamRow(team))}
      </div>
    </div>
  );

  const userTeamHasGamesButNoDbRow =
    userTeamId &&
    (computedRecord.wins > 0 || computedRecord.losses > 0) &&
    !standingsMap[userTeamId];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Standings</h3>
        <p className={`text-xs text-gray-500 ${userTeamHasGamesButNoDbRow ? 'mb-2' : 'mb-4'}`}>
          Enter wins and losses for all 30 teams.
          {userTeamId && " Your team's record is auto-computed from recorded games — click Add to override."}
        </p>
        {userTeamHasGamesButNoDbRow && (
          <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200 mb-4">
            Save your team&apos;s record when the season ends so it appears in career standings.
          </p>
        )}
      </div>
      <div className="flex gap-8 flex-wrap">
        {renderConference(eastTeams, 'Eastern Conference')}
        {renderConference(westTeams, 'Western Conference')}
      </div>
    </div>
  );
}
