'use client';

import { Season, PlayoffSeries, Team, Player, PlayerGameStatsWithDetails } from '@/lib/types';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';

interface PlayoffTreeTabProps {
  selectedSeason: string;
  onSeasonChange: (seasonId: string) => void;
  seasons: Season[];
  loadingPlayoffs: boolean;
  playoffSeries: PlayoffSeries[];
  editingSeries: PlayoffSeries | null;
  onEditingSeriesChange: (series: PlayoffSeries | null) => void;
  onSaveSeries: (series: PlayoffSeries) => void;
  onDeleteSeries: (seriesId: string) => void;
  onCreateSeries: () => void;
  teams: Team[];
  currentUserPlayer: Player | null;
  allStats: PlayerGameStatsWithDetails[];
}

export default function PlayoffTreeTab({
  selectedSeason,
  onSeasonChange,
  seasons,
  loadingPlayoffs,
  playoffSeries,
  editingSeries,
  onEditingSeriesChange,
  onSaveSeries,
  onDeleteSeries,
  onCreateSeries,
  teams,
  currentUserPlayer,
  allStats,
}: PlayoffTreeTabProps) {
  const rounds = ['Play-In Tournament', 'Round 1', 'Conference Semifinals', 'Conference Finals', 'NBA Finals'];
  const roundNumbers: Record<string, number> = {
    'Play-In Tournament': 0,
    'Round 1': 1,
    'Conference Semifinals': 2,
    'Conference Finals': 3,
    'NBA Finals': 4,
  };

  const seriesByRound = rounds.map(round => ({
    round,
    series: playoffSeries.filter(s => s.round_name === round),
  }));

  const handleSeriesUpdate = (series: PlayoffSeries, updates: Partial<PlayoffSeries>) => {
    onSaveSeries({ ...series, ...updates });
  };

  const handleEditingSeriesUpdate = (updates: Partial<PlayoffSeries>) => {
    if (editingSeries) {
      onEditingSeriesChange({ ...editingSeries, ...updates });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Season
        </label>
        <select
          value={selectedSeason}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold"
        >
          {seasons.map(season => (
            <option key={season.id} value={season.id}>
              {season.year_start}–{season.year_end}
            </option>
          ))}
        </select>
      </div>

      {loadingPlayoffs ? (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
          Loading playoff tree...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Playoff Series</h3>
            <button
              onClick={onCreateSeries}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              + Add Series
            </button>
          </div>

          {seriesByRound.map(({ round, series }) => {
            if (series.length === 0 && (!editingSeries || editingSeries.round_name !== round)) return null;
            
            return (
              <div key={round} className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">{round}</h4>
                <div className="space-y-3">
                  {series.map(s => (
                    <div key={s.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Team 1</label>
                            <select
                              value={s.team1_id || ''}
                              onChange={(e) => {
                                const team = teams.find(t => t.id === e.target.value);
                                handleSeriesUpdate(s, {
                                  team1_id: e.target.value || undefined,
                                  team1_name: team?.name,
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            >
                              <option value="">Select team...</option>
                              {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              placeholder="Seed (1-10)"
                              value={s.team1_seed || ''}
                              onChange={(e) => handleSeriesUpdate(s, {
                                team1_seed: e.target.value ? parseInt(e.target.value) : undefined,
                              })}
                              className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Team 2</label>
                            <select
                              value={s.team2_id || ''}
                              onChange={(e) => {
                                const team = teams.find(t => t.id === e.target.value);
                                handleSeriesUpdate(s, {
                                  team2_id: e.target.value || undefined,
                                  team2_name: team?.name,
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            >
                              <option value="">Select team...</option>
                              {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              placeholder="Seed (1-10)"
                              value={s.team2_seed || ''}
                              onChange={(e) => handleSeriesUpdate(s, {
                                team2_seed: e.target.value ? parseInt(e.target.value) : undefined,
                              })}
                              className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteSeries(s.id)}
                          className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Round</label>
                          <select
                            value={s.round_name}
                            onChange={(e) => handleSeriesUpdate(s, {
                              round_name: e.target.value,
                              round_number: roundNumbers[e.target.value] || 1,
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            {rounds.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Team 1 Wins</label>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            value={s.team1_wins || 0}
                            onChange={(e) => handleSeriesUpdate(s, { team1_wins: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Team 2 Wins</label>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            value={s.team2_wins || 0}
                            onChange={(e) => handleSeriesUpdate(s, { team2_wins: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Winner</label>
                          <select
                            value={s.winner_team_id || ''}
                            onChange={(e) => {
                              const team = teams.find(t => t.id === e.target.value);
                              handleSeriesUpdate(s, {
                                winner_team_id: e.target.value || undefined,
                                winner_team_name: team?.name,
                                is_complete: !!e.target.value,
                              });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            <option value="">No winner yet</option>
                            {s.team1_id && (
                              <option value={s.team1_id}>{teams.find(t => t.id === s.team1_id)?.name || s.team1_name}</option>
                            )}
                            {s.team2_id && (
                              <option value={s.team2_id}>{teams.find(t => t.id === s.team2_id)?.name || s.team2_name}</option>
                            )}
                          </select>
                        </div>
                      </div>
                      
                      {currentUserPlayer && currentUserPlayer.team_id && 
                        (s.team1_id === currentUserPlayer.team_id || s.team2_id === currentUserPlayer.team_id) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">Player Games in This Series:</div>
                            {(() => {
                              const opponentTeamId = s.team1_id === currentUserPlayer.team_id ? s.team2_id : s.team1_id;
                              const opponentTeam = opponentTeamId ? teams.find(t => t.id === opponentTeamId) : null;
                              
                              const seriesGames = allStats.filter(game => 
                                game.player_id === currentUserPlayer.id &&
                                game.season_id === selectedSeason &&
                                game.is_playoff_game &&
                                (game.opponent_team?.id === opponentTeamId || game.opponent_team_name === opponentTeam?.name)
                              );
                              
                              return seriesGames.length > 0 ? (
                                <div className="space-y-1">
                                  {seriesGames.map(game => (
                                    <div key={game.id} className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                                      {new Date(game.game_date).toLocaleDateString()} - 
                                      {game.is_home ? ' vs ' : ' @ '}
                                      {getTeamAbbreviation(game.opponent_team?.name || game.opponent_team_name || '')} - 
                                      {game.points || 0} PTS, {game.rebounds || 0} REB, {game.assists || 0} AST
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">No games recorded for this series yet</div>
                              );
                            })()}
                          </div>
                        )
                      }
                    </div>
                  ))}
                  
                  {editingSeries && editingSeries.round_name === round && (
                    <div className="border-2 border-blue-300 rounded p-3 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">New Series</h5>
                        <button
                          onClick={() => onEditingSeriesChange(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Team 1</label>
                          <select
                            value={editingSeries.team1_id || ''}
                            onChange={(e) => {
                              const team = teams.find(t => t.id === e.target.value);
                              handleEditingSeriesUpdate({
                                team1_id: e.target.value || undefined,
                                team1_name: team?.name,
                              });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            <option value="">Select team...</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Seed (1-10)"
                            value={editingSeries.team1_seed || ''}
                            onChange={(e) => handleEditingSeriesUpdate({
                              team1_seed: e.target.value ? parseInt(e.target.value) : undefined,
                            })}
                            className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Team 2</label>
                          <select
                            value={editingSeries.team2_id || ''}
                            onChange={(e) => {
                              const team = teams.find(t => t.id === e.target.value);
                              handleEditingSeriesUpdate({
                                team2_id: e.target.value || undefined,
                                team2_name: team?.name,
                              });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            <option value="">Select team...</option>
                            {teams.map(team => (
                              <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Seed (1-10)"
                            value={editingSeries.team2_seed || ''}
                            onChange={(e) => handleEditingSeriesUpdate({
                              team2_seed: e.target.value ? parseInt(e.target.value) : undefined,
                            })}
                            className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Round</label>
                          <select
                            value={editingSeries.round_name}
                            onChange={(e) => handleEditingSeriesUpdate({
                              round_name: e.target.value,
                              round_number: roundNumbers[e.target.value] || 1,
                            })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            {rounds.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Team 1 Wins</label>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            value={editingSeries.team1_wins || 0}
                            onChange={(e) => handleEditingSeriesUpdate({ team1_wins: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Team 2 Wins</label>
                          <input
                            type="number"
                            min="0"
                            max="7"
                            value={editingSeries.team2_wins || 0}
                            onChange={(e) => handleEditingSeriesUpdate({ team2_wins: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Winner</label>
                          <select
                            value={editingSeries.winner_team_id || ''}
                            onChange={(e) => {
                              const team = teams.find(t => t.id === e.target.value);
                              handleEditingSeriesUpdate({
                                winner_team_id: e.target.value || undefined,
                                winner_team_name: team?.name,
                                is_complete: !!e.target.value,
                              });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            <option value="">No winner yet</option>
                            {editingSeries.team1_id && (
                              <option value={editingSeries.team1_id}>
                                {teams.find(t => t.id === editingSeries.team1_id)?.name || editingSeries.team1_name}
                              </option>
                            )}
                            {editingSeries.team2_id && (
                              <option value={editingSeries.team2_id}>
                                {teams.find(t => t.id === editingSeries.team2_id)?.name || editingSeries.team2_name}
                              </option>
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            onSaveSeries(editingSeries);
                            onEditingSeriesChange(null);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                        >
                          Save Series
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

