'use client';

import { useState, useEffect, useMemo } from 'react';
import { Season, PlayerGameStatsWithDetails, PlayoffSeries as PlayoffSeriesType, Team } from '@/lib/types';
import { getStatsFromGame } from '@/lib/statHelpers';
import { getTeamAbbreviation } from '@/lib/teamAbbreviations';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

interface PlayoffTreeProps {
  season: Season;
  playerStats?: PlayerGameStatsWithDetails[];
  playerTeamName?: string;
  playerName?: string;
  teams?: Team[];
}

interface PlayoffSeriesWithGames extends PlayoffSeriesType {
  games?: PlayerGameStatsWithDetails[];
  team1Display?: string;
  team2Display?: string;
  team1Abbrev?: string;
  team2Abbrev?: string;
  conference?: 'East' | 'West';
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

export default function PlayoffTree({ season, playerStats = [], playerTeamName, playerName, teams = [] }: PlayoffTreeProps) {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [playoffSeries, setPlayoffSeries] = useState<PlayoffSeriesType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayoffSeries = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('playoff_series')
          .select('*')
          .eq('season_id', season.id)
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
  }, [season.id]);

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
        if (stat.playoff_series_id && stat.playoff_series_id === series.id) {
          return true;
        }
        const opponentName = stat.opponent_team?.name || stat.opponent_team_name || '';
        return (
          opponentName === team1Display || opponentName === team2Display ||
          playerTeamName === team1Display || playerTeamName === team2Display
        );
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

  if (loading) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
        <div className="text-gray-500 text-sm">Loading playoff bracket...</div>
      </div>
    );
  }

  if (playoffSeries.length === 0) {
    return (
      <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-700 font-medium mb-1 text-sm">No playoff data available</div>
        <div className="text-gray-500 text-xs">Season: {season.year_start}–{season.year_end}</div>
      </div>
    );
  }

  // Render a matchup card - compact version
  const renderMatchup = (series: PlayoffSeriesWithGames, isHighlighted: boolean = false) => {
    const isSelected = selectedSeries === series.id;
    const hasPlayerGames = series.games && series.games.length > 0;
    const isPlayerSeries = playerTeamName && 
      (series.team1Display === playerTeamName || series.team2Display === playerTeamName);
    
    const winnerId = series.winner_team_id;
    const team1Won = winnerId === series.team1_id;
    const team2Won = winnerId === series.team2_id;
    const isComplete = series.is_complete;

    return (
      <div
        key={series.id}
        className={`relative bg-white rounded border transition-all cursor-pointer ${
          isSelected
            ? 'border-purple-500 shadow-md'
            : isPlayerSeries
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isHighlighted ? 'ring-1 ring-blue-300' : ''}`}
        onClick={() => setSelectedSeries(isSelected ? null : series.id)}
      >
        {/* Matchup Card - Compact */}
        <div className="p-2">
          {/* Team 1 */}
          <div className={`flex items-center justify-between py-1 px-1.5 rounded text-xs ${
            team1Won && isComplete ? 'bg-green-100' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-1.5">
              {series.team1_seed && (
                <span className="text-[10px] font-bold text-gray-500">
                  ({series.team1_seed})
                </span>
              )}
              <span className={`font-semibold ${
                team1Won && isComplete ? 'text-green-700' : 'text-gray-900'
              }`}>
                {series.team1Abbrev}
              </span>
            </div>
            {series.team1_wins !== undefined && (
              <span className={`font-bold text-xs ${
                team1Won && isComplete ? 'text-green-700' : 'text-gray-600'
              }`}>
                {series.team1_wins}
              </span>
            )}
          </div>
          
          {/* Team 2 */}
          <div className={`flex items-center justify-between py-1 px-1.5 rounded mt-0.5 text-xs ${
            team2Won && isComplete ? 'bg-green-100' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-1.5">
              {series.team2_seed && (
                <span className="text-[10px] font-bold text-gray-500">
                  ({series.team2_seed})
                </span>
              )}
              <span className={`font-semibold ${
                team2Won && isComplete ? 'text-green-700' : 'text-gray-900'
              }`}>
                {series.team2Abbrev}
              </span>
            </div>
            {series.team2_wins !== undefined && (
              <span className={`font-bold text-xs ${
                team2Won && isComplete ? 'text-green-700' : 'text-gray-600'
              }`}>
                {series.team2_wins}
              </span>
            )}
          </div>

          {/* Player games indicator */}
          {isPlayerSeries && hasPlayerGames && (
            <div className="mt-1 text-[10px] text-blue-600 font-medium text-center">
              {series.games?.length} game{series.games?.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Expanded games view */}
        {isSelected && hasPlayerGames && series.games && (
          <div className="border-t border-gray-200 bg-white p-2 rounded-b">
            <div className="text-[10px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Player Games</div>
            <div className="space-y-1">
              {series.games.map((game, gameIdx) => {
                const opponentName = game.opponent_team?.name || game.opponent_team_name || 'Unknown';
                const opponentAbbrev = getTeamAbbreviation(opponentName);
                const isHome = game.is_home;
                const gameStats = getStatsFromGame(game);
                return (
                  <div
                    key={game.id || gameIdx}
                    className="p-1.5 bg-gray-50 rounded border border-gray-200 text-[10px]"
                  >
                    <div className="font-medium text-gray-900 mb-0.5">
                      {isHome ? 'vs' : '@'} {opponentAbbrev} • {game.is_win ? 'W' : 'L'} {game.player_score}-{game.opponent_score}
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-gray-600">
                      {Object.entries(gameStats).slice(0, 6).map(([key, value]) => (
                        <div key={key} className="truncate">
                          <span className="capitalize text-[9px]">{key.replace(/_/g, ' ')}:</span>{' '}
                          <span className="font-semibold text-gray-800">
                            {typeof value === 'number' 
                              ? value.toFixed(value % 1 === 0 ? 0 : 1)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render a round column - compact
  const renderRound = (
    roundSeries: PlayoffSeriesWithGames[],
    roundName: string,
    roundNumber: number,
    conference: 'East' | 'West'
  ) => {
    if (roundSeries.length === 0) return null;

    const roundLabels: Record<number, string> = {
      1: 'Round 1',
      2: 'Semifinals',
      3: 'Conference Finals',
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="text-center mb-1">
          <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
            {roundLabels[roundNumber] || roundName}
          </div>
          <div className="h-px bg-gray-300 w-full mt-0.5"></div>
        </div>
        <div className="flex flex-col gap-1.5">
          {roundSeries.map((series) => renderMatchup(series, false))}
        </div>
      </div>
    );
  };

  // Render Play-In round
  const renderPlayIn = (playInSeries: PlayoffSeriesWithGames[], conference: 'East' | 'West') => {
    if (playInSeries.length === 0) return null;

    return (
      <div className="flex flex-col gap-2">
        <div className="text-center mb-1">
          <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
            Play-In
          </div>
          <div className="h-px bg-gray-300 w-full mt-0.5"></div>
        </div>
        <div className="flex flex-col gap-1.5">
          {playInSeries.map((series) => renderMatchup(series, false))}
        </div>
      </div>
    );
  };

  // Render Finals
  const renderFinals = () => {
    if (organizedBracket.finals.length === 0) return null;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-center mb-1">
          <div className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            NBA Finals
          </div>
          <div className="h-px bg-gray-300 w-full max-w-xs mt-0.5"></div>
        </div>
        {organizedBracket.finals.map((series) => renderMatchup(series, true))}
      </div>
    );
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header - Compact */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-0.5">
          Playoff Bracket
        </h3>
        {playerName && (
          <div className="text-sm font-semibold text-gray-700 mb-0.5">
            {playerName}
          </div>
        )}
        <div className="text-xs text-gray-600">
          {season.year_start}–{season.year_end} Season
        </div>
      </div>

      {/* Bracket Layout - Compact */}
      {/* Layout: West (left) → Finals (center) ← East (right) */}
      {/* Rounds face inwards: West goes left-to-right, East goes right-to-left */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 justify-center items-start">
        {/* Western Conference - LEFT SIDE */}
        <div className="flex-1">
          <div className="text-center mb-3">
            <div className="text-sm font-bold text-gray-900 mb-0.5">Western Conference</div>
            <div className="h-px bg-gray-300 w-20 mx-auto"></div>
          </div>
          <div className="flex flex-row gap-3 justify-start overflow-x-auto pb-2">
            {/* Play-In (furthest left - outside) */}
            {organizedBracket.westPlayIn.length > 0 && (
              <div>{renderPlayIn(organizedBracket.westPlayIn, 'West')}</div>
            )}
            {/* Regular Rounds - left to right (facing inwards) */}
            {[1, 2, 3].map(roundNum => {
              const roundSeries = organizedBracket.west[roundNum] || [];
              if (roundSeries.length === 0) return null;
              const roundName = roundSeries[0]?.round_name || '';
              return (
                <div key={`west-${roundNum}`}>
                  {renderRound(roundSeries, roundName, roundNum, 'West')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Finals - Centered */}
        <div className="flex-shrink-0 lg:px-4">
          {renderFinals()}
        </div>

        {/* Eastern Conference - RIGHT SIDE */}
        <div className="flex-1">
          <div className="text-center mb-3">
            <div className="text-sm font-bold text-gray-900 mb-0.5">Eastern Conference</div>
            <div className="h-px bg-gray-300 w-20 mx-auto"></div>
          </div>
          <div className="flex flex-row-reverse gap-3 justify-start overflow-x-auto pb-2">
            {/* Play-In (furthest right - outside) */}
            {organizedBracket.eastPlayIn.length > 0 && (
              <div>{renderPlayIn(organizedBracket.eastPlayIn, 'East')}</div>
            )}
            {/* Regular Rounds - right to left (facing inwards) - REVERSED ORDER */}
            {[3, 2, 1].map(roundNum => {
              const roundSeries = organizedBracket.east[roundNum] || [];
              if (roundSeries.length === 0) return null;
              const roundName = roundSeries[0]?.round_name || '';
              return (
                <div key={`east-${roundNum}`}>
                  {renderRound(roundSeries, roundName, roundNum, 'East')}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
