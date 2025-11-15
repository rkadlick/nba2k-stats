'use client';

import { useState } from 'react';
import { PlayerWithTeam, PlayerGameStatsWithDetails, PlayerAwardInfo, Season, Team } from '@/lib/types';
import { CAREER_SEASON_ID } from '@/lib/types';
import StatTable from './StatTable';
import SeasonSelector from './SeasonSelector';
import CareerView from './CareerView';
import PlayoffTree from './PlayoffTree';

interface PlayerPanelProps {
  player: PlayerWithTeam;
  allStats: PlayerGameStatsWithDetails[];
  awards: PlayerAwardInfo[];
  seasons: Season[];
  defaultSeason: Season;
  teams?: Team[];
  isEditMode?: boolean;
  onEditGame?: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame?: (gameId: string) => void;
  onStatsUpdated?: () => void;
  onSeasonChange?: (season: Season | string) => void;
}

export default function PlayerPanel({
  player,
  allStats,
  awards,
  seasons,
  defaultSeason,
  teams = [],
  isEditMode = false,
  onEditGame,
  onDeleteGame,
  onStatsUpdated,
  onSeasonChange,
}: PlayerPanelProps) {
  const [selectedSeason, setSelectedSeason] = useState<Season | string>(defaultSeason);
  
  // Notify parent when season changes
  const handleSeasonChange = (season: Season | string) => {
    setSelectedSeason(season);
    onSeasonChange?.(season);
  };
  
  const primaryColor = player.team?.primary_color || '#6B7280';
  const secondaryColor = player.team?.secondary_color || '#9CA3AF';

  const isCareerView = selectedSeason === CAREER_SEASON_ID;

  // Filter stats by selected season (if not career view)
  const seasonStats = !isCareerView && typeof selectedSeason === 'object'
    ? allStats.filter((stat) => stat.season_id === selectedSeason.id)
    : [];
  
  // Filter awards by selected season (if not career view)
  const seasonAwards = !isCareerView && typeof selectedSeason === 'object'
    ? awards.filter((award) => award.season_id === selectedSeason.id)
    : [];

  const seasonYear = !isCareerView && typeof selectedSeason === 'object'
    ? `${selectedSeason.year_start}–${selectedSeason.year_end}`
    : 'Career';

  // Get current season for playoff tree
  const currentSeason = !isCareerView && typeof selectedSeason === 'object' 
    ? selectedSeason 
    : null;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header with team colors */}
      <div
        className="px-6 py-5 text-white relative overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-2xl font-bold">{player.player_name}</h2>
              {player.team && (
                <p className="text-sm opacity-90 mt-1">{player.team.name}</p>
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
            <div className="text-sm opacity-90 mb-2">{player.archetype}</div>
          )}
          {player.height && player.weight && (
            <div className="text-xs opacity-80">
              {Math.floor(player.height / 12)}'{player.height % 12}" • {player.weight} lbs
            </div>
          )}
        </div>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent pointer-events-none" />
      </div>

      {/* Season Selector */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Season:</label>
          <SeasonSelector
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSelectSeason={handleSeasonChange}
          />
        </div>
      </div>

      {/* Career View */}
      {isCareerView ? (
        <div className="flex-1 overflow-auto px-6 py-4 bg-gray-50">
          <CareerView
            player={player}
            allStats={allStats}
            allAwards={awards}
            seasons={seasons}
          />
        </div>
      ) : (
        <>
          {/* Awards section */}
          {seasonAwards.length > 0 && (
            <div className="px-6 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
              <div className="text-sm font-semibold text-yellow-900 mb-2">
                Awards ({seasonYear})
              </div>
              <div className="flex flex-wrap gap-2">
                {seasonAwards.map((award) => (
                  <span
                    key={award.id}
                    className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-900 rounded-full border border-yellow-300"
                  >
                    {award.award_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats table */}
          <div className="flex-1 flex flex-col px-4 py-2 bg-gray-50 min-h-0">
            <div className="mb-2">
              <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                Season Stats ({seasonYear})
              </h3>
              <p className="text-xs text-gray-600">
                {seasonStats.length} game{seasonStats.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <StatTable 
                stats={seasonStats} 
                playerName={player.player_name}
                isEditMode={isEditMode}
                onEditGame={onEditGame}
                onDeleteGame={onDeleteGame}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
