// NbaCupView.tsx
import React, { useMemo } from "react";
import StatTable from "@/components/player-panel/stats-section/stat-table";
import { PlayerGameStatsWithDetails } from "@/lib/types";

export function NbaCupView({
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
	const nbaCupStats = allSeasonStats.filter((stat) => stat.is_cup_game === true);
	const calculateRecord = (stats: PlayerGameStatsWithDetails[]) => {
		const wins = stats.filter((stat) => stat.is_win === true).length;
		const losses = stats.filter((stat) => stat.is_win === false).length;
		return { wins, losses };
	};
		const nbaCupRecord = calculateRecord(nbaCupStats);

  return (
    <>
      {/* Playoffs Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">
          NBA Cup
        </h4>
        {nbaCupStats.length > 0 ? (
          <p className="text-xs text-[color:var(--color-text-muted)] mb-2">
            Record: {nbaCupRecord.wins} - {nbaCupRecord.losses} | {nbaCupStats.length}{" "}
            total game{nbaCupStats.length !== 1 ? "s" : ""} recorded
          </p>
        ) : (
          <p className="text-xs text-[color:var(--color-text-muted)] mb-2">No games recorded</p>
        )}
        {nbaCupStats.length > 0 && (
          <StatTable
            stats={nbaCupStats}
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
