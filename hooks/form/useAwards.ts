// hooks/useAwardsData.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Player, Season, Award, User } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

interface UseAwardsDataProps {
  playerSeasons: Season[];
  currentUser: User | null;
  currentUserPlayer: Player | null;
  players: Player[];
  onStatsUpdated: () => void;
}

interface UseAwardsDataReturn {
  selectedSeason: string;
  setSelectedSeason: (seasonId: string) => void;
  awards: Award[];
  awardFormData: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter: boolean;
  };
  setAwardFormData: React.Dispatch<React.SetStateAction<{
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter: boolean;
  }>>;
  handleAddAward: (newAward?: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter?: boolean;
  }) => Promise<void>;
  handleUpdateAward: (award: Award) => Promise<void>;
  handleDeleteAward: (awardId: string) => Promise<void>;
  onAwardFormChange: (data: Partial<{
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter: boolean;
  }>) => void;
}

export const useAwardsData = ({
  playerSeasons,
  currentUser,
  currentUserPlayer,
  players,
  onStatsUpdated,
}: UseAwardsDataProps): UseAwardsDataReturn => {
  const [selectedSeason, setSelectedSeason] = useState<string>(playerSeasons[0]?.id || '');
  const [awards, setAwards] = useState<Award[]>([]);
  const [awardFormData, setAwardFormData] = useState({
    award_name: '',
    winner_player_name: '',
    winner_team_id: '',
    allstar_starter: false,
  });
  
  const { success, error: showError, warning } = useToast();

  // Initialize selected season when seasons change
  useEffect(() => {
    if (playerSeasons.length > 0 && playerSeasons[0] && !selectedSeason) {
      setSelectedSeason(playerSeasons[0].id);
    }
  }, [playerSeasons, selectedSeason]);

  // Load awards when season or user changes
  useEffect(() => {
    if (selectedSeason && currentUser && currentUserPlayer) {
      loadAwards();
    }
  }, [selectedSeason, currentUser, currentUserPlayer]);

  const loadAwards = async () => {
    if (!selectedSeason || !supabase || !currentUser || !currentUserPlayer) return;
    
    try {
      const { data, error } = await supabase
        .from('awards')
        .select('*')
        .eq('season_id', selectedSeason)
        .eq('user_id', currentUser.id)
        .or(`player_id.eq.${currentUserPlayer.id},player_id.is.null`)
        .order('award_name');
      
      if (error) {
        console.error('Error loading awards:', error);
      } else {
        setAwards(data || []);
      }
    } catch (error) {
      console.error('Error loading awards:', error);
    }
  };

  const handleAddAward = async (newAward?: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter?: boolean;
  }) => {
    const data = newAward || awardFormData;
    if (!selectedSeason || !data.award_name || !supabase || !currentUser) {
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
  
      const insertPayload: any = {
        user_id: currentUser.id,
        player_id: currentUserPlayer?.id || null,
        season_id: selectedSeason,
        award_name: data.award_name,
        winner_player_name: winnerPlayerName || null,
        winner_player_id: winnerPlayerId || null,
        winner_team_id: data.winner_team_id || null,
        is_league_award: true,
        allstar_starter: data.allstar_starter ?? false,
      };
  
      // Ensure no id goes to DB
      delete insertPayload.id;
  
      const { error } = await supabase.from('awards').insert([insertPayload]);
      if (error) throw error;
  
      setAwardFormData({ award_name: '', winner_player_name: '', winner_team_id: '', allstar_starter: false });
      loadAwards();
      onStatsUpdated();
      success('Award added successfully');
    } catch (err: any) {
      console.error('Error adding award:', err);
      showError('Failed to add award: ' + (err.message || 'Unknown error'));
    }
  };
  
  const handleUpdateAward = async (award: Award) => {
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
        allstar_starter: award.allstar_starter ?? false,
      };

      // Strip any temp id before sending
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
      console.error('Error updating award:', err);
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
      console.error('Error deleting award:', err);
      showError('Failed to delete award: ' + (err.message || 'Unknown error'));
    }
  };

  const onAwardFormChange = (data: Partial<{
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter: boolean;
  }>) => {
    setAwardFormData(prev => ({ ...prev, ...data }));
  };

  return {
    selectedSeason,
    setSelectedSeason,
    awards,
    awardFormData,
    setAwardFormData,
    handleAddAward,
    handleUpdateAward,
    handleDeleteAward,
    onAwardFormChange,
  };
};