'use client';

import { useMemo, useState, useEffect } from 'react';
import { PlayerWithTeam, PlayerGameStatsWithDetails, PlayerAwardInfo, Season, SeasonTotals } from '@/lib/types';
import { getStatsFromGame, isDoubleDouble, isTripleDouble } from '@/lib/statHelpers';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabaseClient';

interface CareerViewProps {
  player: PlayerWithTeam;
  allStats: PlayerGameStatsWithDetails[];
  allAwards: PlayerAwardInfo[];
  seasons: Season[];
}

// NBA scoreboard order for stats
const NBA_STAT_ORDER = [
  'minutes',
  'points',
  'rebounds',
  'offensive_rebounds',
  'assists',
  'steals',
  'blocks',
  'turnovers',
  'fouls',
  'plus_minus',
  'fg', // Combined FG made/attempted
  'threes', // Combined 3PT made/attempted
  'ft', // Combined FT made/attempted
  'double_doubles',
  'triple_doubles',
];

export default function CareerView({
  player,
  allStats,
  allAwards,
  seasons,
}: CareerViewProps) {
  const [dbSeasonTotals, setDbSeasonTotals] = useState<SeasonTotals[]>([]);

  // Fetch season totals from database
  useEffect(() => {
    const loadSeasonTotals = async () => {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('season_totals')
        .select('*')
        .eq('player_id', player.id);

      if (error) {
        logger.error('Error loading season totals:', error);
      } else {
        setDbSeasonTotals((data || []) as SeasonTotals[]);
      }
    };

    loadSeasonTotals();
  }, [player.id]);

  // Get stat keys in NBA order
  const statKeys = useMemo(() => {
    const keys = new Set<string>();
    allStats.forEach((game) => {
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
    
    // Always add double/triple doubles columns
    keys.add('double_doubles');
    keys.add('triple_doubles');
    
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
  }, [allStats]);

  // Season totals stat keys (includes percentages)
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
    return baseKeys;
  }, [statKeys]);

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

  const formatStatValue = (totals: Record<string, number>, averages: Record<string, number>, key: string): { total: string; avg: string } => {
    // Handle combined shooting stats
    if (key === 'fg') {
      const made = totals.fg_made;
      const attempted = totals.fg_attempted;
      const totalStr = (made !== undefined && attempted !== undefined) ? `${made}/${attempted}` : '–';
      const avgStr = (made !== undefined && attempted !== undefined && attempted > 0) 
        ? (made / attempted).toFixed(3)
        : '–';
      return { total: totalStr, avg: avgStr };
    }
    if (key === 'threes') {
      const made = totals.threes_made;
      const attempted = totals.threes_attempted;
      const totalStr = (made !== undefined && attempted !== undefined) ? `${made}/${attempted}` : '–';
      const avgStr = (made !== undefined && attempted !== undefined && attempted > 0) 
        ? (made / attempted).toFixed(3)
        : '–';
      return { total: totalStr, avg: avgStr };
    }
    if (key === 'ft') {
      const made = totals.ft_made;
      const attempted = totals.ft_attempted;
      const totalStr = (made !== undefined && attempted !== undefined) ? `${made}/${attempted}` : '–';
      const avgStr = (made !== undefined && attempted !== undefined && attempted > 0) 
        ? (made / attempted).toFixed(3)
        : '–';
      return { total: totalStr, avg: avgStr };
    }

    const total = totals[key];
    const avg = averages[key];
    return {
      total: total !== undefined && total !== null 
        ? total.toFixed(total % 1 === 0 ? 0 : 1) 
        : '–',
      avg: avg !== undefined && avg !== null && typeof avg === 'number'
        ? avg.toFixed(1) // Format with 1 decimal place for per-game averages
        : '–',
    };
  };

  const formatCareerStatValue = (totals: Record<string, number>, averages: Record<string, number>, key: string): { total: string; avg: string } => {
    // Handle double/triple doubles - these are totals only
    if (key === 'double_doubles' || key === 'triple_doubles') {
      const total = totals[key] || 0;
      return { total: total.toString(), avg: '–' };
    }
    
    // Handle percentage columns - display as decimals (0.722)
    if (key === 'fg_percentage') {
      const made = totals.fg_made;
      const attempted = totals.fg_attempted;
      const pct = (made !== undefined && attempted !== undefined && attempted > 0) 
        ? (made / attempted).toFixed(3)
        : '–';
      return { total: pct, avg: pct };
    }
    if (key === 'three_pt_percentage') {
      const made = totals.threes_made;
      const attempted = totals.threes_attempted;
      const pct = (made !== undefined && attempted !== undefined && attempted > 0) 
        ? (made / attempted).toFixed(3)
        : '–';
      return { total: pct, avg: pct };
    }
    if (key === 'ft_percentage') {
      const made = totals.ft_made;
      const attempted = totals.ft_attempted;
      const pct = (made !== undefined && attempted !== undefined && attempted > 0) 
        ? (made / attempted).toFixed(3)
        : '–';
      return { total: pct, avg: pct };
    }

    return formatStatValue(totals, averages, key);
  };

  // Calculate season totals for each season (use DB totals if available, otherwise calculate from games)
  const seasonTotals = useMemo(() => {
    return seasons.map((season) => {
      const dbTotal = dbSeasonTotals.find(st => st.season_id === season.id);
      const seasonStats = allStats.filter((stat) => stat.season_id === season.id);
      
      // If we have DB totals, use those; otherwise calculate from games
      let totals: Record<string, number> = {};
      const averages: Record<string, number> = {};
      let gamesPlayed = 0;

      if (dbTotal) {
        // Use database totals
        gamesPlayed = dbTotal.games_played;
        totals = {
          points: dbTotal.total_points,
          rebounds: dbTotal.total_rebounds,
          assists: dbTotal.total_assists,
          steals: dbTotal.total_steals,
          blocks: dbTotal.total_blocks,
          turnovers: dbTotal.total_turnovers,
          minutes: dbTotal.total_minutes,
          fouls: dbTotal.total_fouls,
          plus_minus: dbTotal.total_plus_minus,
          fg_made: dbTotal.total_fg_made,
          fg_attempted: dbTotal.total_fg_attempted,
          threes_made: dbTotal.total_threes_made,
          threes_attempted: dbTotal.total_threes_attempted,
          ft_made: dbTotal.total_ft_made,
          ft_attempted: dbTotal.total_ft_attempted,
          double_doubles: dbTotal.double_doubles || 0,
          triple_doubles: dbTotal.triple_doubles || 0,
        };
        // Calculate offensive_rebounds and DD/TD from games if available
        if (seasonStats.length > 0) {
          let offRebTotal = 0;
          let doubleDoubles = 0;
          let tripleDoubles = 0;
          
          seasonStats.forEach((game) => {
            if (game.offensive_rebounds !== undefined && game.offensive_rebounds !== null) {
              offRebTotal += game.offensive_rebounds;
            }
            // Recalculate DD/TD from games for accuracy
            if (isDoubleDouble(game)) {
              doubleDoubles++;
            }
            if (isTripleDouble(game)) {
              tripleDoubles++;
            }
          });
          
          if (offRebTotal > 0) {
            totals.offensive_rebounds = offRebTotal;
            averages.offensive_rebounds = offRebTotal / gamesPlayed;
          }
          // Use calculated DD/TD from games
          totals.double_doubles = doubleDoubles;
          totals.triple_doubles = tripleDoubles;
        }
        if (dbTotal.avg_points !== undefined) averages.points = dbTotal.avg_points;
        if (dbTotal.avg_rebounds !== undefined) averages.rebounds = dbTotal.avg_rebounds;
        if (dbTotal.avg_assists !== undefined) averages.assists = dbTotal.avg_assists;
        if (dbTotal.avg_steals !== undefined) averages.steals = dbTotal.avg_steals;
        if (dbTotal.avg_blocks !== undefined) averages.blocks = dbTotal.avg_blocks;
        if (dbTotal.avg_turnovers !== undefined) averages.turnovers = dbTotal.avg_turnovers;
        if (dbTotal.avg_minutes !== undefined) averages.minutes = dbTotal.avg_minutes;
        if (dbTotal.avg_fouls !== undefined) averages.fouls = dbTotal.avg_fouls;
        if (dbTotal.avg_plus_minus !== undefined) averages.plus_minus = dbTotal.avg_plus_minus;
      } else if (seasonStats.length > 0) {
        // Calculate from games
        const calcTotals: Record<string, number> = {};
        const counts: Record<string, number> = {};

        let doubleDoubles = 0;
        let tripleDoubles = 0;

        seasonStats.forEach((game) => {
          const gameStats = getStatsFromGame(game);
          Object.entries(gameStats).forEach(([key, value]) => {
            if (typeof value === 'number' && 
                key !== 'player_score' && key !== 'opponent_score' &&
                key !== 'fg_percentage' && key !== 'ft_percentage' && 
                key !== 'three_pt_percentage' && key !== 'is_win') {
              calcTotals[key] = (calcTotals[key] || 0) + value;
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

        Object.keys(calcTotals).forEach((key) => {
          if (counts[key] > 0) {
            averages[key] = calcTotals[key] / counts[key];
          }
        });

        calcTotals.double_doubles = doubleDoubles;
        calcTotals.triple_doubles = tripleDoubles;

        totals = calcTotals;
        gamesPlayed = seasonStats.length;
      }

      // Get season awards
      const seasonAwards = allAwards.filter((award) => award.season_id === season.id);

      return {
        season,
        dbTotal,
        totals,
        averages,
        gamesPlayed,
        awards: seasonAwards,
      };
    }).filter((s) => s.gamesPlayed > 0 || s.awards.length > 0 || s.dbTotal); // Show if has games, awards, or DB totals
  }, [allStats, allAwards, seasons, dbSeasonTotals]);

  // Calculate career totals
  const careerTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    let doubleDoubles = 0;
    let tripleDoubles = 0;

    allStats.forEach((game) => {
      const gameStats = getStatsFromGame(game);
      Object.entries(gameStats).forEach(([key, value]) => {
        if (typeof value === 'number' && 
            key !== 'player_score' && key !== 'opponent_score' &&
            key !== 'fg_percentage' && key !== 'ft_percentage' && 
            key !== 'three_pt_percentage' && key !== 'is_win') {
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

    return { totals, averages, gamesPlayed: allStats.length };
  }, [allStats]);

  return (
    <div className="space-y-4">
      {/* Career Highs */}
      {player.career_highs && Object.keys(player.career_highs).length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Career Highs</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(player.career_highs).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="text-xs text-gray-600 capitalize mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Accolades */}
      {allAwards.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Career Accolades</h3>
          <div className="flex flex-wrap gap-2">
            {allAwards.map((award) => {
              const season = seasons.find((s) => s.id === award.season_id);
              const seasonLabel = season 
                ? `${season.year_start}–${season.year_end}` 
                : 'Unknown Season';
              return (
                <div
                  key={award.id}
                  className="bg-white rounded-lg px-3 py-1.5 border border-yellow-300 shadow-sm"
                >
                  <div className="text-sm font-semibold text-yellow-900">{award.award_name}</div>
                  <div className="text-xs text-yellow-700">{seasonLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Season-by-Season Breakdown */}
      {seasonTotals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900">Season-by-Season</h3>
          </div>
          
          {/* Scrollable season totals table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left px-1.5 py-1 font-semibold text-xs text-gray-700">Season</th>
                  <th className="text-center px-1.5 py-1 font-semibold text-xs text-gray-700">GP</th>
                  {seasonTotalsKeys.map((key) => {
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
                {seasonTotals.map(({ season, totals, averages, gamesPlayed, dbTotal }) => (
                  <tr key={season.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-1.5 py-1 text-xs font-medium text-gray-900">
                      <div>
                        <div className="font-semibold">{season.year_start}–{season.year_end}</div>
                        {dbTotal && (
                          <div className="text-[10px] text-purple-600 mt-0.5">Manual</div>
                        )}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 text-center text-xs text-gray-700">{gamesPlayed}</td>
                    {seasonTotalsKeys.map((key) => {
                      const { total, avg } = formatCareerStatValue(totals, averages, key);
                      return (
                        <td key={key} className="text-right px-1.5 py-1 text-xs text-gray-700 whitespace-nowrap">
                          {total !== '–' ? (
                            <div>
                              <div className="font-semibold">{total}</div>
                              {avg !== '–' && avg !== total && (
                                <div className="text-[10px] text-gray-500">{avg}</div>
                              )}
                            </div>
                          ) : (
                            '–'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fixed Career Totals Footer */}
          {careerTotals.gamesPlayed > 0 && (
            <div className="border-t-4 border-gray-400 bg-gray-800 mt-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-1.5 py-1.5 font-semibold text-xs text-white">Career Totals</th>
                    <th></th>
                    {seasonTotalsKeys.map((key) => {
                      const tooltip = getStatTooltip(key);
                      return (
                        <th
                          key={key}
                          className="text-right px-1.5 py-1.5 font-semibold text-xs text-white whitespace-nowrap"
                          title={tooltip || undefined}
                        >
                          {getStatLabel(key)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-700">
                    <td className="px-1.5 py-1 text-xs font-bold text-white">Totals</td>
                    <td className="px-1.5 py-1 text-center text-xs font-bold text-white">{careerTotals.gamesPlayed}</td>
                    {seasonTotalsKeys.map((key) => {
                      const { total } = formatCareerStatValue(careerTotals.totals, careerTotals.averages, key);
                      return (
                        <td key={key} className="text-right px-1.5 py-1 text-xs font-bold text-white whitespace-nowrap">
                          {total}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-gray-800">
                    <td className="px-1.5 py-1 text-xs font-bold text-white">Avg</td>
                    <td></td>
                    {seasonTotalsKeys.map((key) => {
                      const { avg } = formatCareerStatValue(careerTotals.totals, careerTotals.averages, key);
                      return (
                        <td key={key} className="text-right px-1.5 py-1 text-xs font-bold text-white whitespace-nowrap">
                          {avg}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
