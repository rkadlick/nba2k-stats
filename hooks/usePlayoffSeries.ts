import { useState, useEffect, useMemo } from 'react';
import { Season, PlayerGameStatsWithDetails, PlayoffSeries as PlayoffSeriesType, Team } from '@/lib/types';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';


// Re-export the type for use in components
export type PlayoffSeriesWithGames = {
  id: string;
  player_id: string;
  season_id: string;
  round_name: string;
  round_number: number;
  team1_id?: string | null;
  team1_name?: string;
  team1_seed?: number;
  team2_id?: string | null;
  team2_name?: string;
  team2_seed?: number;
  team1_wins: number;
  team2_wins: number;
  winner_team_id?: string | null;
  winner_team_name?: string;
  is_complete: boolean;
  created_at?: string;
  updated_at?: string;
  games?: PlayerGameStatsWithDetails[];
  team1Display?: string;
  team2Display?: string;
  team1Abbrev?: string;
  team2Abbrev?: string;
  conference?: 'East' | 'West';
};

interface OrganizedBracket {
  east: Record<number, PlayoffSeriesWithGames[]>;
  west: Record<number, PlayoffSeriesWithGames[]>;
  eastPlayIn: PlayoffSeriesWithGames[];
  westPlayIn: PlayoffSeriesWithGames[];
  finals: PlayoffSeriesWithGames[];
}

// Helper to determine conference from team ID
function getConferenceFromTeamId(teamId: string | undefined | null): 'East' | 'West' | null {
  if (!teamId) return null;

  const easternTeams = [
    'team-bos', 'team-bkn', 'team-nyk', 'team-phi', 'team-tor', // Atlantic
    'team-chi', 'team-cle', 'team-det', 'team-ind', 'team-mil', // Central
    'team-atl', 'team-cha', 'team-mia', 'team-orl', 'team-was', // Southeast
  ];

  return easternTeams.includes(teamId) ? 'East' : 'West';
}

export function usePlayoffSeries(season: Season, playerId: string, playerStats: PlayerGameStatsWithDetails[], playerTeamName: string | undefined, teams: Team[]) {
  const [playoffSeries, setPlayoffSeries] = useState<PlayoffSeriesType[]>([]);
  const [loading, setLoading] = useState(true);

  // Load playoff series data
  useEffect(() => {
    const loadPlayoffSeries = async () => {
      if (!supabase || !playerId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('playoff_series')
          .select('*')
          .eq('season_id', season.id)
          .eq('player_id', playerId)
          .order('round_number', { ascending: true })
          .order('created_at', { ascending: true });

        if (error) {
          logger.error('Error loading playoff series:', error);
          setPlayoffSeries([]);
        } else {
          setPlayoffSeries((data || []) as PlayoffSeriesType[]);
        }
      } catch (error) {
        logger.error('Error loading playoff series:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayoffSeries();
  }, [season.id, playerId]);

  // Process and organize series
  const organizedBracket = useMemo(() => {
    const processedSeries: PlayoffSeriesWithGames[] = playoffSeries.map((series) => {
      const team1 = teams.find(t => t.id === series.team1_id);
      const team2 = teams.find(t => t.id === series.team2_id);
      const team1Display = team1?.name || series.team1_name || 'TBD';
      const team2Display = team2?.name || series.team2_name || 'TBD';
      const team1Abbrev = getTeamAbbreviation(team1Display);
      const team2Abbrev = getTeamAbbreviation(team2Display);

      // Determine conference
      const conference = getConferenceFromTeamId(series.team1_id) || getConferenceFromTeamId(series.team2_id) || null;

      // Find player games for this series
      const seriesGames = playerStats.filter((stat) => {
        if (!stat.is_playoff_game) return false;
        // Only include games that explicitly belong to this series
        return stat.playoff_series_id === series.id;
      });


      return {
        ...series,
        games: seriesGames,
        team1Display,
        team2Display,
        team1Abbrev,
        team2Abbrev,
        conference: conference || 'East', // Default to East if can't determine
      };
    });

    // Organize by conference and round
    // Separate Play-In games (round_number 0 or round_name contains "Play-In")
    const east: Record<number, PlayoffSeriesWithGames[]> = {};
    const west: Record<number, PlayoffSeriesWithGames[]> = {};
    const eastPlayIn: PlayoffSeriesWithGames[] = [];
    const westPlayIn: PlayoffSeriesWithGames[] = [];
    const finals: PlayoffSeriesWithGames[] = [];

    processedSeries.forEach(series => {
      const isPlayIn = series.round_number === 0 ||
                       series.round_name.toLowerCase().includes('play-in') ||
                       series.round_name.toLowerCase().includes('play in');

      if (series.round_name === 'NBA Finals') {
        finals.push(series);
      } else if (series.conference === 'East') {
        if (isPlayIn) {
          eastPlayIn.push(series);
        } else {
          if (!east[series.round_number]) east[series.round_number] = [];
          east[series.round_number].push(series);
        }
      } else {
        if (isPlayIn) {
          westPlayIn.push(series);
        } else {
          if (!west[series.round_number]) west[series.round_number] = [];
          west[series.round_number].push(series);
        }
      }
    });

    return { east, west, eastPlayIn, westPlayIn, finals };
  }, [playoffSeries, teams, playerStats, playerTeamName]);

  return {
    playoffSeries,
    organizedBracket,
    loading,
  };
}
