'use client';

import { useMemo } from 'react';
import { PlayerGameStatsWithDetails } from '@/lib/types';
import { getStatsFromGame, isDoubleDouble, isTripleDouble } from '@/lib/statHelpers';

import { SeasonTotals } from '@/lib/types';
import { GameTotals } from './GameTotals';
import { GameLog } from './GameLog';

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
        <GameLog
          games={stats}
          statKeys={statKeys}
          getStatTooltip={getStatTooltip}
          getStatLabel={getStatLabel}
          getStatValue={getStatValue}
          isEditMode={isEditMode}
          onEditGame={onEditGame ?? (() => {})}
          onDeleteGame={onDeleteGame ?? (() => {})}
          playerTeamColor={playerTeamColor ?? '#000000'}
          showKeyGames={showKeyGames}
        />
      )}
      
      {/* Season Totals - Separate section with own headers */}
      {showSeasonTotals && (
        <GameTotals
          seasonTotalsKeys={seasonTotalsKeys}
          getTotalValue={getTotalValue}
          getAvgValue={getAvgValue}
          getStatTooltip={getStatTooltip}
          getStatLabel={getStatLabel}
        />
      )}
    </div>
  );
}
