'use client';

import { useMemo } from 'react';
import { PlayerGameStatsWithDetails } from '@/lib/types';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';

interface GameStatsTableProps {
  games: PlayerGameStatsWithDetails[];
  playerName: string;
}

export default function GameStatsTable({ games, playerName }: GameStatsTableProps) {
  // Define stat columns in order
  const statColumns = [
    { key: 'points', label: 'PTS' },
    { key: 'rebounds', label: 'REB' },
    { key: 'offensive_rebounds', label: 'OREB' },
    { key: 'assists', label: 'AST' },
    { key: 'steals', label: 'STL' },
    { key: 'blocks', label: 'BLK' },
    { key: 'turnovers', label: 'TO' },
    { key: 'fouls', label: 'PF' },
    { key: 'plus_minus', label: '+/-' },
    { key: 'fg_made', label: 'FGM' },
    { key: 'fg_attempted', label: 'FGA' },
    { key: 'threes_made', label: '3PM' },
    { key: 'threes_attempted', label: '3PA' },
    { key: 'ft_made', label: 'FTM' },
    { key: 'ft_attempted', label: 'FTA' },
    { key: 'minutes', label: 'MIN' },
  ];

  // Calculate totals and averages
  const totals = useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};

    games.forEach((game) => {
      statColumns.forEach(({ key }) => {
        const value = game[key as keyof typeof game];
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

    // Calculate percentages
    const fgPct = totals.fg_attempted > 0 
      ? (totals.fg_made / totals.fg_attempted) * 100 
      : 0;
    const threePct = totals.threes_attempted > 0 
      ? (totals.threes_made / totals.threes_attempted) * 100 
      : 0;
    const ftPct = totals.ft_attempted > 0 
      ? (totals.ft_made / totals.ft_attempted) * 100 
      : 0;

    return { totals, averages, counts, fgPct, threePct, ftPct, gamesPlayed: games.length };
  }, [games]);

  const getOpponentDisplay = (game: PlayerGameStatsWithDetails) => {
    const teamName = game.opponent_team?.name || game.opponent_team_name || 'Unknown';
    const abbrev = getTeamAbbreviation(teamName);
    return game.is_home ? `vs ${abbrev}` : `@ ${abbrev}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No games recorded yet for this season.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
            <th className="text-left p-3 font-semibold text-sm text-gray-700">Date</th>
            <th className="text-left p-3 font-semibold text-sm text-gray-700">Opponent</th>
            <th className="text-center p-3 font-semibold text-sm text-gray-700">Score</th>
            <th className="text-center p-3 font-semibold text-sm text-gray-700">W/L</th>
            {statColumns.map(({ key, label }) => (
              <th
                key={key}
                className="text-right p-3 font-semibold text-sm text-gray-700"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games
            .sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime())
            .map((game) => (
              <tr
                key={game.id}
                className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                  game.is_key_game ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="p-3 text-sm text-gray-600">
                  {formatDate(game.game_date)}
                </td>
                <td className="p-3 text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {getOpponentDisplay(game)}
                    {game.is_playoff_game && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
                        PO{game.playoff_game_number ? ` G${game.playoff_game_number}` : ''}
                      </span>
                    )}
                    {game.is_key_game && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                        KEY
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-sm text-gray-700 text-center">
                  <span className={game.is_win ? 'font-semibold text-green-600' : 'text-gray-600'}>
                    {game.player_score}
                  </span>
                  {' - '}
                  <span className={!game.is_win ? 'font-semibold text-red-600' : 'text-gray-600'}>
                    {game.opponent_score}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    game.is_win 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {game.is_win ? 'W' : 'L'}
                  </span>
                </td>
                {statColumns.map(({ key }) => {
                  const value = game[key as keyof typeof game];
                  return (
                    <td key={key} className="text-right p-3 text-sm text-gray-700">
                      {value !== null && value !== undefined
                        ? typeof value === 'number'
                          ? key === 'minutes'
                            ? value.toFixed(1)
                            : value.toString()
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
            <td colSpan={4} className="p-3 text-sm font-semibold text-gray-900">
              Totals ({totals.gamesPlayed} games)
            </td>
            {statColumns.map(({ key }) => (
              <td key={key} className="text-right p-3 text-sm font-semibold text-gray-900">
                {totals.totals[key] !== undefined
                  ? key === 'minutes'
                    ? totals.totals[key].toFixed(1)
                    : totals.totals[key].toString()
                  : '–'}
              </td>
            ))}
          </tr>
          <tr className="bg-gray-100">
            <td colSpan={4} className="p-3 text-sm font-semibold text-gray-900">Avg</td>
            {statColumns.map(({ key }) => (
              <td key={key} className="text-right p-3 text-sm font-semibold text-gray-900">
                {totals.averages[key] !== undefined
                  ? key === 'minutes'
                    ? totals.averages[key].toFixed(1)
                    : totals.averages[key].toFixed(1)
                  : '–'}
              </td>
            ))}
          </tr>
          <tr className="bg-blue-50">
            <td colSpan={4} className="p-3 text-sm font-semibold text-gray-900">Percentages</td>
            <td colSpan={2} className="p-3 text-sm text-gray-700 text-right">
              FG: {totals.fgPct.toFixed(1)}%
            </td>
            <td colSpan={2} className="p-3 text-sm text-gray-700 text-right">
              3PT: {totals.threePct.toFixed(1)}%
            </td>
            <td colSpan={2} className="p-3 text-sm text-gray-700 text-right">
              FT: {totals.ftPct.toFixed(1)}%
            </td>
            <td colSpan={10}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

