// WinLossView.tsx
import React, { useMemo } from "react";
import StatTable from "@/components/player-panel/stats-section/stat-table";
import { PlayerGameStatsWithDetails } from "@/lib/types";

export function WinLossView({
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
	const seasonStats = allSeasonStats.filter((stat) => stat.is_playoff_game === false);
	const winStats = seasonStats.filter((stat) => stat.is_win === true);
	const lossStats = seasonStats.filter((stat) => stat.is_win === false);

	return (
		<>
			{/* Wins Section */}
			<div className="mb-6">
				<h4 className="text-base font-semibold text-gray-800 mb-0.5">
					Wins
				</h4>
				{winStats.length > 0 ? (
					<p className="text-xs text-gray-600 mb-2">
						{winStats.length}{" "} total games{winStats.length !== 1 ? "s" : ""} recorded
					</p>
				) : (
					<p className="text-xs text-gray-600 mb-2">No games recorded</p>
				)}
				{winStats.length > 0 && (
					<StatTable
						stats={winStats}
						isEditMode={isEditMode}
						onEditGame={onEditGame}
						onDeleteGame={onDeleteGame}
						seasonTotals={null} // Calculate from filtered games
						playerTeamColor={playerTeamColor}
						showKeyGames={true}
					/>
				)}
			</div>

			{/* Losses Section */}
			<div>
				<h4 className="text-base font-semibold text-gray-800 mb-0.5">
					Losses
				</h4>
				{lossStats.length > 0 ? (
					<p className="text-xs text-gray-600 mb-2">
						{lossStats.length}{" "}
						total games{lossStats.length !== 1 ? "s" : ""} recorded
					</p>
				) : (
					<p className="text-xs text-gray-600 mb-2">No games recorded</p>
				)}
				{lossStats.length > 0 && (
					<StatTable
						stats={lossStats}
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
