// KeyGameView.tsx
import React, { useMemo } from "react";
import StatTable from "@/components/player-panel/stats-section/stat-table";
import { PlayerGameStatsWithDetails } from "@/lib/types";

export function PlayoffsView({
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
	const playoffsStats = allSeasonStats.filter((stat) => stat.is_playoff_game === true);
	const calculateRecord = (stats: PlayerGameStatsWithDetails[]) => {
		const wins = stats.filter((stat) => stat.is_win === true).length;
		const losses = stats.filter((stat) => stat.is_win === false).length;
		return { wins, losses };
	};
	const playoffsRecord = calculateRecord(playoffsStats);

  return (
    <>
      {/* Playoffs Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-800 mb-0.5">
          Playoffs
        </h4>
        {playoffsStats.length > 0 ? (
          <p className="text-xs text-gray-600 mb-2">
            Record: {playoffsRecord.wins} - {playoffsRecord.losses} | {playoffsStats.length}{" "}
            total game{playoffsStats.length !== 1 ? "s" : ""} recorded
          </p>
        ) : (
          <p className="text-xs text-gray-600 mb-2">No games recorded</p>
        )}
        {playoffsStats.length > 0 && (
          <StatTable
            stats={playoffsStats}
            isEditMode={isEditMode}
            onEditGame={onEditGame}
            onDeleteGame={onDeleteGame}
            seasonTotals={null} // Calculate from filtered games
            playerTeamColor={playerTeamColor}
            showKeyGames={false}
          />
        )}
      </div>
    </>
  );
}
