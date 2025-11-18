'use client';

import { useState, useEffect } from 'react';
import { PlayerWithTeam, PlayerGameStatsWithDetails, PlayerAwardInfo, Season, Team, SeasonTotals, Award } from '@/lib/types';
import { CAREER_SEASON_ID } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import StatTable from './StatTable';
import SeasonSelector from './SeasonSelector';
import CareerView from './CareerView';
import PlayoffTree from './PlayoffTree';

interface PlayerPanelProps {
  player: PlayerWithTeam;
  allStats: PlayerGameStatsWithDetails[];
  awards: PlayerAwardInfo[];
  allSeasonAwards?: Award[]; // All awards for all seasons (for showing other players' awards)
  seasons: Season[];
  defaultSeason: Season;
  teams?: Team[];
  players?: PlayerWithTeam[]; // All players (for looking up award winners)
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
  allSeasonAwards = [],
  seasons,
  defaultSeason,
  teams = [],
  players = [],
  isEditMode = false,
  onEditGame,
  onDeleteGame,
  onStatsUpdated,
  onSeasonChange,
}: PlayerPanelProps) {
  const [selectedSeason, setSelectedSeason] = useState<Season | string>(defaultSeason);
  const [seasonTotals, setSeasonTotals] = useState<SeasonTotals | null>(null);
  
  // Notify parent when season changes
  const handleSeasonChange = (season: Season | string) => {
    setSelectedSeason(season);
    onSeasonChange?.(season);
  };
  
  // Load season totals from database when season changes
  useEffect(() => {
    const loadSeasonTotals = async () => {
      if (selectedSeason === CAREER_SEASON_ID || typeof selectedSeason !== 'object' || !supabase) {
        setSeasonTotals(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('season_totals')
          .select('*')
          .eq('player_id', player.id)
          .eq('season_id', selectedSeason.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          logger.error('Error loading season totals:', error);
        }

        setSeasonTotals(data || null);
      } catch (error) {
        logger.error('Error loading season totals:', error);
        setSeasonTotals(null);
      }
    };

    loadSeasonTotals();
  }, [player.id, selectedSeason]);
  
  const primaryColor = player.team?.primary_color || '#6B7280';
  const secondaryColor = player.team?.secondary_color || '#9CA3AF';

  const isCareerView = selectedSeason === CAREER_SEASON_ID;

  // Filter stats by selected season (if not career view)
  const seasonStats = !isCareerView && typeof selectedSeason === 'object'
    ? allStats.filter((stat) => stat.season_id === selectedSeason.id)
    : [];
  
  // Filter awards by selected season
  // CRITICAL: Awards must belong to this player's user (award.user_id matches player.user_id)
  // Awards belong to this player's league if award.player_id matches player.id
  // Awards are won by this player if winner_player_id matches OR winner_player_name matches
  const seasonAwards = !isCareerView && typeof selectedSeason === 'object'
    ? allSeasonAwards.filter((award) => {
        if (award.season_id !== selectedSeason.id) return false;
        // CRITICAL: Award must belong to this player's user (user who owns this player)
        if (award.user_id !== player.user_id) return false;
        // Award must belong to this player's league (award.player_id matches player.id)
        // If award.player_id is null, it's a general award (shouldn't show as player-specific)
        if (award.player_id && award.player_id !== player.id) return false;
        // Award is won by this player if winner_player_id matches OR winner_player_name matches
        if (award.winner_player_id && award.winner_player_id === player.id) {
          return true;
        }
        if (award.winner_player_name) {
          const winnerName = award.winner_player_name.trim().toLowerCase();
          const playerName = player.player_name.trim().toLowerCase();
          return winnerName === playerName;
        }
        return false;
      })
    : [];

  // Get all other awards for this season (excluding current player's awards)
  // These are awards in the same league (same player_id) but won by OTHER players
  // CRITICAL: Awards must belong to this player's user (award.user_id matches player.user_id)
  const otherSeasonAwards = !isCareerView && typeof selectedSeason === 'object'
    ? allSeasonAwards.filter((award) => {
        if (award.season_id !== selectedSeason.id) return false;
        // CRITICAL: Award must belong to this player's user (user who owns this player)
        if (award.user_id !== player.user_id) return false;
        // Award must belong to this player's league (award.player_id matches player.id)
        if (award.player_id && award.player_id !== player.id) return false;
        // Exclude awards won by this player
        if (award.winner_player_id && award.winner_player_id === player.id) {
          return false;
        }
        if (award.winner_player_name) {
          const winnerName = award.winner_player_name.trim().toLowerCase();
          const playerName = player.player_name.trim().toLowerCase();
          if (winnerName === playerName) return false;
        }
        return true;
      })
    : [];

  const seasonYear = !isCareerView && typeof selectedSeason === 'object'
    ? `${selectedSeason.year_start}–${selectedSeason.year_end}`
    : 'Career';

  // Get current season for playoff tree
  const currentSeason = !isCareerView && typeof selectedSeason === 'object' 
    ? selectedSeason 
    : null;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-scroll border border-gray-200">
      {/* Header with team colors */}
      <div
        className="px-6 py-5 text-white relative"
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
        <div className="flex-1 px-6 py-4 bg-gray-50">
          <CareerView
            player={player}
            allStats={allStats}
            allAwards={awards}
            seasons={seasons}
          />
        </div>
      ) : (
        <>
          {/* Player Awards section - below picker, above stats */}
          {seasonAwards.length > 0 && (
            <div className="px-6 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
              <div className="text-sm font-semibold text-yellow-900 mb-2">
                Awards Won
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
          <div className="flex flex-col px-4 py-2 bg-gray-50">
            {seasonStats.length === 0 && !seasonTotals && (
              <div className="text-sm text-gray-500 mb-2">No games recorded</div>
            )}
            {seasonStats.length === 0 && seasonTotals && (
              <div className="text-sm text-gray-500 mb-2">No games recorded</div>
            )}
            {(seasonStats.length > 0 || seasonTotals) && (
              <div className="mb-2">
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                  Season Stats
                </h3>
                {seasonStats.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {seasonStats.length} game{seasonStats.length !== 1 ? 's' : ''} recorded
                  </p>
                )}
              </div>
            )}
            <div>
              <StatTable 
                stats={seasonStats} 
                isEditMode={isEditMode}
                onEditGame={onEditGame}
                onDeleteGame={onDeleteGame}
                seasonTotals={seasonTotals}
              />
            </div>
          </div>

          {/* All Other Awards section - below totals */}
          {otherSeasonAwards.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-3">
                League Awards
              </div>
              <div className="space-y-2">
                {otherSeasonAwards.map((award) => {
                  const winnerName = award.winner_player_name || 
                    (award.winner_player_id && players.find(p => p.id === award.winner_player_id)?.player_name) ||
                    'TBD';
                  const winnerTeam = award.winner_team_name ||
                    (award.winner_team_id && teams.find(t => t.id === award.winner_team_id)?.name) ||
                    '';
                  return (
                    <div
                      key={award.id}
                      className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 bg-white rounded border border-gray-200"
                    >
                      <span className="text-sm font-medium text-gray-900">{award.award_name}</span>
                      <div className="text-xs text-gray-600 flex flex-col sm:flex-row gap-1 items-center">
                        <span>{winnerName}
                        {winnerTeam && <span> • {winnerTeam}</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
