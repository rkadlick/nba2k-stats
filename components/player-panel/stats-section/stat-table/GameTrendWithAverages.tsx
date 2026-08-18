"use client";

import { useState } from "react";
import { PlayerGameStatsWithDetails } from "@/lib/types";
import { GameRange, sliceGamesByRange, getSeasonTotals } from "@/lib/statHelpers";
import { GameTrendChart } from "./GameTrendChart";

const RANGE_LABELS: Record<GameRange, string> = {
  5: "Last 5",
  10: "Last 10",
  20: "Last 20",
  all: "All",
};

function formatPercentage(made?: number, attempted?: number): string {
  if (!attempted) return "—";
  return `${((made ?? 0) / attempted * 100).toFixed(1)}%`;
}

function buildStatRows(games: PlayerGameStatsWithDetails[]) {
  const { totals, averages } = getSeasonTotals(games);

  return [
    { label: "PTS", value: (averages.points ?? 0).toFixed(1) },
    { label: "REB", value: (averages.rebounds ?? 0).toFixed(1) },
    { label: "AST", value: (averages.assists ?? 0).toFixed(1) },
    { label: "STL", value: (averages.steals ?? 0).toFixed(1) },
    { label: "BLK", value: (averages.blocks ?? 0).toFixed(1) },
    { label: "FG%", value: formatPercentage(totals.fg_made, totals.fg_attempted) },
    { label: "3PT%", value: formatPercentage(totals.threes_made, totals.threes_attempted) },
    { label: "FT%", value: formatPercentage(totals.ft_made, totals.ft_attempted) },
  ];
}

export function GameTrendWithAverages({
  games,
  playerTeamColor,
}: {
  games: PlayerGameStatsWithDetails[];
  playerTeamColor: string;
}) {
  const [gameRange, setGameRange] = useState<GameRange>(10);

  if (games.length === 0) return null;

  const statRows = buildStatRows(sliceGamesByRange(games, gameRange));

  return (
    <div className="mb-3 flex flex-col sm:flex-row gap-3 items-stretch">
      <div className="flex-1 min-w-0">
        <GameTrendChart
          games={games}
          playerTeamColor={playerTeamColor}
          gameRange={gameRange}
          onGameRangeChange={setGameRange}
          className="h-full"
        />
      </div>

      <div className="sm:w-44 shrink-0 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)] mb-2">
          Averages{" "}
          <span className="normal-case font-medium">({RANGE_LABELS[gameRange]})</span>
        </div>
        <div className="divide-y divide-[color:var(--color-border)]">
          {statRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-[color:var(--color-text-muted)] font-medium">{row.label}</span>
              <span className="font-semibold text-[color:var(--color-text)] tabular-nums">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
