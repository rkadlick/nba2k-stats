// FullView.tsx
import React, { useMemo } from "react";
import StatTable from "@/components/player-panel/stats-section/stat-table";
import { PlayerGameStatsWithDetails } from "@/lib/types";

export function FullView({
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
  const fullRecord = useMemo(() => {
    const wins = allSeasonStats.filter((stat) => stat.is_win === true).length;
    const losses = allSeasonStats.filter(
      (stat) => stat.is_win === false
    ).length;
    return { wins, losses };
  }, [allSeasonStats]);

  return (
    <>
    <div className="mb-6">
      <h4 className="text-base font-semibold text-gray-900 mb-0.5">
        Full Season Stats
      </h4>
      {allSeasonStats.length > 0 ? (
        <p className="text-xs text-gray-600 mb-2">
          Record: {fullRecord.wins} - {fullRecord.losses} |{" "}
          {allSeasonStats.length} total game
          {allSeasonStats.length !== 1 ? "s" : ""} recorded
        </p>
      ) : (
        <p className="text-xs text-gray-600 mb-2">No games recorded</p>
      )}
      {allSeasonStats.length > 0 && (
        <StatTable
          stats={allSeasonStats}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          seasonTotals={null}
          playerTeamColor={playerTeamColor}
          showKeyGames={true}
        />
        ) }
    </div>
    </>
  );
}
