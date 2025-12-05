import React, { useMemo } from "react";
import { PlayerGameStatsWithDetails } from "@/lib/types";
import { format } from "date-fns";
import { getTeamAbbreviation } from "@/lib/teams";

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
			{ key: "plus_minus", label: "+/-" },
			{ key: "fg_made", label: "FGM" },
			{ key: "threes_made", label: "3PM" },
			{ key: "ft_made", label: "FTM" },
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
		{ key: "plus_minus", label: "+/-" },
		{ key: "fg_made", label: "FGM" },
		{ key: "threes_made", label: "3PM" },
		{ key: "ft_made", label: "FTM" },
	];

	return (
		<div className="mt-6">

			<div className="flex flex-wrap gap-4 justify-center mx-1 mb-1">
				{statOrder.map(({ key, label }) => {
					const stat = highs[key];
					if (!stat) return null;

					return (
						<div
							key={key}
							className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col h-full min-w-[120px] items-center"
						>
							<div className="text-xs text-gray-500 uppercase font-medium mb-1">
								{label}
							</div>
							<div className="text-2xl font-bold text-gray-900 mb-2">
								{stat.value}
							</div>
							<div className="space-y-1 w-full text-left">
								{stat.games.slice(0, stat.games.length > 5 ? 4 : 5).map((game, idx) => (
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
								{stat.games.length > 5 && (
									<div className="text-xs text-gray-400 italic pl-1">
										{stat.games.length - 4} more...
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
