'use client';

import { useState } from 'react';
import { Season, PlayerGameStatsWithDetails } from '@/lib/types';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';

interface GamesTabProps {
  selectedSeason: string;
  onSeasonChange: (seasonId: string) => void;
  seasons: Season[];
  seasonGames: PlayerGameStatsWithDetails[];
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
}

export default function GamesTab({
  selectedSeason,
  onSeasonChange,
  seasons,
  seasonGames,
  onEditGame,
  onDeleteGame,
}: GamesTabProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (gameId: string) => {
    if (deleteConfirmId === gameId) {
      // Second click - actually delete
      onDeleteGame(gameId);
      setDeleteConfirmId(null);
    } else {
      // First click - show confirmation
      setDeleteConfirmId(gameId);
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

      {seasonGames.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Games ({seasonGames.length})
          </h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700">Date</th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700">Opp</th>
                  <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-700">Score</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">PTS</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">REB</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">AST</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">STL</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">BLK</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">TO</th>
                  <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">MIN</th>
                  <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {seasonGames.map(game => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                      {new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-900">
                      {getTeamAbbreviation(game.opponent_team?.name || game.opponent_team_name)}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 text-center">
                      <span className={`px-1 py-0.5 rounded text-[10px] font-semibold ${
                        game.is_win ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {game.is_win ? 'W' : 'L'}
                      </span>
                      <span className="ml-1">{game.player_score}-{game.opponent_score}</span>
                    </td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.points || '-'}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.rebounds || '-'}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.assists || '-'}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.steals || '-'}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.blocks || '-'}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.turnovers || '-'}</td>
                    <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.minutes || '-'}</td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEditGame(game)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 hover:bg-blue-50 rounded"
                        >
                          Edit
                        </button>
                        {deleteConfirmId === game.id ? (
                          <button
                            onClick={() => handleDeleteClick(game.id)}
                            className="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteClick(game.id)}
                            className="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No games found for this season.
        </div>
      )}
    </div>
  );
}

