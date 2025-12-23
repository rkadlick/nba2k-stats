'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { PlayerWithTeam, Award, Season, SeasonTotals } from '@/lib/types';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabaseClient';
import { CareerViewSwitcher } from './views/CareerViewSwitcher';
import Overview from './views/Overview';
import AwardView from './views/AwardView';
import SplitsView from './views/SplitsView';
import PlayoffView from './views/PlayoffView';

interface CareerViewProps {
  player: PlayerWithTeam;
  allAwards: Award[];
  seasons: Season[];
}

// NBA scoreboard order for stats
const NBA_STAT_ORDER = [
  'minutes',
  'points',
  'rebounds',
  'assists',
  'steals',
  'blocks',
  'offensive_rebounds',
  'turnovers',
  'fouls',
  'plus_minus',
  'fg', // Combined FG made/attempted
  'threes', // Combined 3PT made/attempted
  'ft', // Combined FT made/attempted
];

const STAT_KEYS: string[] = [
  'games_played',
  'games_started',
  ...NBA_STAT_ORDER,
  'offensive_rebounds',
  'double_doubles',
  'triple_doubles',
];

export default function CareerView({
  player,
  allAwards,
  seasons,
}: CareerViewProps) {
  const [dbSeasonTotals, setDbSeasonTotals] = useState<SeasonTotals[]>([]);
  const [viewMode, setViewMode] = useState<"overview" | "awards" | "splits" | "playoffs">("overview");

  // Fetch season totals from database
  useEffect(() => {
    const loadSeasonTotals = async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('season_totals')
        .select('*')
        .eq('player_id', player.id);

      if (error) {
        logger.error('Error loading season totals:', error);
      } else {
        setDbSeasonTotals((data || []) as SeasonTotals[]);
      }
    };

    loadSeasonTotals();
  }, [player.id]);

  // Filter awards to only those won by this player
  const playerWonAwards = useMemo(() => {
    return allAwards.filter((award) => {
      // Award won by player if winner_player_id matches OR winner_player_name matches
      if (award.winner_player_id && award.winner_player_id === player.id) {
        return true;
      }
      if (award.winner_player_name) {
        const winnerName = award.winner_player_name.trim().toLowerCase();
        const playerName = player.player_name.trim().toLowerCase();
        return winnerName === playerName;
      }
      return false;
    });
  }, [allAwards, player]);

  // Calculate season totals first (needed for determining which stats to show)
  // Build a simple list of season totals directly from the DB
  const seasonTotals = useMemo(() => {
    return seasons
      .map(season => {
        const dbTotal = dbSeasonTotals.find(st => st.season_id === season.id);
        if (!dbTotal) return null;

        return {
          season,
          dbTotal,
          totals: {
            points: dbTotal.total_points,
            rebounds: dbTotal.total_rebounds,
            offensive_rebounds: dbTotal.total_offensive_rebounds,
            assists: dbTotal.total_assists,
            steals: dbTotal.total_steals,
            blocks: dbTotal.total_blocks,
            turnovers: dbTotal.total_turnovers,
            minutes: Number(dbTotal.total_minutes) || 0,
            fouls: dbTotal.total_fouls,
            plus_minus: dbTotal.total_plus_minus,
            fg_made: dbTotal.total_fg_made,
            fg_attempted: dbTotal.total_fg_attempted,
            threes_made: dbTotal.total_threes_made,
            threes_attempted: dbTotal.total_threes_attempted,
            ft_made: dbTotal.total_ft_made,
            ft_attempted: dbTotal.total_ft_attempted,
            double_doubles: dbTotal.double_doubles,
            triple_doubles: dbTotal.triple_doubles,
          },
          averages: {
            points: Number(dbTotal.avg_points) || 0,
            rebounds: Number(dbTotal.avg_rebounds) || 0,
            offensive_rebounds: Number(dbTotal.avg_offensive_rebounds) || 0,
            assists: Number(dbTotal.avg_assists) || 0,
            steals: Number(dbTotal.avg_steals) || 0,
            blocks: Number(dbTotal.avg_blocks) || 0,
            turnovers: Number(dbTotal.avg_turnovers) || 0,
            fouls: Number(dbTotal.avg_fouls) || 0,
            minutes: Number(dbTotal.avg_minutes) || 0,
            plus_minus: Number(dbTotal.avg_plus_minus) || 0,
          },
          gamesPlayed: dbTotal.games_played,
          gamesStarted: dbTotal.games_started,
          awards: playerWonAwards.filter(a => a.season_id === season.id),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [dbSeasonTotals, seasons, playerWonAwards]);

  // Season totals stat keys (percentages shown in averages row, not separate columns)
  // Include all stats that exist in any season totals
  const seasonTotalsKeys = useMemo(() => {
    const keys = new Set<string>();

    // Always add GP and GS first
    keys.add('games_played');
    keys.add('games_started');

    // Check all season totals to see what stats exist
    seasonTotals.forEach(({ totals }) => {
      Object.keys(totals).forEach(key => {
        if (key !== 'fg_made' && key !== 'fg_attempted' &&
          key !== 'threes_made' && key !== 'threes_attempted' &&
          key !== 'ft_made' && key !== 'ft_attempted' &&
          key !== 'games_played' && key !== 'games_started') {
          keys.add(key);
        }
      });
      // Add combined shooting stats if they exist
      if (totals.fg_made !== undefined || totals.fg_attempted !== undefined) {
        keys.add('fg');
      }
      if (totals.threes_made !== undefined || totals.threes_attempted !== undefined) {
        keys.add('threes');
      }
      if (totals.ft_made !== undefined || totals.ft_attempted !== undefined) {
        keys.add('ft');
      }
    });

    // Also include stats from games
    STAT_KEYS.forEach(key => keys.add(key));

    // Always include all NBA_STAT_ORDER stats
    NBA_STAT_ORDER.forEach(key => keys.add(key));
    // Always include DD/TD
    keys.add('double_doubles');
    keys.add('triple_doubles');

    // Sort: GP, GS first, then NBA order, then extras
    const ordered: string[] = ['games_played', 'games_started'];
    const nbaOrdered: string[] = [];
    const extras: string[] = [];

    NBA_STAT_ORDER.forEach(key => {
      if (keys.has(key)) {
        nbaOrdered.push(key);
      }
    });

    keys.forEach(key => {
      if (key !== 'games_played' && key !== 'games_started' &&
        !NBA_STAT_ORDER.includes(key)) {
        extras.push(key);
      }
    });

    return [...ordered, ...nbaOrdered, ...extras.sort()];
  }, [seasonTotals]);

  // Calculate career totals from all season totals
  const careerTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const averages: Record<string, number> = {};
    let totalGamesPlayed = 0;
    let totalGamesStarted = 0;

    // Sum all season totals
    seasonTotals.forEach(({ totals: seasonTotals, gamesPlayed, gamesStarted }) => {
      totalGamesPlayed += gamesPlayed;
      totalGamesStarted += gamesStarted || 0;

      Object.entries(seasonTotals).forEach(([key, value]) => {
        if (key !== 'double_doubles' && key !== 'triple_doubles') {
          totals[key] = (totals[key] || 0) + (value || 0);
        } else {
          // DD/TD are cumulative
          totals[key] = (totals[key] || 0) + (value || 0);
        }
      });
    });

    // Calculate averages based on total games played
    if (totalGamesPlayed > 0) {
      Object.keys(totals).forEach((key) => {
        if (key !== 'double_doubles' && key !== 'triple_doubles' &&
          key !== 'fg_made' && key !== 'fg_attempted' &&
          key !== 'threes_made' && key !== 'threes_attempted' &&
          key !== 'ft_made' && key !== 'ft_attempted') {
          averages[key] = totals[key] / totalGamesPlayed;
        }
      });
    }

    totals.games_played = totalGamesPlayed;
    totals.games_started = totalGamesStarted;

    return { totals, averages, gamesPlayed: totalGamesPlayed, gamesStarted: totalGamesStarted };
  }, [seasonTotals]);

  return (
    <div className="flex flex-col px-4 py-2 bg-gray-50">
      <div className="mb-2">
        <CareerViewSwitcher
          viewMode={viewMode}
          onChange={setViewMode}
        />
      </div>

      {viewMode === 'overview' && (
        <Overview
          player={player}
          seasonTotals={seasonTotals}
          careerTotals={careerTotals}
          seasonTotalsKeys={seasonTotalsKeys}
        />
      )}

      {viewMode === 'awards' && (
        <AwardView
          allAwards={playerWonAwards}
          seasons={seasons}
          player={player}
        />
      )}

      {viewMode === 'splits' && (
        <SplitsView />
      )}

      {viewMode === 'playoffs' && (
        <PlayoffView />
      )}
    </div>
  );
}
