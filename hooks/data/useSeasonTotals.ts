import { useState, useEffect, useCallback } from "react";
import { SeasonTotals, Player, PlayerGameStatsWithDetails } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ToastProvider";

interface SeasonTotalsFormData {
  games_played: number;
  games_started: number;
  total_points: number;
  total_rebounds: number;
  total_assists: number;
  total_steals: number;
  total_blocks: number;
  total_turnovers: number;
  total_minutes: number;
  total_fouls: number;
  total_plus_minus: number;
  total_fg_made: number;
  total_fg_attempted: number;
  total_threes_made: number;
  total_threes_attempted: number;
  total_ft_made: number;
  total_ft_attempted: number;
  double_doubles: number;
  triple_doubles: number;
}

interface UseSeasonTotalsProps {
  currentUserPlayer: Player | null;
  selectedSeason: string;
  allStats: PlayerGameStatsWithDetails[];
  onStatsUpdated: () => void;
}∫

export const useSeasonTotals = ({
  currentUserPlayer,
  selectedSeason,
  allStats,
  onStatsUpdated
}: UseSeasonTotalsProps) => {
  const { success, error: showError, warning } = useToast();
  const [seasonTotals, setSeasonTotals] = useState<SeasonTotals | null>(null);
  const [hasGamesInSeason, setHasGamesInSeason] = useState(false);
  const [loadingTotals, setLoadingTotals] = useState(false);
  const [totalsFormData, setTotalsFormData] = useState<SeasonTotalsFormData>({
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

  const loadSeasonTotals = useCallback(async () => {
    if (!currentUserPlayer || !selectedSeason || !supabase) return;

    setLoadingTotals(true);
    try {
      const { data, error } = await supabase
        .from('season_totals')
        .select('*')
        .eq('player_id', currentUserPlayer.id)
        .eq('season_id', selectedSeason)
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
  }, [currentUserPlayer, selectedSeason]);

  // Check if games exist for this season
  const checkForGames = useCallback(() => {
    if (!currentUserPlayer || !selectedSeason) return;
    const hasGames = allStats.some(
      stat => stat.player_id === currentUserPlayer.id && stat.season_id === selectedSeason
    );
    setHasGamesInSeason(hasGames);
  }, [currentUserPlayer, selectedSeason, allStats]);

  // Calculate per-game averages from totals
  const calculatePerGameAverage = useCallback((total: number): number | null => {
    if (totalsFormData.games_played > 0) {
      return Number((total / totalsFormData.games_played).toFixed(1));
    }
    return null;
  }, [totalsFormData.games_played]);

  // Load season totals and check for games when dependencies change
  useEffect(() => {
    if (selectedSeason && currentUserPlayer) {
      loadSeasonTotals();
      checkForGames();
    }
  }, [selectedSeason, currentUserPlayer, loadSeasonTotals, checkForGames]);

  // Form data change handler
  const onTotalsFormChange = useCallback((data: Partial<SeasonTotalsFormData>) => {
    setTotalsFormData(prev => ({ ...prev, ...data }));
  }, []);

  const handleSaveSeasonTotals = useCallback(async () => {
    if (!currentUserPlayer || !selectedSeason || !supabase) return;
    if (hasGamesInSeason) {
      warning('Cannot manually edit season totals when games exist for this season. Totals are calculated from games.');
      return;
    }

    try {
      const gamesPlayed = totalsFormData.games_played || 0;
      
      const fgPct = totalsFormData.total_fg_attempted > 0
        ? Number((totalsFormData.total_fg_made / totalsFormData.total_fg_attempted).toFixed(3))
        : undefined;
      const ftPct = totalsFormData.total_ft_attempted > 0
        ? Number((totalsFormData.total_ft_made / totalsFormData.total_ft_attempted).toFixed(3))
        : undefined;
      const threePct = totalsFormData.total_threes_attempted > 0
        ? Number((totalsFormData.total_threes_made / totalsFormData.total_threes_attempted).toFixed(3))
        : undefined;
      
      // NOTE: For manual season totals, games_started is included and can be set by the user.
      // When adding/editing individual GAMES (not season totals), games_started is automatically handled by Supabase.
      const totalsData: Partial<SeasonTotals> = {
        player_id: currentUserPlayer.id,
        season_id: selectedSeason,
        is_manual_entry: true,
        ...totalsFormData,
        avg_points: gamesPlayed > 0 ? Number((totalsFormData.total_points / gamesPlayed).toFixed(1)) : undefined,
        avg_rebounds: gamesPlayed > 0 ? Number((totalsFormData.total_rebounds / gamesPlayed).toFixed(1)) : undefined,
        avg_assists: gamesPlayed > 0 ? Number((totalsFormData.total_assists / gamesPlayed).toFixed(1)) : undefined,
        avg_steals: gamesPlayed > 0 ? Number((totalsFormData.total_steals / gamesPlayed).toFixed(1)) : undefined,
        avg_blocks: gamesPlayed > 0 ? Number((totalsFormData.total_blocks / gamesPlayed).toFixed(1)) : undefined,
        avg_turnovers: gamesPlayed > 0 ? Number((totalsFormData.total_turnovers / gamesPlayed).toFixed(1)) : undefined,
        avg_minutes: gamesPlayed > 0 ? Number((totalsFormData.total_minutes / gamesPlayed).toFixed(1)) : undefined,
        avg_fouls: gamesPlayed > 0 ? Number((totalsFormData.total_fouls / gamesPlayed).toFixed(1)) : undefined,
        avg_plus_minus: gamesPlayed > 0 ? Number((totalsFormData.total_plus_minus / gamesPlayed).toFixed(1)) : undefined,
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
    } catch (error: unknown) {
      logger.error('Error saving season totals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError('Failed to save season totals: ' + errorMessage);
    }
  }, [currentUserPlayer, selectedSeason, hasGamesInSeason, totalsFormData, seasonTotals, onStatsUpdated, success, showError, warning]);

  return {
    seasonTotals,
    hasGamesInSeason,
    loadingTotals,
    totalsFormData,
    loadSeasonTotals,
    handleSaveSeasonTotals,
    onTotalsFormChange,
    calculatePerGameAverage,
  };
};