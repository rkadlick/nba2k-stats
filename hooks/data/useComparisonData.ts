"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PlayerWithTeam,
  PlayerGameStatsWithDetails,
  Award,
  Season,
  SeasonTotals,
} from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { computeMilestoneCounts, MilestoneCounts } from "@/lib/statHelpers";

export type { MilestoneCounts };

export interface CareerTotalsData {
  totals: Record<string, number>;
  averages: Record<string, number>;
  gamesPlayed: number;
  gamesStarted: number;
}

export interface BestSeasonData {
  stat: string;
  value: number;
  seasonLabel: string;
  seasonId: string;
}

export interface ComparisonData {
  player1SeasonTotals: SeasonTotals[];
  player2SeasonTotals: SeasonTotals[];
  player1CareerTotals: CareerTotalsData | null;
  player2CareerTotals: CareerTotalsData | null;
  player1CareerHighs: Record<string, number>;
  player2CareerHighs: Record<string, number>;
  player1BestSeasons: BestSeasonData[];
  player2BestSeasons: BestSeasonData[];
  player1Milestones: MilestoneCounts;
  player2Milestones: MilestoneCounts;
  player1AwardsWon: Award[];
  player2AwardsWon: Award[];
  seasonTotalsKeys: string[];
}

const STAT_LABELS: Record<string, string> = {
  points: "PTS",
  rebounds: "REB",
  assists: "AST",
  steals: "STL",
  blocks: "BLK",
  minutes: "MIN",
};

const BEST_SEASON_STATS = [
  { key: "avg_points", label: "PPG" },
  { key: "avg_rebounds", label: "RPG" },
  { key: "avg_assists", label: "APG" },
  { key: "avg_steals", label: "SPG" },
  { key: "avg_blocks", label: "BPG" },
];

function computeCareerTotals(
  dbTotals: SeasonTotals[],
  seasons: Season[]
): CareerTotalsData | null {
  if (dbTotals.length === 0) return null;

  const totals: Record<string, number> = {};
  const averages: Record<string, number> = {};
  let totalGamesPlayed = 0;
  let totalGamesStarted = 0;

  dbTotals.forEach((st) => {
    totalGamesPlayed += st.games_played || 0;
    totalGamesStarted += st.games_started || 0;

    const add = (key: string, value: number) => {
      totals[key] = (totals[key] || 0) + value;
    };

    add("points", st.total_points || 0);
    add("rebounds", st.total_rebounds || 0);
    add("assists", st.total_assists || 0);
    add("steals", st.total_steals || 0);
    add("blocks", st.total_blocks || 0);
    add("turnovers", st.total_turnovers || 0);
    add("minutes", st.total_minutes || 0);
    add("fouls", st.total_fouls || 0);
    add("plus_minus", st.total_plus_minus || 0);
    add("offensive_rebounds", st.total_offensive_rebounds || 0);
    add("fg_made", st.total_fg_made || 0);
    add("fg_attempted", st.total_fg_attempted || 0);
    add("threes_made", st.total_threes_made || 0);
    add("threes_attempted", st.total_threes_attempted || 0);
    add("ft_made", st.total_ft_made || 0);
    add("ft_attempted", st.total_ft_attempted || 0);
    add("double_doubles", st.double_doubles || 0);
    add("triple_doubles", st.triple_doubles || 0);
  });

  if (totalGamesPlayed > 0) {
    ["points", "rebounds", "assists", "steals", "blocks", "turnovers", "minutes", "fouls", "plus_minus", "offensive_rebounds"].forEach((key) => {
      averages[key] = Number((totals[key] / totalGamesPlayed).toFixed(1));
    });
  }

  totals.games_played = totalGamesPlayed;
  totals.games_started = totalGamesStarted;

  return { totals, averages, gamesPlayed: totalGamesPlayed, gamesStarted: totalGamesStarted };
}

function computeBestSeasons(
  dbTotals: SeasonTotals[],
  seasons: Season[]
): BestSeasonData[] {
  const result: BestSeasonData[] = [];

  BEST_SEASON_STATS.forEach(({ key, label }) => {
    let best: { value: number; seasonId: string } | null = null;

    dbTotals.forEach((st) => {
      const val = (st as unknown as Record<string, unknown>)[key] as number | undefined;
      if (typeof val === "number" && (!best || val > best.value)) {
        const season = seasons.find((s) => s.id === st.season_id);
        best = { value: val, seasonId: st.season_id };
      }
    });

    if (best !== null) {
      const { value, seasonId } = best;
      const season = seasons.find((s) => s.id === seasonId);
      result.push({
        stat: label,
        value,
        seasonLabel: season ? `${season.year_start}–${season.year_end}` : "",
        seasonId,
      });
    }
  });

  return result;
}

function filterAwardsWonByPlayer(awards: Award[], player: PlayerWithTeam): Award[] {
  return awards.filter((award) => {
    if (award.winner_player_id && award.winner_player_id === player.id) return true;
    if (award.winner_player_name) {
      const winnerName = award.winner_player_name.trim().toLowerCase();
      const playerName = player.player_name.trim().toLowerCase();
      return winnerName === playerName;
    }
    return false;
  });
}

export function useComparisonData(
  player1: PlayerWithTeam | null,
  player2: PlayerWithTeam | null,
  player1Stats: PlayerGameStatsWithDetails[],
  player2Stats: PlayerGameStatsWithDetails[],
  player1Awards: Award[],
  player2Awards: Award[],
  seasons: Season[]
): { data: ComparisonData | null; loading: boolean } {
  const [player1DbTotals, setPlayer1DbTotals] = useState<SeasonTotals[]>([]);
  const [player2DbTotals, setPlayer2DbTotals] = useState<SeasonTotals[]>([]);
  const [player1CareerHighs, setPlayer1CareerHighs] = useState<Record<string, number>>({});
  const [player2CareerHighs, setPlayer2CareerHighs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!player1?.id || !player2?.id || !client) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [res1, res2, highs1, highs2] = await Promise.all([
          client.from("season_totals").select("*").eq("player_id", player1.id),
          client.from("season_totals").select("*").eq("player_id", player2.id),
          client.from("career_highs").select("stat_key, value").eq("player_id", player1.id),
          client.from("career_highs").select("stat_key, value").eq("player_id", player2.id),
        ]);

        if (res1.error) logger.error("Error loading player1 season totals:", res1.error);
        if (res2.error) logger.error("Error loading player2 season totals:", res2.error);
        if (highs1.error) logger.error("Error loading player1 career highs:", highs1.error);
        if (highs2.error) logger.error("Error loading player2 career highs:", highs2.error);

        setPlayer1DbTotals((res1.data || []) as SeasonTotals[]);
        setPlayer2DbTotals((res2.data || []) as SeasonTotals[]);
        setPlayer1CareerHighs(
          Object.fromEntries((highs1.data || []).map((row) => [row.stat_key, row.value]))
        );
        setPlayer2CareerHighs(
          Object.fromEntries((highs2.data || []).map((row) => [row.stat_key, row.value]))
        );
      } catch (err) {
        logger.error("Error loading comparison data:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [player1?.id, player2?.id]);

  const data = useMemo((): ComparisonData | null => {
    if (!player1 || !player2) return null;

    const p1Career = computeCareerTotals(player1DbTotals, seasons);
    const p2Career = computeCareerTotals(player2DbTotals, seasons);

    const p1Highs = player1CareerHighs;
    const p2Highs = player2CareerHighs;

    const p1Best = computeBestSeasons(player1DbTotals, seasons);
    const p2Best = computeBestSeasons(player2DbTotals, seasons);

    const p1Milestones = computeMilestoneCounts(player1Stats);
    const p2Milestones = computeMilestoneCounts(player2Stats);

    const p1AwardsWon = filterAwardsWonByPlayer(player1Awards, player1);
    const p2AwardsWon = filterAwardsWonByPlayer(player2Awards, player2);

    const seasonTotalsKeys = [
      "games_played",
      "games_started",
      "minutes",
      "points",
      "rebounds",
      "assists",
      "steals",
      "blocks",
      "offensive_rebounds",
      "turnovers",
      "fouls",
      "plus_minus",
      "fg",
      "threes",
      "ft",
      "double_doubles",
      "triple_doubles",
    ];

    return {
      player1SeasonTotals: player1DbTotals,
      player2SeasonTotals: player2DbTotals,
      player1CareerTotals: p1Career,
      player2CareerTotals: p2Career,
      player1CareerHighs: p1Highs,
      player2CareerHighs: p2Highs,
      player1BestSeasons: p1Best,
      player2BestSeasons: p2Best,
      player1Milestones: p1Milestones,
      player2Milestones: p2Milestones,
      player1AwardsWon: p1AwardsWon,
      player2AwardsWon: p2AwardsWon,
      seasonTotalsKeys,
    };
  }, [
    player1,
    player2,
    player1DbTotals,
    player2DbTotals,
    player1CareerHighs,
    player2CareerHighs,
    player1Stats,
    player2Stats,
    player1Awards,
    player2Awards,
    seasons,
  ]);

  return { data, loading };
}
