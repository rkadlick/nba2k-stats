import { useState, useEffect, useCallback } from "react";
import { PlayoffSeries, Player, Season } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ToastProvider";
import { generateSeriesId, determineWinner, ROUND_NUMBERS } from "@/lib/playoffUtils";

interface UsePlayoffSeriesProps {
  selectedSeason: string;
  currentUserPlayer: Player | null;
  seasons: Season[];
  onStatsUpdated?: () => void;
}

interface UsePlayoffSeriesReturn {
  playoffSeries: PlayoffSeries[];
  loadingPlayoffs: boolean;
  savingSeriesId: string | null;
  deletingSeriesId: string | null;
  loadPlayoffSeries: () => Promise<void>;
  handleSavePlayoffSeries: (series: PlayoffSeries, displayIdForLoading?: string) => Promise<void>;
  handleDeletePlayoffSeries: (seriesId: string) => Promise<void>;
}

export const usePlayoffSeries = ({
  selectedSeason,
  currentUserPlayer,
  seasons,
  onStatsUpdated
}: UsePlayoffSeriesProps): UsePlayoffSeriesReturn => {
  const { success, error: showError, warning } = useToast();

  const [playoffSeries, setPlayoffSeries] = useState<PlayoffSeries[]>([]);
  const [loadingPlayoffs, setLoadingPlayoffs] = useState(false);
  const [savingSeriesId, setSavingSeriesId] = useState<string | null>(null);
  const [deletingSeriesId, setDeletingSeriesId] = useState<string | null>(null);

  const loadPlayoffSeries = useCallback(async () => {
    if (!selectedSeason || !supabase || !currentUserPlayer) return;

    setLoadingPlayoffs(true);
    try {
      const { data, error } = await supabase
        .from('playoff_series')
        .select('*')
        .eq('season_id', selectedSeason)
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
  }, [selectedSeason, currentUserPlayer]);

  const handleSavePlayoffSeries = useCallback(async (series: PlayoffSeries, displayIdForLoading?: string) => {
    if (!selectedSeason || !supabase || !currentUserPlayer) return;

    setSavingSeriesId(displayIdForLoading ?? series.id ?? null);

    try {
      const selectedSeasonObj = seasons.find(s => s.id === selectedSeason);
      if (!selectedSeasonObj) return;

      let updatedSeries = { ...series };

      // Generate ID if needed
      if (!updatedSeries.id || updatedSeries.id.startsWith('temp-')) {
        updatedSeries.id = generateSeriesId(
          selectedSeasonObj,
          updatedSeries.round_name,
          updatedSeries.team1_id,
          updatedSeries.team2_id,
          currentUserPlayer.id,
          playoffSeries
        );
      }

      // Update round_number if round_name changed
      if (updatedSeries.round_name && updatedSeries.round_number !== ROUND_NUMBERS[updatedSeries.round_name]) {
        updatedSeries.round_number = ROUND_NUMBERS[updatedSeries.round_name] || 1;
      }

      // Auto-determine winner based on wins
      const team1Wins = updatedSeries.team1_wins ?? 0;
      const team2Wins = updatedSeries.team2_wins ?? 0;
      const winner = determineWinner(
        updatedSeries.team1_id,
        updatedSeries.team1_name,
        team1Wins,
        updatedSeries.team2_id,
        updatedSeries.team2_name,
        team2Wins
      );
      updatedSeries = { ...updatedSeries, ...winner };

      const seriesData: Partial<PlayoffSeries> = {
        id: updatedSeries.id,
        player_id: currentUserPlayer.id,
        season_id: selectedSeason,
        round_name: updatedSeries.round_name,
        round_number: updatedSeries.round_number,
        team1_id: updatedSeries.team1_id || undefined,
        team1_name: updatedSeries.team1_name || undefined,
        team1_seed: updatedSeries.team1_seed || undefined,
        team2_id: updatedSeries.team2_id || undefined,
        team2_name: updatedSeries.team2_name || undefined,
        team2_seed: updatedSeries.team2_seed || undefined,
        team1_wins: updatedSeries.team1_wins || 0,
        team2_wins: updatedSeries.team2_wins || 0,
        winner_team_id: updatedSeries.winner_team_id || undefined,
        winner_team_name: updatedSeries.winner_team_name || undefined,
        is_complete: updatedSeries.is_complete || false,
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

      // Optimistic update: merge saved data into local state (no reload = no modal shrink, scroll preserved)
      // Replace in place to preserve row order; only sort when adding a new item
      setPlayoffSeries((prev) => {
        const idx = prev.findIndex((s) => s.id === series.id || s.id === updatedSeries.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedSeries;
          return next;
        }
        const merged = [...prev, updatedSeries];
        return merged.sort((a, b) => (a.round_number ?? 1) - (b.round_number ?? 1));
      });

      onStatsUpdated?.();
      success('Playoff series saved successfully');
    } catch (error: unknown) {
      logger.error('Error saving playoff series:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError('Failed to save playoff series: ' + errorMessage);
    } finally {
      setSavingSeriesId(null);
    }
  }, [selectedSeason, currentUserPlayer, seasons, playoffSeries, onStatsUpdated, success, showError]);

  const handleDeletePlayoffSeries = useCallback(async (seriesId: string) => {
    if (!confirm('Are you sure you want to delete this playoff series?') || !supabase || !currentUserPlayer) return;

    setDeletingSeriesId(seriesId);

    try {
      const { error } = await supabase
        .from('playoff_series')
        .delete()
        .eq('id', seriesId)
        .eq('player_id', currentUserPlayer.id);

      if (error) throw error;

      // Optimistic update: remove from local state (no reload = no modal shrink, scroll preserved)
      setPlayoffSeries((prev) => prev.filter((s) => s.id !== seriesId));

      onStatsUpdated?.();
      success('Playoff series deleted successfully');
    } catch (error: unknown) {
      logger.error('Error deleting playoff series:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError('Failed to delete playoff series: ' + errorMessage);
    } finally {
      setDeletingSeriesId(null);
    }
  }, [currentUserPlayer, onStatsUpdated, success, showError]);

  // Load playoff series when dependencies change
  useEffect(() => {
    if (selectedSeason && currentUserPlayer) {
      loadPlayoffSeries();
    }
  }, [selectedSeason, currentUserPlayer, loadPlayoffSeries]);

  return {
    playoffSeries,
    loadingPlayoffs,
    savingSeriesId,
    deletingSeriesId,
    loadPlayoffSeries,
    handleSavePlayoffSeries,
    handleDeletePlayoffSeries,
  };
};
