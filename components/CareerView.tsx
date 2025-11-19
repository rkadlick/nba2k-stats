'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PlayerWithTeam, PlayerAwardInfo, Season, SeasonTotals } from '@/lib/types';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabaseClient';

interface CareerViewProps {
  player: PlayerWithTeam;
  allAwards: PlayerAwardInfo[];
  seasons: Season[];
}

// NBA scoreboard order for stats
const NBA_STAT_ORDER = [
  'minutes',
  'points',
  'rebounds',
  'assists',
  'steals',
  'blocks',
  'offensive_rebounds',
  'turnovers',
  'fouls',
  'plus_minus',
  'fg', // Combined FG made/attempted
  'threes', // Combined 3PT made/attempted
  'ft', // Combined FT made/attempted
];

const STAT_KEYS: string[] = [
  'games_played',
  'games_started',
  ...NBA_STAT_ORDER,
  'offensive_rebounds',
  'double_doubles',
  'triple_doubles',
];

export default function CareerView({
  player,
  allAwards,
  seasons,
}: CareerViewProps) {
  const [dbSeasonTotals, setDbSeasonTotals] = useState<SeasonTotals[]>([]);

  // Convert hex to rgba with low opacity for transparent gradient
  const hexToRgba = (hex: string, opacity: number = 0.1): string => {
    // Handle hex colors with or without #
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Convert hex to HSL
  const hexToHsl = (hex: string): [number, number, number] => {
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return [h * 360, s * 100, l * 100];
  };

  // Convert HSL to hex
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Get complementary color (180 degrees opposite on color wheel)
  const getComplementaryColor = (hex: string): string => {
    const [h, s, l] = hexToHsl(hex);
    const complementaryH = (h + 180) % 360;
    return hslToHex(complementaryH, s, l);
  };

  // Get team colors with fallback
  const primaryColor = player.team?.primary_color || '#6366f1'; // indigo-500 fallback
  const secondaryColor = player.team?.secondary_color || '#8b5cf6'; // violet-500 fallback

  // Get complementary colors for gradient
  const complementaryPrimary = getComplementaryColor(primaryColor);
  const complementarySecondary = secondaryColor ? getComplementaryColor(secondaryColor) : complementaryPrimary;

  // Create a sophisticated gradient using team colors and their complements
  const primaryRgba = hexToRgba(primaryColor, 0.18);
  const complementaryPrimaryRgba = hexToRgba(complementaryPrimary, 0.15);
  const secondaryRgba = secondaryColor ? hexToRgba(secondaryColor, 0.18) : primaryRgba;
  const complementarySecondaryRgba = hexToRgba(complementarySecondary, 0.15);

  // Create a diagonal gradient with complementary colors for a vibrant, harmonious background
  const gradientBackground = `linear-gradient(135deg, ${primaryRgba} 0%, ${complementaryPrimaryRgba} 30%, ${secondaryRgba} 60%, ${complementarySecondaryRgba} 100%)`;

  // Fetch season totals from database
  useEffect(() => {
    const loadSeasonTotals = async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('season_totals')
        .select('*')
        .eq('player_id', player.id);

      if (error) {
        logger.error('Error loading season totals:', error);
      } else {
        setDbSeasonTotals((data || []) as SeasonTotals[]);
      }
    };

    loadSeasonTotals();
  }, [player.id]);

  // Calculate season totals first (needed for determining which stats to show)
  // Build a simple list of season totals directly from the DB
  const seasonTotals = useMemo(() => {
    return seasons
      .map(season => {
        const dbTotal = dbSeasonTotals.find(st => st.season_id === season.id);
        if (!dbTotal) return null;

        return {
          season,
          dbTotal,
          totals: {
            points: dbTotal.total_points,
            rebounds: dbTotal.total_rebounds,
            offensive_rebounds: dbTotal.total_offensive_rebounds,
            assists: dbTotal.total_assists,
            steals: dbTotal.total_steals,
            blocks: dbTotal.total_blocks,
            turnovers: dbTotal.total_turnovers,
            minutes: Number(dbTotal.total_minutes) || 0,
            fouls: dbTotal.total_fouls,
            plus_minus: dbTotal.total_plus_minus,
            fg_made: dbTotal.total_fg_made,
            fg_attempted: dbTotal.total_fg_attempted,
            threes_made: dbTotal.total_threes_made,
            threes_attempted: dbTotal.total_threes_attempted,
            ft_made: dbTotal.total_ft_made,
            ft_attempted: dbTotal.total_ft_attempted,
            double_doubles: dbTotal.double_doubles,
            triple_doubles: dbTotal.triple_doubles,
          },
          averages: {
            points: Number(dbTotal.avg_points) || 0,
            rebounds: Number(dbTotal.avg_rebounds) || 0,
            offensive_rebounds: Number(dbTotal.avg_offensive_rebounds) || 0,
            assists: Number(dbTotal.avg_assists) || 0,
            steals: Number(dbTotal.avg_steals) || 0,
            blocks: Number(dbTotal.avg_blocks) || 0,
            turnovers: Number(dbTotal.avg_turnovers) || 0,
            fouls: Number(dbTotal.avg_fouls) || 0,
            minutes: Number(dbTotal.avg_minutes) || 0,
            plus_minus: Number(dbTotal.avg_plus_minus) || 0,
          },
          gamesPlayed: dbTotal.games_played,
          gamesStarted: dbTotal.games_started,
          awards: allAwards.filter(a => a.season_id === season.id),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [dbSeasonTotals, seasons, allAwards]);

  // Season totals stat keys (percentages shown in averages row, not separate columns)
  // Include all stats that exist in any season totals
  const seasonTotalsKeys = useMemo(() => {
    const keys = new Set<string>();

    // Always add GP and GS first
    keys.add('games_played');
    keys.add('games_started');

    // Check all season totals to see what stats exist
    seasonTotals.forEach(({ totals }) => {
      Object.keys(totals).forEach(key => {
        if (key !== 'fg_made' && key !== 'fg_attempted' &&
          key !== 'threes_made' && key !== 'threes_attempted' &&
          key !== 'ft_made' && key !== 'ft_attempted' &&
          key !== 'games_played' && key !== 'games_started') {
          keys.add(key);
        }
      });
      // Add combined shooting stats if they exist
      if (totals.fg_made !== undefined || totals.fg_attempted !== undefined) {
        keys.add('fg');
      }
      if (totals.threes_made !== undefined || totals.threes_attempted !== undefined) {
        keys.add('threes');
      }
      if (totals.ft_made !== undefined || totals.ft_attempted !== undefined) {
        keys.add('ft');
      }
    });

    // Also include stats from games
    STAT_KEYS.forEach(key => keys.add(key));

    // Always include all NBA_STAT_ORDER stats
    NBA_STAT_ORDER.forEach(key => keys.add(key));
    // Always include DD/TD
    keys.add('double_doubles');
    keys.add('triple_doubles');

    // Sort: GP, GS first, then NBA order, then extras
    const ordered: string[] = ['games_played', 'games_started'];
    const nbaOrdered: string[] = [];
    const extras: string[] = [];

    NBA_STAT_ORDER.forEach(key => {
      if (keys.has(key)) {
        nbaOrdered.push(key);
      }
    });

    keys.forEach(key => {
      if (key !== 'games_played' && key !== 'games_started' &&
        !NBA_STAT_ORDER.includes(key)) {
        extras.push(key);
      }
    });

    return [...ordered, ...nbaOrdered, ...extras.sort()];
  }, [seasonTotals]);

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

  const getTotalValue = (totals: Record<string, number>, key: string): string => {
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

  const getAvgValue = (totals: Record<string, number>, averages: Record<string, number>, gamesPlayed: number, key: string): string => {
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

  // Calculate career totals from all season totals
  const careerTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const averages: Record<string, number> = {};
    let totalGamesPlayed = 0;
    let totalGamesStarted = 0;

    // Sum all season totals
    seasonTotals.forEach(({ totals: seasonTotals, averages: seasonAverages, gamesPlayed, gamesStarted }) => {
      totalGamesPlayed += gamesPlayed;
      totalGamesStarted += gamesStarted || 0;

      Object.entries(seasonTotals).forEach(([key, value]) => {
        if (key !== 'double_doubles' && key !== 'triple_doubles') {
          totals[key] = (totals[key] || 0) + (value || 0);
        } else {
          // DD/TD are cumulative
          totals[key] = (totals[key] || 0) + (value || 0);
        }
      });
    });

    // Calculate averages based on total games played
    if (totalGamesPlayed > 0) {
      Object.keys(totals).forEach((key) => {
        if (key !== 'double_doubles' && key !== 'triple_doubles' &&
          key !== 'fg_made' && key !== 'fg_attempted' &&
          key !== 'threes_made' && key !== 'threes_attempted' &&
          key !== 'ft_made' && key !== 'ft_attempted') {
          averages[key] = totals[key] / totalGamesPlayed;
        }
      });
    }

    totals.games_played = totalGamesPlayed;
    totals.games_started = totalGamesStarted;

    return { totals, averages, gamesPlayed: totalGamesPlayed, gamesStarted: totalGamesStarted };
  }, [seasonTotals]);

  return (
    <div className="space-y-4">
      {/* Career Highs – Refined Two‑Tone Design */}
      {player.career_highs && Object.keys(player.career_highs).length > 0 && (() => {
        // Define the order and display names for career highs
        const careerHighsOrder = [
          'points',
          'rebounds',
          'assists',
          'steals',
          'blocks',
          'fg_made',
          'threes_made',
          'ft_made',
          'minutes'
        ];

        const displayNames: Record<string, string> = {
          points: 'Points',
          rebounds: 'Rebs',
          assists: 'Assists',
          steals: 'Steals',
          blocks: 'Blocks',
          fg_made: 'FG Made',
          threes_made: '3s Made',
          ft_made: 'FT Made',
          minutes: 'Minutes'
        };

        // Filter and order career highs according to the specified order
        const orderedCareerHighs = careerHighsOrder
          .filter(key => player.career_highs && player.career_highs[key] !== undefined)
          .map(key => ({
            key,
            label: displayNames[key] || key.replace(/_/g, ' '),
            value: player.career_highs![key]
          }));

        if (orderedCareerHighs.length === 0) return null;

        return (
          <div
            className="relative overflow-hidden rounded-2xl border shadow-md"
            style={{
              borderColor: hexToRgba(primaryColor, 0.4),
              background: `linear-gradient(
          135deg,
          ${hexToRgba(primaryColor, 0.95)} 0%,
          ${hexToRgba(secondaryColor || primaryColor, 0.65)} 100%
        )`,
            }}
          >
            {/* Subtle overlay shimmer */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.08)_0%,transparent_70%)] opacity-70 pointer-events-none" />

            {/* Header */}
            <div
              className="relative px-5 py-3 border-b"
              style={{
                borderColor: hexToRgba(primaryColor, 0.3),
                background: `linear-gradient(
            90deg,
            ${hexToRgba(primaryColor, 0.25)},
            ${hexToRgba(secondaryColor || primaryColor, 0.25)}
          )`,
              }}
            >
              <h3 className="text-center text-xl sm:text-2xl font-extrabold text-white tracking-wide drop-shadow-sm">
                Career Highs
              </h3>
            </div>

            {/* Stats grid - centered if items don't fill the row */}
            <div className="relative z-10 flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 p-3 sm:p-5 md:p-6 lg:p-8 text-center">
              {orderedCareerHighs.map(({ key, label, value }) => (
                <div
                  key={key}
                  className="flex flex-col justify-center items-center bg-white/10 rounded-xl border border-white/20 p-2 sm:p-3 md:p-4 transition-transform duration-300 hover:-translate-y-1 hover:bg-white/20 w-[calc(50%-0.75rem)] sm:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)] xl:w-[calc(20%-1rem)]"
                >
                  <div className="text-[11px] sm:text-xs uppercase font-medium tracking-wide text-gray-100 mb-0.5 sm:mb-1">
                    {label}
                  </div>
                  <div
                    className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-sm leading-tight"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

          {/* Bottom accent stripe */}
          <div
            className="absolute inset-x-0 bottom-0 h-1"
            style={{
              background: `linear-gradient(
          90deg,
          ${hexToRgba(primaryColor, 0.9)},
          ${hexToRgba(secondaryColor || primaryColor, 0.9)}
        )`,
            }}
          />
        </div>
        );
      })()}

      {/* All Awards Won – Centered Vertical List */}
      {allAwards && Array.isArray(allAwards) && allAwards.length > 0 && (() => {
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
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

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
      })()}

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
