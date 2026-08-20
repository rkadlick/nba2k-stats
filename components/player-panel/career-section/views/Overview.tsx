import React from 'react';
import { PlayerWithTeam, SeasonTotals, Season, CareerHigh } from '@/lib/types';
import { getTeamColor } from '@/lib/teams';
import CareerHighsGrid from '../CareerHighsGrid';

interface OverviewProps {
	player: PlayerWithTeam;
	seasonTotals: {
		season: Season;
		dbTotal: SeasonTotals | undefined;
		totals: Record<string, number | undefined>;
		averages: Record<string, number>;
		gamesPlayed: number;
		gamesStarted: number | undefined;
	}[];
	careerTotals: {
		totals: Record<string, number>;
		averages: Record<string, number>;
		gamesPlayed: number;
		gamesStarted: number;
	};
	seasonTotalsKeys: string[];
	careerHighs: CareerHigh[];
}

export default function Overview({
	player,
	seasonTotals,
	careerTotals,
	seasonTotalsKeys,
	careerHighs,
}: OverviewProps) {

	// Helper functions moved from index.tsx
	const getStatLabel = (key: string): string => {
		const labels: Record<string, string> = {
			games_played: 'GP',
			games_started: 'GS',
			minutes: 'MIN',
			points: 'PTS',
			rebounds: 'REB',
			offensive_rebounds: 'OR',
			assists: 'AST',
			steals: 'STL',
			blocks: 'BLK',
			turnovers: 'TO',
			fouls: 'PF',
			plus_minus: '+/-',
			fg: 'FG',
			threes: '3PT',
			ft: 'FT',
			fg_percentage: 'FG%',
			ft_percentage: 'FT%',
			three_pt_percentage: '3PT%',
			double_doubles: 'DD',
			triple_doubles: 'TD',
		};
		return labels[key] || key.replace(/_/g, ' ').toUpperCase();
	};

	const getStatTooltip = (key: string): string => {
		const tooltips: Record<string, string> = {
			offensive_rebounds: 'Offensive Rebounds',
		};
		return tooltips[key] || '';
	};

	const getTotalValue = (totals: Record<string, number | undefined>, key: string): string => {
		// Handle double/triple doubles - these are totals, not averages
		if (key === 'double_doubles' || key === 'triple_doubles') {
			const value = totals[key];
			return value !== undefined ? value.toString() : '0';
		}

		// Handle combined shooting stats
		if (key === 'fg') {
			const made = totals.fg_made;
			const attempted = totals.fg_attempted;
			if (made !== undefined && attempted !== undefined) {
				return `${made}/${attempted}`;
			}
			return '–';
		}
		if (key === 'threes') {
			const made = totals.threes_made;
			const attempted = totals.threes_attempted;
			if (made !== undefined && attempted !== undefined) {
				return `${made}/${attempted}`;
			}
			return '–';
		}
		if (key === 'ft') {
			const made = totals.ft_made;
			const attempted = totals.ft_attempted;
			if (made !== undefined && attempted !== undefined) {
				return `${made}/${attempted}`;
			}
			return '–';
		}

		const value = totals[key];
		if (value !== undefined && value !== null) {
			return typeof value === 'number'
				? value.toFixed(value % 1 === 0 ? 0 : 1)
				: String(value);
		}
		return '–';
	};

	const getAvgValue = (totals: Record<string, number | undefined>, averages: Record<string, number>, gamesPlayed: number, key: string): string => {
		// Handle games played/started, double/triple doubles - these don't have averages
		if (key === 'games_played' || key === 'games_started' || key === 'double_doubles' || key === 'triple_doubles') {
			return '–';
		}

		// Handle percentage columns - display as decimals (0.722) in averages row
		if (key === 'fg') {
			const made = totals.fg_made;
			const attempted = totals.fg_attempted;
			if (made !== undefined && attempted !== undefined && attempted > 0) {
				return (made / attempted).toFixed(3);
			}
			return '–';
		}
		if (key === 'threes') {
			const made = totals.threes_made;
			const attempted = totals.threes_attempted;
			if (made !== undefined && attempted !== undefined && attempted > 0) {
				return (made / attempted).toFixed(3);
			}
			return '–';
		}
		if (key === 'ft') {
			const made = totals.ft_made;
			const attempted = totals.ft_attempted;
			if (made !== undefined && attempted !== undefined && attempted > 0) {
				return (made / attempted).toFixed(3);
			}
			return '–';
		}

		const value = averages[key];
		if (value !== undefined && value !== null && typeof value === 'number') {
			// Format with 1 decimal place for per-game averages
			return value.toFixed(1);
		}
		return '–';
	};

	const primaryColor = getTeamColor(player.team?.id ?? '') || '#6366f1';

	return (
		<div className="space-y-4">
			{/* Career Highs */}
			<CareerHighsGrid title="Career Highs" careerHighs={careerHighs} primaryColor={primaryColor} />

			{/* Season-by-Season Breakdown - Mimics season view styling */}
			{seasonTotals.length > 0 && (
				<div className="rounded-lg border border-gray-200 bg-white">
					{/* Horizontal scroll container */}
					<div className="overflow-x-auto">
						<table className="w-full border-collapse min-w-full">
							<thead>
								<tr>
									<th className="text-left px-3 py-2 font-semibold text-sm text-gray-900 sticky left-0 bg-gray-100 z-10 border-b border-gray-300">Season</th>
									{seasonTotalsKeys.map((key) => {
										const tooltip = getStatTooltip(key);
										return (
											<th
												key={key}
												className="text-right px-2 py-2 font-semibold text-xs text-gray-900 whitespace-nowrap border-b border-gray-300"
												title={tooltip || undefined}
											>
												{getStatLabel(key)}
											</th>
										);
									})}
								</tr>
							</thead>
							<tbody>
								{seasonTotals.map(({ season, totals, averages, gamesPlayed, gamesStarted, dbTotal }) => {
									// Add GP and GS to totals
									const totalsWithGP = {
										...totals,
										games_played: gamesPlayed,
										games_started: gamesStarted || 0,
									};

									return (
										<React.Fragment key={season.id}>
											{/* Totals row */}
											<tr className="bg-gray-50 border-b border-gray-200">
												<td rowSpan={2} className="px-3 py-2 text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 align-middle">
													<div className="font-semibold">{season.year_start}–{season.year_end}</div>
													{dbTotal?.is_manual_entry && (
														<div
															className="text-[10px] text-purple-600 mt-0.5 cursor-help"
															title="Stats manually entered; not linked to individual games"
														>
															Manual
														</div>
													)}
												</td>
												{seasonTotalsKeys.map((key) => {
													const needsAverage = key !== 'games_played' && key !== 'games_started' &&
														key !== 'double_doubles' && key !== 'triple_doubles';
													return (
														<td
															key={key}
															className={`text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap ${!needsAverage ? 'align-middle' : ''}`}
															rowSpan={!needsAverage ? 2 : undefined}
														>
															{getTotalValue(totalsWithGP, key)}
														</td>
													);
												})}
											</tr>
											{/* Averages row */}
											<tr className="bg-gray-100 border-b border-gray-300">
												{seasonTotalsKeys.map((key) => {
													const needsAverage = key !== 'games_played' && key !== 'games_started' &&
														key !== 'double_doubles' && key !== 'triple_doubles';
													if (!needsAverage) return null; // Skip cells that span 2 rows
													return (
														<td key={key} className="text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">
															{getAvgValue(totalsWithGP, averages, gamesPlayed, key)}
														</td>
													);
												})}
											</tr>
										</React.Fragment>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Career Totals Table - Separate table below */}
			{careerTotals.gamesPlayed > 0 && (
				<div className="rounded-lg border border-gray-200 bg-white">
					{/* Horizontal scroll container */}
					<div className="overflow-x-auto">
						<table className="w-full border-collapse min-w-full">
							<thead>
								<tr>
									<th className="text-left px-3 py-2 font-semibold text-sm text-gray-900 sticky left-0 bg-gray-100 z-10 border-b border-gray-300">Career Totals</th>
									{seasonTotalsKeys.map((key) => {
										const tooltip = getStatTooltip(key);
										return (
											<th
												key={key}
												className="text-right px-2 py-2 font-semibold text-xs text-gray-900 whitespace-nowrap border-b border-gray-300"
												title={tooltip || undefined}
											>
												{getStatLabel(key)}
											</th>
										);
									})}
								</tr>
							</thead>
							<tbody>
								{/* Totals row */}
								<tr className="bg-gray-50 border-b border-gray-200">
									<td rowSpan={2} className="px-3 py-2 text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 align-middle">
										Career Totals
									</td>
									{seasonTotalsKeys.map((key) => {
										const needsAverage = key !== 'games_played' && key !== 'games_started' &&
											key !== 'double_doubles' && key !== 'triple_doubles';
										return (
											<td
												key={key}
												className={`text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap ${!needsAverage ? 'align-middle' : ''}`}
												rowSpan={!needsAverage ? 2 : undefined}
											>
												{getTotalValue(careerTotals.totals, key)}
											</td>
										);
									})}
								</tr>
								{/* Averages row */}
								<tr className="bg-gray-100">
									{seasonTotalsKeys.map((key) => {
										const needsAverage = key !== 'games_played' && key !== 'games_started' &&
											key !== 'double_doubles' && key !== 'triple_doubles';
										if (!needsAverage) return null; // Skip cells that span 2 rows
										return (
											<td key={key} className="text-right px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">
												{getAvgValue(careerTotals.totals, careerTotals.averages, careerTotals.gamesPlayed, key)}
											</td>
										);
									})}
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
