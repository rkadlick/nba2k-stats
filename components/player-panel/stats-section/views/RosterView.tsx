import React from 'react';
import { RosterEntry, Player, User } from '@/lib/types';
import { useRoster } from '@/hooks/data/useRoster';
import { getDisplayPlayerName } from '@/lib/playerNameUtils';

interface RosterViewProps {
  playerId: string;
  seasonId: string;
  playerTeamColor: string;
  player?: Player | null;
  currentUser?: User | null;
}

export function RosterView({ playerId, seasonId, playerTeamColor, player, currentUser }: RosterViewProps) {
  // Use roster hook to fetch data for this specific player and season
  const rosterResult = useRoster({
    selectedSeason: seasonId,
    playerId: playerId,
    onStatsUpdated: () => {},
  });
  const fetchedRoster = rosterResult.roster;
  const isLoadingRoster = rosterResult.loadingRoster;

  // Filter roster into start and end of season (excluding hardcoded entries)
  const startRoster = fetchedRoster.filter((r) => (r.start_end === 'start' || !r.start_end) && r.id && !String(r.id).startsWith('hardcoded-player'));
  const endRoster = fetchedRoster.filter((r) => r.start_end === 'end' && r.id && !String(r.id).startsWith('hardcoded-player'));
  
  // Only show hardcoded player if there are database entries
  const hasStartEntries = startRoster.length > 0;
  const hasEndEntries = endRoster.length > 0;
  
  // Create hardcoded player entry if player exists
  const hardcodedPlayerEntry = player ? {
    id: 'hardcoded-player',
    player_name: getDisplayPlayerName(player, currentUser ?? null),
    position: 'PG' as const,
    secondary_position: null,
    overall: 99,
    is_starter: true,
  } : null;

  // Position order for sorting starters
  const getPositionOrder = (position: string): number => {
    const order: Record<string, number> = { 'PG': 0, 'SG': 1, 'SF': 2, 'PF': 3, 'C': 4 };
    return order[position] ?? 99; // Unknown positions go to end
  };

  // Helper function to get overall badge color for end of season
  const getOverallBadgeColor = (player: RosterEntry, startEnd: 'start' | 'end'): string => {
    if (startEnd === 'start') {
      return 'bg-blue-100 text-blue-800';
    }
    
    // For end of season, compare with start overall
    const startPlayer = startRoster.find(p => p.player_name === player.player_name);
    
    // If player doesn't exist in start roster, use blue
    if (!startPlayer || startPlayer.overall === undefined || startPlayer.overall === null) {
      return 'bg-blue-100 text-blue-800';
    }
    
    const startOverall = startPlayer.overall;
    const endOverall = player.overall ?? startOverall;
    
    if (endOverall > startOverall) {
      return 'bg-green-100 text-green-800'; // Went up
    } else if (endOverall < startOverall) {
      return 'bg-red-100 text-red-800'; // Went down
    } else {
      return 'bg-blue-100 text-blue-800'; // Stayed same
    }
  };

  // Render roster players
  const renderRosterPlayers = (players: RosterEntry[], showHardcoded: boolean, startEnd: 'start' | 'end') => {
    // Combine hardcoded player with database players if needed
    const allPlayers = [...players];
    if (showHardcoded && hardcodedPlayerEntry) {
      // Add hardcoded player as first starter
      allPlayers.unshift({
        ...hardcodedPlayerEntry,
        id: `hardcoded-player-${startEnd}`,
        player_id: player?.id,
        season_id: seasonId,
        start_end: startEnd,
      } as RosterEntry);
    }

    if (allPlayers.length === 0) return null;

    // Split into starters and bench players
    const starters = allPlayers.filter(player => player.is_starter === true);
    const bench = allPlayers.filter(player => player.is_starter !== true);

    // Sort starters by position (PG, SG, SF, PF, C)
    const sortedStarters = starters.sort((a, b) => {
      const aOrder = getPositionOrder(a.position || '');
      const bOrder = getPositionOrder(b.position || '');
      return aOrder - bOrder;
    });

    // Sort bench by overall (highest to lowest)
    const sortedBench = bench.sort((a, b) => {
      const aOverall = a.overall ?? 0;
      const bOverall = b.overall ?? 0;
      return bOverall - aOverall; // Descending order
    });

    const renderPlayerRow = (player: RosterEntry, isStarter: boolean) => (
      <div key={player.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-1.5 gap-y-0 items-center py-0.5 px-4">
        <span className={`${isStarter ? 'font-bold' : ''} text-left truncate`}>{player.player_name}</span>
        <span 
          className="px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap justify-self-start"
          style={{ 
            backgroundColor: `${playerTeamColor}20`, 
            color: playerTeamColor 
          }}
        >
          {player.position}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap justify-self-start ${
          player.secondary_position ? 'bg-gray-200 text-gray-700' : 'opacity-0 pointer-events-none'
        }`}>
          {player.secondary_position || '—'}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap justify-self-start ${
          player.overall ? getOverallBadgeColor(player, startEnd) : 'opacity-0 pointer-events-none'
        }`}>
          {player.overall ? `OVR ${player.overall}` : '—'}
        </span>
      </div>
    );

    return (
      <div className="flex flex-col space-y-1">
        {sortedStarters.map((player) => renderPlayerRow(player, true))}

        {sortedStarters.length > 0 && sortedBench.length > 0 && (
          <hr className="border-[color:var(--color-border)] my-2" />
        )}

        {sortedBench.map((player) => renderPlayerRow(player, false))}
      </div>
    );
  };

  if (isLoadingRoster) {
    return (
      <div className="text-xs text-[color:var(--color-text-muted)]">
        Loading roster...
      </div>
    );
  }

  // Only show if there are database entries (hardcoded player doesn't count)
  if (startRoster.length === 0 && endRoster.length === 0) {
    return (
      <div className="text-xs text-[color:var(--color-text-muted)]">
        No roster data available
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">
        Roster
      </h3>
      <div className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm text-[color:var(--color-text)]">
          <div className="text-center">
            <div className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: playerTeamColor }}>
              Start of Season
            </div>
            {renderRosterPlayers(startRoster, hasStartEntries, 'start')}
          </div>
          <div className="text-center">
            <div className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: playerTeamColor }}>
              End of Season
            </div>
            {renderRosterPlayers(endRoster, hasEndEntries, 'end')}
          </div>
        </div>
      </div>
    </div>
  );
}