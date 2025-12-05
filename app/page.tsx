"use client";

import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { ViewMode } from "@/lib/types";

import { useGameManagement } from "@/hooks/ui/useGameManagement";
import { useModalState } from "@/hooks/ui/useModalState";
import { usePlayerSeasonSelection } from "@/hooks/ui/usePlayerSeasonSelection";
import { useViewState } from "@/hooks/ui/useViewState";
import AddGameModal from "@/components/add-game-modal";
import EditStatsModal from "@/components/edit-stats-modal";
import Header from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { SupabaseNotConfigured } from "@/components/SupabaseNotConfigured";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePlayerAwards } from "@/hooks/filter/usePlayerAwards";
import PlayerView from "@/components/views/PlayerView";
import SplitView from "@/components/views/SplitView";
import { useSeasonsData } from "@/hooks/data/useSeasonsData";
import { useTeamsData } from "@/hooks/data/useTeamsData";
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
  const { teams, loading: teamsLoading, reload: reloadTeams } = useTeamsData();
  const { players, loading: playersLoading, reload: reloadPlayers } = usePlayersData({ teams });
  const { allStats, allSeasonAwards, loading: statsLoading, reload: reloadStats } = useStatsData({ teams });
  const { player1Stats, player2Stats } = usePlayerStats({ players, allStats });
  const { player1Awards, player2Awards } = usePlayerAwards({ players, allSeasonAwards });

  const loading = authLoading || seasonsLoading || teamsLoading || playersLoading || statsLoading;

  // UI State
  const modalState = useModalState();
  const defaultSeason = seasons.length > 0 ? seasons[0] : null;
  const { getSelectedSeasonForPlayer, handlePlayerSeasonChange } = usePlayerSeasonSelection(defaultSeason);
  const { player1ViewPlayer, player2ViewPlayer, isEditMode } = useViewState(viewMode, players, modalState.editingPlayerId);

  // Actions
  const handleDataReload = async () => {
    await Promise.all([reloadSeasons(), reloadTeams(), reloadPlayers(), reloadStats()]);
  };

  const { handleGameAdded, handleEditGame, handleDeleteGame } = useGameManagement({
    currentUser,
    players,
    setViewMode,
    setEditingPlayerId: (id) => modalState.editingPlayerId !== id && modalState.openEditStatsModal(id ?? ""),
    setEditingGame: modalState.setEditingGame,
    setShowAddGameModal: modalState.setShowAddGameModal,
    onDataReload: handleDataReload,
  });

  const handleEditStats = () => {
    if (players.length > 0 && currentPlayer) {
      modalState.openEditStatsModal(currentPlayer.id);
    }
  };

  if (loading) return <LoadingState />;

  if (!defaultSeason) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
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
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              No seasons found. Please create a season to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
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
        {!isSupabaseConfigured ? (
          <SupabaseNotConfigured />
        ) : (
          <div className="space-y-8">
            {viewMode === "split" && players.length >= 2 && (
              <SplitView
                players={players}
                player1Stats={player1Stats}
                player2Stats={player2Stats}
                player1Awards={player1Awards}
                player2Awards={player2Awards}
                allSeasonAwards={allSeasonAwards}
                seasons={seasons}
                defaultSeason={defaultSeason}
                teams={teams}
                currentUser={currentUser}
                selectedSeason={getSelectedSeasonForPlayer(players[0].id)}
                onSeasonChange={(season) => handlePlayerSeasonChange(players[0].id, season)}
              />
            )}

            {viewMode === "player1" && player1ViewPlayer && (
              <PlayerView
                player={player1ViewPlayer}
                playerStats={player1Stats}
                playerAwards={player1Awards}
                allSeasonAwards={allSeasonAwards}
                seasons={seasons}
                defaultSeason={defaultSeason}
                teams={teams}
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
                teams={teams}
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

      <AddGameModal
        isOpen={modalState.showAddGameModal}
        onClose={modalState.closeAddGameModal}
        players={players}
        seasons={playerSeasons}
        teams={teams}
        onGameAdded={handleGameAdded}
        editingGame={modalState.editingGame}
        currentUser={currentUser}
      />
      <EditStatsModal
        isOpen={modalState.showEditStatsModal}
        onClose={modalState.closeEditStatsModal}
        players={players}
        seasons={playerSeasons}
        teams={teams}
        allStats={allStats}
        currentUser={currentUser}
        onStatsUpdated={handleGameAdded}
      />
    </div>
  );
}