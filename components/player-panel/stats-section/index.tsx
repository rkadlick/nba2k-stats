// StatsSection.tsx
import React from "react";
import { StatsViewSwitcher } from "./views/StatisticsViewSwitcher";
import { FullView } from "./views/FullView";
import { PlayerGameStatsWithDetails, SeasonTotals, Award, Team, PlayerStatsViewMode, ALL_STATS_VIEW_MODES } from "@/lib/types";
import { HomeAwayView } from "./views/HomeAwayView";
import { KeyGameView } from "./views/KeyGameView";
import LeagueAwards from "./views/LeagueAwards";
import { PlayoffsView } from "./views/PlayoffsView";
import { SeasonView } from "./views/SeasonView";
import { WinLossView } from "./views/WinLossView";
import { NbaCupView } from "./views/NbaCupView";

interface StatsSectionProps {
  allSeasonStats: PlayerGameStatsWithDetails[];
  seasonTotals: SeasonTotals | null;
  viewMode: PlayerStatsViewMode;
  setViewMode: (mode: PlayerStatsViewMode) => void;
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

  // Calculate available view modes based on data
const hasOvertimeGames = allSeasonStats.some(stat => stat.is_overtime === true);
const hasSimulatedGames = allSeasonStats.some(stat => stat.is_simulated === true);

  // Dynamically choose which views are allowed
  const allowedViews: readonly PlayerStatsViewMode[] = (() => {
    // Base views that are always available when there are stats
    const baseViews: PlayerStatsViewMode[] = hasStats 
      ? ["full", "season", "playoffs", "home-away", "win-loss", "key-games"]
      : ["season"];
  
    // Always include league-awards
    const views = [...baseViews, "league-awards"];
  
    // Conditionally add nba-cup (you can keep this or change based on your needs)
    if (hasStats) {
      views.push("nba-cup");
    }
  
    // Add overtime view only if player has overtime games
    if (hasOvertimeGames) {
      views.push("overtime");
    }
  
    // Add simulated view only if player has simulated games  
    if (hasSimulatedGames) {
      views.push("simulated");
    }
  
    return views as readonly PlayerStatsViewMode[];
  })();

  return (
    <div className="flex flex-col px-4 py-2 bg-gray-50">
      <div className="mb-2">
        <StatsViewSwitcher
          viewMode={viewMode}
          onChange={(mode: PlayerStatsViewMode) =>
            setViewMode(mode)
          }
          allowedViews={allowedViews as readonly PlayerStatsViewMode[]}
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
      {viewMode === "home-away" && (
        <HomeAwayView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
      {viewMode === "win-loss" && (
        <WinLossView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
      {viewMode === "nba-cup" && (
        <NbaCupView
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
