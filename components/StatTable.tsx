"use client";

import { useMemo } from "react";
import { NBA_STAT_ORDER, PlayerGameStatsWithDetails } from "@/lib/types";
import {
  getAllStatKeys,
  getSeasonTotalsKeys,
  getSeasonTotals,
} from "@/lib/statHelpers";

import { SeasonTotals as SeasonTotalsType } from "@/lib/types";
import { SeasonTotals as SeasonTotalsComponent } from "./SeasonTotals";
import { GameLog } from "./GameLog";

interface StatTableProps {
  stats: PlayerGameStatsWithDetails[];
  isEditMode?: boolean;
  onEditGame?: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame?: (gameId: string) => void;
  seasonTotals?: SeasonTotalsType | null;
  playerTeamColor?: string; // Player's team primary color for key game indicator
  showKeyGames?: boolean; // Whether to show key game indicators (false in key-games view)
}

export default function StatTable({
  stats,
  isEditMode = false,
  onEditGame,
  onDeleteGame,
  seasonTotals,
  playerTeamColor,
  showKeyGames = true,
}: StatTableProps) {
  // Get stat keys in NBA order, excluding percentages, is_win, and scores
  // Note: double_doubles and triple_doubles are NOT included here - they only appear in season totals
  const gameLogStatKeys = useMemo(() => {
    // 🧩 If we have actual game logs, derive stats directly from them
    if (stats && stats.length > 0) {
      return getAllStatKeys(stats);
    }
    // 🏀 No game logs? Use season totals from the database instead
    if (seasonTotals) {
      return [
        ...NBA_STAT_ORDER, // All known stats, using database totals
      ];
    }
    // 🚫 No stats at all — empty array (nothing to render)
    return [];
  }, [stats, seasonTotals]);

  // Season totals stat keys (percentages shown in averages row, not separate columns)
  // Adds double/triple doubles to the season totals keys
  const seasonTotalsKeys = useMemo(() => {
    return getSeasonTotalsKeys(gameLogStatKeys);
  }, [gameLogStatKeys]);

  const seasonTotalsData = useMemo(() => {
    // 🧩 1. If we have game logs, calculate totals from them
    if (stats && stats.length > 0) {
      return getSeasonTotals(stats);
    }

    // 🏀 2. Fall back — use database-provided seasonTotals
    if (seasonTotals) {
      const totals: Record<string, number> = {
        points: seasonTotals.total_points,
        rebounds: seasonTotals.total_rebounds,
        assists: seasonTotals.total_assists,
        steals: seasonTotals.total_steals,
        blocks: seasonTotals.total_blocks,
        turnovers: seasonTotals.total_turnovers,
        minutes: seasonTotals.total_minutes,
        fouls: seasonTotals.total_fouls,
        plus_minus: seasonTotals.total_plus_minus,
        fg_made: seasonTotals.total_fg_made,
        fg_attempted: seasonTotals.total_fg_attempted,
        threes_made: seasonTotals.total_threes_made,
        threes_attempted: seasonTotals.total_threes_attempted,
        ft_made: seasonTotals.total_ft_made,
        ft_attempted: seasonTotals.total_ft_attempted,
        double_doubles: seasonTotals.double_doubles || 0,
        triple_doubles: seasonTotals.triple_doubles || 0,
      };

      const averages: Record<string, number> = {};
      const avgKeys = [
        "points",
        "rebounds",
        "assists",
        "steals",
        "blocks",
        "turnovers",
        "minutes",
        "fouls",
        "plus_minus",
      ];

      avgKeys.forEach((key) => {
        const avgField = `avg_${key}` as keyof typeof seasonTotals;
        const value = seasonTotals[avgField];
        if (typeof value === "number") {
          averages[key] = value;
        }
      });

      return { totals, averages, count: seasonTotals.games_played || 0 };
    }

    // 🚫 3. Worst case — no stats and no seasonTotals
    return { totals: {}, averages: {}, count: 0 };
  }, [stats, seasonTotals]);

  const getStatLabel = (key: string): string => {
    const labels: Record<string, string> = {
      minutes: "MIN",
      points: "PTS",
      rebounds: "REB",
      offensive_rebounds: "OR",
      assists: "AST",
      steals: "STL",
      blocks: "BLK",
      turnovers: "TO",
      fouls: "PF",
      plus_minus: "+/-",
      fg: "FG",
      threes: "3PT",
      ft: "FT",
      double_doubles: "DD",
      triple_doubles: "TD",
    };
    return labels[key] || key.replace(/_/g, " ").toUpperCase();
  };

  const getStatTooltip = (key: string): string => {
    const tooltips: Record<string, string> = {
      minutes: "Minutes",
      points: "Points",
      rebounds: "Rebounds",
      assists: "Assists",
      steals: "Steals",
      blocks: "Blocks",
      turnovers: "Turnovers",
      fouls: "Fouls",
      plus_minus: "Plus/Minus",
      fg: "Field Goals",
      threes: "3-Pointers",
      ft: "Free Throws",
      offensive_rebounds: "Offensive Rebounds",
      double_doubles: "Double Doubles",
      triple_doubles: "Triple Doubles",
    };
    return tooltips[key] || "";
  };

  // Show games table if we have games
  // Show season totals if we have season totals from database (preferred) or games (fallback)
  const showGamesTable = stats.length > 0;
  const showSeasonTotals = seasonTotals !== null || stats.length > 0;

  if (stats.length === 0 && !seasonTotals) {
    return null; // Let parent handle "No games recorded" message
  }

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white">
      {/* Games table - only show if games exist */}
      {showGamesTable && (
        <GameLog
          games={stats}
          statKeys={gameLogStatKeys}
          getStatTooltip={getStatTooltip}
          getStatLabel={getStatLabel}
          isEditMode={isEditMode}
          onEditGame={onEditGame ?? (() => {})}
          onDeleteGame={onDeleteGame ?? (() => {})}
          playerTeamColor={playerTeamColor ?? "#000000"}
          showKeyGames={showKeyGames}
        />
      )}

      {/* Season Totals - Separate section with own headers */}
      {showSeasonTotals && (
        <SeasonTotalsComponent
          seasonTotalsData={seasonTotalsData}
          seasonTotalsKeys={seasonTotalsKeys}
          getStatTooltip={getStatTooltip}
          getStatLabel={getStatLabel}
        />
      )}
    </div>
  );
}
