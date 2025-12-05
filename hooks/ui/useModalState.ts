// hooks/ui/useModalState.ts
import { useState, useCallback } from "react";
import { PlayerGameStatsWithDetails } from "@/lib/types";

export function useModalState() {
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showEditStatsModal, setShowEditStatsModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<PlayerGameStatsWithDetails | null>(null);

  const openAddGameModal = useCallback(() => setShowAddGameModal(true), []);
  const closeAddGameModal = useCallback(() => {
    setShowAddGameModal(false);
    setEditingGame(null);
  }, []);

  const openEditStatsModal = useCallback((playerId: string) => {
    setEditingPlayerId(playerId);
    setShowEditStatsModal(true);
  }, []);

  const closeEditStatsModal = useCallback(() => {
    setShowEditStatsModal(false);
    setEditingPlayerId(null);
  }, []);

  return {
    showAddGameModal,
    showEditStatsModal,
    editingPlayerId,
    editingGame,
    setEditingGame,
    openAddGameModal,
    closeAddGameModal,
    openEditStatsModal,
    closeEditStatsModal,
    setShowAddGameModal,
  };
}