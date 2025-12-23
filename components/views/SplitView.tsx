"use client";

import { PlayerWithTeam, PlayerGameStatsWithDetails, Award, Season, User } from "@/lib/types";
import PlayerPanel from "@/components/player-panel";
import PlayoffTree from "@/components/playoff-tree";
import { getDisplayPlayerName } from "@/lib/playerNameUtils";

interface SplitViewProps {
  players: PlayerWithTeam[];
  player1Stats: PlayerGameStatsWithDetails[];
  player2Stats: PlayerGameStatsWithDetails[];
  player1Awards: Award[];
  player2Awards: Award[];
  seasons: Season[];
  defaultSeason: Season;
  currentUser: User | null;
  getSelectedSeasonForPlayer: (playerId: string) => Season | null;
  onSeasonChange: (playerId: string, season: Season | string) => void;
}

export default function SplitView({
  players,
  player1Stats,
  player2Stats,
  player1Awards,
  player2Awards,
  seasons,
  defaultSeason,
  currentUser,
  getSelectedSeasonForPlayer,
  onSeasonChange,
}: SplitViewProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[calc(100vh-240px)]">
          <PlayerPanel
            player={players[0]}
            allStats={player1Stats}
            awards={player1Awards}
            seasons={seasons}
            defaultSeason={defaultSeason}
            players={players}
            currentUser={currentUser}
            onSeasonChange={(season) => onSeasonChange(players[0].id, season)}
          />
        </div>
        <div className="h-[calc(100vh-240px)]">
          <PlayerPanel
            player={players[1]}
            allStats={player2Stats}
            awards={player2Awards}
            seasons={seasons}
            defaultSeason={defaultSeason}
            players={players}
            currentUser={currentUser}
            onSeasonChange={(season) => onSeasonChange(players[1].id, season)}
          />
        </div>
      </div>

      {/* Playoff Trees - Separate, stacked vertically, full width */}
      <div className="space-y-8 w-full max-w-full">
        {players.map((player, index) => {
          const playerStats =
            index === 0 ? player1Stats : player2Stats;
          const selectedSeasonForPlayer = getSelectedSeasonForPlayer(player.id);
          // Only show playoff tree if a season is selected (not career view)
          if (!selectedSeasonForPlayer) return null;
          return (
            <div key={player.id} className="w-full">
              <PlayoffTree
                season={selectedSeasonForPlayer}
                playerId={player.id}
                playerStats={playerStats.filter((stat) => stat.is_playoff_game)}
                playerName={getDisplayPlayerName(player, currentUser)}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
