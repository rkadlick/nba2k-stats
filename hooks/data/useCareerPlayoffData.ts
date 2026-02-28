import { useState, useEffect, useMemo } from 'react';
import { PlayerGameStatsWithDetails, PlayoffSeries } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { getTeamsByConference, getTeamById, getTeamByName } from '@/lib/teams';

export type PlayoffRoundFilter =
  | 'all'
  | 'play-in'
  | 'round-1'
  | 'conference-semis'
  | 'conference-finals'
  | 'finals';

export const PLAYOFF_ROUND_OPTIONS: { value: PlayoffRoundFilter; label: string }[] = [
  { value: 'all', label: 'All Playoffs' },
  { value: 'play-in', label: 'Play-In' },
  { value: 'round-1', label: 'Round 1' },
  { value: 'conference-semis', label: 'Conference Semis' },
  { value: 'conference-finals', label: 'Conference Finals' },
  { value: 'finals', label: 'Finals' },
];

// Map round_name from playoff_series to our filter value
function roundNameToFilter(roundName: string | undefined): PlayoffRoundFilter {
  if (!roundName) return 'all';
  const lower = roundName.toLowerCase();
  if (lower.includes('play-in') || lower.includes('play in')) return 'play-in';
  if (lower.includes('round 1') || lower === 'rnd 1') return 'round-1';
  if (lower.includes('semifinals') || lower.includes('semi-finals')) return 'conference-semis';
  if (lower.includes('conference finals') || lower.includes('conf finals')) return 'conference-finals';
  if (lower.includes('finals') && !lower.includes('conference')) return 'finals';
  return 'all';
}

// Fallback: infer from playoff_series_id if we don't have series data
function inferRoundFromSeriesId(seriesId: string | undefined): PlayoffRoundFilter {
  if (!seriesId) return 'all';
  const lower = seriesId.toLowerCase();
  if (lower.includes('plyn') || lower.includes('-pi-') || lower.includes('play-in'))
    return 'play-in';
  if (lower.includes('rnd1') || lower.includes('-r1-') || lower.includes('round1'))
    return 'round-1';
  if (lower.includes('rnd2') || lower.includes('-r2-') || lower.includes('round2'))
    return 'conference-semis';
  if (lower.includes('cnf') || lower.includes('-cf-') || lower.includes('conf'))
    return 'conference-finals';
  if (lower.includes('fnl') || lower.includes('finals')) return 'finals';
  return 'all';
}

export interface TeamPlayoffRecord {
  teamId: string;
  teamName: string;
  abbreviation: string;
  conference: 'East' | 'West';
  wins: number;
  losses: number;
  games: number;
}

export interface UseCareerPlayoffDataReturn {
  playoffGames: PlayerGameStatsWithDetails[];
  gamesByRound: Record<PlayoffRoundFilter, PlayerGameStatsWithDetails[]>;
  recordsByTeam: TeamPlayoffRecord[];
  eastTeams: TeamPlayoffRecord[];
  westTeams: TeamPlayoffRecord[];
  loading: boolean;
}

export function useCareerPlayoffData(
  playerId: string,
  allStats: PlayerGameStatsWithDetails[],
  playerTeamId?: string | null
): UseCareerPlayoffDataReturn {
  const [playoffSeries, setPlayoffSeries] = useState<PlayoffSeries[]>([]);
  const [loading, setLoading] = useState(true);

  const playoffGames = useMemo(() => {
    return allStats.filter((s) => s.is_playoff_game === true);
  }, [allStats]);

  const seriesIdsWithGameStats = useMemo(() => {
    return new Set(playoffGames.map((g) => g.playoff_series_id).filter(Boolean));
  }, [playoffGames]);

  useEffect(() => {
    if (!supabase || !playerId) {
      setLoading(false);
      setPlayoffSeries([]);
      return;
    }

    const client = supabase;

    const loadPlayoffSeries = async () => {
      setLoading(true);
      try {
        const { data, error } = await client
          .from('playoff_series')
          .select('*')
          .eq('player_id', playerId)
          .order('season_id', { ascending: true })
          .order('round_number', { ascending: true });

        if (error) {
          logger.error('Error loading career playoff series:', error);
          setPlayoffSeries([]);
        } else {
          setPlayoffSeries((data || []) as PlayoffSeries[]);
        }
      } catch (err) {
        logger.error('Error loading career playoff series:', err);
        setPlayoffSeries([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlayoffSeries();
  }, [playerId]);

  const seriesIdToRound = useMemo(() => {
    const map: Record<string, PlayoffRoundFilter> = {};
    playoffSeries.forEach((s) => {
      map[s.id] = roundNameToFilter(s.round_name);
    });
    return map;
  }, [playoffSeries]);

  const gamesByRound = useMemo(() => {
    const map: Record<PlayoffRoundFilter, PlayerGameStatsWithDetails[]> = {
      all: playoffGames,
      'play-in': [],
      'round-1': [],
      'conference-semis': [],
      'conference-finals': [],
      finals: [],
    };

    playoffGames.forEach((game) => {
      const round =
        seriesIdToRound[game.playoff_series_id || ''] ??
        inferRoundFromSeriesId(game.playoff_series_id);
      if (round !== 'all' && map[round]) {
        map[round].push(game);
      }
    });

    // Sort each round's games by date (most recent first)
    (Object.keys(map) as PlayoffRoundFilter[]).forEach((key) => {
      map[key] = [...map[key]].sort(
        (a, b) =>
          new Date(b.game_date || b.created_at || '').getTime() -
          new Date(a.game_date || a.created_at || '').getTime()
      );
    });

    return map;
  }, [playoffGames, seriesIdToRound]);

  const recordsByTeam = useMemo(() => {
    const teamMap = new Map<string, { wins: number; losses: number }>();

    // 1. From player_game_stats (games we have recorded)
    playoffGames.forEach((game) => {
      const opponentId = game.opponent_team?.id || game.opponent_team_id;
      const opponentName = game.opponent_team?.fullName || game.opponent_team_name;

      const team = opponentId
        ? getTeamById(opponentId)
        : opponentName
          ? getTeamByName(opponentName)
          : null;
      const key = team?.id ?? opponentId ?? opponentName ?? '';
      if (!key) return;

      const current = teamMap.get(key) ?? { wins: 0, losses: 0 };
      if (game.is_win) {
        current.wins += 1;
      } else {
        current.losses += 1;
      }
      teamMap.set(key, current);
    });

    // 2. From playoff_series (older seasons with no game stats - use series W/L)
    // Only add for series where we DON'T have any player_game_stats (avoid double-count)
    if (playerTeamId) {
      playoffSeries.forEach((series) => {
        if (seriesIdsWithGameStats.has(series.id)) return;

        const isTeam1 = series.team1_id === playerTeamId;
        const isTeam2 = series.team2_id === playerTeamId;
        if (!isTeam1 && !isTeam2) return;

        const opponentId = isTeam1 ? series.team2_id : series.team1_id;
        const opponentName = isTeam1 ? series.team2_name : series.team1_name;
        const team = opponentId ? getTeamById(opponentId) : opponentName ? getTeamByName(opponentName) : null;
        const key = team?.id ?? opponentId ?? opponentName ?? '';
        if (!key) return;

        const myWins = isTeam1 ? (series.team1_wins ?? 0) : (series.team2_wins ?? 0);
        const myLosses = isTeam1 ? (series.team2_wins ?? 0) : (series.team1_wins ?? 0);

        const current = teamMap.get(key) ?? { wins: 0, losses: 0 };
        current.wins += myWins;
        current.losses += myLosses;
        teamMap.set(key, current);
      });
    }

    const eastTeams = getTeamsByConference('East');
    const westTeams = getTeamsByConference('West');

    const result: TeamPlayoffRecord[] = [];

    [...eastTeams, ...westTeams].forEach((team) => {
      const record = teamMap.get(team.id) ?? { wins: 0, losses: 0 };
      const games = record.wins + record.losses;

      result.push({
        teamId: team.id,
        teamName: team.fullName,
        abbreviation: team.abbreviation,
        conference: team.conference,
        wins: record.wins,
        losses: record.losses,
        games,
      });
    });

    result.sort((a, b) => {
      if (a.conference !== b.conference) return a.conference === 'East' ? -1 : 1;
      return a.teamName.localeCompare(b.teamName);
    });

    return result;
  }, [playoffGames, playoffSeries, seriesIdsWithGameStats, playerTeamId]);

  const sortByWinPctThenGames = (a: TeamPlayoffRecord, b: TeamPlayoffRecord) => {
    const pctA = a.games > 0 ? a.wins / a.games : 0;
    const pctB = b.games > 0 ? b.wins / b.games : 0;
    if (Math.abs(pctA - pctB) > 0.0001) return pctB - pctA;
    return b.games - a.games;
  };

  const eastTeams = useMemo(
    () => recordsByTeam.filter((r) => r.conference === 'East').sort(sortByWinPctThenGames),
    [recordsByTeam]
  );
  const westTeams = useMemo(
    () => recordsByTeam.filter((r) => r.conference === 'West').sort(sortByWinPctThenGames),
    [recordsByTeam]
  );

  return {
    playoffGames,
    gamesByRound,
    recordsByTeam,
    eastTeams,
    westTeams,
    loading,
  };
}
