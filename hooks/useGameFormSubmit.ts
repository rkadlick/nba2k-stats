"use client";

import { useState } from "react";
import { SubmitHandler } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ToastProvider";
import { Player, User } from "@/lib/types";
import { GameFormData } from "@/components/add-game-modal";

interface UseGameFormSubmitProps {
  currentUser: User | null;
  currentUserPlayer: Player | undefined;
  editingGame?: any | null;
  onGameAdded: () => void;
  onClose: () => void;
  manualSeasonBlocked: boolean;
  manualSeasonMessage: string | null;
}

export function useGameFormSubmit({
  currentUser,
  currentUserPlayer,
  editingGame,
  onGameAdded,
  onClose,
  manualSeasonBlocked,
  manualSeasonMessage,
}: UseGameFormSubmitProps) {
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<GameFormData> = async (data) => {
    if (manualSeasonBlocked) {
      showError(manualSeasonMessage || "Manual season block error");
      return;
    }

    if (!currentUserPlayer?.id) {
      showError("Player not found. Please ensure you are logged in.");
      return;
    }

    if (!data.season_id) {
      showError("Season is required");
      return;
    }

    if (!data.opponent_team_id) {
      showError("Opponent team is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const isWin = data.player_score > data.opponent_score;

      // Fix timezone issue (same as before)
      const date = new Date(data.game_date);
      date.setDate(date.getDate() + 1);
      const adjustedDate = date.toISOString().split("T")[0];

      // Cleanup helper
      const cleanValue = (val: any) => {
        if (val === undefined) return undefined;
        if (val === "" || (typeof val === "number" && isNaN(val))) return null;
        return val;
      };

      const gameData: Record<string, any> = {
        player_id: currentUserPlayer.id,
        season_id: data.season_id,
        game_date: adjustedDate,
        opponent_team_id: data.opponent_team_id,
        is_home: data.is_home ?? true,
        is_win: isWin,
        player_score: data.player_score ?? 0,
        opponent_score: data.opponent_score ?? 0,
        is_key_game: data.is_key_game ?? false,
        is_playoff_game: data.is_playoff_game ?? false,
      };

      // Playoff data
      if (data.playoff_series_id)
        gameData.playoff_series_id = cleanValue(data.playoff_series_id);
      if (data.playoff_game_number)
        gameData.playoff_game_number = cleanValue(data.playoff_game_number);

      // Stat fields
      const statFields = [
        "minutes",
        "points",
        "rebounds",
        "offensive_rebounds",
        "assists",
        "steals",
        "blocks",
        "turnovers",
        "fouls",
        "plus_minus",
        "fg_made",
        "fg_attempted",
        "threes_made",
        "threes_attempted",
        "ft_made",
        "ft_attempted",
      ];

      for (const field of statFields) {
        const val = cleanValue((data as any)[field]);
        if (val !== undefined) gameData[field] = val;
      }

      if ("games_started" in gameData) delete gameData.games_started;

      logger.info("Saving game data:", gameData);

      const { data: result, error } = editingGame
        ? await supabase!
            .from("player_game_stats")
            .update(gameData)
            .eq("id", editingGame.id)
            .select()
        : await supabase!.from("player_game_stats").insert([gameData]).select();

      if (error) {
        logger.error("Database error:", error);
        showError(`Failed to save game: ${error.message}`);
        return;
      }

      logger.info("Game saved successfully:", result);
      onGameAdded();
      success(editingGame ? "Game updated successfully" : "Game added successfully");
      onClose();
    } catch (err) {
      logger.error("Unexpected error saving game:", err);
      showError(`Failed to save game: ${(err as Error)?.message ?? "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit, isSubmitting };
}