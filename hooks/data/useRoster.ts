import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Player, RosterEntry } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

interface UseRosterProps {
  selectedSeason: string;
  currentUserPlayer?: Player | null;
  playerId?: string;
  onStatsUpdated?: () => void;
}

export function useRoster({ selectedSeason, currentUserPlayer, playerId, onStatsUpdated }: UseRosterProps) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const { success, error: showError } = useToast();

  const loadRoster = useCallback(async () => {
    if (!selectedSeason || !supabase) return;
    setLoadingRoster(true);
    try {
      let query = supabase
        .from('roster')
        .select('*')
        .eq('season_id', selectedSeason);

      // If playerId is provided, filter by it; otherwise use currentUserPlayer
      if (playerId) {
        query = query.eq('player_id', playerId);
      } else if (currentUserPlayer) {
        query = query.eq('player_id', currentUserPlayer.id);
      }

      query = query.order('player_name');

      const { data, error } = await query;
      if (error) throw error;
      setRoster(data as RosterEntry[]);
    } catch (err) {
      console.error('Error loading roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedSeason, playerId, currentUserPlayer]);

  const addRoster = useCallback(async (payload: { player_name: string; position: string; secondary_position?: string | null; is_starter?: boolean; overall?: number; start_end?: string }) => {
    if (!selectedSeason || !payload?.player_name || !supabase) return;
    try {
      const insert = {
        player_name: payload.player_name,
        season_id: selectedSeason,
        player_id: currentUserPlayer?.id,
        position: payload.position,
        secondary_position: payload.secondary_position ?? null,
        is_starter: payload.is_starter ?? false,
        overall: payload.overall ?? null,
        start_end: payload.start_end || 'start',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('roster').insert([insert]);
      if (error) throw error;
      await loadRoster();
      onStatsUpdated?.();
      success('Roster member added');
    } catch (e) {
      console.error('Error adding roster member:', e);
      showError('Failed to add roster member');
    }
  }, [selectedSeason, loadRoster, onStatsUpdated, success, showError, currentUserPlayer?.id]);

  const updateRoster = useCallback(async (row: RosterEntry) => {
    if (!row.id || !supabase) return;
    try {
      const updated = {
        player_name: row.player_name,
        season_id: row.season_id,
        position: row.position,
        secondary_position: row.secondary_position ?? null,
        is_starter: row.is_starter === true, // Explicitly convert to boolean
        overall: row.overall ?? null,
        start_end: row.start_end || 'start',
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('roster').update(updated).eq('id', row.id);
      if (error) throw error;
      await loadRoster();
      onStatsUpdated?.();
      success('Roster member updated');
    } catch (e) {
      console.error('Error updating roster member:', e);
      showError('Failed to update roster member');
    }
  }, [loadRoster, onStatsUpdated, success, showError]);

  const deleteRoster = useCallback(async (id: string) => {
    if (!id || !supabase) {
      console.error('Delete roster: Missing id or supabase', { id, supabase: !!supabase });
      return;
    }
    
    try {
      console.log('Attempting to delete roster item:', id);
      
      // Build delete query with ID filter
      let query = supabase.from('roster').delete().eq('id', id);
      
      // Add player_id filter if available (for RLS policies)
      if (playerId) {
        query = query.eq('player_id', playerId);
      } else if (currentUserPlayer?.id) {
        query = query.eq('player_id', currentUserPlayer.id);
      }
      
      const { error, status, count } = await query;
      
      console.log('Delete response:', { error, status, count });
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      // Reload roster to update UI
      await loadRoster();
      onStatsUpdated?.();
      success('Roster member deleted');
    } catch (e) {
      console.error('Error deleting roster member:', e);
      showError('Failed to delete roster member: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  }, [loadRoster, onStatsUpdated, success, showError, playerId, currentUserPlayer?.id]);

  // initial load and refresh on season changes
  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  return { roster, loadingRoster, loadRoster, addRoster, updateRoster, deleteRoster, setRoster };
}


