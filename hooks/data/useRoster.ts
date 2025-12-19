import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RosterEntry } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

interface UseRosterProps {
  selectedSeason: string;
  onStatsUpdated: () => void;
}

export function useRoster({ selectedSeason, onStatsUpdated }: UseRosterProps) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const { success, error: showError } = useToast();

  const loadRoster = useCallback(async () => {
    if (!selectedSeason || !supabase) return;
    setLoadingRoster(true);
    try {
      const { data, error } = await supabase
        .from('roster')
        .select('*')
        .eq('season_id', selectedSeason)
        .order('player_name');
      if (error) throw error;
      setRoster(data as RosterEntry[]);
    } catch (err) {
      console.error('Error loading roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedSeason]);

  const addRoster = useCallback(async (payload: { player_name: string; position: string; secondary_position?: string | null; is_starter?: boolean; start_end?: string }) => {
    if (!selectedSeason || !payload?.player_name || !supabase) return;
    try {
      const insert = {
        player_name: payload.player_name,
        season_id: selectedSeason,
        player_id: null,
        position: payload.position,
        secondary_position: payload.secondary_position ?? null,
        is_starter: payload.is_starter ?? false,
        start_end: payload.start_end || 'start',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('roster').insert([insert]);
      if (error) throw error;
      await loadRoster();
      onStatsUpdated();
      success('Roster member added');
    } catch (e) {
      console.error('Error adding roster member:', e);
      showError('Failed to add roster member');
    }
  }, [selectedSeason, loadRoster, onStatsUpdated, success, showError]);

  const updateRoster = useCallback(async (row: RosterEntry) => {
    if (!row.id || !supabase) return;
    try {
      const updated = {
        player_name: row.player_name,
        season_id: row.season_id,
        position: row.position,
        secondary_position: row.secondary_position ?? null,
        is_starter: row.is_starter ?? false,
        start_end: row.start_end || 'start',
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('roster').update(updated).eq('id', row.id);
      if (error) throw error;
      await loadRoster();
      onStatsUpdated();
      success('Roster member updated');
    } catch (e) {
      console.error('Error updating roster member:', e);
      showError('Failed to update roster member');
    }
  }, [loadRoster, onStatsUpdated, success, showError]);

  const deleteRoster = useCallback(async (id: string) => {
    if (!id || !supabase) return;
    try {
      const { error } = await supabase.from('roster').delete().eq('id', id);
      if (error) throw error;
      await loadRoster();
      onStatsUpdated();
      success('Roster member deleted');
    } catch (e) {
      console.error('Error deleting roster member:', e);
      showError('Failed to delete roster member');
    }
  }, [loadRoster, onStatsUpdated, success, showError]);

  // initial load and refresh on season changes
  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  return { roster, loadingRoster, loadRoster, addRoster, updateRoster, deleteRoster, setRoster };
}


