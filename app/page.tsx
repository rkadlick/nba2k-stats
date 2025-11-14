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
import SeasonSelector from '@/components/SeasonSelector';
import PlayoffTree from '@/components/PlayoffTree';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([mockSeason]);
  const [selectedSeason, setSelectedSeason] = useState<Season>(mockSeason);
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
        setSelectedSeason(seasonsData[0] as Season);
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

      // Load stats
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('*')
        .eq('season_id', selectedSeason.id);

      const statsWithDetails: PlayerStatsWithDetails[] = (
        statsData || []
      ).map((stat: PlayerStats) => ({
        ...stat,
        opponent_team: teams.find((t) => t.id === stat.opponent_team_id),
      }));
      setAllStats(statsWithDetails);

      // Load awards
      const { data: awardsData } = await supabase
        .from('season_awards')
        .select('*')
        .eq('season_id', selectedSeason.id);

      setAllAwards((awardsData || []) as SeasonAward[]);
    } catch (error) {
      console.error('Error loading data:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  // Filter stats by selected season
  const seasonStats = useMemo(() => {
    return allStats.filter((stat) => stat.season_id === selectedSeason.id);
  }, [allStats, selectedSeason]);

  // Get stats for each player
  const player1Stats = useMemo(() => {
    if (players.length === 0) return [];
    return seasonStats.filter((stat) => stat.player_id === players[0].id);
  }, [seasonStats, players]);

  const player2Stats = useMemo(() => {
    if (players.length < 2) return [];
    return seasonStats.filter((stat) => stat.player_id === players[1].id);
  }, [seasonStats, players]);

  // Get awards for each player
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const seasonYear = `${selectedSeason.year_start}–${selectedSeason.year_end}`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">2KCompare</h1>
              <SeasonSelector
                seasons={seasons}
                selectedSeason={selectedSeason}
                onSelectSeason={setSelectedSeason}
              />
            </div>

            <div className="flex items-center gap-4">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="single">Single</option>
                <option value="split">Split</option>
                <option value="combined">Combined</option>
              </select>

              {currentUser && (
                <div className="text-sm text-gray-600">
                  {currentUser.display_name}
                </div>
              )}

              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="text-center py-12">
            <p className="text-gray-600">No players found. Please add players to your database.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Player panels */}
            {viewMode === 'split' && players.length >= 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-[calc(100vh-200px)]">
                  <PlayerPanel
                    player={players[0]}
                    stats={player1Stats}
                    awards={player1Awards}
                    seasonYear={seasonYear}
                  />
                </div>
                <div className="h-[calc(100vh-200px)]">
                  <PlayerPanel
                    player={players[1]}
                    stats={player2Stats}
                    awards={player2Awards}
                    seasonYear={seasonYear}
                  />
                </div>
              </div>
            )}

            {viewMode === 'single' && players.length > 0 && (
              <div className="h-[calc(100vh-200px)]">
                <PlayerPanel
                  player={players[0]}
                  stats={player1Stats}
                  awards={player1Awards}
                  seasonYear={seasonYear}
                />
              </div>
            )}

            {viewMode === 'combined' && players.length >= 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-[600px]">
                    <PlayerPanel
                      player={players[0]}
                      stats={player1Stats}
                      awards={player1Awards}
                      seasonYear={seasonYear}
                    />
                  </div>
                  <div className="h-[600px]">
                    <PlayerPanel
                      player={players[1]}
                      stats={player2Stats}
                      awards={player2Awards}
                      seasonYear={seasonYear}
                    />
                  </div>
                </div>
                <PlayoffTree season={selectedSeason} />
              </div>
            )}

            {/* Playoff tree (shown in split view at bottom) */}
            {viewMode === 'split' && (
              <PlayoffTree season={selectedSeason} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
