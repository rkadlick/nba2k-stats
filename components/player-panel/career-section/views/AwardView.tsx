import React from 'react';
import { PlayerAwardInfo, Season, PlayerWithTeam } from '@/lib/types';

interface AwardViewProps {
	allAwards: PlayerAwardInfo[];
	seasons: Season[];
	player: PlayerWithTeam;
}

export default function AwardView({
	allAwards,
	seasons,
	player,
}: AwardViewProps) {

	const AWARDS_MASTER_LIST: { name: string }[] = [
		{ name: 'MVP' },
		{ name: 'Rookie of the Year' },
		{ name: 'Most Improved Player' },
		{ name: 'Sixth Man of the Year' },
		{ name: 'Defensive Player of the Year' },
		{ name: 'Finals MVP' },
		{ name: 'Clutch Player of the Year' },
		{ name: 'Coach of the Year' },
		{ name: '1st Team All-NBA' },
		{ name: '2nd Team All-NBA' },
		{ name: '3rd Team All-NBA' },
		{ name: '1st Team All-Defense' },
		{ name: '2nd Team All-Defense' },
		{ name: '1st Team All-Rookie' },
		{ name: '2nd Team All-Rookie' },
		{ name: 'All-Star' },
		{ name: 'All-Star MVP' }
	];

	// Color helpers (duplicated for now to keep components self-contained)
	const hexToRgba = (hex: string, opacity: number = 0.1): string => {
		const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
		const r = parseInt(cleanHex.slice(0, 2), 16);
		const g = parseInt(cleanHex.slice(2, 4), 16);
		const b = parseInt(cleanHex.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	};

	const primaryColor = player.team?.primary_color || '#6366f1';
	const secondaryColor = player.team?.secondary_color || '#8b5cf6';

	if (!allAwards || !Array.isArray(allAwards) || allAwards.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500 italic">
				No awards recorded.
			</div>
		);
	}

	const awardOrder = AWARDS_MASTER_LIST.reduce((acc: Record<string, number>, award: { name: string }, index: number) => {
		acc[award.name] = index;
		return acc;
	}, {});

	// Group & choose correct year for display
	const groupedAwards: Record<string, number[]> = {};
	allAwards.forEach((award) => {
		const season = seasons.find((s) => s.id === award.season_id);
		if (!season) return;

		// All awards use the year_end (final year of the season)
		const displayYear = season.year_end;

		if (!groupedAwards[award.award_name]) groupedAwards[award.award_name] = [];
		groupedAwards[award.award_name].push(displayYear);
	});

	const awardEntries = Object.entries(groupedAwards)
		.map(([name, years]) => ({
			name,
			count: years.length,
			years: years.sort((a, b) => a - b),
		}))
		.sort((a, b) => {
			const orderA = awardOrder[a.name];
			const orderB = awardOrder[b.name];

			// If both awards are in the master list, use that order
			if (orderA !== undefined && orderB !== undefined) {
				return orderA - orderB;
			}

			// If only one is in the master list, that one goes first
			if (orderA !== undefined) return -1;
			if (orderB !== undefined) return 1;

			// Otherwise, fallback (optional): maybe sort by count or name
			return b.count - a.count || a.name.localeCompare(b.name);
		});

	return (
		<div
			className="relative overflow-hidden rounded-2xl border shadow-md text-center"
			style={{
				borderColor: hexToRgba(primaryColor, 0.35),
				background: `linear-gradient(
    125deg,
    ${hexToRgba(primaryColor, 0.96)} 0%,
    ${hexToRgba(secondaryColor || primaryColor, 0.75)} 100%
  )`,
			}}
		>
			{/* Gradient overlay for depth */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06)_0%,transparent_60%)] pointer-events-none" />

			{/* Header */}
			<div
				className="relative px-5 py-3 border-b"
				style={{ borderColor: hexToRgba(primaryColor, 0.3) }}
			>
				<h3 className="text-xl sm:text-2xl font-extrabold tracking-wide text-white drop-shadow-sm">
					Awards & Achievements
				</h3>
			</div>

			{/* Stacked awards list */}
			<div className="relative z-10 flex flex-col divide-y divide-white/20">
				{awardEntries.map(({ name, count, years }) => (
					<div
						key={name}
						className="px-5 sm:px-8 py-4 sm:py-5 flex flex-col items-center justify-center"
					>
						{/* Award name line */}
						<div className="text-base sm:text-lg md:text-xl font-semibold text-white drop-shadow-sm mb-1">
							{count > 1 ? `${count}× ${name}` : name}
						</div>
						{/* Years line */}
						<div className="text-sm sm:text-base text-gray-100/85 tracking-wide">
							{years.join(', ')}
						</div>
					</div>
				))}
			</div>

			{/* Bottom accent gradient */}
			<div
				className="absolute inset-x-0 bottom-0 h-1"
				style={{
					background: `linear-gradient(90deg,
      ${hexToRgba(primaryColor, 0.9)},
      ${hexToRgba(secondaryColor || primaryColor, 0.9)})`,
				}}
			/>
		</div>
	);
}
