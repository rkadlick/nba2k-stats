"use client";

import { useState, useEffect } from "react";
import {
  PlayerWithTeam,
  PlayerGameStatsWithDetails,
  Season,
  SeasonTotals,
  Award,
  User
} from "@/lib/types";
import { CAREER_SEASON_ID, PlayerStatsViewMode } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { getDisplayPlayerName, getBasePlayerId } from "@/lib/playerNameUtils";
import { StatsSection } from "./stats-section";
import SeasonSelector from "../SeasonSelector";
import CareerSection from "./career-section";
import { TEAM_BASED_AWARDS } from "./stats-section/views/LeagueAwards";
import {
  TbTrophyFilled,
  TbCrown,
  TbShieldCheckFilled,
  TbShieldFilled,
  TbSparkles,
  TbBoltFilled,
  TbTrendingUp,
  TbFlame,
  TbClipboardList,
  TbStarFilled,
  TbPlant2,
  TbMedal,
  TbAwardFilled,
} from "react-icons/tb";
import type { IconType } from "react-icons";

interface PlayerPanelProps {
  player: PlayerWithTeam;
  allStats: PlayerGameStatsWithDetails[];
  awards: Award[];
  seasons: Season[];
  defaultSeason: Season;
  players?: PlayerWithTeam[]; // All players (for looking up award winners)
  currentUser?: User | null; // Current logged-in user (for name obfuscation)
  privateNamesById?: Record<string, string>; // Private names by player ID
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
  players = [],
  currentUser = null,
  privateNamesById = {},
  isEditMode = false,
  onEditGame,
  onDeleteGame,
  onSeasonChange,
}: PlayerPanelProps) {
  const [playerSeasons, setPlayerSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | string>(
    defaultSeason
  );
  const [seasonTotals, setSeasonTotals] = useState<SeasonTotals | null>(null);
  const [hasInitializedSeason, setHasInitializedSeason] = useState(false);
  const [viewMode, setViewMode] = useState<PlayerStatsViewMode>("full");

  // Notify parent when season changes
  const handleSeasonChange = (season: Season | string) => {
    setSelectedSeason(season);

    // Determine if the new season has stats
    // If it's a string (e.g. "career"), we assume full view is allowed (or handled elsewhere)
    // If it's a season object, we check if there are stats for that season
    if (typeof season === "object") {
      const hasStats = allStats.some((stat) => stat.season_id === season.id);
      setViewMode(hasStats ? "full" : "season");
    } else {
      setViewMode("full");
    }

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

  const primaryColor = player.team?.colors.primary || "#6B7280";
  const secondaryColor = player.team?.colors.secondary || "#9CA3AF";
  // Accessible text color for the team's primary background (falls back to white)
  const onPrimaryColor = player.team?.colors.onPrimary || "#FFFFFF";

  // Utility: convert hex like "#123ABC" → rgba string
  const hexToRgba = (hex: string, opacity: number = 0.1): string => {
    const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Utility: perceived luminance of a hex color (0 = black, 1 = white)
  const getColorLuminance = (hex: string): number => {
    const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  // Whether the team's on-primary text color is light (i.e. the primary
  // background itself is dark) — drives which pill treatment reads best
  const isLightOnPrimary = getColorLuminance(onPrimaryColor) > 0.5;

  // Pill fill/border that stays legible against any primaryColor: darkens
  // the chip when the banner text is light, and lightens it (near-solid)
  // when the banner text is dark — always moving contrast in the safe
  // direction instead of risking a wash-out from blending team colors.
  // Same treatment for every pill, individual or team-based.
  const pillColors = {
    background: isLightOnPrimary ? "rgba(0, 0, 0, 0.26)" : "rgba(255, 255, 255, 0.85)",
    border: isLightOnPrimary ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.15)",
  };

  // Utility: pick an icon that represents an award's category
  const getAwardIcon = (awardName: string): IconType => {
    const n = awardName.toLowerCase().trim();

    if (n.includes("finals") && n.includes("mvp")) return TbTrophyFilled;
    if (n.includes("all-star") && n.includes("mvp")) return TbTrophyFilled;
    if (n === "mvp" || n.includes("most valuable player")) return TbCrown;
    if (n.includes("defensive player") || n.includes("dpoy"))
      return TbShieldCheckFilled;
    if (n.includes("rookie of the year") || n === "roy") return TbSparkles;
    if (n.includes("clutch")) return TbBoltFilled;
    if (n.includes("most improved") || n.includes("mip")) return TbTrendingUp;
    if (n.includes("sixth man") || n.includes("6th man")) return TbFlame;
    if (n.includes("coach")) return TbClipboardList;
    if (n.includes("all-star")) return TbStarFilled;
    if (n.includes("all-defense")) return TbShieldFilled;
    if (n.includes("all-rookie")) return TbPlant2;
    if (n.includes("all-nba")) return TbMedal;

    return TbAwardFilled;
  };

  // Renders a single award pill — same treatment for every award,
  // individual or team-based.
  const renderAwardPill = (award: Award) => {
    const Icon = getAwardIcon(award.award_name);

    return (
      <span
        key={award.id}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full shadow-sm transition-transform hover:scale-105"
        style={{
          color: onPrimaryColor,
          backgroundColor: pillColors.background,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: pillColors.border,
        }}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: onPrimaryColor, opacity: 0.85 }} />
        {award.award_name}
      </span>
    );
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

  // Filter awards won by this player for the selected season
  const seasonAwards =
    !isCareerView && typeof selectedSeason === "object"
      ? sortAwards(
        awards.filter((award) => {
          if (award.season_id !== selectedSeason.id) return false;
          // Award must be won by this player (compare base IDs since
          // winner_player_id may predate game-version-suffixed player IDs)
          if (
            award.winner_player_id &&
            getBasePlayerId(award.winner_player_id) === getBasePlayerId(player.id)
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
  const otherSeasonAwards =
    !isCareerView && typeof selectedSeason === "object"
      ? sortAwards(
        awards.filter((award) => {
          if (award.season_id !== selectedSeason.id) return false;
          // Exclude awards won by this player (compare base IDs since
          // winner_player_id may predate game-version-suffixed player IDs)
          if (
            award.winner_player_id &&
            getBasePlayerId(award.winner_player_id) === getBasePlayerId(player.id)
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

  // Get player's team-based awards (All-NBA, All-Defense, All-Rookie, All-Star)
  const playerTeamBasedAwards = seasonAwards.filter((award) =>
    (TEAM_BASED_AWARDS as readonly string[]).includes(award.award_name)
  );

  // Everything else won this season (MVP, ROY, DPOY, Finals MVP, etc.) —
  // used to split the awards banner into individual vs. team-based groups
  const individualSeasonAwards = seasonAwards.filter(
    (award) => !(TEAM_BASED_AWARDS as readonly string[]).includes(award.award_name)
  );

  // Combine player's team-based awards with other players' awards
  const allLeagueAwards = [...playerTeamBasedAwards, ...otherSeasonAwards];

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
                  currentUser,
                  privateNamesById
                )}
              </h2>
              {player.team && (
                <p className="text-sm opacity-90 mt-1">{player.team.fullName}</p>
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
        <CareerSection
          player={player}
          allAwards={awards}
          seasons={playerSeasons}
          allStats={allStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={primaryColor}
        />
      ) : (
        <>
          {/* Season Awards */}
          {seasonAwards.length > 0 && (
            <div
              className="px-6 py-4 border-b relative"
              style={{
                backgroundColor: primaryColor,
                borderColor: hexToRgba(secondaryColor, 0.5),
              }}
            >
              {/* Decorative layer — clipped on its own so effects can't bleed
                  into neighboring sections without also clipping real content */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Depth overlay, matching the header treatment above */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
                {/* Secondary-color glow for a team-flavored accent */}
                <div
                  className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl opacity-30"
                  style={{ backgroundColor: secondaryColor }}
                />
                {/* Bottom accent strip tying header + banner + secondary color together */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[3px]"
                  style={{
                    background: `linear-gradient(90deg, ${hexToRgba(secondaryColor, 0.9)}, ${hexToRgba(primaryColor, 0.9)}, ${hexToRgba(secondaryColor, 0.9)})`,
                  }}
                />
              </div>

              <div className="space-y-3 relative z-10">
                <div
                  className="text-center text-xs sm:text-sm font-bold uppercase tracking-widest"
                  style={{ color: onPrimaryColor }}
                >
                  Season Awards
                </div>

                {individualSeasonAwards.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {individualSeasonAwards.map((award) => renderAwardPill(award))}
                  </div>
                )}

                {individualSeasonAwards.length > 0 && playerTeamBasedAwards.length > 0 && (
                  <div
                    className="h-px w-20 mx-auto"
                    style={{ backgroundColor: hexToRgba(onPrimaryColor, 0.2) }}
                  />
                )}

                {playerTeamBasedAwards.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {playerTeamBasedAwards.map((award) => renderAwardPill(award))}
                  </div>
                )}
              </div>
            </div>
          )}
          <StatsSection
            allSeasonStats={allSeasonStats}
            seasonTotals={seasonTotals}
            isEditMode={isEditMode}
            onEditGame={onEditGame ?? (() => { })}
            onDeleteGame={onDeleteGame ?? (() => { })}
            playerTeamColor={primaryColor}
            viewMode={viewMode}
            setViewMode={setViewMode}
            awards={allLeagueAwards}
            playerId={player.id}
            seasonId={!isCareerView && typeof selectedSeason === "object" ? selectedSeason.id : ""}
            player={player}
            currentUser={currentUser}
            players={players}
          />
        </>
      )}
    </div>
  );
}
