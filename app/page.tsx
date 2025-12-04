"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  User,
  Team,
  Season,
  Player,
  PlayerGameStats,
  PlayerAwardInfo,
  PlayerWithTeam,
  PlayerGameStatsWithDetails,
  ViewMode,
  Award,
} from "@/lib/types";
import PlayerPanel from "@/components/player-panel";
import PlayoffTree from "@/components/playoff-tree";
import AddGameModal from "@/components/add-game-modal";
import EditStatsModal from "@/components/edit-stats-modal";
import { useToast } from "@/components/ToastProvider";
import { logger } from "@/lib/logger";
import { getDisplayPlayerName } from "@/lib/playerNameUtils";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [playerSeasons, setPlayerSeasons] = useState<Season[]>([]);
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [allStats, setAllStats] = useState<PlayerGameStatsWithDetails[]>([]);
  const [allSeasonAwards, setAllSeasonAwards] = useState<Award[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showEditStatsModal, setShowEditStatsModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingGame, setEditingGame] =
    useState<PlayerGameStatsWithDetails | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Track selected season for each player
  const [playerSelectedSeasons, setPlayerSelectedSeasons] = useState<
    Record<string, Season | string>
  >({});
  // Toast notifications
  const { error: showError, success } = useToast();

  useEffect(() => {
    // Check authentication and load data (allow public access)
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadData(session.user.id);
      } else {
        // Load data without authentication (public view)
        loadData();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPlayerIdForUser = async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (error) {
      logger.error("Error loading player id for user:", error);
      return null;
    }
    setCurrentPlayer(data as Player);
    return data?.id;
  };

  const loadUserProfile = async (userId: string) => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      logger.error("Error loading user profile:", error);
      return null;
    }

    return data as User;
  };

  const loadData = async (userId?: string) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Load user profile only if userId is provided (user is logged in)
      if (userId) {
        const userProfile = await loadUserProfile(userId);
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }

      // Load seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from("seasons")
        .select("*")
        .order("year_start", { ascending: false });

      if (seasonsError) {
        logger.error("Error loading seasons:", seasonsError);
      } else if (seasonsData && seasonsData.length > 0) {
        setSeasons(seasonsData as Season[]);
      }

      //Load player seasons
      if (userId) {
        const playerId = await getPlayerIdForUser(userId);
        if (!playerId) {
          logger.error("Player not found for user:", userId);
          return;
        }

        const { data: totalsData, error: totalsError } = await supabase
          .from("season_totals")
          .select("season_id")
          .eq("player_id", playerId);


        if (totalsError) {
          logger.error("Error loading season_totals:", totalsError);
        } else {
          const playerSeasonIds = (totalsData ?? []).map((t) => t.season_id);
          const playerSeasons = seasonsData?.filter((s) =>
            playerSeasonIds.includes(s.id)
          );
          setPlayerSeasons(playerSeasons ?? []);
        }
      } else {
        setPlayerSeasons([]);
      }

      // Load teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .order("name", { ascending: true });

      if (teamsError) {
        logger.error("Error loading teams:", teamsError);
      }

      const teamsList = (teamsData || []) as Team[];
      setTeams(teamsList);

      // Load players with teams
      // Use players_public view which obfuscates names for anonymous users
      // Authenticated users will see real names via the view's function
      const { data: playersData, error: playersError } = await supabase
        .from("players_public")
        .select("*")
        .order("created_at", { ascending: true });

      if (playersError) {
        logger.error("Error loading players:", playersError);
      }

      const playersWithTeams: PlayerWithTeam[] = (playersData || []).map(
        (player: Player) => ({
          ...player,
          team: teamsList.find((t) => t.id === player.team_id),
        })
      );
      setPlayers(playersWithTeams);

      // Load ALL game stats (not filtered by season)
      const { data: statsData, error: statsError } = await supabase
        .from("player_game_stats")
        .select("*")
        .order("game_date", { ascending: false });

      if (statsError) {
        logger.error("Error loading game stats:", statsError);
      }

      const statsWithDetails: PlayerGameStatsWithDetails[] = (
        statsData || []
      ).map((stat: PlayerGameStats) => ({
        ...stat,
        opponent_team: teamsList.find((t) => t.id === stat.opponent_team_id),
      }));
      setAllStats(statsWithDetails);

      // Load ALL awards - we'll filter by player's user_id when displaying
      // RLS policies ensure users can only see their own awards, but we need to load
      // awards for each player based on that player's user_id
      const { data: seasonAwardsData, error: seasonAwardsError } =
        await supabase
          .from("awards")
          .select("*")
          .order("season_id")
          .order("award_name");

      if (seasonAwardsError) {
        logger.error("Error loading awards:", seasonAwardsError);
      } else {
        const awards = (seasonAwardsData || []) as Award[];
        setAllSeasonAwards(awards);
      }
    } catch (error) {
      logger.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get stats for each player (all seasons)
  const player1Stats = useMemo(() => {
    if (players.length === 0) return [];
    return allStats.filter((stat) => stat.player_id === players[0].id);
  }, [allStats, players]);

  const player2Stats = useMemo(() => {
    if (players.length < 2) return [];
    return allStats.filter((stat) => stat.player_id === players[1].id);
  }, [allStats, players]);

  // Get awards for each player (all seasons)
  // CRITICAL: Awards must belong to the player's user (award.user_id matches player.user_id)
  // Awards belong to a player's league if award.player_id matches
  // Awards are won by a player if winner_player_id matches OR winner_player_name matches
  const player1Awards = useMemo((): PlayerAwardInfo[] => {
    if (players.length === 0) return [];
    const player = players[0];
    // Filter from allSeasonAwards (Award[]) which has winner_player_id and winner_player_name
    const filteredAwards = allSeasonAwards.filter((award) => {
      // CRITICAL: Award must belong to this player's user (user who owns this player)
      if (award.user_id !== player.user_id) return false;
      // Award must belong to this player's league
      if (award.player_id && award.player_id !== player.id) return false;
      // Award is won by this player
      return (
        award.winner_player_id === player.id ||
        award.winner_player_name?.trim().toLowerCase() ===
          player.player_name.trim().toLowerCase()
      );
    });
    // Transform to PlayerAwardInfo format for CareerView
    return filteredAwards.map((award) => ({
      id: award.id,
      player_id: award.player_id || award.winner_player_id || "",
      season_id: award.season_id,
      award_name: award.award_name,
      award_id: award.id,
      created_at: award.created_at,
    }));
  }, [allSeasonAwards, players]);

  const player2Awards = useMemo((): PlayerAwardInfo[] => {
    if (players.length < 2) return [];
    const player = players[1];
    // Filter from allSeasonAwards (Award[]) which has winner_player_id and winner_player_name
    const filteredAwards = allSeasonAwards.filter((award) => {
      // CRITICAL: Award must belong to this player's user (user who owns this player)
      if (award.user_id !== player.user_id) return false;
      // Award must belong to this player's league
      if (award.player_id && award.player_id !== player.id) return false;
      // Award is won by this player
      return (
        award.winner_player_id === player.id ||
        award.winner_player_name?.trim().toLowerCase() ===
          player.player_name.trim().toLowerCase()
      );
    });
    // Transform to PlayerAwardInfo format for CareerView
    return filteredAwards.map((award) => ({
      id: award.id,
      player_id: award.player_id || award.winner_player_id || "",
      season_id: award.season_id,
      award_name: award.award_name,
      award_id: award.id,
      created_at: award.created_at,
    }));
  }, [allSeasonAwards, players]);

  const handleLogout = async () => {
    try {
      // Clear local state first to prevent any race conditions
      setCurrentUser(null);
      setPlayers([]);
      setAllStats([]);
      setAllSeasonAwards([]);
      setLoading(true);

      if (isSupabaseConfigured && supabase) {
        // Sign out and wait for it to complete
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error("Error signing out:", error);
        }

        // Clear all Supabase auth-related localStorage items
        // This ensures the session is fully cleared in localhost
        if (typeof window !== "undefined") {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              (key.startsWith("sb-") || key.includes("supabase.auth"))
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        }

        // Wait a moment to ensure everything is cleared
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Use window.location.href for a hard redirect to ensure session is cleared
      // This works better in localhost where router.push might not fully clear state
      window.location.href = "/login";
    } catch (error) {
      logger.error("Error during logout:", error);
      // Force redirect even on error
      window.location.href = "/login";
    }
  };

  const handleGameAdded = async () => {
    // Reload all data after game is added
    if (currentUser) {
      await loadData(currentUser.id);
    }
  };

  const handleEditStats = () => {
    // Switch to player1 view and set editing mode
    if (players.length > 0) {
      setEditingPlayerId(currentPlayer?.id ?? null);
      setShowEditStatsModal(true);
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
        await loadData(currentUser.id);
        success("Game deleted successfully");
      }
    } catch (error) {
      logger.error("Error deleting game:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showError("Failed to delete game: " + errorMessage);
    }
  };

  const player1ViewPlayer = players.length > 0 ? players[0] : null;
  const player2ViewPlayer = players.length > 1 ? players[1] : null;

  const isEditMode =
    (viewMode === "player1" || viewMode === "player2") &&
    editingPlayerId !== null;

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

  const defaultSeason = seasons.length > 0 ? seasons[0] : null;

  // Get selected season for a player, defaulting to defaultSeason
  const getSelectedSeasonForPlayer = (playerId: string): Season | null => {
    const selected = playerSelectedSeasons[playerId];
    if (!selected) return defaultSeason;
    if (typeof selected === "string") return null; // Career view
    return selected;
  };

  // Handler to update selected season for a player
  const handlePlayerSeasonChange = (
    playerId: string,
    season: Season | string
  ) => {
    setPlayerSelectedSeasons((prev) => ({
      ...prev,
      [playerId]: season,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Top bar - Modernized */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NBA2K Stat Tracker
              </h1>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              {currentUser && (
                <>
                  <button
                    onClick={() => setShowAddGameModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    Add Game
                  </button>
                  <button
                    onClick={handleEditStats}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    Edit Stats
                  </button>
                </>
              )}

              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="px-4 py-2 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all"
              >
                {players.length >= 2 && (
                  <option value="split">Split View</option>
                )}
                {players.length > 0 && (
                  <option value="player1">
                    {getDisplayPlayerName(players[0], players, currentUser)}
                  </option>
                )}
                {players.length > 1 && (
                  <option value="player2">
                    {getDisplayPlayerName(players[1], players, currentUser)}
                  </option>
                )}
              </select>

              {currentUser && (
                <div className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700">
                  {currentUser.display_name}
                </div>
              )}

              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              >
                {players.length >= 2 && (
                  <option value="split">Split View</option>
                )}
                {players.length > 0 && (
                  <option value="player1">
                    {getDisplayPlayerName(players[0], players, currentUser)}
                  </option>
                )}
                {players.length > 1 && (
                  <option value="player2">
                    {getDisplayPlayerName(players[1], players, currentUser)}
                  </option>
                )}
              </select>

              {currentUser && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowAddGameModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                  >
                    Add Game
                  </button>
                  <button
                    onClick={() => {
                      handleEditStats();
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm"
                  >
                    Edit Stats
                  </button>
                </div>
              )}

              {currentUser ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 text-center">
                    {currentUser.display_name}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all shadow-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="w-full px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

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
        ) : !defaultSeason ? (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-yellow-500"
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
              No Seasons Found
            </h2>
            <p className="text-gray-600 text-lg">
              Please add at least one season to your database.
            </p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">
              No players found. Please add players to your database.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Player panels */}
            {viewMode === "split" && players.length >= 2 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-[calc(100vh-240px)]">
                    <PlayerPanel
                      player={players[0]}
                      allStats={player1Stats}
                      awards={player1Awards}
                      allSeasonAwards={allSeasonAwards}
                      seasons={seasons}
                      defaultSeason={defaultSeason}
                      teams={teams}
                      players={players}
                      currentUser={currentUser}
                      onSeasonChange={(season) =>
                        handlePlayerSeasonChange(players[0].id, season)
                      }
                    />
                  </div>
                  <div className="h-[calc(100vh-240px)]">
                    <PlayerPanel
                      player={players[1]}
                      allStats={player2Stats}
                      awards={player2Awards}
                      allSeasonAwards={allSeasonAwards}
                      seasons={seasons}
                      defaultSeason={defaultSeason}
                      teams={teams}
                      players={players}
                      currentUser={currentUser}
                      onSeasonChange={(season) =>
                        handlePlayerSeasonChange(players[1].id, season)
                      }
                    />
                  </div>
                </div>

                {/* Playoff Trees - Separate, stacked vertically, full width */}
                <div className="space-y-8 w-full max-w-full">
                  {players.map((player, index) => {
                    const playerStats =
                      index === 0 ? player1Stats : player2Stats;
                    const selectedSeason = getSelectedSeasonForPlayer(
                      player.id
                    );
                    // Only show playoff tree if a season is selected (not career view)
                    if (!selectedSeason) return null;
                    return (
                      <div key={player.id} className="w-full">
                        <PlayoffTree
                          season={selectedSeason}
                          playerId={player.id}
                          playerStats={playerStats.filter(
                            (stat) => stat.is_playoff_game
                          )}
                          playerTeamName={player.team?.name}
                          playerName={getDisplayPlayerName(
                            player,
                            players,
                            currentUser
                          )}
                          teams={teams}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {viewMode === "player1" && player1ViewPlayer && (
              <>
                <div className="h-[calc(100vh-240px)] max-w-[90%] mx-auto">
                  <PlayerPanel
                    player={player1ViewPlayer}
                    allStats={player1Stats}
                    awards={player1Awards}
                    allSeasonAwards={allSeasonAwards}
                    seasons={seasons}
                    defaultSeason={defaultSeason}
                    teams={teams}
                    players={players}
                    currentUser={currentUser}
                    isEditMode={
                      isEditMode && editingPlayerId === player1ViewPlayer.id
                    }
                    onEditGame={handleEditGame}
                    onDeleteGame={handleDeleteGame}
                    onStatsUpdated={handleGameAdded}
                    onSeasonChange={(season) =>
                      handlePlayerSeasonChange(player1ViewPlayer.id, season)
                    }
                  />
                </div>

                {/* Playoff Tree - Separate, full width */}
                <div className="w-full max-w-full mt-8">
                  {(() => {
                    const selectedSeason = getSelectedSeasonForPlayer(
                      player1ViewPlayer.id
                    );
                    if (!selectedSeason) return null; // Don't show in career view
                    return (
                      <PlayoffTree
                        season={selectedSeason}
                        playerId={player1ViewPlayer.id}
                        playerStats={player1Stats.filter(
                          (stat) => stat.is_playoff_game
                        )}
                        playerTeamName={player1ViewPlayer.team?.name}
                        playerName={getDisplayPlayerName(
                          player1ViewPlayer,
                          players,
                          currentUser
                        )}
                        teams={teams}
                      />
                    );
                  })()}
                </div>
              </>
            )}

            {viewMode === "player2" && player2ViewPlayer && (
              <>
                <div className="h-[calc(100vh-240px)] max-w-[90%] mx-auto">
                  <PlayerPanel
                    player={player2ViewPlayer}
                    allStats={player2Stats}
                    awards={player2Awards}
                    allSeasonAwards={allSeasonAwards}
                    seasons={seasons}
                    defaultSeason={defaultSeason}
                    teams={teams}
                    players={players}
                    currentUser={currentUser}
                    isEditMode={
                      isEditMode && editingPlayerId === player2ViewPlayer.id
                    }
                    onEditGame={handleEditGame}
                    onDeleteGame={handleDeleteGame}
                    onStatsUpdated={handleGameAdded}
                    onSeasonChange={(season) =>
                      handlePlayerSeasonChange(player2ViewPlayer.id, season)
                    }
                  />
                </div>

                {/* Playoff Tree - Separate, full width */}
                <div className="w-full max-w-full mt-8">
                  {(() => {
                    const selectedSeason = getSelectedSeasonForPlayer(
                      player2ViewPlayer.id
                    );
                    if (!selectedSeason) return null; // Don't show in career view
                    return (
                      <PlayoffTree
                        season={selectedSeason}
                        playerId={player2ViewPlayer.id}
                        playerStats={player2Stats.filter(
                          (stat) => stat.is_playoff_game
                        )}
                        playerTeamName={player2ViewPlayer.team?.name}
                        playerName={getDisplayPlayerName(
                          player2ViewPlayer,
                          players,
                          currentUser
                        )}
                        teams={teams}
                      />
                    );
                  })()}
                </div>
              </>
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
