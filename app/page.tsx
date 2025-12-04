"use client";

import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  Season,
  PlayerGameStatsWithDetails,
  ViewMode,
} from "@/lib/types";

import { useGameManagement } from "@/hooks/ui/useGameManagement";
import AddGameModal from "@/components/add-game-modal";
import EditStatsModal from "@/components/edit-stats-modal";
import Header from "@/components/Header";
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
  // State for UI controls (not data)
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showEditStatsModal, setShowEditStatsModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<PlayerGameStatsWithDetails | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Track selected season for each player
  const [playerSelectedSeasons, setPlayerSelectedSeasons] = useState<
    Record<string, Season | string>
  >({});

  // Data hooks
  const { currentUser, currentPlayer, loading: authLoading, handleLogout, userId } = useAuth();
  const { seasons, playerSeasons, loading: seasonsLoading } = useSeasonsData({ userId: userId ?? undefined });
  const { teams, loading: teamsLoading } = useTeamsData();
  const { players, loading: playersLoading } = usePlayersData({ teams });
  const { allStats, allSeasonAwards, loading: statsLoading } = useStatsData({ teams });
  const { player1Stats, player2Stats } = usePlayerStats({ players, allStats });
  const { player1Awards, player2Awards } = usePlayerAwards({ players, allSeasonAwards });

  // Combined loading state
  const loading = authLoading || seasonsLoading || teamsLoading || playersLoading || statsLoading;

  // For now, create a simple reload mechanism
  // In a more advanced setup, each hook could expose a reload function
  const handleDataReload = () => {
    // Force a page reload for now - in production you'd implement proper cache invalidation
    window.location.reload();
  };

  const { handleGameAdded, handleEditGame, handleDeleteGame } = useGameManagement({
    currentUser,
    players,
    setViewMode,
    setEditingPlayerId,
    setEditingGame,
    setShowAddGameModal,
    onDataReload: async () => {
      await handleDataReload();
    },
  });

  const handleEditStats = () => {
    // Switch to player1 view and set editing mode
    if (players.length > 0) {
      setEditingPlayerId(currentPlayer?.id ?? null);
      setShowEditStatsModal(true);
    }
  };

  // View helpers
  const player1ViewPlayer = players.length > 0 ? players[0] : null;
  const player2ViewPlayer = players.length > 1 ? players[1] : null;
  const isEditMode = (viewMode === "player1" || viewMode === "player2") && editingPlayerId !== null;

  // Season helpers
  const defaultSeason = seasons.length > 0 ? seasons[0] : null;
  
  const getSelectedSeasonForPlayer = (playerId: string): Season | null => {
    const selected = playerSelectedSeasons[playerId];
    if (!selected) return defaultSeason;
    if (typeof selected === "string") return null; // Career view
    return selected;
  };

  const handlePlayerSeasonChange = (playerId: string, season: Season | string) => {
    setPlayerSelectedSeasons((prev) => ({
      ...prev,
      [playerId]: season,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header
        currentUser={currentUser}
        players={players}
        setShowAddGameModal={setShowAddGameModal}
        handleEditStats={handleEditStats}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setMobileMenuOpen={setMobileMenuOpen}
        mobileMenuOpen={mobileMenuOpen}
        handleLogout={handleLogout}
      />

      {/* Main content */}
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isSupabaseConfigured ? (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Supabase Not Configured
            </h2>
            <p className="text-gray-600 text-lg mb-4">
              Please configure your Supabase credentials in{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>
            </p>
            <p className="text-sm text-gray-500">
              See{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                SUPABASE_SETUP.md
              </code>{" "}
              for instructions.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Player panels */}
            {viewMode === "split" && players.length >= 2 && (
              <SplitView
                players={players}
                player1Stats={player1Stats}
                player2Stats={player2Stats}
                player1Awards={player1Awards}
                player2Awards={player2Awards}
                allSeasonAwards={allSeasonAwards}
                seasons={seasons}
                defaultSeason={defaultSeason ?? seasons[0]}
                teams={teams}
                currentUser={currentUser}
                getSelectedSeasonForPlayer={getSelectedSeasonForPlayer}
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
                defaultSeason={defaultSeason ?? seasons[0]}
                teams={teams}
                players={players}
                currentUser={currentUser}
                isEditMode={isEditMode && editingPlayerId === player1ViewPlayer.id}
                getSelectedSeasonForPlayer={getSelectedSeasonForPlayer}
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
                defaultSeason={defaultSeason ?? seasons[0]}
                teams={teams}
                players={players}
                currentUser={currentUser}
                isEditMode={isEditMode && editingPlayerId === player2ViewPlayer.id}
                getSelectedSeasonForPlayer={getSelectedSeasonForPlayer}
                onEditGame={handleEditGame}
                onDeleteGame={handleDeleteGame}
                onStatsUpdated={handleGameAdded}
                onSeasonChange={(season) => handlePlayerSeasonChange(player2ViewPlayer.id, season)}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddGameModal
        isOpen={showAddGameModal}
        onClose={() => {
          setShowAddGameModal(false);
          setEditingGame(null);
        }}
        players={players}
        seasons={playerSeasons}
        teams={teams}
        onGameAdded={handleGameAdded}
        editingGame={editingGame}
        currentUser={currentUser}
      />
      <EditStatsModal
        isOpen={showEditStatsModal}
        onClose={() => {
          setShowEditStatsModal(false);
          setEditingPlayerId(null);
        }}
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
