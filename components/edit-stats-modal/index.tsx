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
import { logger } from '@/lib/logger';
import { useToast } from '../ToastProvider';
import AddGameModal from '../AddGameModal';
import GamesTab from './GamesTab';
import SeasonTotalsTab from './SeasonTotalsTab';
import AwardsTab from './AwardsTab';
import CareerHighsTab from './CareerHighsTab';
import PlayoffTreeTab from './PlayoffTreeTab';

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
  const { success, error: showError, warning } = useToast();
  
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
  // NOTE: games_started is included here for manual season totals entry.
  // When adding/editing individual GAMES (not season totals), games_started is automatically handled by Supabase.
  // But for manual season totals, users can set games_started manually.
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
  });

  // Calculate per-game averages from totals
  const calculatePerGameAverage = (total: number): number | null => {
    if (totalsFormData.games_played > 0) {
      return Number((total / totalsFormData.games_played).toFixed(1));
    }
    return null;
  };

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
    if (selectedSeasonForPlayoffs && currentUserPlayer) {
      loadPlayoffSeries();
    }
  }, [selectedSeasonForPlayoffs, currentUserPlayer]);
  
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
    if (selectedSeasonForAwards && currentUser && currentUserPlayer) {
      loadAwards();
    }
  }, [selectedSeasonForAwards, currentUser, currentUserPlayer]);
  
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
        });
      }
    } catch (error) {
      logger.error('Error loading season totals:', error);
    } finally {
      setLoadingTotals(false);
    }
  };

  const loadAwards = async () => {
    if (!selectedSeasonForAwards || !supabase || !currentUser || !currentUserPlayer) return;
    
    try {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .eq('season_id', selectedSeasonForAwards)
        .eq('user_id', currentUser.id)
        .or(`player_id.eq.${currentUserPlayer.id},player_id.is.null`)
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
    if (!selectedSeasonForPlayoffs || !supabase || !currentUserPlayer) return;
    
    setLoadingPlayoffs(true);
    try {
      const { data, error } = await supabase
        .from('playoff_series')
        .select('*')
        .eq('season_id', selectedSeasonForPlayoffs)
        .eq('player_id', currentUserPlayer.id)
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
    if (!selectedSeasonForPlayoffs || !supabase || !currentUserPlayer) return;

    console.log('handleSavePlayoffSeries', series);
    
    try {
      const seriesData: any = {
        id: series.id,
        player_id: currentUserPlayer.id,
        season_id: selectedSeasonForPlayoffs,
        round_name: series.round_name,
        round_number: series.round_number,
        team1_id: series.team1_id || null,
        team1_name: series.team1_name || null,
        team1_seed: series.team1_seed || null,
        team2_id: series.team2_id || null,
        team2_name: series.team2_name || null,
        team2_seed: series.team2_seed || null,
        team1_wins: series.team1_wins || 0,
        team2_wins: series.team2_wins || 0,
        winner_team_id: series.winner_team_id || null,
        winner_team_name: series.winner_team_name || null,
        is_complete: series.is_complete || false,
      };
      
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
    if (!confirm('Are you sure you want to delete this playoff series?') || !supabase || !currentUserPlayer) return;
    
    try {
      const { error } = await supabase
        .from('playoff_series')
        .delete()
        .eq('id', seriesId)
        .eq('player_id', currentUserPlayer.id);
      
      if (error) throw error;
      
      await loadPlayoffSeries();
      onStatsUpdated();
      success('Playoff series deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting playoff series:', error);
      showError('Failed to delete playoff series: ' + (error.message || 'Unknown error'));
    }
  };
  
  const handleEditGame = (game: PlayerGameStatsWithDetails) => {
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
      
      // Remove game from local state immediately for UI feedback
      setSeasonGames(prev => prev.filter(game => game.id !== gameId));
      
      onStatsUpdated();
      success('Game deleted successfully');
    } catch (error: any) {
      logger.error('Error deleting game:', error);
      showError('Failed to delete game: ' + (error.message || 'Unknown error'));
    }
  };
  
  const handleSaveSeasonTotals = async () => {
    if (!currentUserPlayer || !selectedSeasonForTotals || !supabase) return;
    if (hasGamesInSeason) {
      warning('Cannot manually edit season totals when games exist for this season. Totals are calculated from games.');
      return;
    }

    try {
      const gamesPlayed = totalsFormData.games_played || 0;
      
      const fgPct = totalsFormData.total_fg_attempted > 0 
        ? Number((totalsFormData.total_fg_made / totalsFormData.total_fg_attempted).toFixed(3))
        : null;
      const ftPct = totalsFormData.total_ft_attempted > 0
        ? Number((totalsFormData.total_ft_made / totalsFormData.total_ft_attempted).toFixed(3))
        : null;
      const threePct = totalsFormData.total_threes_attempted > 0
        ? Number((totalsFormData.total_threes_made / totalsFormData.total_threes_attempted).toFixed(3))
        : null;
      
      // NOTE: For manual season totals, games_started is included and can be set by the user.
      // When adding/editing individual GAMES (not season totals), games_started is automatically handled by Supabase.
      const totalsData: any = {
        player_id: currentUserPlayer.id,
        season_id: selectedSeasonForTotals,
        is_manual_entry: true,
        ...totalsFormData,
        avg_points: gamesPlayed > 0 ? Number((totalsFormData.total_points / gamesPlayed).toFixed(1)) : null,
        avg_rebounds: gamesPlayed > 0 ? Number((totalsFormData.total_rebounds / gamesPlayed).toFixed(1)) : null,
        avg_assists: gamesPlayed > 0 ? Number((totalsFormData.total_assists / gamesPlayed).toFixed(1)) : null,
        avg_steals: gamesPlayed > 0 ? Number((totalsFormData.total_steals / gamesPlayed).toFixed(1)) : null,
        avg_blocks: gamesPlayed > 0 ? Number((totalsFormData.total_blocks / gamesPlayed).toFixed(1)) : null,
        avg_turnovers: gamesPlayed > 0 ? Number((totalsFormData.total_turnovers / gamesPlayed).toFixed(1)) : null,
        avg_minutes: gamesPlayed > 0 ? Number((totalsFormData.total_minutes / gamesPlayed).toFixed(1)) : null,
        avg_fouls: gamesPlayed > 0 ? Number((totalsFormData.total_fouls / gamesPlayed).toFixed(1)) : null,
        avg_plus_minus: gamesPlayed > 0 ? Number((totalsFormData.total_plus_minus / gamesPlayed).toFixed(1)) : null,
        fg_percentage: fgPct,
        ft_percentage: ftPct,
        three_pt_percentage: threePct,
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
  
  
  const handleAddAward = async (newAward?: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
  }) => {
    const data = newAward || awardFormData;
    if (!selectedSeasonForAwards || !data.award_name || !supabase || !currentUser) {
      if (!data.award_name) {
        warning('Please enter an award name');
      }
      return;
    }
  
    try {
      const winnerPlayerName = data.winner_player_name?.trim();
      let winnerPlayerId: string | null = null;
  
      if (winnerPlayerName) {
        const match = players.find(
          (p) => p.player_name.trim().toLowerCase() === winnerPlayerName.toLowerCase()
        );
        winnerPlayerId = match?.id || null;
      }
      console.log('winnerPlayerId', winnerPlayerId);
  
      const insertPayload: any = {
        user_id: currentUser.id,
        player_id: currentUserPlayer?.id || null,
        season_id: selectedSeasonForAwards,
        award_name: data.award_name,
        winner_player_name: winnerPlayerName || null,
        winner_player_id: winnerPlayerId || null,
        winner_team_id: data.winner_team_id || null,
        is_league_award: true,
      };
  
      // **critical line** – ensure no id goes to DB
      delete insertPayload.id;

  
      const { error } = await supabase.from('awards').insert([insertPayload]);
      if (error) throw error;
  
      setAwardFormData({ award_name: '', winner_player_name: '', winner_team_id: '' });
      loadAwards();
      onStatsUpdated();
      success('Award added successfully');
    } catch (err: any) {
      logger.error('Error adding award:', err);
      showError('Failed to add award: ' + (err.message || 'Unknown error'));
    }
  };
  
  const handleUpdateAward = async (award: Award) => {
    console.log('handleUpdateAward', award);
    if (!supabase || !currentUser || !currentUserPlayer) return;
  
    try {
      const winnerPlayerName = award.winner_player_name?.trim();
      let winnerPlayerId: string | null = null;
  
      if (winnerPlayerName) {
        const match = players.find(
          (p) => p.player_name.trim().toLowerCase() === winnerPlayerName.toLowerCase()
        );
        winnerPlayerId = match?.id || null;
      }
  
      const updatePayload: any = {
        id: award.id,
        player_id: currentUserPlayer.id,
        user_id: currentUser.id,
        award_name: award.award_name,
        winner_player_name: winnerPlayerName || null,
        winner_player_id: winnerPlayerId || null,
        winner_team_id: award.winner_team_id || null,
      };
      console.log('updatePayload', updatePayload);
  
      // **critical line** – strip any temp id before sending
      if (award.id?.startsWith('temp-')) delete updatePayload.id;
  
      const { error } = await supabase
        .from('awards')
        .update(updatePayload)
        .eq('id', award.id);
  
      if (error) throw error;
  
      await loadAwards();
      onStatsUpdated();
      success('Award updated successfully');
    } catch (err: any) {
      logger.error('Error updating award:', err);
      showError('Failed to update award: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteAward = async (awardId: string) => {
    if (!supabase || !currentUser) return;
  
    try {
      const { error } = await supabase
        .from('awards')
        .delete()
        .eq('id', awardId)
        .eq('user_id', currentUser.id); // ensures user only deletes their own award
  
      if (error) throw error;
  
      await loadAwards();
      onStatsUpdated();
      success('Award deleted successfully');
    } catch (err: any) {
      logger.error('Error deleting award:', err);
      showError('Failed to delete award: ' + (err.message || 'Unknown error'));
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
        if (error.code === '23505') {
          warning('This season already exists!');
        } else {
          throw error;
        }
      } else {
        setSelectedSeasonForTotals(seasonId);
        setShowAddSeasonForm(false);
        setNewSeasonData({ year_start: endYear, year_end: endYear + 1 });
        onStatsUpdated();
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
              <GamesTab
                selectedSeason={selectedSeasonForGames}
                onSeasonChange={setSelectedSeasonForGames}
                seasons={seasons}
                seasonGames={seasonGames}
                onEditGame={handleEditGame}
                onDeleteGame={handleDeleteGame}
              />
            )}
            
            {activeTab === 'seasonTotals' && (
              <SeasonTotalsTab
                selectedSeason={selectedSeasonForTotals}
                onSeasonChange={setSelectedSeasonForTotals}
                seasons={seasons}
                loadingTotals={loadingTotals}
                hasGamesInSeason={hasGamesInSeason}
                totalsFormData={totalsFormData}
                onTotalsFormChange={(data) => setTotalsFormData(prev => ({ ...prev, ...data }))}
                onSave={handleSaveSeasonTotals}
                showAddSeasonForm={showAddSeasonForm}
                onToggleAddSeasonForm={() => setShowAddSeasonForm(!showAddSeasonForm)}
                newSeasonData={newSeasonData}
                onNewSeasonDataChange={setNewSeasonData}
                onCreateSeason={handleCreateSeason}
                creatingSeason={creatingSeason}
                calculatePerGameAverage={calculatePerGameAverage}
              />
            )}
            
            {activeTab === 'awards' && (
              <AwardsTab
                selectedSeason={selectedSeasonForAwards}
                onSeasonChange={setSelectedSeasonForAwards}
                seasons={seasons}
                awards={awards}
                awardFormData={awardFormData}
                onAwardFormChange={(data) => setAwardFormData(prev => ({ ...prev, ...data }))}
                onAddAward={handleAddAward}
                onUpdateAward={handleUpdateAward}
                onDeleteAward={handleDeleteAward}
                teams={teams}
              />
            )}
            
            {activeTab === 'careerHighs' && (
              <CareerHighsTab
                careerHighs={careerHighs}
                onCareerHighsChange={setCareerHighs}
                onSave={handleSaveCareerHighs}
              />
            )}
            
            {activeTab === 'playoffTree' && (
              <PlayoffTreeTab
                selectedSeason={selectedSeasonForPlayoffs}
                onSeasonChange={setSelectedSeasonForPlayoffs}
                seasons={seasons}
                loadingPlayoffs={loadingPlayoffs}
                playoffSeries={playoffSeries}
                onSaveSeries={handleSavePlayoffSeries}
                onDeleteSeries={handleDeletePlayoffSeries}
                teams={teams}
                currentUserPlayer={currentUserPlayer}
                allStats={allStats}
              />
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
