// StatsSection.tsx
import React from "react";
import { StatsViewSwitcher } from "./views/StatisticsViewSwitcher";
import { FullView } from "./views/FullView";
import { PlayerGameStatsWithDetails, SeasonTotals, Award, PlayerStatsViewMode, Player, User, PlayerWithTeam } from "@/lib/types";
import { HomeAwayView } from "./views/HomeAwayView";
import { KeyGameView } from "./views/KeyGameView";
import LeagueAwards from "./views/LeagueAwards";
import { PlayoffsView } from "./views/PlayoffsView";
import { SeasonView } from "./views/SeasonView";
import { WinLossView } from "./views/WinLossView";
import { NbaCupView } from "./views/NbaCupView";
import { RosterView } from "./views/RosterView";
import { useRoster } from "@/hooks/data/useRoster";
import { OvertimeView } from "./views/OvertimeView";
import { SimulatedView } from "./views/SimulatedView";

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
  playerId: string;
  seasonId: string;
  player: Player;
  currentUser?: User | null;
  players?: PlayerWithTeam[];
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
  playerId,
  seasonId,
  player,
  currentUser,
  players = [],
}: StatsSectionProps) {
  const hasStats = allSeasonStats.length > 0;

  // Use roster hook to check for roster data
  const { roster } = useRoster({
    selectedSeason: seasonId,
    currentUserPlayer: player,
    onStatsUpdated: () => {},
  });

  // Calculate available view modes based on data
  const hasOvertimeGames = allSeasonStats.some(stat => stat.is_overtime === true);
  const hasSimulatedGames = allSeasonStats.some(stat => stat.is_simulated === true);
  // Only count database entries, not hardcoded players
  const hasRoster = roster.filter(r => r.id && String(r.id).startsWith('hardcoded-player') === false).length > 0;

  // Calculate streaks for different views
  const calculateStreak = (stats: PlayerGameStatsWithDetails[]) => {
    if (stats.length === 0) return null;
    
    // Sort games by date (most recent first)
    const sortedGames = [...stats].sort(
      (a, b) =>
        new Date(b.game_date || b.created_at || "").getTime() -
        new Date(a.game_date || a.created_at || "").getTime()
    );
    
    if (sortedGames.length === 0) return null;
    
    const mostRecentWinStatus = sortedGames[0].is_win;
    let streak = 0;
    
    // Count consecutive wins or losses from most recent game
    for (const game of sortedGames) {
      if (game.is_win === mostRecentWinStatus) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      count: streak,
      isWin: mostRecentWinStatus,
    };
  };

  const fullStreak = React.useMemo(() => calculateStreak(allSeasonStats), [allSeasonStats]);
  const seasonStreak = React.useMemo(() => {
    const seasonStats = allSeasonStats.filter((stat) => stat.is_playoff_game === false);
    return calculateStreak(seasonStats);
  }, [allSeasonStats]);
  const playoffsStreak = React.useMemo(() => {
    const playoffsStats = allSeasonStats.filter((stat) => stat.is_playoff_game === true);
    return calculateStreak(playoffsStats);
  }, [allSeasonStats]);

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
    if (hasRoster) {
      views.push("roster");
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
          currentStreak={fullStreak}
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
          currentStreak={seasonStreak}
        />
      )}
      {viewMode === "playoffs" && (
        <PlayoffsView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
          currentStreak={playoffsStreak}
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
      {viewMode === "overtime" && (
        <OvertimeView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
      {viewMode === "simulated" && (
        <SimulatedView
          allSeasonStats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          playerTeamColor={playerTeamColor}
        />
      )}
      {viewMode === "league-awards" && (
        <LeagueAwards awards={awards} currentUser={currentUser} players={players} />
      )}
      {viewMode === "roster" && (
        <RosterView
          playerId={playerId}
          seasonId={seasonId}
          playerTeamColor={playerTeamColor}
          player={player}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
