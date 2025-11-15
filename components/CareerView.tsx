'use client';

import { useMemo } from 'react';
import { PlayerWithTeam, PlayerGameStatsWithDetails, PlayerAwardInfo, Season } from '@/lib/types';
import { getStatsFromGame, getAllStatKeys } from '@/lib/statHelpers';

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
  // Calculate season totals for each season
  const seasonTotals = useMemo(() => {
    return seasons.map((season) => {
      const seasonStats = allStats.filter((stat) => stat.season_id === season.id);
      
      // Calculate totals
      const totals: Record<string, number> = {};
      const counts: Record<string, number> = {};

      seasonStats.forEach((game) => {
        const gameStats = getStatsFromGame(game);
        Object.entries(gameStats).forEach(([key, value]) => {
          if (typeof value === 'number') {
            totals[key] = (totals[key] || 0) + value;
            counts[key] = (counts[key] || 0) + 1;
          }
        });
      });

      // Calculate averages
      const averages: Record<string, number> = {};
      Object.keys(totals).forEach((key) => {
        if (counts[key] > 0) {
          averages[key] = totals[key] / counts[key];
        }
      });

      // Get season awards
      const seasonAwards = allAwards.filter((award) => award.season_id === season.id);

      return {
        season,
        stats: seasonStats,
        totals,
        averages,
        gamesPlayed: seasonStats.length,
        awards: seasonAwards,
      };
    }).filter((s) => s.gamesPlayed > 0 || s.awards.length > 0); // Only show seasons with games or awards
  }, [allStats, allAwards, seasons]);

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

      {/* Career Totals */}
      {careerTotals.gamesPlayed > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
            <h3 className="text-xl font-bold text-white">Career Totals</h3>
            <p className="text-sm text-gray-300 mt-1">
              {careerTotals.gamesPlayed} game{careerTotals.gamesPlayed !== 1 ? 's' : ''} played
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {statKeys.map((key) => (
                <div key={key} className="border-b border-gray-200 pb-3">
                  <div className="text-xs text-gray-600 capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {careerTotals.totals[key] !== undefined
                      ? careerTotals.totals[key].toFixed(
                          careerTotals.totals[key] % 1 === 0 ? 0 : 1
                        )
                      : '–'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg: {careerTotals.averages[key] !== undefined
                      ? careerTotals.averages[key].toFixed(
                          careerTotals.averages[key] % 1 === 0 ? 0 : 1
                        )
                      : '–'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Season-by-Season Breakdown */}
      {seasonTotals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Season-by-Season</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {seasonTotals.map(({ season, totals, averages, gamesPlayed, awards }) => (
              <div key={season.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {season.year_start}–{season.year_end}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {gamesPlayed} game{gamesPlayed !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {awards.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {awards.map((award) => (
                        <span
                          key={award.id}
                          className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-900 rounded-full border border-yellow-300"
                        >
                          {award.award_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {statKeys.map((key) => {
                    const total = totals[key];
                    const avg = averages[key];
                    if (total === undefined && avg === undefined) return null;
                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="text-xs text-gray-600 capitalize mb-1">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-base font-semibold text-gray-900">
                          {total !== undefined
                            ? total.toFixed(total % 1 === 0 ? 0 : 1)
                            : '–'}
                        </div>
                        {avg !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            Avg: {avg.toFixed(avg % 1 === 0 ? 0 : 1)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

