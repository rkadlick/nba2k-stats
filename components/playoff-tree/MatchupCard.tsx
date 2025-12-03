import React from 'react';
import { PlayerGameStatsWithDetails } from '@/lib/types';
import { PlayoffSeriesWithGames } from '@/hooks/usePlayoffSeries';
import { getStatsFromGame } from '@/lib/statHelpers';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';

interface MatchupCardProps {
  series: PlayoffSeriesWithGames;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export function MatchupCard({ series, isHighlighted = false, onClick }: MatchupCardProps) {
  const isSelected = false; // This would be passed as prop if needed
  const hasPlayerGames = series.games && series.games.length > 0;

  const winnerId = series.winner_team_id;
  const team1Won = winnerId === series.team1_id;
  const team2Won = winnerId === series.team2_id;
  const isComplete = series.is_complete;

  return (
    <div
      className={`relative bg-white rounded border transition-all cursor-pointer ${
        isSelected
          ? 'border-purple-500 shadow-md'
          : 'border-gray-300 hover:border-gray-400'
      } ${isHighlighted ? 'ring-1 ring-blue-300' : ''}`}
      onClick={onClick}
    >
      {/* Matchup Card - Compact */}
      <div className="p-2">
        {/* Team 1 */}
        <div className={`flex items-center justify-between py-1 px-1.5 rounded text-xs ${
          team1Won && isComplete ? 'bg-green-100' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-1.5">
            {series.team1_seed && (
              <span className="text-[10px] font-bold text-gray-500">
                ({series.team1_seed})
              </span>
            )}
            <span className={`font-semibold ${
              team1Won && isComplete ? 'text-green-700' : 'text-gray-900'
            }`}>
              {series.team1Abbrev}
            </span>
          </div>
          {series.team1_wins !== undefined && (
            <span className={`font-bold text-xs ${
              team1Won && isComplete ? 'text-green-700' : 'text-gray-600'
            }`}>
              {series.team1_wins}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between py-1 px-1.5 rounded mt-0.5 text-xs ${
          team2Won && isComplete ? 'bg-green-100' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-1.5">
            {series.team2_seed && (
              <span className="text-[10px] font-bold text-gray-500">
                ({series.team2_seed})
              </span>
            )}
            <span className={`font-semibold ${
              team2Won && isComplete ? 'text-green-700' : 'text-gray-900'
            }`}>
              {series.team2Abbrev}
            </span>
          </div>
          {series.team2_wins !== undefined && (
            <span className={`font-bold text-xs ${
              team2Won && isComplete ? 'text-green-700' : 'text-gray-600'
            }`}>
              {series.team2_wins}
            </span>
          )}
        </div>

        {/* Player games indicator */}
        {hasPlayerGames && (
          <div className="mt-1 text-[10px] text-blue-600 font-medium text-center">
            {series.games?.length} game{series.games?.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Expanded games view */}
      {isSelected && hasPlayerGames && series.games && (
        <div className="border-t border-gray-200 bg-white p-2 rounded-b">
          <div className="text-[10px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Player Games</div>
          <div className="space-y-1">
            {series.games.map((game, gameIdx) => {
              const opponentName = game.opponent_team?.name || game.opponent_team_name || 'Unknown';
              const opponentAbbrev = getTeamAbbreviation(opponentName);
              const isHome = game.is_home;
              const gameStats = getStatsFromGame(game);
              return (
                <div
                  key={game.id || gameIdx}
                  className="p-1.5 bg-gray-50 rounded border border-gray-200 text-[10px]"
                >
                  <div className="font-medium text-gray-900 mb-0.5">
                    {isHome ? 'vs' : '@'} {opponentAbbrev} • {game.is_win ? 'W' : 'L'} {game.player_score}-{game.opponent_score}
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-gray-600">
                    {Object.entries(gameStats).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="truncate">
                        <span className="capitalize text-[9px]">{key.replace(/_/g, ' ')}:</span>{' '}
                        <span className="font-semibold text-gray-800">
                          {typeof value === 'number'
                            ? value.toFixed(value % 1 === 0 ? 0 : 1)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
