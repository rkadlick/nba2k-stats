// StatsSection.tsx
import React from "react";
import { StatsViewSwitcher } from "./views/StatisticsViewSwitcher";
import { FullView } from "./views/FullView";
import { PlayerGameStatsWithDetails, SeasonTotals, Award, Team } from "@/lib/types";
import { HomeAwayView } from "./views/HomeAwayView";
import { KeyGameView } from "./views/KeyGameView";
import LeagueAwards from "./views/LeagueAwards";
import { PlayoffsView } from "./views/PlayoffsView";
import { SeasonView } from "./views/SeasonView";

interface StatsSectionProps {
  allSeasonStats: PlayerGameStatsWithDetails[];
  seasonTotals: SeasonTotals | null;
  viewMode: "season" | "full" | "playoffs" | "home-away" | "key-games" | "league-awards";
  setViewMode: (mode: "season" | "full" | "playoffs" | "home-away" | "key-games" | "league-awards") => void;
  isEditMode: boolean;
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
  playerTeamColor: string;
  awards?: Award[];
  teams?: Team[];
}
export function StatsSection({
  allSeasonStats,
  seasonTotals,
  viewMode,
  setViewMode,
  isEditMode,
  onEditGame,
  onDeleteGame,
  playerTeamColor,
  awards = [],
  teams = [],
}: StatsSectionProps) {
  const hasStats = allSeasonStats.length > 0;

  // Dynamically choose which views are allowed
  const allowedViews = hasStats
    ? ["season", "playoffs", "full", "home-away", "key-games", "league-awards"] as const
    : ["season", "league-awards"] as const;

  return (
    <div className="flex flex-col px-4 py-2 bg-gray-50">
      <div className="mb-2">
        <StatsViewSwitcher
          viewMode={viewMode}
          onChange={(mode: "season" | "playoffs" | "full" | "home-away" | "key-games" | "league-awards") =>
            setViewMode(mode)
          }
          allowedViews={allowedViews}
        />
      </div>

      {viewMode === "season" && (
        <SeasonView
          allSeasonStats={allSeasonStats} 
          seasonTotals={seasonTotals}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
      {viewMode === "playoffs" && (
        <PlayoffsView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
            {viewMode === "full" && (
        <FullView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
      {viewMode === "home-away" && (
        <HomeAwayView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
      {viewMode === "key-games" && (
        <KeyGameView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
      {viewMode === "league-awards" && (
        <LeagueAwards awards={awards} teams={teams} />
      )}
    </div>
  );
}
