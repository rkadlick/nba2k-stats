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
import RosterTab from './RosterTab';
import PlayoffTreeTab from './PlayoffTreeTab';
import { useAwardsData } from '@/hooks/data/useAwards';
import { useSeasonTotals } from '@/hooks/data/useSeasonTotals';
import { usePlayoffSeries } from '@/hooks/data/usePlayoffSeries';
import { useCareerHighs } from '@/hooks/data/useCareerHighs';
import { useSeasonCreation } from '@/hooks/data/useSeasonCreation';
import { useRoster } from '@/hooks/data/useRoster';
import { useGames } from '@/hooks/data/useGames';
import { useTabState } from '@/hooks/ui/useTabState';
import { useSeasonSelection } from '@/hooks/ui/useSeasonSelection';
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
  const { activeTab, setActiveTab, tabs } = useTabState();
  const [currentUserPlayer, setCurrentUserPlayer] = useState<Player | null>(null);
  const { success, error: showError } = useToast();

  // Season selection hook
  const { selectedSeason, setSelectedSeason } = useSeasonSelection({ playerSeasons });
  // Roster state
  const rosterData = useRoster({ selectedSeason, currentUserPlayer, onStatsUpdated });

  // Games hook
  const { seasonGames, setSeasonGames } = useGames({
    selectedSeason,
    currentUserPlayer,
    allStats,
  });

  const [editingGame, setEditingGame] = useState<PlayerGameStatsWithDetails | null>(null);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  
  // Season creation hook
  const seasonCreation = useSeasonCreation({
    onSeasonCreated: (seasonId) => {
      setSelectedSeason(seasonId);
    },
    onStatsUpdated,
  });


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
  
  
  if (!isOpen) return null;

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
                showAddSeasonForm={seasonCreation.showAddSeasonForm}
                onToggleAddSeasonForm={() => seasonCreation.setShowAddSeasonForm(!seasonCreation.showAddSeasonForm)}
                newSeasonData={seasonCreation.newSeasonData}
                onNewSeasonDataChange={seasonCreation.setNewSeasonData}
                onCreateSeason={seasonCreation.handleCreateSeason}
                creatingSeason={seasonCreation.creatingSeason}
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
            
            {activeTab === 'roster' && (
              <RosterTab
                roster={rosterData.roster}
                onAddRoster={(payload) => rosterData.addRoster(payload as any)}
                onUpdateRoster={(row) => rosterData.updateRoster(row)}
                onDeleteRoster={(id) => rosterData.deleteRoster(id)}
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
