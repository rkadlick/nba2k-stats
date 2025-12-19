'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Player,
  Season,
  User,
  PlayerGameStatsWithDetails
} from '@/lib/types';
import { logger } from '@/lib/logger';
import { useToast } from '../ToastProvider';
import AddGameModal from '../add-game-modal';
import GamesTab from './GamesTab';
import SeasonTotalsTab from './SeasonTotalsTab';
import AwardsTab from './AwardsTab';
import CareerHighsTab from './CareerHighsTab';
import PlayoffTreeTab from './PlayoffTreeTab';
import { useAwardsData } from '@/hooks/data/useAwards';
import { useSeasonTotals } from '@/hooks/data/useSeasonTotals';
import { usePlayoffSeries } from '@/hooks/data/usePlayoffSeries';
import { useCareerHighs } from '@/hooks/data/useCareerHighs';
import SeasonSelector from '../SeasonSelector';

interface EditStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  playerSeasons: Season[];
  allSeasons: Season[];
  allStats: PlayerGameStatsWithDetails[];
  currentUser: User | null;
  onStatsUpdated: () => void;
}

type TabType = 'games' | 'seasonTotals' | 'awards' | 'careerHighs' | 'playoffTree';

export default function EditStatsModal({
  isOpen,
  onClose,
  players,
  playerSeasons,
  allSeasons,
  allStats,
  currentUser,
  onStatsUpdated,
}: EditStatsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('games');
  const [currentUserPlayer, setCurrentUserPlayer] = useState<Player | null>(null);
  const { success, error: showError, warning } = useToast();

  // Global season selection - default to most recent season
  const [selectedSeason, setSelectedSeason] = useState<string>(() => {
    // Default to the most recent season (first in array, sorted most recent first)
    return playerSeasons[0]?.id || '';
  });

  // Games tab state
  const [seasonGames, setSeasonGames] = useState<PlayerGameStatsWithDetails[]>([]);
  const [editingGame, setEditingGame] = useState<PlayerGameStatsWithDetails | null>(null);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  
  // Season creation state (separate from season totals)
  const [showAddSeasonForm, setShowAddSeasonForm] = useState(false);
  const [newSeasonData, setNewSeasonData] = useState({ year_start: new Date().getFullYear(), year_end: new Date().getFullYear() + 1 });
  const [creatingSeason, setCreatingSeason] = useState(false);


  // Awards tab state
  const awardsData = useAwardsData({
    selectedSeason,
    currentUser,
    currentUserPlayer,
    players,
    onStatsUpdated,
  });

  // Season Totals tab state
  const seasonTotalsData = useSeasonTotals({
    currentUserPlayer,
    selectedSeason,
    allStats,
    onStatsUpdated,
  });

  // Playoff Series tab state
  const playoffSeriesData = usePlayoffSeries({
    selectedSeason,
    currentUserPlayer,
    seasons: playerSeasons,
    onStatsUpdated,
  });

  // Career Highs tab state
  const careerHighsData = useCareerHighs({
    currentUserPlayer,
    onStatsUpdated,
  });
  

  useEffect(() => {
    if (currentUser) {
      const player = players.find(p => p.user_id === currentUser.id);
      setCurrentUserPlayer(player || null);
    }
  }, [currentUser, players]);
  
  // Initialize global season when seasons prop changes
  useEffect(() => {
    if (playerSeasons.length > 0 && !selectedSeason) {
      // Default to the most recent season (first in array, sorted most recent first)
      setSelectedSeason(playerSeasons[0].id);
    }
  }, [playerSeasons, selectedSeason]);

  // Load games for selected season
  useEffect(() => {
    if (selectedSeason && currentUserPlayer) {
      const games = allStats.filter(
        stat => stat.player_id === currentUserPlayer.id && stat.season_id === selectedSeason
      );
      setSeasonGames(games.sort((a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()));
    }
  }, [selectedSeason, currentUserPlayer, allStats]);

  

  
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
    } catch (error: unknown) {
      logger.error('Error deleting game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError('Failed to delete game: ' + errorMessage);
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
        setSelectedSeason(seasonId);
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

          {/* Global Season Selector */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Season:</label>
              <SeasonSelector
                seasons={playerSeasons}
                selectedSeason={selectedSeason}
                onSelectSeason={(season) => {
                  const seasonId = typeof season === 'string' ? season : season.id;
                  setSelectedSeason(seasonId);
                }}
              />
            </div>
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
                seasonGames={seasonGames}
                onEditGame={handleEditGame}
                onDeleteGame={handleDeleteGame}
              />
            )}
            
            {activeTab === 'seasonTotals' && (
              <SeasonTotalsTab
                loadingTotals={seasonTotalsData.loadingTotals}
                hasGamesInSeason={seasonTotalsData.hasGamesInSeason}
                totalsFormData={seasonTotalsData.totalsFormData}
                onTotalsFormChange={seasonTotalsData.onTotalsFormChange}
                onSave={seasonTotalsData.handleSaveSeasonTotals}
                showAddSeasonForm={showAddSeasonForm}
                onToggleAddSeasonForm={() => setShowAddSeasonForm(!showAddSeasonForm)}
                newSeasonData={newSeasonData}
                onNewSeasonDataChange={setNewSeasonData}
                onCreateSeason={handleCreateSeason}
                creatingSeason={creatingSeason}
                calculatePerGameAverage={seasonTotalsData.calculatePerGameAverage}
              />
            )}
            
            {activeTab === 'awards' && (
              <AwardsTab
              awards={awardsData.awards}
              awardFormData={awardsData.awardFormData}
              onAwardFormChange={awardsData.onAwardFormChange}
              onAddAward={awardsData.handleAddAward}
              onUpdateAward={awardsData.handleUpdateAward}
              onDeleteAward={awardsData.handleDeleteAward}
              />
            )}
            
            {activeTab === 'careerHighs' && (
              <CareerHighsTab
                careerHighs={careerHighsData.careerHighs}
                onCareerHighsChange={careerHighsData.setCareerHighs}
                onSave={careerHighsData.handleSaveCareerHighs}
              />
            )}
            
            {activeTab === 'playoffTree' && (
              <PlayoffTreeTab
                selectedSeason={selectedSeason}
                seasons={playerSeasons}
                loadingPlayoffs={playoffSeriesData.loadingPlayoffs}
                playoffSeries={playoffSeriesData.playoffSeries}
                onSaveSeries={playoffSeriesData.handleSavePlayoffSeries}
                onDeleteSeries={playoffSeriesData.handleDeletePlayoffSeries}
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
          playerSeasons={playerSeasons}
          allSeasons={allSeasons}
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
