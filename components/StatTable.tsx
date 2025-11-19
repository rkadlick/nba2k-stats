'use client';

import { useMemo } from 'react';
import { PlayerGameStatsWithDetails } from '@/lib/types';
import { getStatsFromGame, isDoubleDouble, isTripleDouble } from '@/lib/statHelpers';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';

import { SeasonTotals } from '@/lib/types';

interface StatTableProps {
  stats: PlayerGameStatsWithDetails[];
  isEditMode?: boolean;
  onEditGame?: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame?: (gameId: string) => void;
  seasonTotals?: SeasonTotals | null;
  playerTeamColor?: string; // Player's team primary color for key game indicator
  showKeyGames?: boolean; // Whether to show key game indicators (false in key-games view)
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
  isEditMode = false,
  onEditGame,
  onDeleteGame,
  seasonTotals,
  playerTeamColor,
  showKeyGames = true
}: StatTableProps) {
  // Get stat keys in NBA order, excluding percentages, is_win, and scores
  // Note: double_doubles and triple_doubles are NOT included here - they only appear in season totals
  const statKeys = useMemo(() => {
    // If we have season totals from database, show ALL possible stats from NBA_STAT_ORDER
    // (season totals are maintained by Supabase triggers, so we trust the database)
    if (seasonTotals) {
      // Return all NBA stats in order, percentages are shown in averages row
      // Exclude double_doubles and triple_doubles - they only appear in season totals section
      return [
        ...NBA_STAT_ORDER, // minutes, points, rebounds, assists, steals, blocks, turnovers, fouls, plus_minus, fg, threes, ft
      ];
    }

    // Fallback: derive stat keys from games if no season totals available
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
  }, [stats, seasonTotals]);

  // Season totals stat keys (percentages shown in averages row, not separate columns)
  const seasonTotalsKeys = useMemo(() => {
    const baseKeys = [...statKeys];
    // Add double/triple doubles to season totals only if not already included
    if (!baseKeys.includes('double_doubles')) {
      baseKeys.push('double_doubles');
    }
    if (!baseKeys.includes('triple_doubles')) {
      baseKeys.push('triple_doubles');
    }
    return baseKeys;
  }, [statKeys]);

  // Use season totals from database when available (preferred)
  // Only calculate from games as fallback if seasonTotals not provided
  const totals = useMemo(() => {
    // Always use database season totals if available (from Supabase triggers)
    if (seasonTotals) {
      const totals: Record<string, number> = {
        points: seasonTotals.total_points,
        rebounds: seasonTotals.total_rebounds,
        assists: seasonTotals.total_assists,
        steals: seasonTotals.total_steals,
        blocks: seasonTotals.total_blocks,
        turnovers: seasonTotals.total_turnovers,
        minutes: seasonTotals.total_minutes,
        fouls: seasonTotals.total_fouls,
        plus_minus: seasonTotals.total_plus_minus,
        fg_made: seasonTotals.total_fg_made,
        fg_attempted: seasonTotals.total_fg_attempted,
        threes_made: seasonTotals.total_threes_made,
        threes_attempted: seasonTotals.total_threes_attempted,
        ft_made: seasonTotals.total_ft_made,
        ft_attempted: seasonTotals.total_ft_attempted,
        double_doubles: seasonTotals.double_doubles || 0,
        triple_doubles: seasonTotals.triple_doubles || 0,
      };

      const averages: Record<string, number> = {};
      if (seasonTotals.avg_points !== undefined && seasonTotals.avg_points !== null) averages.points = seasonTotals.avg_points;
      if (seasonTotals.avg_rebounds !== undefined && seasonTotals.avg_rebounds !== null) averages.rebounds = seasonTotals.avg_rebounds;
      if (seasonTotals.avg_assists !== undefined && seasonTotals.avg_assists !== null) averages.assists = seasonTotals.avg_assists;
      if (seasonTotals.avg_steals !== undefined && seasonTotals.avg_steals !== null) averages.steals = seasonTotals.avg_steals;
      if (seasonTotals.avg_blocks !== undefined && seasonTotals.avg_blocks !== null) averages.blocks = seasonTotals.avg_blocks;
      if (seasonTotals.avg_turnovers !== undefined && seasonTotals.avg_turnovers !== null) averages.turnovers = seasonTotals.avg_turnovers;
      if (seasonTotals.avg_minutes !== undefined && seasonTotals.avg_minutes !== null) averages.minutes = seasonTotals.avg_minutes;
      if (seasonTotals.avg_fouls !== undefined && seasonTotals.avg_fouls !== null) averages.fouls = seasonTotals.avg_fouls;
      if (seasonTotals.avg_plus_minus !== undefined && seasonTotals.avg_plus_minus !== null) averages.plus_minus = seasonTotals.avg_plus_minus;

      return { totals, averages, count: seasonTotals.games_played || 0 };
    }

    // Fallback: calculate from games only if seasonTotals not available
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
  }, [stats, seasonTotals]);

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


  const getTotalValue = (key: string): string => {
    // Handle double/triple doubles - these are totals, not averages
    if (key === 'double_doubles' || key === 'triple_doubles') {
      const value = totals.totals[key];
      return value !== undefined ? value.toString() : '0';
    }
    
    // Handle percentage columns (only in season totals) - display as decimals (0.722)
    if (key === 'fg_percentage') {
      const made = totals.totals.fg_made;
      const attempted = totals.totals.fg_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return '–';
    }
    if (key === 'three_pt_percentage') {
      const made = totals.totals.threes_made;
      const attempted = totals.totals.threes_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return '–';
    }
    if (key === 'ft_percentage') {
      const made = totals.totals.ft_made;
      const attempted = totals.totals.ft_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
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
    
    // Handle percentage columns - display as decimals (0.722)
    if (key === 'fg_percentage') {
      const made = totals.totals.fg_made;
      const attempted = totals.totals.fg_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return '–';
    }
    if (key === 'three_pt_percentage') {
      const made = totals.totals.threes_made;
      const attempted = totals.totals.threes_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return '–';
    }
    if (key === 'ft_percentage') {
      const made = totals.totals.ft_made;
      const attempted = totals.totals.ft_attempted;
      if (made !== undefined && attempted !== undefined && attempted > 0) {
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return '–';
    }
    
    if (key === 'fg' || key === 'threes' || key === 'ft') {
      // For shooting stats, show percentage in averages as decimals (0.722)
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
        const pct = (made / attempted).toFixed(3);
        return pct;
      }
      return '–';
    }
    
    const value = totals.averages[key];
    if (value !== undefined) {
      // Format with 1 decimal place for per-game averages
      return value.toFixed(1);
    }
    return '–';
  };

  // Show games table if we have games
  // Show season totals if we have season totals from database (preferred) or games (fallback)
  const showGamesTable = stats.length > 0;
  const showSeasonTotals = seasonTotals !== null || stats.length > 0;

  if (stats.length === 0 && !seasonTotals) {
    return null; // Let parent handle "No games recorded" message
  }

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white">
      {/* Games table - only show if games exist */}
      {showGamesTable && (
        <>
      {/* Scrollable table body */}
      <div className="overflow-auto">
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
                          <div className="flex items-center gap-1">
                            {getOpponentDisplay(game)}
                            {showKeyGames && game.is_key_game && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="inline-block align-middle flex-shrink-0"
                                title="Key Game"
                                style={{ 
                                  color: playerTeamColor || '#000000'
                                }}
                              >
                                {/* Fancy 4-pointed star */}
                                <path
                                  d="M12 2L14.5 9L22 9L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9L9.5 9L12 2Z"
                                  fill="currentColor"
                                  stroke="currentColor"
                                  strokeWidth="0.5"
                                />
                              </svg>
                            )}
                          </div>
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
        </>
      )}
      
      {/* Season Totals - Separate section with own headers */}
      {showSeasonTotals && (
        <div className={`bg-gray-100 ${showGamesTable ? 'border-t-4 border-gray-400 mt-4' : ''}`}>
        {/* Horizontal scroll container for split view */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-full">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-sm text-gray-900 sticky left-0 bg-gray-100 z-10 border-b border-gray-300">Season Totals</th>
                {seasonTotalsKeys.map((key) => {
                  const tooltip = getStatTooltip(key);
                  return (
                    <th
                      key={key}
                      className="text-right px-2 py-2 font-semibold text-xs text-gray-900 whitespace-nowrap border-b border-gray-300"
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
                <td className="px-3 py-2 text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">Totals</td>
                {seasonTotalsKeys.map((key) => (
                  <td key={key} className="text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">
                    {getTotalValue(key)}
                </td>
              ))}
            </tr>
            <tr className="bg-gray-100">
                <td className="px-3 py-2 text-sm font-semibold text-gray-900 sticky left-0 bg-gray-100 z-10">Avg</td>
                {seasonTotalsKeys.map((key) => (
                  <td key={key} className="text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">
                    {getAvgValue(key)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
        </div>
      )}
    </div>
  );
}
