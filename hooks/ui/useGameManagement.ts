"use client";

import { supabase } from "@/lib/supabaseClient";
import { PlayerGameStatsWithDetails, ViewMode, PlayerWithTeam, User } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { logger } from "@/lib/logger";

interface UseGameManagementProps {
  currentUser: User | null;
  players: PlayerWithTeam[];
  setViewMode: (mode: ViewMode) => void;
  setEditingPlayerId: (id: string | null) => void;
  setEditingGame: (game: PlayerGameStatsWithDetails | null) => void;
  setShowAddGameModal: (show: boolean) => void;
  onDataReload: () => Promise<void>; // This will be provided by the data hooks later
}

export function useGameManagement({
  currentUser,
  players,
  setViewMode,
  setEditingPlayerId,
  setEditingGame,
  setShowAddGameModal,
  onDataReload,
}: UseGameManagementProps) {
  const { success, error: showError } = useToast();

  const handleGameAdded = async () => {
    // Reload all data after game is added
    if (currentUser) {
      await onDataReload();
    }
  };

  const handleEditGame = (game: PlayerGameStatsWithDetails) => {
    // Switch to the appropriate player view based on which player the game belongs to
    const playerIndex = players.findIndex((p) => p.id === game.player_id);
    if (playerIndex === 0) {
      setViewMode("player1");
    } else if (playerIndex === 1) {
      setViewMode("player2");
    } else if (players.length > 0) {
      // Fallback to player1 if player not found
      setViewMode("player1");
    }
    // Set editing player to the game's player
    setEditingPlayerId(game.player_id);
    setEditingGame(game);
    setShowAddGameModal(true);
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from("player_game_stats")
        .delete()
        .eq("id", gameId);

      if (error) throw error;

      // Reload data
      if (currentUser) {
        await onDataReload();
        success("Game deleted successfully");
      }
    } catch (error) {
      logger.error("Error deleting game:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showError("Failed to delete game: " + errorMessage);
    }
  };

  return {
    handleGameAdded,
    handleEditGame,
    handleDeleteGame,
  };
}
