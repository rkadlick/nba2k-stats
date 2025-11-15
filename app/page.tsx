'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
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
} from '@/lib/types';
import PlayerPanel from '@/components/PlayerPanel';
import PlayoffTree from '@/components/PlayoffTree';
import AddGameModal from '@/components/AddGameModal';
import EditStatsModal from '@/components/EditStatsModal';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [allStats, setAllStats] = useState<PlayerGameStatsWithDetails[]>([]);
  const [allAwards, setAllAwards] = useState<PlayerAwardInfo[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showEditStatsModal, setShowEditStatsModal] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<PlayerGameStatsWithDetails | null>(null);

  useEffect(() => {
    // Check authentication and load data
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        loadData(session.user.id);
      }
    });
  }, [router]);

  const loadUserProfile = async (userId: string) => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading user profile:', error);
      return null;
    }

    return data as User;
  };

  const loadData = async (userId: string) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Load user profile
      const userProfile = await loadUserProfile(userId);
      setCurrentUser(userProfile);

      // Load seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('seasons')
        .select('*')
        .order('year_start', { ascending: false });

      if (seasonsError) {
        console.error('Error loading seasons:', seasonsError);
      } else if (seasonsData && seasonsData.length > 0) {
        setSeasons(seasonsData as Season[]);
      }

      // Load teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*');

      if (teamsError) {
        console.error('Error loading teams:', teamsError);
      }

      const teamsList = (teamsData || []) as Team[];
      setTeams(teamsList);

      // Load players with teams
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: true });

      if (playersError) {
        console.error('Error loading players:', playersError);
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
        .from('player_game_stats')
        .select('*')
        .order('game_date', { ascending: false });

      if (statsError) {
        console.error('Error loading game stats:', statsError);
      }

      const statsWithDetails: PlayerGameStatsWithDetails[] = (
        statsData || []
      ).map((stat: PlayerGameStats) => ({
        ...stat,
        opponent_team: teamsList.find((t) => t.id === stat.opponent_team_id),
      }));
      setAllStats(statsWithDetails);

      // Load ALL awards - join player_awards with awards table
      const { data: playerAwardsData, error: playerAwardsError } = await supabase
        .from('player_awards')
        .select(`
          *,
          awards (
            id,
            award_name,
            season_id
          )
        `);

      if (playerAwardsError) {
        console.error('Error loading player awards:', playerAwardsError);
      }

      // Transform the joined data into PlayerAwardInfo format
      const awardsWithInfo: PlayerAwardInfo[] = (playerAwardsData || [])
        .map((pa: any) => {
          const award = Array.isArray(pa.awards) ? pa.awards[0] : pa.awards;
          return {
            id: pa.id,
            player_id: pa.player_id,
            season_id: pa.season_id,
            award_name: award?.award_name || 'Unknown Award',
            award_id: pa.award_id,
            created_at: pa.created_at,
          };
        });
      setAllAwards(awardsWithInfo);
    } catch (error) {
      console.error('Error loading data:', error);
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
  const player1Awards = useMemo(() => {
    if (players.length === 0) return [];
    return allAwards.filter((award) => award.player_id === players[0].id);
  }, [allAwards, players]);

  const player2Awards = useMemo(() => {
    if (players.length < 2) return [];
    return allAwards.filter((award) => award.player_id === players[1].id);
  }, [allAwards, players]);

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      router.push('/login');
    } else {
      router.push('/login');
    }
  };

  const handleGameAdded = async () => {
    // Reload all data after game is added
    if (currentUser) {
      await loadData(currentUser.id);
    }
  };

  const handleEditStats = () => {
    // Switch to single view and set editing mode
    if (players.length > 0) {
      setViewMode('single');
      setEditingPlayerId(players[0].id);
      setShowEditStatsModal(true);
    }
  };

  const handleEditGame = (game: PlayerGameStatsWithDetails) => {
    // Switch to single view if not already
    if (viewMode !== 'single') {
      setViewMode('single');
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
        .from('player_game_stats')
        .delete()
        .eq('id', gameId);

      if (error) throw error;

      // Reload data
      if (currentUser) {
        await loadData(currentUser.id);
      }
    } catch (error: any) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game: ' + error.message);
    }
  };

  // Determine which player to show in single view (for editing)
  const singleViewPlayer = editingPlayerId 
    ? players.find(p => p.id === editingPlayerId) || players[0]
    : players[0];
  
  const singleViewStats = editingPlayerId
    ? allStats.filter((stat) => stat.player_id === editingPlayerId)
    : player1Stats;
  
  const singleViewAwards = editingPlayerId
    ? allAwards.filter((award) => award.player_id === editingPlayerId)
    : player1Awards;

  const isEditMode = viewMode === 'single' && editingPlayerId !== null;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Top bar - Modernized */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                2KCompare
          </h1>
            </div>

            <div className="flex items-center gap-4">
              {currentUser && (
                <>
                  <button
                    onClick={() => setShowAddGameModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    Add Game
                  </button>
                  <button
                    onClick={() => setShowEditStatsModal(true)}
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
                <option value="single">Single View</option>
                <option value="split">Split View</option>
                <option value="combined">Combined View</option>
              </select>

              {currentUser && (
                <div className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700">
                  {currentUser.display_name}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isSupabaseConfigured ? (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Supabase Not Configured</h2>
            <p className="text-gray-600 text-lg mb-4">Please configure your Supabase credentials in <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></p>
            <p className="text-sm text-gray-500">See <code className="bg-gray-100 px-2 py-1 rounded">SUPABASE_SETUP.md</code> for instructions.</p>
          </div>
        ) : !defaultSeason ? (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Seasons Found</h2>
            <p className="text-gray-600 text-lg">Please add at least one season to your database.</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No players found. Please add players to your database.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Player panels */}
            {viewMode === 'split' && players.length >= 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[calc(100vh-240px)]">
                  <PlayerPanel
                    player={players[0]}
                    allStats={player1Stats}
                    awards={player1Awards}
                    seasons={seasons}
                    defaultSeason={defaultSeason}
                  />
                </div>
                <div className="h-[calc(100vh-240px)]">
                  <PlayerPanel
                    player={players[1]}
                    allStats={player2Stats}
                    awards={player2Awards}
                    seasons={seasons}
                    defaultSeason={defaultSeason}
                  />
                </div>
              </div>
            )}

            {viewMode === 'single' && singleViewPlayer && (
              <div className="h-[calc(100vh-240px)] max-w-4xl mx-auto">
                <PlayerPanel
                  player={singleViewPlayer}
                  allStats={singleViewStats}
                  awards={singleViewAwards}
                  seasons={seasons}
                  defaultSeason={defaultSeason}
                  isEditMode={isEditMode}
                  onEditGame={handleEditGame}
                  onDeleteGame={handleDeleteGame}
                  onStatsUpdated={handleGameAdded}
                />
              </div>
            )}

            {viewMode === 'combined' && players.length >= 2 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-[700px]">
                    <PlayerPanel
                      player={players[0]}
                      allStats={player1Stats}
                      awards={player1Awards}
                      seasons={seasons}
                      defaultSeason={defaultSeason!}
                    />
                  </div>
                  <div className="h-[700px]">
                    <PlayerPanel
                      player={players[1]}
                      allStats={player2Stats}
                      awards={player2Awards}
                      seasons={seasons}
                      defaultSeason={defaultSeason}
                    />
                  </div>
                </div>
                <PlayoffTree 
                  season={defaultSeason!}
                  playerStats={[...player1Stats, ...player2Stats]}
                  playerTeamName={players[0]?.team?.name}
                  teams={teams}
                />
              </div>
            )}

            {/* Playoff tree (shown in split view at bottom) */}
            {viewMode === 'split' && (
              <PlayoffTree 
                season={defaultSeason}
                playerStats={[...player1Stats, ...player2Stats]}
                playerTeamName={players[0]?.team?.name}
                teams={teams}
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
        seasons={seasons}
        teams={teams}
        onGameAdded={handleGameAdded}
        editingGame={editingGame}
      />
      <EditStatsModal
        isOpen={showEditStatsModal}
        onClose={() => {
          setShowEditStatsModal(false);
          setEditingPlayerId(null);
        }}
        players={players}
        seasons={seasons}
        onStatsUpdated={handleGameAdded}
      />
    </div>
  );
}
