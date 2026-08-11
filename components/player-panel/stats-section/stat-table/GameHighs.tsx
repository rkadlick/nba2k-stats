import { useMemo } from "react";
import { PlayerGameStatsWithDetails } from "@/lib/types";
import { format } from "date-fns";
import { getTeamAbbreviation } from "@/lib/teams";
import { getSeasonHighValues } from "@/lib/statHelpers";

interface GameHighsProps {
	games: PlayerGameStatsWithDetails[];
	playerTeamColor?: string;
}

interface HighStat {
	value: number;
	games: {
		date: string;
		opponent: string;
		isHome: boolean;
	}[];
}

const statOrder = [
	{ key: "points", label: "PTS" },
	{ key: "rebounds", label: "REB" },
	{ key: "assists", label: "AST" },
	{ key: "steals", label: "STL" },
	{ key: "blocks", label: "BLK" },
	{ key: "plus_minus", label: "+/-" },
	{ key: "fg_made", label: "FGM" },
	{ key: "threes_made", label: "3PM" },
	{ key: "ft_made", label: "FTM" },
] as const;

export function GameHighs({ games, playerTeamColor = "#000000" }: GameHighsProps) {
	const highs = useMemo(() => {
		const maxValues = getSeasonHighValues(games);
		const result: Record<string, HighStat> = {};

		statOrder.forEach(({ key }) => {
			const maxVal = maxValues[key];
			if (maxVal === undefined) return;

			const occurrences = games
				.filter((game) => ((game[key] as number) || 0) === maxVal)
				.map((game) => ({
					date: game.game_date,
					opponent: game.opponent_team?.fullName || game.opponent_team_name || "Unknown",
					isHome: game.is_home,
				}))
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first

			result[key] = {
				value: maxVal,
				games: occurrences,
			};
		});

		return result;
	}, [games]);

	if (Object.keys(highs).length === 0) return null;

	const orderedHighs = statOrder
		.filter(({ key }) => highs[key])
		.map(({ key, label }) => {
			const stat = highs[key];
			const shown = stat.games.slice(0, stat.games.length > 5 ? 4 : 5);
			const subtitles = shown.map((game) => {
				const homeAway = game.isHome ? "vs" : "@";
				const date = format(new Date(game.date), "M/d/yy");
				return `${homeAway} ${getTeamAbbreviation(game.opponent)} · ${date}`;
			});
			const moreCount = stat.games.length > 5 ? stat.games.length - 4 : 0;

			return { key, label, value: stat.value, subtitles, moreCount };
		});

	return (
		<div className="border-t border-gray-200 p-3 sm:p-4">
			<h3 className="text-base font-bold text-gray-900 mb-3">Season Highs</h3>
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
				{orderedHighs.map(({ key, label, value, subtitles, moreCount }) => (
					<div
						key={key}
						className="flex flex-col items-center text-center rounded-lg py-3 px-2 bg-gray-50 hover:bg-gray-100 transition-colors"
					>
						<div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							{label}
						</div>
						<div
							className="text-3xl font-extrabold leading-tight tabular-nums mt-1"
							style={{ color: playerTeamColor }}
						>
							{value}
						</div>
						<div className="mt-1.5 space-y-0.5">
							{subtitles.map((subtitle, idx) => (
								<div key={idx} className="text-xs text-gray-500">
									{subtitle}
								</div>
							))}
							{moreCount > 0 && (
								<div className="text-xs text-gray-400 italic">
									+{moreCount} more
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
