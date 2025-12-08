import React from 'react';
import { PlayoffSeriesWithGames } from '@/hooks/filter/usePlayoffSeries';
import { getTeamColor } from '@/lib/teams';
import { getTeamLogoUrl } from '@/lib/teams';
import Image from 'next/image';

interface FinalsSectionProps {
  finalsSeries: PlayoffSeriesWithGames[];
}

export function FinalsSection({ finalsSeries }: FinalsSectionProps) {
  if (finalsSeries.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-center mb-1">
        <div className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          NBA Finals
        </div>
        <div className="h-px bg-gray-300 w-full max-w-xs mt-0.5"></div>
      </div>
      {finalsSeries.map((series) => {
        const winnerId = series.winner_team_id;
        const team1Won = winnerId === series.team1_id;
        const team2Won = winnerId === series.team2_id;
        const isComplete = series.is_complete;

        // Get team colors for winners
        const team1Primary = series.team1_id ? getTeamColor(series.team1_id, 'primary') : '#000000';
        const team1OnPrimary = series.team1_id ? getTeamColor(series.team1_id, 'onPrimary') : '#ffffff';
        const team2Primary = series.team2_id ? getTeamColor(series.team2_id, 'primary') : '#000000';
        const team2OnPrimary = series.team2_id ? getTeamColor(series.team2_id, 'onPrimary') : '#ffffff';

        return (
          <div
            key={series.id}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm min-w-[280px]"
          >
            {/* Team 1 */}
            <div className={`flex items-center justify-between py-3 px-3 rounded mb-2 text-sm ${
              team1Won && isComplete
                ? `border`
                : 'bg-gray-50'
            }`} style={team1Won && isComplete ? {
              backgroundColor: team1Primary,
              color: team1OnPrimary,
              borderColor: team1Primary
            } : {}}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {series.team1_seed && (
                  <span className={`text-[11px] font-bold flex-shrink-0 ${
                    team1Won && isComplete ? 'opacity-90' : 'text-gray-700'
                  }`}>
                    ({series.team1_seed})
                  </span>
                )}
                {getTeamLogoUrl(series.team1_id || series.team1Display || null) && (
                  <Image
                    src={getTeamLogoUrl(series.team1_id || series.team1Display || null)!}
                    alt={`${series.team1Display} logo`}
                    width={20}
                    height={20}
                    className="flex-shrink-0"
                  />
                )}
                <span className={`font-semibold truncate ${
                  team1Won && isComplete ? '' : 'text-gray-900'
                }`}>
                  {series.team1Display}
                </span>
              </div>
              {series.team1_wins !== undefined && (
                <span className={`font-bold text-sm flex-shrink-0 ml-3 ${
                  team1Won && isComplete ? '' : 'text-gray-600'
                }`}>
                  {series.team1_wins}
                </span>
              )}
            </div>

            {/* Team 2 */}
            <div className={`flex items-center justify-between py-3 px-3 rounded text-sm ${
              team2Won && isComplete
                ? `border`
                : 'bg-gray-50'
            }`} style={team2Won && isComplete ? {
              backgroundColor: team2Primary,
              color: team2OnPrimary,
              borderColor: team2Primary
            } : {}}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {series.team2_seed && (
                  <span className={`text-[11px] font-bold flex-shrink-0 ${
                    team2Won && isComplete ? 'opacity-90' : 'text-gray-700'
                  }`}>
                    ({series.team2_seed})
                  </span>
                )}
                {getTeamLogoUrl(series.team2_id || series.team2Display || null) && (
                  <Image
                    src={getTeamLogoUrl(series.team2_id || series.team2Display || null)!}
                    alt={`${series.team2Display} logo`}
                    width={20}
                    height={20}
                    className="flex-shrink-0"
                  />
                )}
                <span className={`font-semibold truncate ${
                  team2Won && isComplete ? '' : 'text-gray-900'
                }`}>
                  {series.team2Display}
                </span>
              </div>
              {series.team2_wins !== undefined && (
                <span className={`font-bold text-sm flex-shrink-0 ml-3 ${
                  team2Won && isComplete ? '' : 'text-gray-600'
                }`}>
                  {series.team2_wins}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
