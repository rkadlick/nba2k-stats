"use client";

import React, { useState } from "react";
import StatTable from "@/components/player-panel/stats-section/stat-table";
import { PlayerGameStatsWithDetails, Player, PlayerWithTeam } from "@/lib/types";
import {
  useCareerPlayoffData,
  PLAYOFF_ROUND_OPTIONS,
  PlayoffRoundFilter,
} from "@/hooks/data/useCareerPlayoffData";

export function PlayoffsView({
  allSeasonStats,
  isEditMode,
  onEditGame,
  onDeleteGame,
  playerTeamColor,
  currentStreak,
  playerId,
  player,
}: {
  allSeasonStats: PlayerGameStatsWithDetails[];
  isEditMode: boolean;
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
  playerTeamColor: string;
  currentStreak: { count: number; isWin: boolean } | null;
  playerId: string;
  player: Player;
}) {
  const [roundFilter, setRoundFilter] = useState<PlayoffRoundFilter>("all");

  const playerTeamId = (player as PlayerWithTeam).team?.id ?? player.team_id;

  const { playoffGames, gamesByRound, loading } = useCareerPlayoffData(
    playerId,
    allSeasonStats,
    playerTeamId
  );

  const visibleRoundOptions = PLAYOFF_ROUND_OPTIONS.filter((opt) => gamesByRound[opt.value].length > 0);
  const effectiveRoundFilter = visibleRoundOptions.some((opt) => opt.value === roundFilter)
    ? roundFilter
    : visibleRoundOptions[0]?.value ?? "all";
  const displayGames = gamesByRound[effectiveRoundFilter];

  const calculateRecord = (stats: PlayerGameStatsWithDetails[]) => {
    const wins = stats.filter((stat) => stat.is_win === true).length;
    const losses = stats.filter((stat) => stat.is_win === false).length;
    return { wins, losses };
  };
  const playoffsRecord = calculateRecord(playoffGames);

  return (
    <>
      {/* Playoffs Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">
          Playoffs
        </h4>
        {playoffGames.length > 0 ? (
          <p className="text-xs text-[color:var(--color-text-muted)] mb-2">
            Record: {playoffsRecord.wins} - {playoffsRecord.losses} | {playoffGames.length}{" "}
            total game{playoffGames.length !== 1 ? "s" : ""} recorded
            {currentStreak && ` | ${currentStreak.count} game ${currentStreak.isWin ? "win" : "loss"} streak`}
          </p>
        ) : (
          <p className="text-xs text-[color:var(--color-text-muted)] mb-2">No games recorded</p>
        )}

        {/* Round filter blocks - only show rounds that have games */}
        {playoffGames.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {visibleRoundOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRoundFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  effectiveRoundFilter === opt.value
                    ? "btn-primary"
                    : "bg-[color:var(--color-surface-muted)] text-[color:var(--color-text)] hover:bg-[color:var(--color-border)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-xs text-[color:var(--color-text-muted)]">Loading...</p>
        ) : playoffGames.length > 0 ? (
          displayGames.length > 0 ? (
            <StatTable
              stats={displayGames}
              isEditMode={isEditMode}
              onEditGame={onEditGame}
              onDeleteGame={onDeleteGame}
              seasonTotals={null}
              playerTeamColor={playerTeamColor}
              showKeyGames={false}
            />
          ) : (
            <p className="text-center py-6 text-gray-500 italic text-sm">
              No games in this round.
            </p>
          )
        ) : null}
      </div>
    </>
  );
}
