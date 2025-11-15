'use client';

import { useMemo, useState, useEffect } from 'react';
import { PlayerWithTeam, PlayerGameStatsWithDetails, PlayerAwardInfo, Season, SeasonTotals } from '@/lib/types';
import { getStatsFromGame, getAllStatKeys } from '@/lib/statHelpers';
import { supabase } from '@/lib/supabaseClient';

interface CareerViewProps {
  player: PlayerWithTeam;
  allStats: PlayerGameStatsWithDetails[];
  allAwards: PlayerAwardInfo[];
  seasons: Season[];
}

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
        console.error('Error loading season totals:', error);
      } else {
        setDbSeasonTotals((data || []) as SeasonTotals[]);
      }
    };

    loadSeasonTotals();
  }, [player.id]);

  // Calculate season totals for each season (use DB totals if available, otherwise calculate from games)
  const seasonTotals = useMemo(() => {
    return seasons.map((season) => {
      const dbTotal = dbSeasonTotals.find(st => st.season_id === season.id);
      const seasonStats = allStats.filter((stat) => stat.season_id === season.id);
      
      // If we have DB totals, use those; otherwise calculate from games
      let totals: Record<string, number> = {};
      let averages: Record<string, number> = {};
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
        };
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

        seasonStats.forEach((game) => {
          const gameStats = getStatsFromGame(game);
          Object.entries(gameStats).forEach(([key, value]) => {
            if (typeof value === 'number') {
              calcTotals[key] = (calcTotals[key] || 0) + value;
              counts[key] = (counts[key] || 0) + 1;
            }
          });
        });

        Object.keys(calcTotals).forEach((key) => {
          if (counts[key] > 0) {
            averages[key] = calcTotals[key] / counts[key];
          }
        });

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

    allStats.forEach((game) => {
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

    return { totals, averages, gamesPlayed: allStats.length };
  }, [allStats]);

  // Get all stat keys
  const statKeys = useMemo(() => {
    return getAllStatKeys(allStats);
  }, [allStats]);

  return (
    <div className="space-y-6">
      {/* Career Highs */}
      {player.career_highs && Object.keys(player.career_highs).length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Career Highs</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(player.career_highs).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 capitalize mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Accolades */}
      {allAwards.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Career Accolades</h3>
          <div className="flex flex-wrap gap-3">
            {allAwards.map((award) => {
              const season = seasons.find((s) => s.id === award.season_id);
              const seasonLabel = season 
                ? `${season.year_start}–${season.year_end}` 
                : 'Unknown Season';
              return (
                <div
                  key={award.id}
                  className="bg-white rounded-lg px-4 py-2 border border-yellow-300 shadow-sm"
                >
                  <div className="text-sm font-semibold text-yellow-900">{award.award_name}</div>
                  <div className="text-xs text-yellow-700">{seasonLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Season-by-Season Breakdown with Fixed Career Totals */}
      {seasonTotals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: '600px' }}>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-xl font-bold text-gray-900">Season-by-Season</h3>
          </div>
          
          {/* Scrollable season totals table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-2 font-semibold text-xs text-gray-700">Season</th>
                  <th className="text-center p-2 font-semibold text-xs text-gray-700">GP</th>
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
                {seasonTotals.map(({ season, totals, averages, gamesPlayed, awards, dbTotal }) => (
                  <tr key={season.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="p-2 text-xs font-medium text-gray-900">
                      <div>
                        <div className="font-semibold">{season.year_start}–{season.year_end}</div>
                        {dbTotal && (
                          <div className="text-xs text-purple-600 mt-0.5">Manual Entry</div>
                        )}
                        {awards.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {awards.slice(0, 2).map((award) => (
                              <span
                                key={award.id}
                                className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-900 rounded border border-yellow-300"
                              >
                                {award.award_name}
                              </span>
                            ))}
                            {awards.length > 2 && (
                              <span className="text-xs text-gray-500">+{awards.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center text-xs text-gray-700">{gamesPlayed}</td>
                    {statKeys.map((key) => {
                      const total = totals[key];
                      const avg = averages[key];
                      return (
                        <td key={key} className="text-right p-2 text-xs text-gray-700">
                          {total !== undefined ? (
                            <div>
                              <div className="font-semibold">
                                {total.toFixed(total % 1 === 0 ? 0 : 1)}
                              </div>
                              {avg !== undefined && (
                                <div className="text-xs text-gray-500">
                                  {avg.toFixed(avg % 1 === 0 ? 0 : 1)}
                                </div>
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
            <div className="border-t-2 border-gray-300 bg-gray-800 flex-shrink-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="p-2 text-xs font-bold text-white">Career Totals</td>
                    <td className="p-2 text-center text-xs font-bold text-white">{careerTotals.gamesPlayed}</td>
                    {statKeys.map((key) => (
                      <td key={key} className="text-right p-2 text-xs font-bold text-white">
                        {careerTotals.totals[key] !== undefined
                          ? careerTotals.totals[key].toFixed(
                              careerTotals.totals[key] % 1 === 0 ? 0 : 1
                            )
                          : '–'}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-700">
                    <td className="p-2 text-xs font-bold text-white">Career Avg</td>
                    <td></td>
                    {statKeys.map((key) => (
                      <td key={key} className="text-right p-2 text-xs font-bold text-white">
                        {careerTotals.averages[key] !== undefined
                          ? careerTotals.averages[key].toFixed(
                              careerTotals.averages[key] % 1 === 0 ? 0 : 1
                            )
                          : '–'}
                      </td>
                    ))}
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

