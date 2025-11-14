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

  if (stats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No stats recorded yet for this season.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left p-2 font-semibold text-sm">Game</th>
            {statKeys.map((key) => (
              <th
                key={key}
                className="text-right p-2 font-semibold text-sm capitalize"
              >
                {key.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats
            .sort((a, b) => b.game_number - a.game_number)
            .map((game) => (
              <tr
                key={game.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="p-2 text-sm font-medium">
                  #{game.game_number}
                  {game.is_playoff_game && (
                    <span className="ml-2 text-xs text-purple-600">PO</span>
                  )}
                </td>
                {statKeys.map((key) => {
                  const value = game.stats?.[key];
                  return (
                    <td key={key} className="text-right p-2 text-sm">
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
        <tfoot className="bg-gray-100 font-semibold">
          <tr className="border-t-2 border-gray-400">
            <td className="p-2 text-sm">Totals</td>
            {statKeys.map((key) => (
              <td key={key} className="text-right p-2 text-sm">
                {totals.totals[key] !== undefined
                  ? totals.totals[key].toFixed(
                      totals.totals[key] % 1 === 0 ? 0 : 1
                    )
                  : '–'}
              </td>
            ))}
          </tr>
          <tr className="border-t border-gray-300">
            <td className="p-2 text-sm">Avg</td>
            {statKeys.map((key) => (
              <td key={key} className="text-right p-2 text-sm">
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

