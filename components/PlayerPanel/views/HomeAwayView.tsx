// HomeAwayView.tsx
import React, { useMemo } from "react";
import StatTable from "@/components/StatTable";
import { PlayerGameStatsWithDetails } from "@/lib/types";

export function HomeAwayView({
  allSeasonStats,
  isEditMode,
  onEditGame,
  onDeleteGame,
  playerTeamColor,
}: {
  allSeasonStats: PlayerGameStatsWithDetails[];
  isEditMode: boolean;
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
  playerTeamColor: string;
}) {
  const homeStats = allSeasonStats.filter((stat) => stat.is_home === true);
  const awayStats = allSeasonStats.filter((stat) => stat.is_home === false);
  const calculateRecord = (stats: PlayerGameStatsWithDetails[]) => {
    const wins = stats.filter((stat) => stat.is_win === true).length;
    const losses = stats.filter((stat) => stat.is_win === false).length;
    return { wins, losses };
  };
  const homeRecord = calculateRecord(homeStats);
  const awayRecord = calculateRecord(awayStats);

  return (
    <>
      {/* Home Games Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-800 mb-0.5">
          Home Games
        </h4>
        {homeStats.length > 0 ? (
          <p className="text-xs text-gray-600 mb-2">
            Record: {homeRecord.wins} - {homeRecord.losses} | {homeStats.length}{" "}
            total game{homeStats.length !== 1 ? "s" : ""} recorded
          </p>
        ) : (
          <p className="text-xs text-gray-600 mb-2">No games recorded</p>
        )}
        {homeStats.length > 0 && (
          <StatTable
            stats={homeStats}
            isEditMode={isEditMode}
            onEditGame={onEditGame}
            onDeleteGame={onDeleteGame}
            seasonTotals={null} // Calculate from filtered games
            playerTeamColor={playerTeamColor}
            showKeyGames={true}
          />
        )}
      </div>

      {/* Away Games Section */}
      <div>
        <h4 className="text-base font-semibold text-gray-800 mb-0.5">
          Away Games
        </h4>
        {awayStats.length > 0 ? (
          <p className="text-xs text-gray-600 mb-2">
            Record: {awayRecord.wins} - {awayRecord.losses} | {awayStats.length}{" "}
            total game{awayStats.length !== 1 ? "s" : ""} recorded
          </p>
        ) : (
          <p className="text-xs text-gray-600 mb-2">No games recorded</p>
        )}
        {awayStats.length > 0 && (
          <StatTable
            stats={awayStats}
            isEditMode={isEditMode}
            onEditGame={onEditGame}
            onDeleteGame={onDeleteGame}
            seasonTotals={null} // Calculate from filtered games
            playerTeamColor={playerTeamColor}
            showKeyGames={true}
          />
        )}
      </div>
    </>
  );
}
