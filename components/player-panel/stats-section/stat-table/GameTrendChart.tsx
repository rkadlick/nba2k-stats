"use client";

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Dot,
} from "recharts";
import { PlayerGameStatsWithDetails } from "@/lib/types";
import { getStatsFromGame } from "@/lib/statHelpers";
import { getTeamAbbreviation } from "@/lib/teams";

type GameRange = 5 | 10 | 20 | "all";

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

function CustomDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  // Neutral outline (matches the card background) instead of the team color so the
  // win/loss fill always reads clearly, regardless of what the team's color is.
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={4}
      fill={
        payload.isWin ? "var(--color-win-text)" : "var(--color-loss-text)"
      }
      stroke="var(--color-card)"
      strokeWidth={1.5}
    />
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
}: {
  games: PlayerGameStatsWithDetails[];
  playerTeamColor: string;
}) {
  const [gameRange, setGameRange] = useState<GameRange>(10);
  const [selectedStat, setSelectedStat] = useState<string>("points");

  const sortedDesc = useMemo(() => {
    return [...games].sort(
      (a, b) =>
        new Date(b.game_date || b.created_at || "").getTime() -
        new Date(a.game_date || a.created_at || "").getTime()
    );
  }, [games]);

  const chartData = useMemo<ChartPoint[]>(() => {
    const count = gameRange === "all" ? sortedDesc.length : gameRange;
    const sliced = sortedDesc.slice(0, count);
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
  }, [sortedDesc, gameRange, selectedStat]);

  const average = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, point) => acc + point.value, 0);
    return Number((sum / chartData.length).toFixed(1));
  }, [chartData]);

  const activeStatOption =
    STAT_OPTIONS.find((opt) => opt.key === selectedStat) ?? STAT_OPTIONS[0];

  if (games.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
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
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
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
              width={28}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip statLabel={activeStatOption.label} />}
              cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
            />
            <ReferenceLine
              y={average}
              stroke={playerTeamColor}
              strokeOpacity={0.35}
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={playerTeamColor}
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-[color:var(--color-text-muted)] mt-1 text-right">
        Avg {activeStatOption.label}: {average}
      </p>
    </div>
  );
}
