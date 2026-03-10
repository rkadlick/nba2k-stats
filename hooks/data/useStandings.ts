import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Player, TeamStandings } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

interface UseStandingsProps {
  selectedSeason: string;
  currentUserPlayer?: Player | null;
  playerId?: string;
}

export function useStandings({ selectedSeason, currentUserPlayer, playerId }: UseStandingsProps) {
  const [standings, setStandings] = useState<TeamStandings[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const { success, error: showError } = useToast();

  const resolvedPlayerId = playerId ?? currentUserPlayer?.id;

  const loadStandings = useCallback(async () => {
    if (!selectedSeason || !resolvedPlayerId || !supabase) return;
    setLoadingStandings(true);
    try {
      const { data, error } = await supabase
        .from('team_standings')
        .select('*')
        .eq('season_id', selectedSeason)
        .eq('player_id', resolvedPlayerId);
      if (error) throw error;
      setStandings(data as TeamStandings[]);
    } catch (err) {
      console.error('Error loading standings:', err);
    } finally {
      setLoadingStandings(false);
    }
  }, [selectedSeason, resolvedPlayerId]);

  const upsertStanding = useCallback(async (teamId: string, wins: number, losses: number) => {
    if (!selectedSeason || !resolvedPlayerId || !supabase) return;
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('team_standings')
        .upsert(
          {
            player_id: resolvedPlayerId,
            season_id: selectedSeason,
            team_id: teamId,
            wins,
            losses,
            updated_at: now,
          },
          { onConflict: 'player_id,season_id,team_id' }
        );
      if (error) throw error;
      await loadStandings();
      success('Standings saved');
    } catch (e) {
      console.error('Error saving standings:', e);
      showError('Failed to save standings');
    }
  }, [selectedSeason, resolvedPlayerId, loadStandings, success, showError]);

  const deleteStanding = useCallback(async (id: string) => {
    if (!id || !supabase) return;
    try {
      const { error } = await supabase
        .from('team_standings')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await loadStandings();
      success('Standings entry deleted');
    } catch (e) {
      console.error('Error deleting standings:', e);
      showError('Failed to delete standings entry');
    }
  }, [loadStandings, success, showError]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  return { standings, loadingStandings, loadStandings, upsertStanding, deleteStanding };
}
