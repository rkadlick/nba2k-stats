"use client";

import { useCallback, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { ViewMode } from "@/lib/types";

import { useGameManagement } from "@/hooks/ui/useGameManagement";
import { useModalState } from "@/hooks/ui/useModalState";
import { usePlayerSeasonSelection } from "@/hooks/ui/usePlayerSeasonSelection";
import { useViewState } from "@/hooks/ui/useViewState";
import AddGameModal from "@/components/add-game-modal";
import EditStatsModal from "@/components/edit-stats-modal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LoadingState } from "@/components/LoadingState";
import { SupabaseNotConfigured } from "@/components/SupabaseNotConfigured";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePlayerAwards } from "@/hooks/filter/usePlayerAwards";
import PlayerView from "@/components/views/PlayerView";
import SplitView from "@/components/views/SplitView";
import { useSeasonsData } from "@/hooks/data/useSeasonsData";
import { usePlayersData } from "@/hooks/data/usePlayersData";
import { useStatsData } from "@/hooks/data/useStatsData";
import { usePlayerStats } from "@/hooks/filter/usePlayerStats";

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Auth
  const { currentUser, currentPlayer, loading: authLoading, handleLogout, userId } = useAuth();

  // Data
  const { seasons, playerSeasons, loading: seasonsLoading, reload: reloadSeasons } = useSeasonsData({ userId: userId ?? undefined });
  const { players, loading: playersLoading, reload: reloadPlayers } = usePlayersData();
  const { allStats, allSeasonAwards, loading: statsLoading, reload: reloadStats } = useStatsData();
  const { player1Stats, player2Stats } = usePlayerStats({ players, allStats });
  const { player1Awards, player2Awards } = usePlayerAwards({ players, allSeasonAwards });
  const latestGameDate = allStats.find(g => g.player_id === currentPlayer?.id)?.game_date;

  const loading = authLoading || seasonsLoading || playersLoading || statsLoading;

  // UI State
  const modalState = useModalState();
  const defaultSeason = seasons.length > 0 ? seasons[0] : null;
  const { getSelectedSeasonForPlayer, handlePlayerSeasonChange } = usePlayerSeasonSelection(defaultSeason);
  const { player1ViewPlayer, player2ViewPlayer, isEditMode } = useViewState(viewMode, players, modalState.editingPlayerId);

  // Actions
  const handleDataReload = useCallback(async () => {
    await Promise.all([reloadSeasons(), reloadPlayers(), reloadStats()]);
  }, [reloadSeasons, reloadPlayers, reloadStats]);

  const setEditingPlayerId = useCallback(
    (id: string | null) => {
      if (!id) return;
      if (modalState.editingPlayerId !== id) {
        modalState.openEditStatsModal(id);
      }
    },
    [modalState]
  );

  const { handleGameAdded, handleEditGame, handleDeleteGame } = useGameManagement({
    currentUser,
    players,
    setViewMode,
    setEditingPlayerId,
    setEditingGame: modalState.setEditingGame,
    setShowAddGameModal: modalState.setShowAddGameModal,
    onDataReload: handleDataReload,
  });

  const handleEditStats = useCallback(() => {
    if (players.length > 0 && currentPlayer) {
      modalState.openEditStatsModal(currentPlayer.id);
    }
  }, [players.length, currentPlayer, modalState]);

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-text)] transition-colors">
      <Header
        currentUser={currentUser}
        players={players}
        setShowAddGameModal={modalState.openAddGameModal}
        handleEditStats={handleEditStats}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setMobileMenuOpen={setMobileMenuOpen}
        mobileMenuOpen={mobileMenuOpen}
        handleLogout={handleLogout}
      />

      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!defaultSeason ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              No seasons found. Please create a season to get started.
            </p>
          </div>
        ) : !isSupabaseConfigured ? (
          <SupabaseNotConfigured />
        ) : (
          <div className="space-y-8">
            {viewMode === "split" ? (
              players.length >= 2 ? (
                <SplitView
                  players={players}
                  player1Stats={player1Stats}
                  player2Stats={player2Stats}
                  player1Awards={player1Awards}
                  player2Awards={player2Awards}
                  allSeasonAwards={allSeasonAwards}
                  seasons={seasons}
                  defaultSeason={defaultSeason}
                  currentUser={currentUser}
                  getSelectedSeasonForPlayer={getSelectedSeasonForPlayer}
                  onSeasonChange={handlePlayerSeasonChange}
                />
              ) : (
                <div className="text-center py-8 text-gray-600">
                  Add at least two players to view the split comparison.
                </div>
              )
            ) : null}

            {viewMode === "player1" && player1ViewPlayer && (
              <PlayerView
                player={player1ViewPlayer}
                playerStats={player1Stats}
                playerAwards={player1Awards}
                allSeasonAwards={allSeasonAwards}
                seasons={seasons}
                defaultSeason={defaultSeason}
                currentUser={currentUser}
                isEditMode={isEditMode && modalState.editingPlayerId === player1ViewPlayer.id}
                selectedSeason={getSelectedSeasonForPlayer(player1ViewPlayer.id)}
                onEditGame={handleEditGame}
                onDeleteGame={handleDeleteGame}
                onStatsUpdated={handleGameAdded}
                onSeasonChange={(season) => handlePlayerSeasonChange(player1ViewPlayer.id, season)}
              />
            )}

            {viewMode === "player2" && player2ViewPlayer && (
              <PlayerView
                player={player2ViewPlayer}
                playerStats={player2Stats}
                playerAwards={player2Awards}
                allSeasonAwards={allSeasonAwards}
                seasons={seasons}
                defaultSeason={defaultSeason}
                currentUser={currentUser}
                isEditMode={isEditMode && modalState.editingPlayerId === player2ViewPlayer.id}
                selectedSeason={getSelectedSeasonForPlayer(player2ViewPlayer.id)}
                onEditGame={handleEditGame}
                onDeleteGame={handleDeleteGame}
                onStatsUpdated={handleGameAdded}
                onSeasonChange={(season) => handlePlayerSeasonChange(player2ViewPlayer.id, season)}
              />
            )}
          </div>
        )}
      </div>

      <Footer />

      <AddGameModal
        isOpen={modalState.showAddGameModal}
        onClose={modalState.closeAddGameModal}
        players={players}
        playerSeasons={playerSeasons}
        allSeasons={seasons}
        onGameAdded={handleGameAdded}
        editingGame={modalState.editingGame}
        currentUser={currentUser}
        latestGameDate={latestGameDate}
      />
      <EditStatsModal
        isOpen={modalState.showEditStatsModal}
        onClose={modalState.closeEditStatsModal}
        players={players}
        seasons={playerSeasons}
        allStats={allStats}
        currentUser={currentUser}
        onStatsUpdated={handleGameAdded}
      />
    </div>
  );
}