'use client';

import { PlayerWithTeam, PlayerStatsWithDetails, SeasonAward } from '@/lib/types';
import StatTable from './StatTable';

interface PlayerPanelProps {
  player: PlayerWithTeam;
  stats: PlayerStatsWithDetails[];
  awards: SeasonAward[];
  seasonYear: string;
}

export default function PlayerPanel({
  player,
  stats,
  awards,
  seasonYear,
}: PlayerPanelProps) {
  const primaryColor = player.team?.primary_color || '#6B7280';
  const secondaryColor = player.team?.secondary_color || '#9CA3AF';

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with team colors */}
      <div
        className="px-6 py-4 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{player.player_name}</h2>
            {player.team && (
              <p className="text-sm opacity-90">{player.team.name}</p>
            )}
          </div>
          {player.position && (
            <div className="text-right">
              <div className="text-sm opacity-90">Position</div>
              <div className="text-xl font-semibold">{player.position}</div>
            </div>
          )}
        </div>
        {player.archetype && (
          <div className="mt-2 text-sm opacity-90">{player.archetype}</div>
        )}
        {player.height && player.weight && (
          <div className="mt-1 text-xs opacity-80">
            {Math.floor(player.height / 12)}'{player.height % 12}" • {player.weight} lbs
          </div>
        )}
      </div>

      {/* Awards section */}
      {awards.length > 0 && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
          <div className="text-sm font-semibold text-yellow-800 mb-1">
            Awards ({seasonYear})
          </div>
          <div className="flex flex-wrap gap-2">
            {awards.map((award) => (
              <span
                key={award.id}
                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-900 rounded"
              >
                {award.award_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Career highs */}
      {player.career_highs && Object.keys(player.career_highs).length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            Career Highs
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(player.career_highs).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Season Stats ({seasonYear})
          </h3>
          <p className="text-sm text-gray-600">
            {stats.length} game{stats.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <StatTable stats={stats} playerName={player.player_name} />
      </div>
    </div>
  );
}

