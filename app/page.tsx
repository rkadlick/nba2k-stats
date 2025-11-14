'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  mockUsers,
  mockTeams,
  mockSeason,
  mockPlayers,
  mockStats,
  mockAwards,
} from '@/lib/mockData';
import {
  User,
  Team,
  Season,
  Player,
  PlayerStats,
  SeasonAward,
  PlayerWithTeam,
  PlayerStatsWithDetails,
  ViewMode,
} from '@/lib/types';
import PlayerPanel from '@/components/PlayerPanel';
import PlayoffTree from '@/components/PlayoffTree';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([mockSeason]);
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [allStats, setAllStats] = useState<PlayerStatsWithDetails[]>([]);
  const [allAwards, setAllAwards] = useState<SeasonAward[]>(mockAwards);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  useEffect(() => {
    // Check authentication
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          router.push('/login');
        } else {
          loadData();
        }
      });
    } else {
      // Mock mode
      loadMockData();
    }
  }, [router]);

  const loadMockData = () => {
    // Combine players with teams
    const playersWithTeams: PlayerWithTeam[] = mockPlayers.map((player) => ({
      ...player,
      team: mockTeams.find((t) => t.id === player.team_id),
    }));

    // Combine stats with opponent teams
    const statsWithDetails: PlayerStatsWithDetails[] = mockStats.map((stat) => ({
      ...stat,
      opponent_team: mockTeams.find((t) => t.id === stat.opponent_team_id),
    }));

    setPlayers(playersWithTeams);
    setAllStats(statsWithDetails);
    setCurrentUser(mockUsers[0]);
    setLoading(false);
  };

  const loadData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      loadMockData();
      return;
    }

    try {
      // Load seasons
      const { data: seasonsData } = await supabase
        .from('seasons')
        .select('*')
        .order('year_start', { ascending: false });

      if (seasonsData && seasonsData.length > 0) {
        setSeasons(seasonsData as Season[]);
      }

      // Load teams
      const { data: teamsData } = await supabase.from('teams').select('*');
      const teams = (teamsData || []) as Team[];

      // Load players with teams
      const { data: playersData } = await supabase
        .from('players')
        .select('*');

      const playersWithTeams: PlayerWithTeam[] = (playersData || []).map(
        (player: Player) => ({
          ...player,
          team: teams.find((t) => t.id === player.team_id),
        })
      );
      setPlayers(playersWithTeams);

      // Load ALL stats (not filtered by season)
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*');

      const statsWithDetails: PlayerStatsWithDetails[] = (
        statsData || []
      ).map((stat: PlayerStats) => ({
        ...stat,
        opponent_team: teams.find((t) => t.id === stat.opponent_team_id),
      }));
      setAllStats(statsWithDetails);

      // Load ALL awards
      const { data: awardsData } = await supabase
        .from('season_awards')
        .select('*');

      setAllAwards((awardsData || []) as SeasonAward[]);
    } catch (error) {
      console.error('Error loading data:', error);
      loadMockData();
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

  const defaultSeason = seasons.length > 0 ? seasons[0] : mockSeason;

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
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="px-4 py-2 border border-gray-300 rounded-xl bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all"
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
        {players.length === 0 ? (
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

            {viewMode === 'single' && players.length > 0 && (
              <div className="h-[calc(100vh-240px)] max-w-4xl mx-auto">
                <PlayerPanel
                  player={players[0]}
                  allStats={player1Stats}
                  awards={player1Awards}
                  seasons={seasons}
                  defaultSeason={defaultSeason}
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
                      defaultSeason={defaultSeason}
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
                  season={defaultSeason}
                  playerStats={[...player1Stats, ...player2Stats]}
                  playerTeamName={players[0]?.team?.name}
                />
              </div>
            )}

            {/* Playoff tree (shown in split view at bottom) */}
            {viewMode === 'split' && (
              <PlayoffTree 
                season={defaultSeason}
                playerStats={[...player1Stats, ...player2Stats]}
                playerTeamName={players[0]?.team?.name}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
