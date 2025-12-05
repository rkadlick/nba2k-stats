// hooks/ui/useViewState.ts
import { useMemo } from "react";
import { Player, ViewMode } from "@/lib/types";

export function useViewState(
  viewMode: ViewMode,
  players: Player[],
  editingPlayerId: string | null
) {
  return useMemo(() => {
    const player1ViewPlayer = players.length > 0 ? players[0] : null;
    const player2ViewPlayer = players.length > 1 ? players[1] : null;
    const isEditMode =
      (viewMode === "player1" || viewMode === "player2") &&
      editingPlayerId !== null;

    return {
      player1ViewPlayer,
      player2ViewPlayer,
      isEditMode,
    };
  }, [viewMode, players, editingPlayerId]);
}