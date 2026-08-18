"use client";

import React, { useId, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Dot,
} from "recharts";
import { PlayerGameStatsWithDetails } from "@/lib/types";
import { getStatsFromGame, GameRange, sliceGamesByRange } from "@/lib/statHelpers";
import { getTeamAbbreviation } from "@/lib/teams";

export type { GameRange };

interface StatOption {
  key: string;
  label: string;
  shortLabel: string;
}

const STAT_OPTIONS: StatOption[] = [
  { key: "points", label: "Points", shortLabel: "PTS" },
  { key: "rebounds", label: "Rebounds", shortLabel: "REB" },
  { key: "assists", label: "Assists", shortLabel: "AST" },
  { key: "steals", label: "Steals", shortLabel: "STL" },
  { key: "blocks", label: "Blocks", shortLabel: "BLK" },
  { key: "turnovers", label: "Turnovers", shortLabel: "TO" },
  { key: "plus_minus", label: "+/-", shortLabel: "+/-" },
  { key: "minutes", label: "Minutes", shortLabel: "MIN" },
];

const RANGE_OPTIONS: { value: GameRange; label: string }[] = [
  { value: 5, label: "Last 5" },
  { value: 10, label: "Last 10" },
  { value: 20, label: "Last 20" },
  { value: "all", label: "All" },
];

interface ChartPoint {
  id: string;
  dateLabel: string;
  fullDate: string;
  opponentLabel: string;
  isWin: boolean;
  value: number;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getOpponentAbbrev(game: PlayerGameStatsWithDetails): string {
  const teamIdOrName =
    game.opponent_team?.id ||
    game.opponent_team_id ||
    game.opponent_team_name ||
    "Unknown";
  const abbrev = getTeamAbbreviation(teamIdOrName);
  return game.is_home ? `vs ${abbrev}` : `@ ${abbrev}`;
}

function CustomDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  minValue?: number;
  maxValue?: number;
  shadowId?: string;
  active?: boolean;
}) {
  const { cx, cy, payload, minValue, maxValue, shadowId, active } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const isPeak = minValue !== maxValue && payload.value === maxValue;
  const isTrough = minValue !== maxValue && payload.value === minValue;
  const radius = active ? 6 : 5;
  const color = payload.isWin ? "var(--color-win-text)" : "var(--color-loss-text)";
  const filter = shadowId ? `url(#${shadowId})` : undefined;

  return (
    <g filter={filter}>
      {/* Neutral outline (matches the card background) instead of the team color so the
          win/loss fill always reads clearly, regardless of what the team's color is.
          Shape (circle vs diamond), not just color, distinguishes win/loss so the
          signal still reads for colorblind viewers. */}
      {payload.isWin ? (
        <Dot cx={cx} cy={cy} r={radius} fill={color} stroke="var(--color-card)" strokeWidth={2} />
      ) : (
        <rect
          x={cx - radius * 0.78}
          y={cy - radius * 0.78}
          width={radius * 1.56}
          height={radius * 1.56}
          fill={color}
          stroke="var(--color-card)"
          strokeWidth={2}
          transform={`rotate(45 ${cx} ${cy})`}
        />
      )}
      {(isPeak || isTrough) && (
        <text
          x={cx}
          y={isPeak ? cy - 10 : cy + 18}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill="var(--color-text)"
        >
          {payload.value}
        </text>
      )}
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
  statLabel,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
  statLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-2.5 py-1.5 shadow-md text-xs min-w-[140px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[color:var(--color-text)] whitespace-nowrap">
          {point.dateLabel} &middot; {point.opponentLabel}
        </span>
        <span
          className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full leading-none"
          style={{
            backgroundColor: point.isWin
              ? "var(--color-win-bg)"
              : "var(--color-loss-bg)",
            color: point.isWin
              ? "var(--color-win-text)"
              : "var(--color-loss-text)",
          }}
        >
          {point.isWin ? "W" : "L"}
        </span>
      </div>
      <div className="text-center mt-1 text-[color:var(--color-text)]">
        <span className="text-[color:var(--color-text-muted)]">
          {statLabel}:{" "}
        </span>
        <span className="font-semibold">{point.value}</span>
      </div>
    </div>
  );
}

export function GameTrendChart({
  games,
  playerTeamColor,
  gameRange: controlledGameRange,
  onGameRangeChange,
  className,
}: {
  games: PlayerGameStatsWithDetails[];
  playerTeamColor: string;
  // Optional controlled range — when omitted, the chart tracks its own
  // range selection exactly as before. A sibling panel that needs to
  // mirror the selected range can pass both of these to take over.
  gameRange?: GameRange;
  onGameRangeChange?: (range: GameRange) => void;
  // Overrides the default `mb-3` on the root wrapper (e.g. when this chart
  // is nested inside a layout that manages its own spacing).
  className?: string;
}) {
  const [uncontrolledGameRange, setUncontrolledGameRange] = useState<GameRange>(10);
  const gameRange = controlledGameRange ?? uncontrolledGameRange;
  const setGameRange = (range: GameRange) => {
    setUncontrolledGameRange(range);
    onGameRangeChange?.(range);
  };
  const [selectedStat, setSelectedStat] = useState<string>("points");

  const chartData = useMemo<ChartPoint[]>(() => {
    const sliced = sliceGamesByRange(games, gameRange);
    // Reverse so the chart flows chronologically left-to-right, ending
    // with the most recent game on the right (right next to the game log below).
    const chronological = [...sliced].reverse();

    return chronological.map((game) => {
      const gameStats = getStatsFromGame(game);
      const rawValue = gameStats[selectedStat];
      const value = typeof rawValue === "number" ? rawValue : 0;
      const dateStr = game.game_date || game.created_at || "";
      return {
        id: game.id,
        dateLabel: formatDateLabel(dateStr),
        fullDate: dateStr,
        opponentLabel: getOpponentAbbrev(game),
        isWin: game.is_win,
        value,
      };
    });
  }, [games, gameRange, selectedStat]);

  const average = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, point) => acc + point.value, 0);
    return Number((sum / chartData.length).toFixed(1));
  }, [chartData]);

  const { minValue, maxValue } = useMemo(() => {
    if (chartData.length === 0) return { minValue: 0, maxValue: 0 };
    const values = chartData.map((point) => point.value);
    return { minValue: Math.min(...values), maxValue: Math.max(...values) };
  }, [chartData]);

  // Pad the Y domain so the peak/trough sit inside the plot rather than
  // pinned to its top/bottom edge — otherwise their value labels (and a
  // trough of 0 in particular) get clipped or crowded against the axis.
  const yDomain = useMemo<[number, number]>(() => {
    if (chartData.length === 0) return [0, 1];
    const range = maxValue - minValue;
    const padding = range === 0 ? 2 : Math.max(1, Math.ceil(range * 0.25));
    return [minValue - padding, maxValue + padding];
  }, [chartData.length, minValue, maxValue]);

  const activeStatOption =
    STAT_OPTIONS.find((opt) => opt.key === selectedStat) ?? STAT_OPTIONS[0];

  const gradientId = useId();
  const dotShadowId = useId();

  if (games.length === 0) return null;

  return (
    <div className={`${className ?? "mb-3"} rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        {/* Stat selector */}
        <div className="flex flex-wrap gap-1">
          {STAT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedStat(opt.key)}
              className="px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors cursor-pointer text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] data-[active=true]:text-white"
              data-active={selectedStat === opt.key}
              style={
                selectedStat === opt.key
                  ? { backgroundColor: playerTeamColor, color: "#ffffff" }
                  : undefined
              }
            >
              {opt.shortLabel}
            </button>
          ))}
        </div>

        {/* Range selector */}
        <div className="flex gap-0.5 rounded-full border border-[color:var(--color-border)] p-0.5 bg-[color:var(--color-surface-muted)]">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGameRange(opt.value)}
              className={
                gameRange === opt.value
                  ? "px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[color:var(--color-card)] text-[color:var(--color-text)] shadow-sm cursor-pointer"
                  : "px-2 py-0.5 text-[11px] font-medium rounded-full text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] cursor-pointer"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 8, bottom: 6, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={playerTeamColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={playerTeamColor} stopOpacity={0} />
              </linearGradient>
              <filter id={dotShadowId} x="-75%" y="-75%" width="250%" height="250%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.35" />
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              width={34}
              allowDecimals={false}
              domain={yDomain}
            />
            <Tooltip
              content={<CustomTooltip statLabel={activeStatOption.label} />}
              cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
            />
            <ReferenceLine
              y={average}
              stroke="var(--color-text-muted)"
              strokeOpacity={0.6}
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              activeDot={false}
              legendType="none"
              tooltipType="none"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={playerTeamColor}
              strokeWidth={2.5}
              dot={
                <CustomDot
                  minValue={minValue}
                  maxValue={maxValue}
                  shadowId={dotShadowId}
                />
              }
              activeDot={
                <CustomDot
                  minValue={minValue}
                  maxValue={maxValue}
                  shadowId={dotShadowId}
                  active
                />
              }
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-[color:var(--color-text-muted)] mt-1 text-right">
        Avg {activeStatOption.label}: {average}
      </p>
    </div>
  );
}
