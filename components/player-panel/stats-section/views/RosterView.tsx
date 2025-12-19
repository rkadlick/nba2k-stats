 import React from 'react';
import { RosterEntry } from '@/lib/types';
import { useRoster } from '@/hooks/data/useRoster';

interface RosterViewProps {
  playerId: string;
  seasonId: string;
  playerTeamColor: string;
}

export function RosterView({ playerId, seasonId, playerTeamColor }: RosterViewProps) {
  // Use roster hook to fetch data for this specific player and season
  const rosterResult = useRoster({
    selectedSeason: seasonId,
    playerId: playerId,
    onStatsUpdated: () => {},
  });
  const fetchedRoster = rosterResult.roster;
  const isLoadingRoster = rosterResult.loadingRoster;
  // Use roster hook to fetch data
  const { roster, loadingRoster } = useRoster({
    selectedSeason: seasonId || '',
    onStatsUpdated: () => {} // No need for stats update callback here
  });

  // Filter roster into start and end of season
  const startRoster = fetchedRoster.filter((r) => r.start_end === 'start' || !r.start_end);
  const endRoster = fetchedRoster.filter((r) => r.start_end === 'end');

  // Render roster players
  const renderRosterPlayers = (players: RosterEntry[]) => {
    if (players.length === 0) return null;

    // Sort players with starters first
    const sortedPlayers = players.sort((a, b) => {
      const aIsStarter = a.is_starter ?? false;
      const bIsStarter = b.is_starter ?? false;
      if (aIsStarter && !bIsStarter) return -1;
      if (!aIsStarter && bIsStarter) return 1;
      return 0;
    });

    // Split into starters and bench players
    const starters = sortedPlayers.filter(player => player.is_starter === true);
    const bench = sortedPlayers.filter(player => player.is_starter !== true);

    return (
      <div className="flex flex-col space-y-1">
        {starters.map((player) => (
          <div key={player.id} className="text-center py-0.5">
            <span className="font-bold">
              {player.player_name} &nbsp;•&nbsp; {player.position}
              {player.secondary_position ? ` | ${player.secondary_position}` : ''}
            </span>
          </div>
        ))}

        {starters.length > 0 && bench.length > 0 && (
          <hr className="border-[color:var(--color-border)] my-2" />
        )}

        {bench.map((player) => (
          <div key={player.id} className="text-center py-0.5">
            <span>
              {player.player_name} &nbsp;•&nbsp; {player.position}
              {player.secondary_position ? ` | ${player.secondary_position}` : ''}
            </span>
          </div>
        ))}
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

  if (fetchedRoster.length === 0) {
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
            {renderRosterPlayers(startRoster)}
          </div>
          <div className="text-center">
            <div className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: playerTeamColor }}>
              End of Season
            </div>
            {renderRosterPlayers(endRoster)}
          </div>
        </div>
      </div>
    </div>
  );
}