// SeasonView.tsx
import React, { useMemo } from "react";
import StatTable from "@/components/player-panel/stats-section/stat-table";
import { PlayerGameStatsWithDetails, SeasonTotals } from "@/lib/types";

export function SeasonView({
  allSeasonStats,
  seasonTotals,
  isEditMode,
  onEditGame,
  onDeleteGame,
  playerTeamColor,
}: {
  allSeasonStats: PlayerGameStatsWithDetails[];
  seasonTotals: SeasonTotals | null;
  isEditMode: boolean;
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
  playerTeamColor: string;
}) {
  const seasonStats = allSeasonStats.filter((stat) => stat.is_playoff_game === false);
  const calculateRecord = (stats: PlayerGameStatsWithDetails[]) => {
    const wins = stats.filter((stat) => stat.is_win === true).length;
    const losses = stats.filter((stat) => stat.is_win === false).length;
    return { wins, losses };
  };
  const seasonRecord = calculateRecord(seasonStats);

  return (
    <>
      {/* Season Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">
          Season
        </h4>
        {seasonStats.length > 0 ? (
          <p className="text-xs text-[color:var(--color-text-muted)] mb-2">
            Record: {seasonRecord.wins} - {seasonRecord.losses} | {seasonStats.length}{" "}
            total game{seasonStats.length !== 1 ? "s" : ""} recorded
          </p>
        ) : (
          <p className="text-xs text-[color:var(--color-text-muted)] mb-2">No games recorded</p>
        )}
        {seasonStats.length > 0 ? (
          <StatTable
            stats={seasonStats}
            isEditMode={isEditMode}
            onEditGame={onEditGame}
            onDeleteGame={onDeleteGame}
            seasonTotals={null} // Calculate from filtered games
            playerTeamColor={playerTeamColor}
            showKeyGames={true}
          />
        ) : (
          <StatTable
            stats={seasonStats}
            isEditMode={isEditMode}
            onEditGame={onEditGame}
            onDeleteGame={onDeleteGame}
            seasonTotals={seasonTotals} // Calculate from filtered games
            playerTeamColor={playerTeamColor}
            showKeyGames={true}
          />
        )}
      </div>
    </>
  );
}
