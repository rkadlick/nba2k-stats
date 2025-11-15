'use client';

import { useMemo } from 'react';
import { PlayerGameStatsWithDetails } from '@/lib/types';
import { getStatsFromGame, isDoubleDouble, isTripleDouble } from '@/lib/statHelpers';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';

interface StatTableProps {
  stats: PlayerGameStatsWithDetails[];
  playerName: string;
  isEditMode?: boolean;
  onEditGame?: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame?: (gameId: string) => void;
}

// NBA scoreboard order for stats
const NBA_STAT_ORDER = [
  'minutes',
  'points',
  'rebounds',
  'assists',
  'steals',
  'blocks',
  'turnovers',
  'fouls',
  'plus_minus',
  'fg', // Combined FG made/attempted
  'threes', // Combined 3PT made/attempted
  'ft', // Combined FT made/attempted
];

export default function StatTable({ 
  stats, 
  playerName, 
  isEditMode = false,
  onEditGame,
  onDeleteGame 
}: StatTableProps) {
  // Get stat keys in NBA order, excluding percentages, is_win, and scores
  const statKeys = useMemo(() => {
    const keys = new Set<string>();
    stats.forEach((game) => {
      const gameStats = getStatsFromGame(game);
      Object.keys(gameStats).forEach((key) => {
        // Exclude score columns, percentages, is_win, and combine shooting stats
        if (key !== 'player_score' && key !== 'opponent_score' && 
            key !== 'fg_made' && key !== 'fg_attempted' &&
            key !== 'threes_made' && key !== 'threes_attempted' &&
            key !== 'ft_made' && key !== 'ft_attempted' &&
            key !== 'fg_percentage' && key !== 'ft_percentage' && 
            key !== 'three_pt_percentage' && key !== 'is_win') {
          keys.add(key);
        }
      });
      // Add combined shooting stats if they exist
      if (gameStats.fg_made !== undefined || gameStats.fg_attempted !== undefined) {
        keys.add('fg');
      }
      if (gameStats.threes_made !== undefined || gameStats.threes_attempted !== undefined) {
        keys.add('threes');
      }
      if (gameStats.ft_made !== undefined || gameStats.ft_attempted !== undefined) {
        keys.add('ft');
      }
    });
    
    // Note: double_doubles and triple_doubles are NOT included in game rows
    // They only appear in season totals
    
    // Sort by NBA order, then alphabetically for any extras
    const ordered: string[] = [];
    const extras: string[] = [];
    
    NBA_STAT_ORDER.forEach(key => {
      if (keys.has(key)) {
        ordered.push(key);
      }
    });
    
    keys.forEach(key => {
      if (!NBA_STAT_ORDER.includes(key)) {
        extras.push(key);
      }
    });
    
    return [...ordered, ...extras.sort()];
  }, [stats]);

  // Season totals stat keys (includes percentages and DD/TD)
  const seasonTotalsKeys = useMemo(() => {
    const baseKeys = [...statKeys];
    // Add percentage columns if shooting stats exist
    if (statKeys.includes('fg')) {
      baseKeys.push('fg_percentage');
    }
    if (statKeys.includes('threes')) {
      baseKeys.push('three_pt_percentage');
    }
    if (statKeys.includes('ft')) {
      baseKeys.push('ft_percentage');
    }
    // Add double/triple doubles to season totals only
    baseKeys.push('double_doubles');
    baseKeys.push('triple_doubles');
    return baseKeys;
  }, [statKeys]);

  // Calculate totals and averages
  const totals = useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    let doubleDoubles = 0;
    let tripleDoubles = 0;

    stats.forEach((game) => {
      const gameStats = getStatsFromGame(game);
      Object.entries(gameStats).forEach(([key, value]) => {
        if (typeof value === 'number' && 
            key !== 'player_score' && key !== 'opponent_score') {
          totals[key] = (totals[key] || 0) + value;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      
      // Calculate double/triple doubles
      if (isDoubleDouble(game)) {
        doubleDoubles++;
      }
      if (isTripleDouble(game)) {
        tripleDoubles++;
      }
    });

    totals.double_doubles = doubleDoubles;
    totals.triple_doubles = tripleDoubles;

    const averages: Record<string, number> = {};
    Object.keys(totals).forEach((key) => {
      if (counts[key] > 0 && key !== 'double_doubles' && key !== 'triple_doubles') {
        averages[key] = totals[key] / counts[key];
      }
    });

    return { totals, averages, count: stats.length };
  }, [stats]);

  const getOpponentDisplay = (game: PlayerGameStatsWithDetails) => {
    const teamName = game.opponent_team?.name || game.opponent_team_name || 'Unknown';
    const abbrev = getTeamAbbreviation(teamName);
    return game.is_home ? `vs ${abbrev}` : `@ ${abbrev}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatValue = (game: PlayerGameStatsWithDetails, key: string): string => {
    const gameStats = getStatsFromGame(game);
    
    // Note: double_doubles and triple_doubles should not appear in game rows
    // They are only calculated for season totals
    
    // Handle combined shooting stats
    if (key === 'fg') {
      const made = gameStats.fg_made;
      const attempted = gameStats.fg_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return '–';
    }
    if (key === 'threes') {
      const made = gameStats.threes_made;
      const attempted = gameStats.threes_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return '–';
    }
    if (key === 'ft') {
      const made = gameStats.ft_made;
      const attempted = gameStats.ft_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return '–';
    }
    
    const value = gameStats[key];
    if (value !== null && value !== undefined) {
      return typeof value === 'number'
        ? value.toFixed(value % 1 === 0 ? 0 : 1)
        : String(value);
    }
    return '–';
  };

  const getStatLabel = (key: string): string => {
    const labels: Record<string, string> = {
      minutes: 'MIN',
      points: 'PTS',
      rebounds: 'REB',
      offensive_rebounds: 'OR',
      assists: 'AST',
      steals: 'STL',
      blocks: 'BLK',
      turnovers: 'TO',
      fouls: 'PF',
      plus_minus: '+/-',
      fg: 'FG',
      threes: '3PT',
      ft: 'FT',
      fg_percentage: 'FG%',
      ft_percentage: 'FT%',
      three_pt_percentage: '3PT%',
      double_doubles: 'DD',
      triple_doubles: 'TD',
    };
    return labels[key] || key.replace(/_/g, ' ').toUpperCase();
  };

  const getStatTooltip = (key: string): string => {
    const tooltips: Record<string, string> = {
      offensive_rebounds: 'Offensive Rebounds',
    };
    return tooltips[key] || '';
  };


  const getTotalValue = (key: string, forSeasonTotals = false): string => {
    // Handle double/triple doubles - these are totals, not averages
    if (key === 'double_doubles' || key === 'triple_doubles') {
      const value = totals.totals[key];
      return value !== undefined ? value.toString() : '0';
    }
    
    // Handle percentage columns (only in season totals)
    if (key === 'fg_percentage') {
      const made = totals.totals.fg_made;
      const attempted = totals.totals.fg_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted * 100).toFixed(1);
        return `${pct}%`;
      }
      return '–';
    }
    if (key === 'three_pt_percentage') {
      const made = totals.totals.threes_made;
      const attempted = totals.totals.threes_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted * 100).toFixed(1);
        return `${pct}%`;
      }
      return '–';
    }
    if (key === 'ft_percentage') {
      const made = totals.totals.ft_made;
      const attempted = totals.totals.ft_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted * 100).toFixed(1);
        return `${pct}%`;
      }
      return '–';
    }
    
    if (key === 'fg') {
      const made = totals.totals.fg_made;
      const attempted = totals.totals.fg_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return '–';
    }
    if (key === 'threes') {
      const made = totals.totals.threes_made;
      const attempted = totals.totals.threes_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return '–';
    }
    if (key === 'ft') {
      const made = totals.totals.ft_made;
      const attempted = totals.totals.ft_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return '–';
    }
    
    const value = totals.totals[key];
    if (value !== undefined) {
      return value.toFixed(value % 1 === 0 ? 0 : 1);
    }
    return '–';
  };

  const getAvgValue = (key: string): string => {
    // Handle double/triple doubles - show as dash in averages row
    if (key === 'double_doubles' || key === 'triple_doubles') {
      return '–';
    }
    
    // Handle percentage columns
    if (key === 'fg_percentage') {
      const made = totals.totals.fg_made;
      const attempted = totals.totals.fg_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted * 100).toFixed(1);
        return `${pct}%`;
      }
      return '–';
    }
    if (key === 'three_pt_percentage') {
      const made = totals.totals.threes_made;
      const attempted = totals.totals.threes_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted * 100).toFixed(1);
        return `${pct}%`;
      }
      return '–';
    }
    if (key === 'ft_percentage') {
      const made = totals.totals.ft_made;
      const attempted = totals.totals.ft_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted * 100).toFixed(1);
        return `${pct}%`;
      }
      return '–';
    }
    
    if (key === 'fg' || key === 'threes' || key === 'ft') {
      // For shooting stats, show percentage in averages
      let made: number | undefined;
      let attempted: number | undefined;
      
      if (key === 'fg') {
        made = totals.totals.fg_made;
        attempted = totals.totals.fg_attempted;
      } else if (key === 'threes') {
        made = totals.totals.threes_made;
        attempted = totals.totals.threes_attempted;
      } else if (key === 'ft') {
        made = totals.totals.ft_made;
        attempted = totals.totals.ft_attempted;
      }
      
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted * 100).toFixed(1);
        return `${pct}%`;
      }
      return '–';
    }
    
    const value = totals.averages[key];
    if (value !== undefined) {
      return value.toFixed(value % 1 === 0 ? 0 : 1);
    }
    return '–';
  };

  if (stats.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
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
              <th className="text-left px-1.5 py-1 font-semibold text-xs text-gray-700">Date</th>
              <th className="text-left px-1.5 py-1 font-semibold text-xs text-gray-700">Opp</th>
              <th className="text-center px-1.5 py-1 font-semibold text-xs text-gray-700">W/L</th>
              {isEditMode && (
                <th className="text-center px-1 py-1 font-semibold text-xs text-gray-700 w-16">Actions</th>
              )}
              {statKeys.map((key) => {
                const tooltip = getStatTooltip(key);
                return (
                <th
                  key={key}
                    className="text-right px-1.5 py-1 font-semibold text-xs text-gray-700 whitespace-nowrap"
                    title={tooltip || undefined}
                >
                    {getStatLabel(key)}
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {stats
              .sort((a, b) => new Date(b.game_date || b.created_at || '').getTime() - new Date(a.game_date || a.created_at || '').getTime())
              .map((game) => {
                return (
                  <tr
                    key={game.id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-1.5 py-0.5 text-xs text-gray-900 whitespace-nowrap">
                      {formatDate(game.game_date || game.created_at || '')}
                    </td>
                    <td className="px-1.5 py-0.5 text-xs font-medium text-gray-900">
                      <div>{getOpponentDisplay(game)}</div>
                        {game.is_playoff_game && (
                        <div className="text-[10px] text-purple-600 font-semibold mt-0.5">PO</div>
                      )}
                    </td>
                    <td className="px-1.5 py-0.5 text-center text-xs text-gray-900">
                      <div className={`inline-block px-1 py-0.5 text-[10px] font-semibold rounded ${
                        game.is_win ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {game.is_win ? 'W' : 'L'}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {game.player_score}-{game.opponent_score}
                      </div>
                    </td>
                    {isEditMode && (
                      <td className="px-1 py-0.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {onEditGame && (
                            <button
                              onClick={() => onEditGame(game)}
                              className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
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
                              className="px-1.5 py-0.5 text-[10px] font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Delete game"
                            >
                              Del
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    {statKeys.map((key) => {
                      return (
                        <td key={key} className="text-right px-1.5 py-0.5 text-xs text-gray-700 whitespace-nowrap">
                          {getStatValue(game, key)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      
      {/* Season Totals - Separate section with own headers */}
      <div className="border-t-4 border-gray-400 bg-gray-100 mt-2">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-1.5 py-1.5 font-semibold text-xs text-gray-900">Season Totals</th>
              <th></th>
              <th></th>
              {isEditMode && <th></th>}
              {seasonTotalsKeys.map((key) => {
                const tooltip = getStatTooltip(key);
                return (
                  <th
                    key={key}
                    className="text-right px-1.5 py-1.5 font-semibold text-xs text-gray-900 whitespace-nowrap"
                    title={tooltip || undefined}
                  >
                    {getStatLabel(key)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50">
              <td className="px-1.5 py-1 text-xs font-semibold text-gray-900">Totals</td>
              <td></td>
              <td></td>
              {isEditMode && <td></td>}
              {seasonTotalsKeys.map((key) => (
                <td key={key} className="text-right px-1.5 py-1 text-xs font-semibold text-gray-900 whitespace-nowrap">
                  {getTotalValue(key, true)}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-100">
              <td className="px-1.5 py-1 text-xs font-semibold text-gray-900">Avg</td>
              <td></td>
              <td></td>
              {isEditMode && <td></td>}
              {seasonTotalsKeys.map((key) => (
                <td key={key} className="text-right px-1.5 py-1 text-xs font-semibold text-gray-900 whitespace-nowrap">
                  {getAvgValue(key)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
