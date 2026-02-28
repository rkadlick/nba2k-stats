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
import { CAREER_HIGHS_FIELDS } from "@/lib/formUtils";
import { isDoubleDouble, isTripleDouble, isQuadDouble, is5x5 } from "@/lib/statHelpers";

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

export interface MilestoneCounts {
  doubleDoubles: number;
  tripleDoubles: number;
  quadDoubles: number;
  fiveByFive: number;
  games40Plus: number;
  games50Plus: number;
  games60Plus: number;
  games70Plus: number;
  games20PlusReb: number;
  games15PlusReb: number;
  games15PlusAst: number;
  games20PlusAst: number;
  games30PlusAst: number;
  games10PlusStl: number;
  games15PlusStl: number;
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

function computeCareerHighs(
  stats: PlayerGameStatsWithDetails[],
  manualHighs?: Record<string, number | string>
): Record<string, number> {
  const result: Record<string, number> = {};

  CAREER_HIGHS_FIELDS.forEach(({ key }) => {
    const manual = manualHighs?.[key];
    if (manual !== undefined && manual !== null) {
      result[key] = typeof manual === "number" ? manual : parseInt(String(manual), 10) || 0;
      return;
    }

    const values = stats
      .map((g) => (g as unknown as Record<string, unknown>)[key] as number | undefined)
      .filter((v): v is number => typeof v === "number");
    result[key] = values.length > 0 ? Math.max(...values) : 0;
  });

  return result;
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

function computeMilestones(stats: PlayerGameStatsWithDetails[]): MilestoneCounts {
  let doubleDoubles = 0;
  let tripleDoubles = 0;
  let quadDoubles = 0;
  let fiveByFive = 0;
  let games40Plus = 0;
  let games50Plus = 0;
  let games60Plus = 0;
  let games70Plus = 0;
  let games20PlusReb = 0;
  let games15PlusReb = 0;
  let games15PlusAst = 0;
  let games20PlusAst = 0;
  let games30PlusAst = 0;
  let games10PlusStl = 0;
  let games15PlusStl = 0;

  stats.forEach((g) => {
    if (isDoubleDouble(g)) doubleDoubles++;
    if (isTripleDouble(g)) tripleDoubles++;
    if (isQuadDouble(g)) quadDoubles++;
    if (is5x5(g)) fiveByFive++;
    if ((g.points ?? 0) >= 40) games40Plus++;
    if ((g.points ?? 0) >= 50) games50Plus++;
    if ((g.points ?? 0) >= 60) games60Plus++;
    if ((g.points ?? 0) >= 70) games70Plus++;
    if ((g.rebounds ?? 0) >= 20) games20PlusReb++;
    if ((g.rebounds ?? 0) >= 15) games15PlusReb++;
    if ((g.assists ?? 0) >= 15) games15PlusAst++;
    if ((g.assists ?? 0) >= 20) games20PlusAst++;
    if ((g.assists ?? 0) >= 30) games30PlusAst++;
    if ((g.steals ?? 0) >= 10) games10PlusStl++;
    if ((g.steals ?? 0) >= 15) games15PlusStl++;
  });

  return {
    doubleDoubles,
    tripleDoubles,
    quadDoubles,
    fiveByFive,
    games40Plus,
    games50Plus,
    games60Plus,
    games70Plus,
    games20PlusReb,
    games15PlusReb,
    games15PlusAst,
    games20PlusAst,
    games30PlusAst,
    games10PlusStl,
    games15PlusStl,
  };
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
        const [res1, res2] = await Promise.all([
          client.from("season_totals").select("*").eq("player_id", player1.id),
          client.from("season_totals").select("*").eq("player_id", player2.id),
        ]);

        if (res1.error) logger.error("Error loading player1 season totals:", res1.error);
        if (res2.error) logger.error("Error loading player2 season totals:", res2.error);

        setPlayer1DbTotals((res1.data || []) as SeasonTotals[]);
        setPlayer2DbTotals((res2.data || []) as SeasonTotals[]);
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

    const p1Highs = computeCareerHighs(player1Stats, player1.career_highs as Record<string, number | string> | undefined);
    const p2Highs = computeCareerHighs(player2Stats, player2.career_highs as Record<string, number | string> | undefined);

    const p1Best = computeBestSeasons(player1DbTotals, seasons);
    const p2Best = computeBestSeasons(player2DbTotals, seasons);

    const p1Milestones = computeMilestones(player1Stats);
    const p2Milestones = computeMilestones(player2Stats);

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
    player1Stats,
    player2Stats,
    player1Awards,
    player2Awards,
    seasons,
  ]);

  return { data, loading };
}
