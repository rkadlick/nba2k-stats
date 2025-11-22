"use client";

import { useState, useEffect } from "react";
import {
  PlayerWithTeam,
  PlayerGameStatsWithDetails,
  PlayerAwardInfo,
  Season,
  Team,
  SeasonTotals,
  Award,
  User,
} from "@/lib/types";
import { CAREER_SEASON_ID } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { getDisplayPlayerName } from "@/lib/playerNameUtils";
import { StatsSection } from "./stats-section";
import SeasonSelector from "../SeasonSelector";
import CareerView from "../CareerView";
import TeamLogo from "../TeamLogo";
import StatTable from "./stats-section/stat-table";

interface PlayerPanelProps {
  player: PlayerWithTeam;
  allStats: PlayerGameStatsWithDetails[];
  awards: PlayerAwardInfo[];
  allSeasonAwards?: Award[]; // All awards for all seasons (for showing other players' awards)
  seasons: Season[];
  defaultSeason: Season;
  teams?: Team[];
  players?: PlayerWithTeam[]; // All players (for looking up award winners)
  currentUser?: User | null; // Current logged-in user (for name obfuscation)
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
  currentUser = null,
  isEditMode = false,
  onEditGame,
  onDeleteGame,
  onStatsUpdated,
  onSeasonChange,
}: PlayerPanelProps) {
  const [playerSeasons, setPlayerSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | string>(
    defaultSeason
  );
  const [seasonTotals, setSeasonTotals] = useState<SeasonTotals | null>(null);
  const [hasInitializedSeason, setHasInitializedSeason] = useState(false);
  const [viewMode, setViewMode] = useState<"full" | "home-away" | "key-games">(
    "full"
  );

  // Notify parent when season changes
  const handleSeasonChange = (season: Season | string) => {
    setSelectedSeason(season);
    setViewMode("full"); // Reset to full view when season changes
    onSeasonChange?.(season);
  };

  useEffect(() => {
    // Reset initialization flag when player changes
    setHasInitializedSeason(false);
  }, [player.id]);

  useEffect(() => {
    const loadPlayerSeasons = async () => {
      if (!supabase || !player.id) {
        setPlayerSeasons([]);
        return;
      }

      try {
        // Find all season_ids from season_totals for this player
        const { data, error } = await supabase
          .from("season_totals")
          .select("season_id")
          .eq("player_id", player.id);

        if (error) {
          logger.error("Error loading player seasons:", error);
          setPlayerSeasons([]);
          return;
        }

        const seasonIds = (data || []).map((row) => row.season_id);

        // Filter from global seasons prop
        const filteredSeasons = seasons.filter((season) =>
          seasonIds.includes(season.id)
        );
        setPlayerSeasons(filteredSeasons);

        // Set selected season to the most recent season with totals for this player (only on initial load)
        if (!hasInitializedSeason) {
          if (filteredSeasons.length > 0) {
            // Sort by year_end descending to get the most recent season
            const sortedSeasons = [...filteredSeasons].sort(
              (a, b) => b.year_end - a.year_end
            );
            const mostRecentSeason = sortedSeasons[0];
            setSelectedSeason(mostRecentSeason);
            onSeasonChange?.(mostRecentSeason);
          } else {
            // No seasons with totals, default to career view
            setSelectedSeason(CAREER_SEASON_ID);
            onSeasonChange?.(CAREER_SEASON_ID);
          }
          setHasInitializedSeason(true);
        }
      } catch (err) {
        logger.error("Error loading player seasons:", err);
        setPlayerSeasons([]);
      }
    };

    loadPlayerSeasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.id, seasons, hasInitializedSeason]);

  // Load season totals from database when season changes
  useEffect(() => {
    const loadSeasonTotals = async () => {
      if (
        selectedSeason === CAREER_SEASON_ID ||
        typeof selectedSeason !== "object" ||
        !supabase
      ) {
        setSeasonTotals(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("season_totals")
          .select("*")
          .eq("player_id", player.id)
          .eq("season_id", selectedSeason.id)
          .single();

        if (error && error.code !== "PGRST116") {
          logger.error("Error loading season totals:", error);
        }

        setSeasonTotals(data || null);
      } catch (error) {
        logger.error("Error loading season totals:", error);
        setSeasonTotals(null);
      }
    };

    loadSeasonTotals();
  }, [player.id, selectedSeason]);

  const primaryColor = player.team?.primary_color || "#6B7280";
  const secondaryColor = player.team?.secondary_color || "#9CA3AF";

  // Utility: convert hex like "#123ABC" → rgba string
  const hexToRgba = (hex: string, opacity: number = 0.1): string => {
    const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Utility: get sort order for awards
  const getAwardSortOrder = (awardName: string): number => {
    const normalized = awardName.toLowerCase().trim();

    // Define the priority order (check more specific matches first)
    if (normalized.includes("finals") && normalized.includes("mvp")) return 2;
    if (normalized === "mvp" || normalized.includes("most valuable player"))
      return 1;
    if (normalized.includes("defensive player") || normalized.includes("dpoy"))
      return 3;
    if (normalized.includes("rookie") || normalized.includes("roy")) return 4;
    if (normalized.includes("clutch")) return 5;
    if (normalized.includes("most improved") || normalized.includes("mip"))
      return 6;
    if (normalized.includes("sixth man") || normalized.includes("6th man"))
      return 7;
    if (normalized.includes("coach")) return 8;

    // All other awards come after
    return 9;
  };

  // Utility: sort awards by priority
  const sortAwards = (awards: Award[]): Award[] => {
    return [...awards].sort((a, b) => {
      const orderA = getAwardSortOrder(a.award_name);
      const orderB = getAwardSortOrder(b.award_name);

      // If same priority, sort alphabetically
      if (orderA === orderB) {
        return a.award_name.localeCompare(b.award_name);
      }

      return orderA - orderB;
    });
  };

  const isCareerView = selectedSeason === CAREER_SEASON_ID;

  // Filter stats by selected season (if not career view)
  const allSeasonStats =
    !isCareerView && typeof selectedSeason === "object"
      ? allStats.filter((stat) => stat.season_id === selectedSeason.id)
      : [];

  // Filter stats based on view mode
  const seasonStats = viewMode === "full" ? allSeasonStats : allSeasonStats; // Will be filtered per section in Home/Away view

  // Filter home and away stats for Home/Away view
  const homeStats = allSeasonStats.filter((stat) => stat.is_home === true);
  const awayStats = allSeasonStats.filter((stat) => stat.is_home === false);

  // Filter key games for Key Games view
  const keyGamesStats = allSeasonStats.filter(
    (stat) => stat.is_key_game === true
  );

  // Helper function to calculate record (wins - losses)
  const calculateRecord = (stats: typeof allSeasonStats) => {
    const wins = stats.filter((stat) => stat.is_win === true).length;
    const losses = stats.filter((stat) => stat.is_win === false).length;
    return { wins, losses };
  };

  // Calculate records for each view
  const fullRecord = calculateRecord(allSeasonStats);
  const homeRecord = calculateRecord(homeStats);
  const awayRecord = calculateRecord(awayStats);
  const keyGamesRecord = calculateRecord(keyGamesStats);

  // Filter awards by selected season
  // CRITICAL: Awards must belong to this player's user (award.user_id matches player.user_id)
  // Awards belong to this player's league if award.player_id matches player.id
  // Awards are won by this player if winner_player_id matches OR winner_player_name matches
  const seasonAwards =
    !isCareerView && typeof selectedSeason === "object"
      ? sortAwards(
          allSeasonAwards.filter((award) => {
            if (award.season_id !== selectedSeason.id) return false;
            // CRITICAL: Award must belong to this player's user (user who owns this player)
            if (award.user_id !== player.user_id) return false;
            // Award must belong to this player's league (award.player_id matches player.id)
            // If award.player_id is null, it's a general award (shouldn't show as player-specific)
            if (award.player_id && award.player_id !== player.id) return false;
            // Award is won by this player if winner_player_id matches OR winner_player_name matches
            if (
              award.winner_player_id &&
              award.winner_player_id === player.id
            ) {
              return true;
            }
            if (award.winner_player_name) {
              const winnerName = award.winner_player_name.trim().toLowerCase();
              const playerName = player.player_name.trim().toLowerCase();
              return winnerName === playerName;
            }
            return false;
          })
        )
      : [];

  // Get all other awards for this season (excluding current player's awards)
  // These are awards in the same league (same player_id) but won by OTHER players
  // CRITICAL: Awards must belong to this player's user (award.user_id matches player.user_id)
  const otherSeasonAwards =
    !isCareerView && typeof selectedSeason === "object"
      ? sortAwards(
          allSeasonAwards.filter((award) => {
            if (award.season_id !== selectedSeason.id) return false;
            // CRITICAL: Award must belong to this player's user (user who owns this player)
            if (award.user_id !== player.user_id) return false;
            // Award must belong to this player's league (award.player_id matches player.id)
            if (award.player_id && award.player_id !== player.id) return false;
            // Exclude awards won by this player
            if (
              award.winner_player_id &&
              award.winner_player_id === player.id
            ) {
              return false;
            }
            if (award.winner_player_name) {
              const winnerName = award.winner_player_name.trim().toLowerCase();
              const playerName = player.player_name.trim().toLowerCase();
              if (winnerName === playerName) return false;
            }
            return true;
          })
        )
      : [];

  const seasonYear =
    !isCareerView && typeof selectedSeason === "object"
      ? `${selectedSeason.year_start}–${selectedSeason.year_end}`
      : "Career";

  // Get current season for playoff tree
  const currentSeason =
    !isCareerView && typeof selectedSeason === "object" ? selectedSeason : null;

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
              <h2 className="text-2xl font-bold">
                {getDisplayPlayerName(
                  player,
                  players.length > 0 ? players : [player],
                  currentUser
                )}
              </h2>
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
              {Math.floor(player.height / 12)}&apos;{player.height % 12}&quot; •{" "}
              {player.weight} lbs
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
            seasons={playerSeasons}
            selectedSeason={selectedSeason}
            onSelectSeason={handleSeasonChange}
          />
        </div>
      </div>

      {/* Career View */}
      {isCareerView ? (
        <div className="flex-1 px-6 py-4 bg-gray-50">
          <CareerView player={player} allAwards={awards} seasons={seasons} />
        </div>
      ) : (
        <>
          {/* Player Awards Section – Cleaned Up */}
          {seasonAwards.length > 0 && (
            <div
              className="px-6 py-4 border-b text-center relative"
              style={{
                background: `linear-gradient(90deg,
        ${hexToRgba(primaryColor, 0.75)},
        ${hexToRgba(secondaryColor || primaryColor, 0.65)})`,
                borderColor: hexToRgba(primaryColor, 0.4),
              }}
            >
              <div className="space-y-2 relative z-10">
                <div className="text-sm sm:text-base font-semibold text-white drop-shadow-sm tracking-wide">
                  Awards This Season
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {seasonAwards.map((award) => (
                    <span
                      key={award.id}
                      className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full
                       bg-white/15 text-white border border-white/25
                       backdrop-blur-sm shadow-sm"
                    >
                      {award.award_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stats Table */}
          {allSeasonStats.length > 0 ? (
          <StatsSection
            allSeasonStats={allSeasonStats}
            seasonTotals={null}
            isEditMode={isEditMode}
            onEditGame={onEditGame ?? (() => {})}
            onDeleteGame={onDeleteGame ?? (() => {})}
            playerTeamColor={primaryColor}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          ) : (
            <StatTable
              stats={allSeasonStats}
              seasonTotals={seasonTotals}
              isEditMode={isEditMode}
              onEditGame={onEditGame ?? (() => {})}
              onDeleteGame={onDeleteGame ?? (() => {})}
              playerTeamColor={primaryColor}
              showKeyGames={true}
            />
          )}

          {/* All Other Awards section - below totals */}
          {otherSeasonAwards.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-800 mb-4">
                League Awards
              </div>

              <div className="flex flex-col">
                {otherSeasonAwards.map((award, index) => {
                  // Try to determine color from the winner's team
                  const team = award.winner_team_id
                    ? teams.find((t) => t.id === award.winner_team_id)
                    : teams.find(
                        (t) =>
                          t.name?.toLowerCase() ===
                          (award.winner_team_name ?? "").toLowerCase()
                      );

                  const teamColor = team?.primary_color || "#374151"; // fallback gray-700

                  // Player name to show
                  const winnerName = award.winner_player_name || "Unknown";

                  return (
                    <div key={award.id}>
                      <div className="text-center py-2">
                        <div className="text-base font-bold text-gray-900 mb-1">
                          {award.award_name}
                        </div>
                        <div className="text-sm text-gray-700 flex items-center justify-center gap-2">
                          {winnerName}
                          {team?.name && (
                            <>
                              {" • "}
                              <TeamLogo
                                teamName={team.name}
                                teamId={team.id}
                                size={20}
                              />
                              <span style={{ color: teamColor }}>
                                {team.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {index < otherSeasonAwards.length - 1 && (
                        <hr className="border-gray-300 my-2" />
                      )}
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
