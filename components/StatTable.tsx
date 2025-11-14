'use client';

import { useMemo } from 'react';
import { PlayerStatsWithDetails } from '@/lib/types';

interface StatTableProps {
  stats: PlayerStatsWithDetails[];
  playerName: string;
}

export default function StatTable({ stats, playerName }: StatTableProps) {
  // Get all unique stat keys from all games
  const statKeys = useMemo(() => {
    const keys = new Set<string>();
    stats.forEach((game) => {
      Object.keys(game.stats || {}).forEach((key) => keys.add(key));
    });
    return Array.from(keys).sort();
  }, [stats]);

  // Calculate totals and averages
  const totals = useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    stats.forEach((game) => {
      Object.entries(game.stats || {}).forEach(([key, value]) => {
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

  const getOpponentDisplay = (game: PlayerStatsWithDetails) => {
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
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
            <th className="text-left p-3 font-semibold text-sm text-gray-700">Opponent</th>
            {statKeys.map((key) => (
              <th
                key={key}
                className="text-right p-3 font-semibold text-sm text-gray-700 capitalize"
              >
                {key.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats
            .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
            .map((game) => (
              <tr
                key={game.id}
                className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
              >
                <td className="p-3 text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {getOpponentDisplay(game)}
                    {game.is_playoff_game && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                        PO
                      </span>
                    )}
                  </div>
                </td>
                {statKeys.map((key) => {
                  const value = game.stats?.[key];
                  return (
                    <td key={key} className="text-right p-3 text-sm text-gray-700">
                      {value !== null && value !== undefined
                        ? typeof value === 'number'
                          ? value.toFixed(value % 1 === 0 ? 0 : 1)
                          : String(value)
                        : '–'}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
          <tr>
            <td className="p-3 text-sm font-semibold text-gray-900">Totals</td>
            {statKeys.map((key) => (
              <td key={key} className="text-right p-3 text-sm font-semibold text-gray-900">
                {totals.totals[key] !== undefined
                  ? totals.totals[key].toFixed(
                      totals.totals[key] % 1 === 0 ? 0 : 1
                    )
                  : '–'}
              </td>
            ))}
          </tr>
          <tr className="bg-gray-100">
            <td className="p-3 text-sm font-semibold text-gray-900">Avg</td>
            {statKeys.map((key) => (
              <td key={key} className="text-right p-3 text-sm font-semibold text-gray-900">
                {totals.averages[key] !== undefined
                  ? totals.averages[key].toFixed(
                      totals.averages[key] % 1 === 0 ? 0 : 1
                    )
                  : '–'}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
