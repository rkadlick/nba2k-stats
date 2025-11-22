// KeyGameView.tsx
import React, { useMemo } from "react";
import StatTable from "@/components/StatTable";
import { PlayerGameStatsWithDetails } from "@/lib/types";

export function KeyGameView({
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
	const keyGamesStats = allSeasonStats.filter((stat) => stat.is_key_game === true);
	const calculateRecord = (stats: PlayerGameStatsWithDetails[]) => {
		const wins = stats.filter((stat) => stat.is_win === true).length;
		const losses = stats.filter((stat) => stat.is_win === false).length;
		return { wins, losses };
	};
	const keyGamesRecord = calculateRecord(keyGamesStats);

  return (
    <>
      {/* Home Games Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-gray-800 mb-0.5">
          Key Games
        </h4>
        {keyGamesStats.length > 0 ? (
          <p className="text-xs text-gray-600 mb-2">
            Record: {keyGamesRecord.wins} - {keyGamesRecord.losses} | {keyGamesStats.length}{" "}
            total game{keyGamesStats.length !== 1 ? "s" : ""} recorded
          </p>
        ) : (
          <p className="text-xs text-gray-600 mb-2">No games recorded</p>
        )}
        {keyGamesStats.length > 0 && (
          <StatTable
            stats={keyGamesStats}
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
