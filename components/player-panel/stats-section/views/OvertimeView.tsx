// OvertimeView.tsx
import StatTable from "@/components/player-panel/stats-section/stat-table";
import { PlayerGameStatsWithDetails } from "@/lib/types";

export function OvertimeView({
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
	const overtimeStats = allSeasonStats.filter((stat) => stat.is_overtime === true);
	const calculateRecord = (stats: PlayerGameStatsWithDetails[]) => {
		const wins = stats.filter((stat) => stat.is_win === true).length;
		const losses = stats.filter((stat) => stat.is_win === false).length;
		return { wins, losses };
	};
	const overtimeRecord = calculateRecord(overtimeStats);

  return (
    <>
      {/* Home Games Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">
          Overtime Games
        </h4>
        {overtimeStats.length > 0 ? (
          <p className="text-xs text-[color:var(--color-text-muted)] mb-2">
            Record: {overtimeRecord.wins} - {overtimeRecord.losses} | {overtimeStats.length}{" "}
            total game{overtimeStats.length !== 1 ? "s" : ""} recorded
          </p>
        ) : (
          <p className="text-xs text-[color:var(--color-text-muted)] mb-2">No games recorded</p>
        )}
        {overtimeStats.length > 0 && (
          <StatTable
            stats={overtimeStats}
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
