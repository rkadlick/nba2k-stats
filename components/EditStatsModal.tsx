'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Player, 
  Season, 
  SeasonTotals, 
  PlayerGameStats, 
  Award, 
  Team,
  User,
  PlayerGameStatsWithDetails,
  PlayoffSeries
} from '@/lib/types';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';
import { logger } from '@/lib/logger';
import { useToast } from './ToastProvider';
import AddGameModal from './AddGameModal';

interface EditStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  seasons: Season[];
  teams: Team[];
  allStats: PlayerGameStatsWithDetails[];
  currentUser: User | null;
  onStatsUpdated: () => void;
}

type TabType = 'games' | 'seasonTotals' | 'awards' | 'careerHighs' | 'playoffTree';

export default function EditStatsModal({
  isOpen,
  onClose,
  players,
  seasons,
  teams,
  allStats,
  currentUser,
  onStatsUpdated,
}: EditStatsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('games');
  const [currentUserPlayer, setCurrentUserPlayer] = useState<Player | null>(null);
  const { success, error: showError, warning, info } = useToast();
  
  // Games tab state
  const [selectedSeasonForGames, setSelectedSeasonForGames] = useState<string>(seasons[0]?.id || '');
  const [seasonGames, setSeasonGames] = useState<PlayerGameStatsWithDetails[]>([]);
  const [editingGame, setEditingGame] = useState<PlayerGameStatsWithDetails | null>(null);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  
  // Season Totals tab state
  const [selectedSeasonForTotals, setSelectedSeasonForTotals] = useState<string>(seasons[0]?.id || '');
  const [seasonTotals, setSeasonTotals] = useState<SeasonTotals | null>(null);
  const [hasGamesInSeason, setHasGamesInSeason] = useState(false);
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [showAddSeasonForm, setShowAddSeasonForm] = useState(false);
  const [newSeasonData, setNewSeasonData] = useState({ year_start: new Date().getFullYear(), year_end: new Date().getFullYear() + 1 });
  const [creatingSeason, setCreatingSeason] = useState(false);
  const [totalsFormData, setTotalsFormData] = useState({
    games_played: 0,
    games_started: 0,
    total_points: 0,
    total_rebounds: 0,
    total_assists: 0,
    total_steals: 0,
    total_blocks: 0,
    total_turnovers: 0,
    total_minutes: 0,
    total_fouls: 0,
    total_plus_minus: 0,
    total_fg_made: 0,
    total_fg_attempted: 0,
    total_threes_made: 0,
    total_threes_attempted: 0,
    total_ft_made: 0,
    total_ft_attempted: 0,
    double_doubles: 0,
    triple_doubles: 0,
    // Per-game averages
    avg_points: undefined as number | undefined,
    avg_rebounds: undefined as number | undefined,
    avg_assists: undefined as number | undefined,
    avg_steals: undefined as number | undefined,
    avg_blocks: undefined as number | undefined,
    avg_turnovers: undefined as number | undefined,
    avg_minutes: undefined as number | undefined,
    avg_fouls: undefined as number | undefined,
    avg_plus_minus: undefined as number | undefined,
  });

  // Awards tab state
  const [selectedSeasonForAwards, setSelectedSeasonForAwards] = useState<string>(seasons[0]?.id || '');
  const [awards, setAwards] = useState<Award[]>([]);
  const [awardFormData, setAwardFormData] = useState({
    award_name: '',
    winner_player_name: '',
    winner_team_id: '',
  });
  
  // Career Highs tab state
  const [careerHighs, setCareerHighs] = useState<Record<string, number | string>>({});
  
  // Playoff Tree tab state
  const [selectedSeasonForPlayoffs, setSelectedSeasonForPlayoffs] = useState<string>(seasons[0]?.id || '');
  const [playoffSeries, setPlayoffSeries] = useState<PlayoffSeries[]>([]);
  const [loadingPlayoffs, setLoadingPlayoffs] = useState(false);
  const [editingSeries, setEditingSeries] = useState<PlayoffSeries | null>(null);

  useEffect(() => {
    if (currentUser) {
      const player = players.find(p => p.user_id === currentUser.id);
      setCurrentUserPlayer(player || null);
    }
  }, [currentUser, players]);
  
  // Initialize selected seasons when seasons prop changes
  useEffect(() => {
    if (seasons.length > 0 && seasons[0]) {
      if (!selectedSeasonForGames) {
        setSelectedSeasonForGames(seasons[0].id);
      }
      if (!selectedSeasonForTotals) {
        setSelectedSeasonForTotals(seasons[0].id);
      }
      if (!selectedSeasonForAwards) {
        setSelectedSeasonForAwards(seasons[0].id);
      }
      if (!selectedSeasonForPlayoffs) {
        setSelectedSeasonForPlayoffs(seasons[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasons]);
  
  // Load playoff series for selected season
  useEffect(() => {
    if (selectedSeasonForPlayoffs) {
      loadPlayoffSeries();
    }
  }, [selectedSeasonForPlayoffs]);
  
  // Load games for selected season
  useEffect(() => {
    if (selectedSeasonForGames && currentUserPlayer) {
      const games = allStats.filter(
        stat => stat.player_id === currentUserPlayer.id && stat.season_id === selectedSeasonForGames
      );
      setSeasonGames(games.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()));
    }
  }, [selectedSeasonForGames, currentUserPlayer, allStats]);
  
  // Load season totals and check for games
  useEffect(() => {
    if (selectedSeasonForTotals && currentUserPlayer) {
      loadSeasonTotals();
      checkForGames();
    }
  }, [selectedSeasonForTotals, currentUserPlayer]);
  
  // Load awards for selected season
  useEffect(() => {
    if (selectedSeasonForAwards) {
      loadAwards();
    }
  }, [selectedSeasonForAwards]);
  
  // Load career highs
  useEffect(() => {
    if (currentUserPlayer && currentUserPlayer.career_highs) {
      setCareerHighs(currentUserPlayer.career_highs);
    }
  }, [currentUserPlayer]);
  
  const checkForGames = () => {
    if (!currentUserPlayer || !selectedSeasonForTotals) return;
    const hasGames = allStats.some(
      stat => stat.player_id === currentUserPlayer.id && stat.season_id === selectedSeasonForTotals
    );
    setHasGamesInSeason(hasGames);
  };

  const loadSeasonTotals = async () => {
    if (!currentUserPlayer || !selectedSeasonForTotals || !supabase) return;

    setLoadingTotals(true);
    try {
      const { data, error } = await supabase
        .from('season_totals')
        .select('*')
        .eq('player_id', currentUserPlayer.id)
        .eq('season_id', selectedSeasonForTotals)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error loading season totals:', error);
      }

      if (data) {
        setSeasonTotals(data);
        setTotalsFormData({
          games_played: data.games_played || 0,
          games_started: data.games_started || 0,
          total_points: data.total_points || 0,
          total_rebounds: data.total_rebounds || 0,
          total_assists: data.total_assists || 0,
          total_steals: data.total_steals || 0,
          total_blocks: data.total_blocks || 0,
          total_turnovers: data.total_turnovers || 0,
          total_minutes: data.total_minutes || 0,
          total_fouls: data.total_fouls || 0,
          total_plus_minus: data.total_plus_minus || 0,
          total_fg_made: data.total_fg_made || 0,
          total_fg_attempted: data.total_fg_attempted || 0,
          total_threes_made: data.total_threes_made || 0,
          total_threes_attempted: data.total_threes_attempted || 0,
          total_ft_made: data.total_ft_made || 0,
          total_ft_attempted: data.total_ft_attempted || 0,
          double_doubles: data.double_doubles || 0,
          triple_doubles: data.triple_doubles || 0,
          // Per-game averages
          avg_points: data.avg_points !== null && data.avg_points !== undefined ? Number(data.avg_points) : undefined,
          avg_rebounds: data.avg_rebounds !== null && data.avg_rebounds !== undefined ? Number(data.avg_rebounds) : undefined,
          avg_assists: data.avg_assists !== null && data.avg_assists !== undefined ? Number(data.avg_assists) : undefined,
          avg_steals: data.avg_steals !== null && data.avg_steals !== undefined ? Number(data.avg_steals) : undefined,
          avg_blocks: data.avg_blocks !== null && data.avg_blocks !== undefined ? Number(data.avg_blocks) : undefined,
          avg_turnovers: data.avg_turnovers !== null && data.avg_turnovers !== undefined ? Number(data.avg_turnovers) : undefined,
          avg_minutes: data.avg_minutes !== null && data.avg_minutes !== undefined ? Number(data.avg_minutes) : undefined,
          avg_fouls: data.avg_fouls !== null && data.avg_fouls !== undefined ? Number(data.avg_fouls) : undefined,
          avg_plus_minus: data.avg_plus_minus !== null && data.avg_plus_minus !== undefined ? Number(data.avg_plus_minus) : undefined,
        });
      } else {
        setSeasonTotals(null);
        setTotalsFormData({
          games_played: 0,
          games_started: 0,
          total_points: 0,
          total_rebounds: 0,
          total_assists: 0,
          total_steals: 0,
          total_blocks: 0,
          total_turnovers: 0,
          total_minutes: 0,
          total_fouls: 0,
          total_plus_minus: 0,
          total_fg_made: 0,
          total_fg_attempted: 0,
          total_threes_made: 0,
          total_threes_attempted: 0,
          total_ft_made: 0,
          total_ft_attempted: 0,
          double_doubles: 0,
          triple_doubles: 0,
          // Per-game averages
          avg_points: undefined,
          avg_rebounds: undefined,
          avg_assists: undefined,
          avg_steals: undefined,
          avg_blocks: undefined,
          avg_turnovers: undefined,
          avg_minutes: undefined,
          avg_fouls: undefined,
          avg_plus_minus: undefined,
        });
      }
    } catch (error) {
      logger.error('Error loading season totals:', error);
    } finally {
      setLoadingTotals(false);
    }
  };

  const loadAwards = async () => {
    if (!selectedSeasonForAwards || !supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .eq('season_id', selectedSeasonForAwards)
        .order('award_name');
      
      if (error) {
        logger.error('Error loading awards:', error);
      } else {
        setAwards(data || []);
      }
    } catch (error) {
      logger.error('Error loading awards:', error);
    }
  };
  
  const loadPlayoffSeries = async () => {
    if (!selectedSeasonForPlayoffs || !supabase) return;
    
    setLoadingPlayoffs(true);
    try {
      const { data, error } = await supabase
        .from('playoff_series')
        .select('*')
        .eq('season_id', selectedSeasonForPlayoffs)
        .order('round_number', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) {
        logger.error('Error loading playoff series:', error);
      } else {
        setPlayoffSeries((data || []) as PlayoffSeries[]);
      }
    } catch (error) {
      logger.error('Error loading playoff series:', error);
    } finally {
      setLoadingPlayoffs(false);
    }
  };
  
  const handleSavePlayoffSeries = async (series: PlayoffSeries) => {
    if (!selectedSeasonForPlayoffs || !supabase) return;
    
    try {
      const seriesData: any = {
        id: series.id,
        season_id: selectedSeasonForPlayoffs,
        round_name: series.round_name,
        round_number: series.round_number,
        team1_id: series.team1_id || null,
        team1_name: series.team1_name || null,
        team2_id: series.team2_id || null,
        team2_name: series.team2_name || null,
        team1_wins: series.team1_wins || 0,
        team2_wins: series.team2_wins || 0,
        winner_team_id: series.winner_team_id || null,
        winner_team_name: series.winner_team_name || null,
        is_complete: series.is_complete || false,
      };
      
      // Check if series exists
      const existing = playoffSeries.find(s => s.id === series.id);
      
      if (existing) {
        const { error } = await supabase
          .from('playoff_series')
          .update(seriesData)
          .eq('id', series.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('playoff_series')
          .insert([seriesData]);
        
        if (error) throw error;
      }
      
      await loadPlayoffSeries();
      onStatsUpdated();
      success('Playoff series saved successfully');
    } catch (error: any) {
      logger.error('Error saving playoff series:', error);
      showError('Failed to save playoff series: ' + (error.message || 'Unknown error'));
    }
  };
  
  const handleDeletePlayoffSeries = async (seriesId: string) => {
    if (!confirm('Are you sure you want to delete this playoff series?') || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('playoff_series')
        .delete()
        .eq('id', seriesId);
      
      if (error) throw error;
      
      await loadPlayoffSeries();
      onStatsUpdated();
      success('Playoff series deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting playoff series:', error);
      showError('Failed to delete playoff series: ' + (error.message || 'Unknown error'));
    }
  };
  
  const handleCreatePlayoffSeries = () => {
    const newSeries: PlayoffSeries = {
      id: `series-${selectedSeasonForPlayoffs}-${Date.now()}`,
      season_id: selectedSeasonForPlayoffs,
      round_name: 'Round 1',
      round_number: 1,
      team1_wins: 0,
      team2_wins: 0,
      is_complete: false,
    };
    setEditingSeries(newSeries);
  };
  
  const handleEditGame = (game: PlayerGameStatsWithDetails) => {
    setEditingGame(game);
    setShowAddGameModal(true);
  };
  
  const handleSaveSeasonTotals = async () => {
    if (!currentUserPlayer || !selectedSeasonForTotals || !supabase) return;
    if (hasGamesInSeason) {
      warning('Cannot manually edit season totals when games exist for this season. Totals are calculated from games.');
      return;
    }

    try {
      // Filter out undefined values for per-game averages (convert to null for database)
      const totalsData: any = {
        player_id: currentUserPlayer.id,
        season_id: selectedSeasonForTotals,
        is_manual_entry: true,
        ...totalsFormData,
        // Convert undefined to null for per-game averages
        avg_points: totalsFormData.avg_points ?? null,
        avg_rebounds: totalsFormData.avg_rebounds ?? null,
        avg_assists: totalsFormData.avg_assists ?? null,
        avg_steals: totalsFormData.avg_steals ?? null,
        avg_blocks: totalsFormData.avg_blocks ?? null,
        avg_turnovers: totalsFormData.avg_turnovers ?? null,
        avg_minutes: totalsFormData.avg_minutes ?? null,
        avg_fouls: totalsFormData.avg_fouls ?? null,
        avg_plus_minus: totalsFormData.avg_plus_minus ?? null,
      };

      if (seasonTotals) {
        const { error } = await supabase
          .from('season_totals')
          .update(totalsData)
          .eq('id', seasonTotals.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('season_totals')
          .insert([totalsData]);

        if (error) throw error;
      }

      onStatsUpdated();
      success('Season totals saved successfully!');
    } catch (error: any) {
      logger.error('Error saving season totals:', error);
      showError('Failed to save season totals: ' + (error.message || 'Unknown error'));
    }
  };
  
  const handleAddAward = async () => {
    if (!selectedSeasonForAwards || !awardFormData.award_name || !supabase) {
      if (!awardFormData.award_name) {
        warning('Please enter an award name');
      }
      return;
    }
    
    try {
      const awardData: any = {
        season_id: selectedSeasonForAwards,
        award_name: awardFormData.award_name,
        winner_player_name: awardFormData.winner_player_name || null,
        winner_team_id: awardFormData.winner_team_id || null,
        is_league_award: true,
      };
      
      const { error } = await supabase
        .from('awards')
        .insert([awardData]);
      
      if (error) throw error;
      
      setAwardFormData({
        award_name: '',
        winner_player_name: '',
        winner_team_id: '',
      });
      loadAwards();
      onStatsUpdated();
      success('Award added successfully');
    } catch (error: any) {
      logger.error('Error adding award:', error);
      showError('Failed to add award: ' + (error.message || 'Unknown error'));
    }
  };
  
  const handleUpdateAward = async (award: Award) => {
    if (!supabase) return;
    
    try {
      const updateData: any = {
        winner_player_name: award.winner_player_name || null,
        winner_team_id: award.winner_team_id || null,
      };
      
      const { error } = await supabase
        .from('awards')
        .update(updateData)
        .eq('id', award.id);
      
      if (error) throw error;
      
      loadAwards();
      onStatsUpdated();
      success('Award updated successfully');
    } catch (error: any) {
      logger.error('Error updating award:', error);
      showError('Failed to update award: ' + (error.message || 'Unknown error'));
    }
  };
  
  const handleSaveCareerHighs = async () => {
    if (!currentUserPlayer || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('players')
        .update({ career_highs: careerHighs })
        .eq('id', currentUserPlayer.id);
      
      if (error) throw error;
      
      onStatsUpdated();
      success('Career highs saved successfully!');
    } catch (error) {
      logger.error('Error saving career highs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save career highs';
      showError('Failed to save career highs: ' + errorMessage);
    }
  };
  
  const handleCreateSeason = async () => {
    if (!newSeasonData.year_start || !supabase) {
      if (!newSeasonData.year_start) {
        warning('Please enter a start year');
      }
      return;
    }
    
    // Ensure end year is exactly one year after start year
    const endYear = newSeasonData.year_start + 1;
    
    setCreatingSeason(true);
    try {
      const seasonId = `season-${newSeasonData.year_start}-${endYear}`;
      
      const { error } = await supabase
        .from('seasons')
        .insert([{
          id: seasonId,
          year_start: newSeasonData.year_start,
          year_end: endYear,
        }]);
      
      if (error) {
        // Check if season already exists
        if (error.code === '23505') {
          warning('This season already exists!');
        } else {
          throw error;
        }
      } else {
        // Refresh data and select the new season
        setSelectedSeasonForTotals(seasonId);
        setShowAddSeasonForm(false);
        setNewSeasonData({ year_start: endYear, year_end: endYear + 1 });
        onStatsUpdated(); // This will reload seasons from parent
        success('Season created successfully!');
      }
    } catch (error) {
      logger.error('Error creating season:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create season';
      showError('Failed to create season: ' + errorMessage);
    } finally {
      setCreatingSeason(false);
    }
  };

  if (!isOpen) return null;
  
  const tabs: { id: TabType; label: string }[] = [
    { id: 'games', label: 'Games' },
    { id: 'seasonTotals', label: 'Season Totals' },
    { id: 'awards', label: 'League Awards' },
    { id: 'careerHighs', label: 'Career Highs' },
    { id: 'playoffTree', label: 'Playoff Tree' },
  ];

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Edit Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'games' && (
              <div className="space-y-4">
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Season
              </label>
              <select
                    value={selectedSeasonForGames}
                    onChange={(e) => setSelectedSeasonForGames(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold"
                  >
                    {seasons.map(season => (
                      <option key={season.id} value={season.id}>
                        {season.year_start}–{season.year_end}
                  </option>
                ))}
              </select>
            </div>

                {seasonGames.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Games ({seasonGames.length})
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700">Date</th>
                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-700">Opp</th>
                            <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-700">Score</th>
                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">PTS</th>
                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">REB</th>
                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">AST</th>
                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">STL</th>
                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">BLK</th>
                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">TO</th>
                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">MIN</th>
                            <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {seasonGames.map(game => (
                            <tr key={game.id} className="hover:bg-gray-50">
                              <td className="px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap">
                                {new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-2 py-1.5 text-xs text-gray-900">
                                {getTeamAbbreviation(game.opponent_team?.name || game.opponent_team_name)}
                              </td>
                              <td className="px-2 py-1.5 text-xs text-gray-900 text-center">
                                <span className={`px-1 py-0.5 rounded text-[10px] font-semibold ${
                                  game.is_win ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {game.is_win ? 'W' : 'L'}
                                </span>
                                <span className="ml-1">{game.player_score}-{game.opponent_score}</span>
                              </td>
                              <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.points || '-'}</td>
                              <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.rebounds || '-'}</td>
                              <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.assists || '-'}</td>
                              <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.steals || '-'}</td>
                              <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.blocks || '-'}</td>
                              <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.turnovers || '-'}</td>
                              <td className="px-2 py-1.5 text-xs text-gray-900 text-right">{game.minutes || '-'}</td>
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  onClick={() => handleEditGame(game)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 hover:bg-blue-50 rounded"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No games found for this season.
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'seasonTotals' && (
              <div className="space-y-4">
            <div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Season
              </label>
              <select
                        value={selectedSeasonForTotals}
                        onChange={(e) => setSelectedSeasonForTotals(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold"
              >
                {seasons.map(season => (
                          <option key={season.id} value={season.id}>
                    {season.year_start}–{season.year_end}
                  </option>
                ))}
              </select>
            </div>
                    <button
                      type="button"
                      onClick={() => setShowAddSeasonForm(!showAddSeasonForm)}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      {showAddSeasonForm ? 'Cancel' : '+ Add Season'}
                    </button>
                  </div>
                  
                  {showAddSeasonForm && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Create New Season</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Start Year *
                          </label>
                          <input
                            type="number"
                            value={newSeasonData.year_start}
                            onChange={(e) => {
                              const startYear = parseInt(e.target.value) || new Date().getFullYear();
                              setNewSeasonData({
                                year_start: startYear,
                                year_end: startYear + 1,
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                            min="2000"
                            max="2100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            End Year (auto-calculated)
                          </label>
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-semibold">
                            {newSeasonData.year_start + 1}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Seasons must be exactly one year apart
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleCreateSeason}
                          disabled={creatingSeason}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creatingSeason ? 'Creating...' : `Create Season ${newSeasonData.year_start}–${newSeasonData.year_start + 1}`}
                        </button>
                      </div>
                    </div>
                  )}
          </div>

          {loadingTotals ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                  </div>
                ) : hasGamesInSeason ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      This season has games recorded. Season totals are calculated from games and cannot be manually edited.
                    </p>
            </div>
          ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Games Played</label>
                    <input
                      type="number"
                          value={totalsFormData.games_played}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, games_played: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Games Started</label>
                    <input
                      type="number"
                          value={totalsFormData.games_started}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, games_started: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input
                      type="number"
                          value={totalsFormData.total_points}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_points: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rebounds</label>
                    <input
                      type="number"
                          value={totalsFormData.total_rebounds}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_rebounds: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assists</label>
                    <input
                      type="number"
                          value={totalsFormData.total_assists}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_assists: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Steals</label>
                    <input
                      type="number"
                          value={totalsFormData.total_steals}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_steals: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blocks</label>
                    <input
                      type="number"
                          value={totalsFormData.total_blocks}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_blocks: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turnovers</label>
                    <input
                      type="number"
                          value={totalsFormData.total_turnovers}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_turnovers: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                    <input
                      type="number"
                      step="0.1"
                          value={totalsFormData.total_minutes}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_minutes: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fouls</label>
                    <input
                      type="number"
                          value={totalsFormData.total_fouls}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_fouls: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">+/-</label>
                    <input
                      type="number"
                          value={totalsFormData.total_plus_minus}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_plus_minus: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FG Made</label>
                    <input
                      type="number"
                          value={totalsFormData.total_fg_made}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_fg_made: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FG Attempted</label>
                    <input
                      type="number"
                          value={totalsFormData.total_fg_attempted}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_fg_attempted: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3PT Made</label>
                    <input
                      type="number"
                          value={totalsFormData.total_threes_made}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_threes_made: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3PT Attempted</label>
                    <input
                      type="number"
                          value={totalsFormData.total_threes_attempted}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_threes_attempted: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FT Made</label>
                    <input
                      type="number"
                          value={totalsFormData.total_ft_made}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_ft_made: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">FT Attempted</label>
                    <input
                      type="number"
                          value={totalsFormData.total_ft_attempted}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, total_ft_attempted: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Double-Doubles</label>
                    <input
                      type="number"
                          value={totalsFormData.double_doubles}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, double_doubles: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Triple-Doubles</label>
                    <input
                      type="number"
                          value={totalsFormData.triple_doubles}
                          onChange={(e) => setTotalsFormData(prev => ({ ...prev, triple_doubles: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      min="0"
                    />
                  </div>
                </div>
                
                {/* Per-Game Averages Section */}
                <div className="border-t border-gray-300 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Per-Game Averages</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_points ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_points: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rebounds Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_rebounds ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_rebounds: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assists Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_assists ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_assists: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Steals Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_steals ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_steals: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blocks Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_blocks ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_blocks: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Turnovers Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_turnovers ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_turnovers: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minutes Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_minutes ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_minutes: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fouls Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_fouls ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_fouls: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">+/- Per Game</label>
                      <input
                        type="number"
                        step="0.1"
                        value={totalsFormData.avg_plus_minus ?? ''}
                        onChange={(e) => setTotalsFormData(prev => ({ ...prev, avg_plus_minus: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleSaveSeasonTotals}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Save Season Totals
                      </button>
              </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'awards' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Season
                  </label>
                  <select
                    value={selectedSeasonForAwards}
                    onChange={(e) => setSelectedSeasonForAwards(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold"
                  >
                    {seasons.map(season => (
                      <option key={season.id} value={season.id}>
                        {season.year_start}–{season.year_end}
                      </option>
                    ))}
                  </select>
                </div>
                
              <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Award</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Award Name *</label>
                      <input
                        type="text"
                        value={awardFormData.award_name}
                        onChange={(e) => setAwardFormData(prev => ({ ...prev, award_name: e.target.value }))}
                        placeholder="e.g., MVP, Finals MVP, DPOY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Winner Player Name</label>
                      <input
                        type="text"
                        value={awardFormData.winner_player_name}
                        onChange={(e) => setAwardFormData(prev => ({ ...prev, winner_player_name: e.target.value }))}
                        placeholder="Player name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Winner Team</label>
                      <select
                        value={awardFormData.winner_team_id}
                        onChange={(e) => setAwardFormData(prev => ({ ...prev, winner_team_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                      >
                        <option value="">Select team...</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleAddAward}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Add Award
                    </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Awards</h3>
                  {awards.length > 0 ? (
                    <div className="space-y-2">
                      {awards.map(award => (
                        <div key={award.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{award.award_name}</h4>
                  </div>
                          <div className="grid grid-cols-2 gap-4">
                  <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Winner Player</label>
                    <input
                                type="text"
                                value={award.winner_player_name || ''}
                                onChange={(e) => {
                                  const updated = { ...award, winner_player_name: e.target.value };
                                  handleUpdateAward(updated);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Winner Team</label>
                              <select
                                value={award.winner_team_id || ''}
                                onChange={(e) => {
                                  const updated = { ...award, winner_team_id: e.target.value };
                                  handleUpdateAward(updated);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                              >
                                <option value="">Select team...</option>
                                {teams.map(team => (
                                  <option key={team.id} value={team.id}>
                                    {team.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No awards found for this season.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'careerHighs' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Enter career highs manually. These can override calculated values from game statistics.
                  </p>
              </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'points', label: 'Points' },
                    { key: 'rebounds', label: 'Rebounds' },
                    { key: 'assists', label: 'Assists' },
                    { key: 'steals', label: 'Steals' },
                    { key: 'blocks', label: 'Blocks' },
                    { key: 'minutes', label: 'Minutes' },
                    { key: 'fg_made', label: 'Field Goals Made' },
                    { key: 'threes_made', label: 'Three-Pointers Made' },
                    { key: 'ft_made', label: 'Free Throws Made' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type="number"
                        value={(careerHighs[key] as number) || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          setCareerHighs(prev => ({
                            ...prev,
                            [key]: value !== undefined ? value : '',
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                        min="0"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
            <button
                    onClick={handleSaveCareerHighs}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Save Career Highs
            </button>
              </div>
      </div>
            )}
            
            {activeTab === 'playoffTree' && (
              <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Season
                  </label>
                  <select
                    value={selectedSeasonForPlayoffs}
                    onChange={(e) => setSelectedSeasonForPlayoffs(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold"
                  >
                    {seasons.map(season => (
                      <option key={season.id} value={season.id}>
                        {season.year_start}–{season.year_end}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingPlayoffs ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                    Loading playoff tree...
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Playoff Series</h3>
                      <button
                        onClick={handleCreatePlayoffSeries}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                      >
                        + Add Series
                      </button>
                    </div>

                    {/* Group series by round */}
                    {(() => {
                      const rounds = ['Play-In Tournament', 'Round 1', 'Conference Semifinals', 'Conference Finals', 'NBA Finals'];
                      const seriesByRound = rounds.map(round => ({
                        round,
                        series: playoffSeries.filter(s => s.round_name === round),
                      }));

                      return seriesByRound.map(({ round, series }) => {
                        if (series.length === 0 && !editingSeries) return null;
                        
                        return (
                          <div key={round} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">{round}</h4>
                            <div className="space-y-3">
                              {series.map(s => (
                                <div key={s.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Team 1</label>
                                        <select
                                          value={s.team1_id || ''}
                                          onChange={(e) => {
                                            const updated = { ...s, team1_id: e.target.value || undefined, team1_name: e.target.value ? teams.find(t => t.id === e.target.value)?.name : undefined };
                                            handleSavePlayoffSeries(updated);
                                          }}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        >
                                          <option value="">Select team...</option>
                                          {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                          ))}
                                        </select>
                    <input
                      type="number"
                                          min="1"
                                          max="10"
                                          placeholder="Seed (1-10)"
                                          value={s.team1_seed || ''}
                                          onChange={(e) => {
                                            const updated = { ...s, team1_seed: e.target.value ? parseInt(e.target.value) : undefined };
                                            handleSavePlayoffSeries(updated);
                                          }}
                                          className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Team 2</label>
                                        <select
                                          value={s.team2_id || ''}
                                          onChange={(e) => {
                                            const updated = { ...s, team2_id: e.target.value || undefined, team2_name: e.target.value ? teams.find(t => t.id === e.target.value)?.name : undefined };
                                            handleSavePlayoffSeries(updated);
                                          }}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        >
                                          <option value="">Select team...</option>
                                          {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                          ))}
                                        </select>
                    <input
                      type="number"
                                          min="1"
                                          max="10"
                                          placeholder="Seed (1-10)"
                                          value={s.team2_seed || ''}
                                          onChange={(e) => {
                                            const updated = { ...s, team2_seed: e.target.value ? parseInt(e.target.value) : undefined };
                                            handleSavePlayoffSeries(updated);
                                          }}
                                          className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                                    </div>
                                    <button
                                      onClick={() => handleDeletePlayoffSeries(s.id)}
                                      className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2 mt-2">
                  <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Round</label>
                                      <select
                                        value={s.round_name}
                                        onChange={(e) => {
                                          const roundNumbers: Record<string, number> = {
                                            'Play-In Tournament': 0,
                                            'Round 1': 1,
                                            'Conference Semifinals': 2,
                                            'Conference Finals': 3,
                                            'NBA Finals': 4,
                                          };
                                          const updated = { ...s, round_name: e.target.value, round_number: roundNumbers[e.target.value] || 1 };
                                          handleSavePlayoffSeries(updated);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      >
                                        <option value="Play-In Tournament">Play-In Tournament</option>
                                        <option value="Round 1">Round 1</option>
                                        <option value="Conference Semifinals">Conference Semifinals</option>
                                        <option value="Conference Finals">Conference Finals</option>
                                        <option value="NBA Finals">NBA Finals</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Team 1 Wins</label>
                    <input
                      type="number"
                                        min="0"
                                        max="7"
                                        value={s.team1_wins || 0}
                                        onChange={(e) => {
                                          const updated = { ...s, team1_wins: parseInt(e.target.value) || 0 };
                                          handleSavePlayoffSeries(updated);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Team 2 Wins</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="7"
                                        value={s.team2_wins || 0}
                                        onChange={(e) => {
                                          const updated = { ...s, team2_wins: parseInt(e.target.value) || 0 };
                                          handleSavePlayoffSeries(updated);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      />
                </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Winner</label>
                                      <select
                                        value={s.winner_team_id || ''}
                                        onChange={(e) => {
                                          const updated = { 
                                            ...s, 
                                            winner_team_id: e.target.value || undefined,
                                            winner_team_name: e.target.value ? teams.find(t => t.id === e.target.value)?.name : undefined,
                                            is_complete: !!e.target.value,
                                          };
                                          handleSavePlayoffSeries(updated);
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      >
                                        <option value="">No winner yet</option>
                                        {s.team1_id && (
                                          <option value={s.team1_id}>{teams.find(t => t.id === s.team1_id)?.name || s.team1_name}</option>
                                        )}
                                        {s.team2_id && (
                                          <option value={s.team2_id}>{teams.find(t => t.id === s.team2_id)?.name || s.team2_name}</option>
                                        )}
                                      </select>
              </div>
                                  </div>
                                  
                                  {/* Show player games if their team is in this series */}
                                  {currentUserPlayer && currentUserPlayer.team_id && (
                                    (s.team1_id === currentUserPlayer.team_id || s.team2_id === currentUserPlayer.team_id) && (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="text-xs font-medium text-gray-700 mb-2">Player Games in This Series:</div>
                                        {(() => {
                                          const playerTeam = teams.find(t => t.id === currentUserPlayer.team_id);
                                          const opponentTeamId = s.team1_id === currentUserPlayer.team_id ? s.team2_id : s.team1_id;
                                          const opponentTeam = opponentTeamId ? teams.find(t => t.id === opponentTeamId) : null;
                                          
                                          const seriesGames = allStats.filter(game => 
                                            game.player_id === currentUserPlayer.id &&
                                            game.season_id === selectedSeasonForPlayoffs &&
                                            game.is_playoff_game &&
                                            (game.opponent_team?.id === opponentTeamId || game.opponent_team_name === opponentTeam?.name)
                                          );
                                          
                                          return seriesGames.length > 0 ? (
                                            <div className="space-y-1">
                                              {seriesGames.map(game => (
                                                <div key={game.id} className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                                                  {new Date(game.game_date).toLocaleDateString()} - 
                                                  {game.is_home ? ' vs ' : ' @ '}
                                                  {getTeamAbbreviation(game.opponent_team?.name || game.opponent_team_name || '')} - 
                                                  {game.points || 0} PTS, {game.rebounds || 0} REB, {game.assists || 0} AST
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-gray-500 italic">No games recorded for this series yet</div>
                                          );
                                        })()}
                                      </div>
                                    )
                                  )}
                                </div>
                              ))}
                              
                              {/* Show editing form for new series */}
                              {editingSeries && editingSeries.round_name === round && (
                                <div className="border-2 border-blue-300 rounded p-3 bg-blue-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-semibold text-gray-900">New Series</h5>
            <button
                                      onClick={() => setEditingSeries(null)}
                                      className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 mb-2">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Team 1</label>
                                      <select
                                        value={editingSeries.team1_id || ''}
                                        onChange={(e) => setEditingSeries({ ...editingSeries, team1_id: e.target.value || undefined, team1_name: e.target.value ? teams.find(t => t.id === e.target.value)?.name : undefined })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      >
                                        <option value="">Select team...</option>
                                        {teams.map(team => (
                                          <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                      </select>
                                      <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        placeholder="Seed (1-10)"
                                        value={editingSeries.team1_seed || ''}
                                        onChange={(e) => setEditingSeries({ ...editingSeries, team1_seed: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Team 2</label>
                                      <select
                                        value={editingSeries.team2_id || ''}
                                        onChange={(e) => setEditingSeries({ ...editingSeries, team2_id: e.target.value || undefined, team2_name: e.target.value ? teams.find(t => t.id === e.target.value)?.name : undefined })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      >
                                        <option value="">Select team...</option>
                                        {teams.map(team => (
                                          <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                      </select>
                                      <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        placeholder="Seed (1-10)"
                                        value={editingSeries.team2_seed || ''}
                                        onChange={(e) => setEditingSeries({ ...editingSeries, team2_seed: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Round</label>
                                      <select
                                        value={editingSeries.round_name}
                                        onChange={(e) => {
                                          const roundNumbers: Record<string, number> = {
                                            'Play-In Tournament': 0,
                                            'Round 1': 1,
                                            'Conference Semifinals': 2,
                                            'Conference Finals': 3,
                                            'NBA Finals': 4,
                                          };
                                          setEditingSeries({ ...editingSeries, round_name: e.target.value, round_number: roundNumbers[e.target.value] || 1 });
                                        }}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      >
                                        <option value="Play-In Tournament">Play-In Tournament</option>
                                        <option value="Round 1">Round 1</option>
                                        <option value="Conference Semifinals">Conference Semifinals</option>
                                        <option value="Conference Finals">Conference Finals</option>
                                        <option value="NBA Finals">NBA Finals</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Team 1 Wins</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="7"
                                        value={editingSeries.team1_wins || 0}
                                        onChange={(e) => setEditingSeries({ ...editingSeries, team1_wins: parseInt(e.target.value) || 0 })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Team 2 Wins</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="7"
                                        value={editingSeries.team2_wins || 0}
                                        onChange={(e) => setEditingSeries({ ...editingSeries, team2_wins: parseInt(e.target.value) || 0 })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Winner</label>
                                      <select
                                        value={editingSeries.winner_team_id || ''}
                                        onChange={(e) => setEditingSeries({ 
                                          ...editingSeries, 
                                          winner_team_id: e.target.value || undefined,
                                          winner_team_name: e.target.value ? teams.find(t => t.id === e.target.value)?.name : undefined,
                                          is_complete: !!e.target.value,
                                        })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                      >
                                        <option value="">No winner yet</option>
                                        {editingSeries.team1_id && (
                                          <option value={editingSeries.team1_id}>{teams.find(t => t.id === editingSeries.team1_id)?.name || editingSeries.team1_name}</option>
                                        )}
                                        {editingSeries.team2_id && (
                                          <option value={editingSeries.team2_id}>{teams.find(t => t.id === editingSeries.team2_id)?.name || editingSeries.team2_name}</option>
                                        )}
                                      </select>
                                    </div>
                                  </div>
                                  <div className="mt-3">
            <button
                                      onClick={() => {
                                        handleSavePlayoffSeries(editingSeries);
                                        setEditingSeries(null);
                                      }}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                                    >
                                      Save Series
            </button>
          </div>
                                </div>
                              )}
      </div>
    </div>
                        );
                      }).filter(Boolean);
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Game Modal for editing games */}
      {showAddGameModal && (
        <AddGameModal
          isOpen={showAddGameModal}
          onClose={() => {
            setShowAddGameModal(false);
            setEditingGame(null);
            onStatsUpdated();
          }}
          players={players}
          seasons={seasons}
          teams={teams}
          onGameAdded={() => {
            onStatsUpdated();
            setShowAddGameModal(false);
            setEditingGame(null);
          }}
          editingGame={editingGame}
          currentUser={currentUser}
        />
      )}
    </>
  );
}
