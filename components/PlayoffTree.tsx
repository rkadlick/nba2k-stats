'use client';

import { useState } from 'react';
import { Season, PlayerGameStatsWithDetails } from '@/lib/types';
import { getStatsFromGame } from '@/lib/statHelpers';

interface PlayoffTreeProps {
  season: Season;
  playerStats?: PlayerGameStatsWithDetails[];
  playerTeamName?: string;
}

interface PlayoffSeries {
  id: string;
  team1: string;
  team2: string;
  winner?: string | null;
  team1Wins?: number;
  team2Wins?: number;
  games?: PlayerGameStatsWithDetails[];
}

export default function PlayoffTree({ season, playerStats = [], playerTeamName }: PlayoffTreeProps) {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const playoffTree = season.playoff_tree as Record<string, PlayoffSeries[]> | undefined;

  if (!playoffTree) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        No playoff data available for this season.
      </div>
    );
  }

  // Process playoff tree to include player games
  const processSeries = (series: PlayoffSeries[]): PlayoffSeries[] => {
    return series.map((s) => {
      // Find player games for this series
      const seriesGames = playerStats.filter((stat) => {
        if (!stat.is_playoff_game) return false;
        const opponentName = stat.opponent_team?.name || stat.opponent_team_name || '';
        const playerTeam = playerTeamName || '';
        
        // Match by series ID first, then by team names
        if (stat.playoff_series_id && s.id && stat.playoff_series_id === s.id) {
          return true;
        }
        
        // Check if this game belongs to this series by team names
        return (
          (opponentName === s.team1 || opponentName === s.team2) ||
          (playerTeam === s.team1 || playerTeam === s.team2)
        );
      });

      // Calculate wins if we have games
      let team1Wins = 0;
      let team2Wins = 0;
      
      if (seriesGames.length > 0) {
        seriesGames.forEach((game) => {
          const opponentName = game.opponent_team?.name || game.opponent_team_name || '';
          const isPlayerTeam1 = playerTeamName === s.team1;
          const isPlayerTeam2 = playerTeamName === s.team2;
          
          // Determine winner based on player's team
          if (isPlayerTeam1 || isPlayerTeam2) {
            // This is a simplified check - in reality you'd need game results
            // For now, we'll use the series winner if available
          }
        });
        
        // If we have a winner, calculate wins
        if (s.winner) {
          if (s.winner === s.team1) {
            team1Wins = 4; // Assuming best of 7
            team2Wins = seriesGames.length - 4;
          } else {
            team2Wins = 4;
            team1Wins = seriesGames.length - 4;
          }
        } else {
          // Default to showing series total if available
          team1Wins = s.team1Wins || 0;
          team2Wins = s.team2Wins || 0;
        }
      } else {
        // No player games - show series total if available
        team1Wins = s.team1Wins || 0;
        team2Wins = s.team2Wins || 0;
      }

      return {
        ...s,
        games: seriesGames,
        team1Wins,
        team2Wins,
      };
    });
  };

  const getSeriesId = (round: string, index: number) => `${round}-${index}`;

  const renderBracketRound = (round: string, series: PlayoffSeries[], roundIndex: number) => {
    const processedSeries = processSeries(series);
    const isPlayerInRound = processedSeries.some((s) => 
      playerTeamName && (s.team1 === playerTeamName || s.team2 === playerTeamName)
    );

    return (
      <div key={round} className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
          {round.replace(/([A-Z])/g, ' $1').trim()}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedSeries.map((series, idx) => {
            const seriesId = getSeriesId(round, idx);
            const isSelected = selectedSeries === seriesId;
            const hasPlayerGames = series.games && series.games.length > 0;
            const isPlayerSeries = playerTeamName && 
              (series.team1 === playerTeamName || series.team2 === playerTeamName);

            return (
              <div
                key={seriesId}
                className={`border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 shadow-lg'
                    : isPlayerSeries
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                onClick={() => setSelectedSeries(isSelected ? null : seriesId)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className={`font-semibold ${series.winner === series.team1 ? 'text-green-600' : 'text-gray-700'}`}>
                        {series.team1}
                      </div>
                      <div className={`font-semibold mt-1 ${series.winner === series.team2 ? 'text-green-600' : 'text-gray-700'}`}>
                        {series.team2}
                      </div>
                    </div>
                    <div className="text-right">
                      {series.team1Wins !== undefined && series.team2Wins !== undefined ? (
                        <div className="text-lg font-bold text-gray-900">
                          {series.team1Wins} - {series.team2Wins}
                        </div>
                      ) : series.winner ? (
                        <div className="text-sm text-green-600 font-semibold">
                          {series.winner} wins
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">TBD</div>
                      )}
                    </div>
                  </div>
                  {isPlayerSeries && hasPlayerGames && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      {series.games?.length} player game{series.games?.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Show games when selected */}
                {isSelected && hasPlayerGames && series.games && (
                  <div className="border-t border-gray-200 bg-white p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Player Games:</div>
                    <div className="space-y-2">
                      {series.games.map((game, gameIdx) => {
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
                {isSelected && !hasPlayerGames && (series.team1Wins !== undefined || series.winner) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">
                      Series: {series.team1} {series.team1Wins || 0} - {series.team2Wins || 0} {series.team2}
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
        {Object.entries(playoffTree).map(([round, series], idx) =>
          renderBracketRound(round, series as PlayoffSeries[], idx)
        )}
      </div>
    </div>
  );
}
