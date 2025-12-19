'use client';

import React, { useMemo } from 'react';
import { PlayoffSeries, Player, PlayerGameStatsWithDetails, Season } from '@/lib/types';
import { getTeamAbbreviation } from '@/lib/teams';
import { getAllTeams } from '@/lib/teams';
import { useDraftEditing } from '@/hooks/ui/useDraftEditing';
import { ROUNDS, ROUND_NUMBERS, determineWinner, generateSeriesId } from '@/lib/playoffUtils';

interface PlayoffTreeTabProps {
  selectedSeason: string;
  seasons: Season[];
  loadingPlayoffs: boolean;
  playoffSeries: PlayoffSeries[];
  onSaveSeries: (series: PlayoffSeries) => void;
  onDeleteSeries: (seriesId: string) => void;
  currentUserPlayer: Player | null;
  allStats: PlayerGameStatsWithDetails[];
}


export default function PlayoffTreeTab({
  selectedSeason,
  seasons,
  loadingPlayoffs,
  playoffSeries,
  onSaveSeries,
  onDeleteSeries,
  currentUserPlayer,
  allStats,
}: PlayoffTreeTabProps) {
  const teams = getAllTeams();

  // Use draft editing hook for state management
  const {
    editingRows,
    draftItems: draftSeries,
    pendingItems: pendingSeries,
    stageEdit: baseStageEdit,
    startEditing,
    addPending: addPendingSeries,
    saveItem,
  } = useDraftEditing<PlayoffSeries>();

  // Custom stageEdit with auto-winner determination
  const stageEdit = (id: string, field: keyof PlayoffSeries, value: PlayoffSeries[keyof PlayoffSeries]) => {
    baseStageEdit(id, field, value);

    // Auto-determine winner when wins change
    if (field === 'team1_wins' || field === 'team2_wins') {
      const draft = draftSeries[id] || {};
      const seriesRow = playoffSeries.find(s => s.id === id) || ({} as PlayoffSeries);
      const team1Wins = draft.team1_wins ?? seriesRow.team1_wins ?? 0;
      const team2Wins = draft.team2_wins ?? seriesRow.team2_wins ?? 0;
      const team1Id = draft.team1_id ?? seriesRow.team1_id;
      const team1Name = draft.team1_name ?? seriesRow.team1_name;
      const team2Id = draft.team2_id ?? seriesRow.team2_id;
      const team2Name = draft.team2_name ?? seriesRow.team2_name;

      const winner = determineWinner(team1Id, team1Name, team1Wins, team2Id, team2Name, team2Wins);
      baseStageEdit(id, 'winner_team_id', winner.winner_team_id);
      baseStageEdit(id, 'winner_team_name', winner.winner_team_name);
      baseStageEdit(id, 'is_complete', winner.is_complete);
    }
  };

  const selectedSeasonObj = useMemo(
    () => seasons.find(s => s.id === selectedSeason),
    [seasons, selectedSeason]
  );

  const seriesByRound = useMemo(
    () =>
      ROUNDS.map(round => ({
    round,
    series: playoffSeries.filter(s => s.round_name === round),
      })),
    [playoffSeries]
  );



  /* ----------------------------------------- */
  /*   SAVE HANDLERS                           */
  /* ----------------------------------------- */
  const handleSave = (seriesRow: PlayoffSeries) => {
    saveItem(seriesRow.id, (item) => {
      if (!selectedSeasonObj) return;

      const isTemp = !seriesRow.id || seriesRow.id.startsWith('temp-');
      let updated = { ...seriesRow, ...item };

      // Generate ID if needed
      if (isTemp || !updated.id) {
        updated.id = generateSeriesId(
          selectedSeasonObj,
          updated.round_name || seriesRow.round_name,
          updated.team1_id || seriesRow.team1_id,
          updated.team2_id || seriesRow.team2_id,
          currentUserPlayer?.id || '',
          playoffSeries
        );
      }

      // Update round_number if round_name changed
      if (updated.round_name && updated.round_name !== seriesRow.round_name) {
        updated.round_number = ROUND_NUMBERS[updated.round_name] || 1;
      }

      // Auto-determine winner based on wins
      const team1Wins = updated.team1_wins ?? seriesRow.team1_wins ?? 0;
      const team2Wins = updated.team2_wins ?? seriesRow.team2_wins ?? 0;
      const winner = determineWinner(
        updated.team1_id ?? seriesRow.team1_id,
        updated.team1_name ?? seriesRow.team1_name,
        team1Wins,
        updated.team2_id ?? seriesRow.team2_id,
        updated.team2_name ?? seriesRow.team2_name,
        team2Wins
      );
      updated = { ...updated, ...winner };

      onSaveSeries(updated);
    });
  };

  const savePendingSeries = (roundName: string, tempId: string, draft: Partial<PlayoffSeries>) => {
    if (!selectedSeasonObj) return;
    if (!draft.team1_id && !draft.team2_id) return;

    // Generate ID
    const seriesId = generateSeriesId(
      selectedSeasonObj,
      draft.round_name || roundName,
      draft.team1_id,
      draft.team2_id,
      currentUserPlayer?.id || '',
      playoffSeries
    );

    // Auto-determine winner based on wins
    const team1Wins = draft.team1_wins ?? 0;
    const team2Wins = draft.team2_wins ?? 0;
    const winner = determineWinner(
      draft.team1_id,
      draft.team1_name,
      team1Wins,
      draft.team2_id,
      draft.team2_name,
      team2Wins
    );

    const newSeries: PlayoffSeries = {
      id: seriesId,
      player_id: currentUserPlayer?.id || '',
      season_id: selectedSeason,
      round_name: draft.round_name || roundName,
      round_number: draft.round_number || ROUND_NUMBERS[draft.round_name || roundName] || 1,
      team1_id: draft.team1_id,
      team1_name: draft.team1_name,
      team1_seed: draft.team1_seed,
      team2_id: draft.team2_id,
      team2_name: draft.team2_name,
      team2_seed: draft.team2_seed,
      team1_wins: team1Wins,
      team2_wins: team2Wins,
      ...winner,
    };

    onSaveSeries(newSeries);
  };

  /* ----------------------------------------- */
  /*   RENDER                                  */
  /* ----------------------------------------- */
  return (
    <div className="space-y-8 w-full">
      {loadingPlayoffs ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
          Loading playoff tree...
        </div>
      ) : (
        <div>
          <h3 className="px-4 text-lg font-semibold text-gray-900 mb-3">Playoff Series</h3>
          <p className="px-4 text-xs text-gray-500 mb-4">
            Add and manage playoff series for each round.
          </p>

          {seriesByRound.map(({ round, series }, index) => {
            const rows: PlayoffSeries[] =
              series.length > 0
                ? series
                : ([
                    {
                      id: `temp-${round}-0`,
                      player_id: currentUserPlayer?.id || '',
                      season_id: selectedSeason,
                      round_name: round,
                      round_number: ROUND_NUMBERS[round] || 1,
                      team1_wins: 0,
                      team2_wins: 0,
                      is_complete: false,
                    },
                  ] as PlayoffSeries[]);
            
            return (
              <div key={round} className="relative py-4 w-[95%] mx-auto">
                {index !== 0 && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] border-t border-gray-200" />
                )}

                {/* Existing series */}
                {rows.map((seriesRow, rIdx) => {
                  const isEditing = editingRows[seriesRow.id] ?? (!seriesRow.team1_id && !seriesRow.team2_id);
                  const draft = draftSeries[seriesRow.id] ?? {};

                  /** 🧠 Determine which buttons to show: Edit/Delete only when not editing */
                  const showEditDelete = !isEditing && (!!seriesRow.team1_id || !!seriesRow.team2_id);

                  return (
                    <div key={seriesRow.id} className="flex flex-wrap items-start gap-x-6 gap-y-2 py-2">
                      {rIdx === 0 ? (
                        <div className="w-56 text-gray-900 font-semibold pt-2">{round}</div>
                      ) : (
                        <div className="w-56" />
                      )}

                      {/* Team 1 */}
                      <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Team 1</label>
                        {isEditing ? (
                          <>
                            <select
                              value={draft.team1_id ?? seriesRow.team1_id ?? ''}
                              onChange={(e) => {
                                const team = teams.find((t) => t.id === e.target.value);
                                stageEdit(seriesRow.id, 'team1_id', e.target.value || undefined);
                                stageEdit(seriesRow.id, 'team1_name', team?.fullName);
                              }}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select team...</option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.fullName}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              placeholder="Seed (1-10)"
                              value={draft.team1_seed ?? seriesRow.team1_seed ?? ''}
                              onChange={(e) =>
                                stageEdit(
                                  seriesRow.id,
                                  'team1_seed',
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 focus:ring-2 focus:ring-blue-500"
                            />
                          </>
                        ) : (
                          <div className="text-sm text-gray-800 px-3 py-[6px] min-h-[36px] flex items-center justify-between">
                            <span>
                              {seriesRow.team1_name || teams.find((t) => t.id === seriesRow.team1_id)?.fullName || '—'}
                              {seriesRow.team1_seed && ` (${seriesRow.team1_seed})`}
                            </span>
                            {showEditDelete && (
                              <button
                                onClick={() => startEditing(seriesRow.id)}
                                className="text-xs text-blue-600 hover:underline ml-3 whitespace-nowrap"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Team 2</label>
                        {isEditing ? (
                          <>
                            <select
                              value={draft.team2_id ?? seriesRow.team2_id ?? ''}
                              onChange={(e) => {
                                const team = teams.find((t) => t.id === e.target.value);
                                stageEdit(seriesRow.id, 'team2_id', e.target.value || undefined);
                                stageEdit(seriesRow.id, 'team2_name', team?.fullName);
                              }}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select team...</option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.fullName}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              placeholder="Seed (1-10)"
                              value={draft.team2_seed ?? seriesRow.team2_seed ?? ''}
                              onChange={(e) =>
                                stageEdit(
                                  seriesRow.id,
                                  'team2_seed',
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 focus:ring-2 focus:ring-blue-500"
                            />
                          </>
                        ) : (
                          <div className="text-sm text-gray-800 px-3 py-[6px] min-h-[36px] flex items-center">
                            <span>
                              {seriesRow.team2_name || teams.find((t) => t.id === seriesRow.team2_id)?.fullName || '—'}
                              {seriesRow.team2_seed && ` (${seriesRow.team2_seed})`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Wins */}
                      {isEditing ? (
                        <div className="flex-1 min-w-[200px]">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Team 1 Wins</label>
                              <input
                                type="number"
                                min="0"
                                max="4"
                                value={draft.team1_wins ?? seriesRow.team1_wins ?? 0}
                                onChange={(e) =>
                                  stageEdit(seriesRow.id, 'team1_wins', parseInt(e.target.value) || 0)
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Team 2 Wins</label>
                              <input
                                type="number"
                                min="0"
                                max="4"
                                value={draft.team2_wins ?? seriesRow.team2_wins ?? 0}
                                onChange={(e) =>
                                  stageEdit(seriesRow.id, 'team2_wins', parseInt(e.target.value) || 0)
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          {(() => {
                            const team1Wins = draft.team1_wins ?? seriesRow.team1_wins ?? 0;
                            const team2Wins = draft.team2_wins ?? seriesRow.team2_wins ?? 0;
                            const team1Id = draft.team1_id ?? seriesRow.team1_id;
                            const team1Name = draft.team1_name ?? seriesRow.team1_name;
                            const team2Id = draft.team2_id ?? seriesRow.team2_id;
                            const team2Name = draft.team2_name ?? seriesRow.team2_name;
                            const winner = determineWinner(team1Id, team1Name, team1Wins, team2Id, team2Name, team2Wins);
                            const winnerName = winner.winner_team_id
                              ? teams.find((t) => t.id === winner.winner_team_id)?.fullName || winner.winner_team_name
                              : null;
                            return (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Winner</label>
                                <div className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 bg-gray-50">
                                  {winnerName || 'None'}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex-1 min-w-[200px]">
                          <div className="text-sm text-gray-800 px-3 py-[6px] min-h-[36px] flex items-center">
                            <span>
                              {seriesRow.team1_wins || 0}–{seriesRow.team2_wins || 0}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 px-3 py-[6px] flex items-center">
                            Winner: {seriesRow.winner_team_name
                              ? teams.find((t) => t.id === seriesRow.winner_team_id)?.fullName || seriesRow.winner_team_name
                              : 'None'}
                          </div>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex items-center h-[36px] pt-6">
                        {isEditing && (
                          <button
                            onClick={() => handleSave(seriesRow)}
                            className="text-xs text-green-600 hover:underline mr-3"
                          >
                            Save
                          </button>
                        )}

                        {showEditDelete && (
                          <button
                            onClick={() => onDeleteSeries(seriesRow.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      
                      {/* Player Games Section */}
                      {currentUserPlayer &&
                        currentUserPlayer.team_id &&
                        (seriesRow.team1_id === currentUserPlayer.team_id ||
                          seriesRow.team2_id === currentUserPlayer.team_id) && (
                          <div className="w-full mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-1">Player Games in This Series:</div>
                            {(() => {
                              const opponentTeamId =
                                seriesRow.team1_id === currentUserPlayer.team_id
                                  ? seriesRow.team2_id
                                  : seriesRow.team1_id;
                              const opponentTeam = opponentTeamId
                                ? teams.find((t) => t.id === opponentTeamId)
                                : null;

                              const seriesGames = allStats.filter(
                                (game) =>
                                game.player_id === currentUserPlayer.id &&
                                game.season_id === selectedSeason &&
                                game.is_playoff_game &&
                                  (game.opponent_team?.id === opponentTeamId ||
                                    game.opponent_team_name === opponentTeam?.fullName)
                              );
                              
                              return seriesGames.length > 0 ? (
                                <div className="space-y-1">
                                  {seriesGames.map((game) => (
                                    <div
                                      key={game.id}
                                      className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200"
                                    >
                                      {new Date(game.game_date).toLocaleDateString()} -{game.is_home ? ' vs ' : ' @ '}
                                      {getTeamAbbreviation(
                                        game.opponent_team?.fullName || game.opponent_team_name || ''
                                      )}{' '}
                                      - {game.points || 0} PTS, {game.rebounds || 0} REB, {game.assists || 0} AST
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">No games recorded for this series yet</div>
                              );
                            })()}
                          </div>
                        )}
                    </div>
                  );
                })}

                {/* Pending unsaved rows */}
                {(pendingSeries[round] || []).map((tempId) => {
                  const draft = draftSeries[tempId] ?? {};
                  return (
                    <div key={tempId} className="flex flex-wrap items-start gap-x-6 gap-y-2 py-2">
                      <div className="w-56" />
                      <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Team 1</label>
                          <select
                          value={draft.team1_id ?? ''}
                            onChange={(e) => {
                            const team = teams.find((t) => t.id === e.target.value);
                            stageEdit(tempId, 'team1_id', e.target.value || undefined);
                            stageEdit(tempId, 'team1_name', team?.fullName);
                          }}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select team...</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.fullName}
                            </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Seed (1-10)"
                          value={draft.team1_seed ?? ''}
                          onChange={(e) =>
                            stageEdit(tempId, 'team1_seed', e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Team 2</label>
                          <select
                          value={draft.team2_id ?? ''}
                            onChange={(e) => {
                            const team = teams.find((t) => t.id === e.target.value);
                            stageEdit(tempId, 'team2_id', e.target.value || undefined);
                            stageEdit(tempId, 'team2_name', team?.fullName);
                          }}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select team...</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName}
                            </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Seed (1-10)"
                          value={draft.team2_seed ?? ''}
                          onChange={(e) =>
                            stageEdit(tempId, 'team2_seed', e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-800 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Team 1 Wins</label>
                            <input
                              type="number"
                              min="0"
                              max="4"
                              value={draft.team1_wins ?? 0}
                              onChange={(e) => stageEdit(tempId, 'team1_wins', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Team 2 Wins</label>
                            <input
                              type="number"
                              min="0"
                              max="4"
                              value={draft.team2_wins ?? 0}
                              onChange={(e) => stageEdit(tempId, 'team2_wins', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {(() => {
                          const team1Wins = draft.team1_wins ?? 0;
                          const team2Wins = draft.team2_wins ?? 0;
                          const team1Id = draft.team1_id;
                          const team1Name = draft.team1_name;
                          const team2Id = draft.team2_id;
                          const team2Name = draft.team2_name;
                          const winner = determineWinner(team1Id, team1Name, team1Wins, team2Id, team2Name, team2Wins);
                          const winnerName = winner.winner_team_id
                              ? teams.find((t) => t.id === winner.winner_team_id)?.fullName || winner.winner_team_name
                            : null;
                          return (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Winner</label>
                              <div className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 bg-gray-50">
                                {winnerName || 'None'}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex items-center h-[36px] pt-6">
                        <button
                          onClick={() => savePendingSeries(round, tempId, draftSeries[tempId])}
                          className="text-xs text-green-600 hover:underline mr-3"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add button */}
                <div className="ml-56 mt-2">
                  <button
                    onClick={() => addPendingSeries(round)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Add Series
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
