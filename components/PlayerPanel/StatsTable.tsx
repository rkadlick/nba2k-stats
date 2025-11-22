// StatsSection.tsx
import React from "react";
import { StatsViewSwitcher } from "./views/StatisticsViewSwitcher";
import { FullView } from "./views/FullView";
import { PlayerGameStatsWithDetails, SeasonTotals } from "@/lib/types";
import { HomeAwayView } from "./views/HomeAwayView";
import { KeyGameView } from "./views/KeyGameView";

interface StatsTableProps {
  allSeasonStats: PlayerGameStatsWithDetails[];
  seasonTotals: SeasonTotals | null;
  viewMode: "full" | "home-away" | "key-games";
  setViewMode: (mode: "full" | "home-away" | "key-games") => void;
  isEditMode: boolean;
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
  playerTeamColor: string;
}
export function StatsTable({
  allSeasonStats,
  viewMode,
  setViewMode,
  isEditMode,
  onEditGame,
  onDeleteGame,
  playerTeamColor,
}: StatsTableProps) {
  const showSwitcher =
    allSeasonStats.length > 0

  return (
    <div className="flex flex-col px-4 py-2 bg-gray-50">
      <div className="mb-2">
        <StatsViewSwitcher
          viewMode={viewMode}
          onChange={(mode: "full" | "home-away" | "key-games") =>
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
    </div>
  );
}
