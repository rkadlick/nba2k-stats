import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { buildHeadlineContext } from "@/lib/headlineContext";
import { generateHeadlineText } from "@/lib/generateHeadline";
import { logger } from "@/lib/logger";
import {
  Award,
  Player,
  PlayerGameStats,
  PlayoffSeries,
  SeasonTotals,
} from "@/lib/types";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient(accessToken);
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 }
    );
  }

  let gameId: string;
  try {
    const body = (await request.json()) as { gameId?: string };
    if (!body.gameId) {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }
    gameId = body.gameId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data: game, error: gameError } = await supabase
    .from("player_game_stats")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const typedGame = game as PlayerGameStats;

  const { data: player, error: playerError } = await supabase
    .from("players_public")
    .select("*")
    .eq("id", typedGame.player_id)
    .single();

  if (playerError || !player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const typedPlayer = player as Player;

  await supabase
    .from("player_game_stats")
    .update({ headline_status: "pending" })
    .eq("id", gameId);

  try {
    const [
      seasonTotalsResult,
      seasonGamesResult,
      allGamesResult,
      careerTotalsResult,
      awardsResult,
      playoffSeriesResult,
      manualCareerHighsResult,
    ] = await Promise.all([
      supabase
        .from("season_totals")
        .select("*")
        .eq("player_id", typedGame.player_id)
        .eq("season_id", typedGame.season_id)
        .maybeSingle(),
      supabase
        .from("player_game_stats")
        .select("*")
        .eq("player_id", typedGame.player_id)
        .eq("season_id", typedGame.season_id)
        .eq("is_playoff_game", typedGame.is_playoff_game)
        .order("game_date", { ascending: false }),
      supabase
        .from("player_game_stats")
        .select("*")
        .eq("player_id", typedGame.player_id)
        .order("game_date", { ascending: false }),
      supabase
        .from("season_totals")
        .select("*")
        .eq("player_id", typedGame.player_id),
      supabase.from("awards_public").select("*").eq("player_id", typedGame.player_id),
      typedGame.playoff_series_id
        ? supabase
            .from("playoff_series")
            .select("*")
            .eq("id", typedGame.playoff_series_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("career_highs")
        .select("stat_key, value")
        .eq("player_id", typedGame.player_id)
        .eq("is_manual", true),
    ]);

    // The career_highs table has already been recalculated (by a DB trigger) to
    // include this game by the time we read it here, so only the manual-only
    // entries are usable as a "value before this game" fallback for milestone
    // detection — the rest is derived from prior games directly.
    const manualCareerHighs: Record<string, number> = Object.fromEntries(
      ((manualCareerHighsResult.data as { stat_key: string; value: number }[]) ?? []).map(
        (row) => [row.stat_key, row.value]
      )
    );

    const context = buildHeadlineContext({
      game: typedGame,
      player: typedPlayer,
      seasonTotals: (seasonTotalsResult.data as SeasonTotals | null) ?? null,
      seasonGames: (seasonGamesResult.data as PlayerGameStats[]) ?? [],
      allGames: (allGamesResult.data as PlayerGameStats[]) ?? [],
      careerSeasonTotals: (careerTotalsResult.data as SeasonTotals[]) ?? [],
      awards: (awardsResult.data as Award[]) ?? [],
      playoffSeries: (playoffSeriesResult.data as PlayoffSeries | null) ?? null,
      manualCareerHighs,
    });

    const { headline, log } = await generateHeadlineText(context);
    const usedFallback = log.status !== "success";

    const { error: logError } = await supabase.from("ai_generation_logs").insert({
      feature: "headline_generation",
      game_id: gameId,
      player_id: typedGame.player_id,
      ...log,
    });
    if (logError) {
      logger.error("Error inserting ai_generation_logs row:", logError);
    }

    const { error: updateError } = await supabase
      .from("player_game_stats")
      .update({
        headline,
        headline_generated_at: new Date().toISOString(),
        headline_status: "ready",
      })
      .eq("id", gameId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      headline,
      headline_status: "ready",
      usedFallback,
    });
  } catch (error) {
    await supabase
      .from("player_game_stats")
      .update({ headline_status: "failed" })
      .eq("id", gameId);

    const { error: logError } = await supabase.from("ai_generation_logs").insert({
      feature: "headline_generation",
      game_id: gameId,
      player_id: typedGame.player_id,
      model: null,
      system_prompt: null,
      user_prompt: "",
      response_text: null,
      status: "error",
      error_message: error instanceof Error ? error.message : "Unknown error",
      latency_ms: null,
    });
    if (logError) {
      logger.error("Error inserting ai_generation_logs row:", logError);
    }

    return NextResponse.json(
      {
        error: "Failed to generate headline",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
