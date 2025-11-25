// StatsSection.tsx
import React from "react";
import { StatsViewSwitcher } from "./views/StatisticsViewSwitcher";
import { FullView } from "./views/FullView";
import { PlayerGameStatsWithDetails, SeasonTotals, Award, Team } from "@/lib/types";
import { HomeAwayView } from "./views/HomeAwayView";
import { KeyGameView } from "./views/KeyGameView";
import LeagueAwards from "./views/LeagueAwards";

interface StatsSectionProps {
  allSeasonStats: PlayerGameStatsWithDetails[];
  seasonTotals: SeasonTotals | null;
  viewMode: "full" | "home-away" | "key-games" | "league-awards";
  setViewMode: (mode: "full" | "home-away" | "key-games" | "league-awards") => void;
  isEditMode: boolean;
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
  playerTeamColor: string;
  awards?: Award[];
  teams?: Team[];
}
export function StatsSection({
  allSeasonStats,
  viewMode,
  setViewMode,
  isEditMode,
  onEditGame,
  onDeleteGame,
  playerTeamColor,
  awards = [],
  teams = [],
}: StatsSectionProps) {
  const showSwitcher =
    allSeasonStats.length > 0

  return (
    <div className="flex flex-col px-4 py-2 bg-gray-50">
      <div className="mb-2">
        <StatsViewSwitcher
          viewMode={viewMode}
          onChange={(mode: "full" | "home-away" | "key-games" | "league-awards") =>
            setViewMode(mode)
          }
          show={showSwitcher}
        />
      </div>

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
