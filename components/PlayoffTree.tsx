'use client';

import { useState, useEffect } from 'react';
import { Season, PlayerGameStatsWithDetails, PlayoffSeries as PlayoffSeriesType, Team } from '@/lib/types';
import { getStatsFromGame } from '@/lib/statHelpers';
import { supabase } from '@/lib/supabaseClient';

interface PlayoffTreeProps {
  season: Season;
  playerStats?: PlayerGameStatsWithDetails[];
  playerTeamName?: string;
  teams?: Team[];
}

interface PlayoffSeriesWithGames extends PlayoffSeriesType {
  games?: PlayerGameStatsWithDetails[];
  team1Display?: string;
  team2Display?: string;
}

export default function PlayoffTree({ season, playerStats = [], playerTeamName, teams = [] }: PlayoffTreeProps) {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [playoffSeries, setPlayoffSeries] = useState<PlayoffSeriesType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayoffSeries = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('playoff_series')
          .select('*')
          .eq('season_id', season.id)
          .order('round_number', { ascending: true })
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading playoff series:', error);
        } else {
          setPlayoffSeries((data || []) as PlayoffSeriesType[]);
        }
      } catch (error) {
        console.error('Error loading playoff series:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayoffSeries();
  }, [season.id]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
        Loading playoff bracket...
      </div>
    );
  }

  if (playoffSeries.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        No playoff data available for this season.
      </div>
    );
  }

  // Process playoff series to include player games and team names
  const processedSeries: PlayoffSeriesWithGames[] = playoffSeries.map((series) => {
    // Get team names
    const team1 = teams.find(t => t.id === series.team1_id);
    const team2 = teams.find(t => t.id === series.team2_id);
    const team1Display = team1?.name || series.team1_name || 'TBD';
    const team2Display = team2?.name || series.team2_name || 'TBD';

    // Find player games for this series
    const seriesGames = playerStats.filter((stat) => {
      if (!stat.is_playoff_game) return false;
      // Match by series ID
      if (stat.playoff_series_id && stat.playoff_series_id === series.id) {
        return true;
      }
      // Match by team names
      const opponentName = stat.opponent_team?.name || stat.opponent_team_name || '';
      return (
        opponentName === team1Display || opponentName === team2Display ||
        playerTeamName === team1Display || playerTeamName === team2Display
      );
    });

    return {
      ...series,
      games: seriesGames,
      team1Display,
      team2Display,
    };
  });

  // Group series by round
  const seriesByRound = processedSeries.reduce((acc, series) => {
    const round = series.round_name;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(series);
    return acc;
  }, {} as Record<string, PlayoffSeriesWithGames[]>);

  const renderBracketRound = (roundName: string, series: PlayoffSeriesWithGames[]) => {
    return (
      <div key={roundName} className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{roundName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {series.map((s) => {
            const isSelected = selectedSeries === s.id;
            const hasPlayerGames = s.games && s.games.length > 0;
            const isPlayerSeries = playerTeamName && 
              (s.team1Display === playerTeamName || s.team2Display === playerTeamName);
            const winnerDisplay = s.winner_team_id 
              ? teams.find(t => t.id === s.winner_team_id)?.name || s.winner_team_name
              : s.winner_team_name;

            return (
              <div
                key={s.id}
                className={`border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 shadow-lg'
                    : isPlayerSeries
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                onClick={() => setSelectedSeries(isSelected ? null : s.id)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className={`font-semibold ${winnerDisplay === s.team1Display ? 'text-green-600' : 'text-gray-700'}`}>
                        {s.team1Display}
                      </div>
                      <div className={`font-semibold mt-1 ${winnerDisplay === s.team2Display ? 'text-green-600' : 'text-gray-700'}`}>
                        {s.team2Display}
                      </div>
                    </div>
                    <div className="text-right">
                      {s.team1_wins !== undefined && s.team2_wins !== undefined ? (
                        <div className="text-lg font-bold text-gray-900">
                          {s.team1_wins} - {s.team2_wins}
                        </div>
                      ) : winnerDisplay ? (
                        <div className="text-sm text-green-600 font-semibold">
                          {winnerDisplay} wins
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">TBD</div>
                      )}
                    </div>
                  </div>
                  {isPlayerSeries && hasPlayerGames && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      {s.games?.length} player game{s.games?.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Show games when selected */}
                {isSelected && hasPlayerGames && s.games && (
                  <div className="border-t border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Player Games:</div>
                    <div className="space-y-2">
                      {s.games.map((game, gameIdx) => {
                        const opponentName = game.opponent_team?.name || game.opponent_team_name || 'Unknown';
                        const isHome = game.is_home;
                        return (
                          <div
                            key={game.id || gameIdx}
                            className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
                          >
                            <div className="font-medium text-gray-900 mb-1">
                              {isHome ? 'vs' : '@'} {opponentName}
                            </div>
                            {(() => {
                              const gameStats = getStatsFromGame(game);
                              const statEntries = Object.entries(gameStats).slice(0, 6);
                              return statEntries.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 text-gray-600">
                                  {statEntries.map(([key, value]) => (
                                    <div key={key}>
                                      <span className="capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                      <span className="font-semibold">
                                        {typeof value === 'number' 
                                          ? value.toFixed(value % 1 === 0 ? 0 : 1)
                                          : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Show series total for non-player games */}
                {isSelected && !hasPlayerGames && (s.team1_wins !== undefined || winnerDisplay) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">
                      Series: {s.team1Display} {s.team1_wins || 0} - {s.team2_wins || 0} {s.team2Display}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Playoff Bracket ({season.year_start}–{season.year_end})
      </h3>
      <div className="space-y-6">
        {Object.entries(seriesByRound).map(([roundName, series]) =>
          renderBracketRound(roundName, series)
        )}
      </div>
    </div>
  );
}
