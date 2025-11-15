'use client';

import { useMemo } from 'react';
import { PlayerGameStatsWithDetails } from '@/lib/types';
import { getStatsFromGame, getAllStatKeys } from '@/lib/statHelpers';

interface StatTableProps {
  stats: PlayerGameStatsWithDetails[];
  playerName: string;
  isEditMode?: boolean;
  onEditGame?: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame?: (gameId: string) => void;
}

export default function StatTable({ 
  stats, 
  playerName, 
  isEditMode = false,
  onEditGame,
  onDeleteGame 
}: StatTableProps) {
  // Get all unique stat keys from all games
  const statKeys = useMemo(() => {
    return getAllStatKeys(stats);
  }, [stats]);

  // Calculate totals and averages
  const totals = useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    stats.forEach((game) => {
      const gameStats = getStatsFromGame(game);
      Object.entries(gameStats).forEach(([key, value]) => {
        if (typeof value === 'number') {
          totals[key] = (totals[key] || 0) + value;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });

    const averages: Record<string, number> = {};
    Object.keys(totals).forEach((key) => {
      if (counts[key] > 0) {
        averages[key] = totals[key] / counts[key];
      }
    });

    return { totals, averages, count: stats.length };
  }, [stats]);

  const getOpponentDisplay = (game: PlayerGameStatsWithDetails) => {
    const teamName = game.opponent_team?.name || game.opponent_team_name || 'Unknown';
    return game.is_home ? `vs ${teamName}` : `@ ${teamName}`;
  };

  if (stats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No stats recorded yet for this season.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-lg border border-gray-200 bg-white">
      {/* Scrollable table body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="text-left p-2 font-semibold text-xs text-gray-700">Opponent</th>
              {isEditMode && (
                <th className="text-center p-2 font-semibold text-xs text-gray-700 w-20">Actions</th>
              )}
              {statKeys.map((key) => (
                <th
                  key={key}
                  className="text-right p-2 font-semibold text-xs text-gray-700 capitalize"
                >
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats
              .sort((a, b) => new Date(b.game_date || b.created_at || '').getTime() - new Date(a.game_date || a.created_at || '').getTime())
              .map((game) => {
                const gameStats = getStatsFromGame(game);
                return (
                  <tr
                    key={game.id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                  >
                    <td className="p-2 text-xs font-medium text-gray-900">
                      <div className="flex items-center gap-1.5">
                        {getOpponentDisplay(game)}
                        {game.is_playoff_game && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                            PO
                          </span>
                        )}
                        {game.is_win && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                            W
                          </span>
                        )}
                        {!game.is_win && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                            L
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {game.player_score} - {game.opponent_score}
                      </div>
                    </td>
                    {isEditMode && (
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onEditGame && (
                            <button
                              onClick={() => onEditGame(game)}
                              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Edit game"
                            >
                              Edit
                            </button>
                          )}
                          {onDeleteGame && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this game?')) {
                                  onDeleteGame(game.id);
                                }
                              }}
                              className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Delete game"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    {statKeys.map((key) => {
                      const value = gameStats[key];
                      return (
                        <td key={key} className="text-right p-2 text-xs text-gray-700">
                          {value !== null && value !== undefined
                            ? typeof value === 'number'
                              ? value.toFixed(value % 1 === 0 ? 0 : 1)
                              : String(value)
                            : '–'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      
      {/* Fixed footer with totals */}
      <div className="border-t-2 border-gray-300 bg-gray-50">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="p-2 text-xs font-semibold text-gray-900">Totals</td>
              {isEditMode && <td></td>}
              {statKeys.map((key) => (
                <td key={key} className="text-right p-2 text-xs font-semibold text-gray-900">
                  {totals.totals[key] !== undefined
                    ? totals.totals[key].toFixed(
                        totals.totals[key] % 1 === 0 ? 0 : 1
                      )
                    : '–'}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-100">
              <td className="p-2 text-xs font-semibold text-gray-900">Avg</td>
              {isEditMode && <td></td>}
              {statKeys.map((key) => (
                <td key={key} className="text-right p-2 text-xs font-semibold text-gray-900">
                  {totals.averages[key] !== undefined
                    ? totals.averages[key].toFixed(
                        totals.averages[key] % 1 === 0 ? 0 : 1
                      )
                    : '–'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
