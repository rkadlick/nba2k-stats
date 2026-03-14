import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Season, TeamStandings } from '@/lib/types';

interface UseCareerStandingsProps {
  playerId: string;
  seasons: Season[];
}

/** Aggregated record for a team across a season range */
export interface AggregatedStanding {
  team_id: string;
  wins: number;
  losses: number;
  pct: number;
}

export function useCareerStandings({ playerId, seasons }: UseCareerStandingsProps) {
  const [allStandings, setAllStandings] = useState<TeamStandings[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStandings = useCallback(async () => {
    if (!playerId || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_standings')
        .select('*')
        .eq('player_id', playerId);
      if (error) throw error;
      setAllStandings((data || []) as TeamStandings[]);
    } catch (err) {
      console.error('Error loading career standings:', err);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  /** Seasons sorted by year_start (oldest first) */
  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => a.year_start - b.year_start);
  }, [seasons]);

  /**
   * Aggregate standings for teams in the given season range.
   * Sums wins/losses per team; missing seasons count as 0-0.
   */
  const getAggregatedStandings = useCallback(
    (fromSeasonId: string, toSeasonId: string): AggregatedStanding[] => {
      const fromIdx = sortedSeasons.findIndex((s) => s.id === fromSeasonId);
      const toIdx = sortedSeasons.findIndex((s) => s.id === toSeasonId);
      if (fromIdx < 0 || toIdx < 0) return [];
      const [lo, hi] = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];

      const seasonIdsInRange = new Set(
        sortedSeasons.slice(lo, hi + 1).map((s) => s.id)
      );

      const aggregated: Record<string, { wins: number; losses: number }> = {};

      allStandings
        .filter((s) => seasonIdsInRange.has(s.season_id))
        .forEach((s) => {
          if (!aggregated[s.team_id]) {
            aggregated[s.team_id] = { wins: 0, losses: 0 };
          }
          aggregated[s.team_id].wins += s.wins;
          aggregated[s.team_id].losses += s.losses;
        });

      return Object.entries(aggregated).map(([team_id, { wins, losses }]) => {
        const total = wins + losses;
        return {
          team_id,
          wins,
          losses,
          pct: total > 0 ? wins / total : 0,
        };
      });
    },
    [allStandings, sortedSeasons]
  );

  const hasAnyStandings = allStandings.length > 0;

  return {
    allStandings,
    loading,
    sortedSeasons,
    getAggregatedStandings,
    hasAnyStandings,
  };
}
