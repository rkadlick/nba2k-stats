import React, { useMemo } from "react";
import { PlayerGameStatsWithDetails } from "@/lib/types";
import { format } from "date-fns";
import { getTeamAbbreviation } from "@/lib/teamAbbreviations";

interface GameHighsProps {
	games: PlayerGameStatsWithDetails[];
}

interface HighStat {
	value: number;
	games: {
		date: string;
		opponent: string;
		isHome: boolean;
	}[];
}

export function GameHighs({ games }: GameHighsProps) {
	const highs = useMemo(() => {
		const statsToTrack = [
			{ key: "points", label: "Points" },
			{ key: "rebounds", label: "Rebounds" },
			{ key: "assists", label: "Assists" },
			{ key: "steals", label: "Steals" },
			{ key: "blocks", label: "Blocks" },
			{ key: "threes_made", label: "3PM" },
		] as const;

		const result: Record<string, HighStat> = {};

		statsToTrack.forEach(({ key }) => {
			let maxVal = -1;

			// First pass: find max value
			games.forEach((game) => {
				const val = (game[key] as number) || 0;
				if (val > maxVal) maxVal = val;
			});

			if (maxVal > 0) {
				// Second pass: find all games with max value
				const occurrences = games
					.filter((game) => ((game[key] as number) || 0) === maxVal)
					.map((game) => ({
						date: game.game_date,
						opponent: game.opponent_team?.name || game.opponent_team_name || "Unknown",
						isHome: game.is_home,
					}))
					.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first

				result[key] = {
					value: maxVal,
					games: occurrences,
				};
			}
		});

		return result;
	}, [games]);

	if (Object.keys(highs).length === 0) return null;

	const statOrder = [
		{ key: "points", label: "Points" },
		{ key: "rebounds", label: "Rebounds" },
		{ key: "assists", label: "Assists" },
		{ key: "steals", label: "Steals" },
		{ key: "blocks", label: "Blocks" },
		{ key: "threes_made", label: "3PM" },
	];

	return (
		<div className="mt-6">
			<h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider pl-1">
				Game Highs
			</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
				{statOrder.map(({ key, label }) => {
					const stat = highs[key];
					if (!stat) return null;

					return (
						<div
							key={key}
							className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col"
						>
							<div className="text-xs text-gray-500 uppercase font-medium mb-1">
								{label}
							</div>
							<div className="text-2xl font-bold text-gray-900 mb-2">
								{stat.value}
							</div>
							<div className="mt-auto space-y-1">
								{stat.games.map((game, idx) => (
									<div key={idx} className="text-xs text-gray-600 truncate" title={`${format(new Date(game.date), "MMM d")} ${game.isHome ? "vs" : "@"} ${game.opponent}`}>
										<span className="font-medium">
											{format(new Date(game.date), "MMM d")}
										</span>{" "}
										<span className="text-gray-400">
											{game.isHome ? "vs" : "@"}
										</span>{" "}
										{getTeamAbbreviation(game.opponent)}
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
