"use client";

import { PlayerWithTeam, PlayerGameStatsWithDetails, PlayerAwardInfo, Award, Season, Team, User } from "@/lib/types";
import PlayerPanel from "@/components/player-panel";
import PlayoffTree from "@/components/playoff-tree";
import { getDisplayPlayerName } from "@/lib/playerNameUtils";

interface SplitViewProps {
  players: PlayerWithTeam[];
  player1Stats: PlayerGameStatsWithDetails[];
  player2Stats: PlayerGameStatsWithDetails[];
  player1Awards: PlayerAwardInfo[];
  player2Awards: PlayerAwardInfo[];
  allSeasonAwards: Award[];
  seasons: Season[];
  defaultSeason: Season;
  teams: Team[];
  currentUser: User | null;
  selectedSeason: Season | null;
  onSeasonChange: (season: Season | string) => void;
}

export default function SplitView({
  players,
  player1Stats,
  player2Stats,
  player1Awards,
  player2Awards,
  allSeasonAwards,
  seasons,
  defaultSeason,
  teams,
  currentUser,
  selectedSeason,
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
            allSeasonAwards={allSeasonAwards}
            seasons={seasons}
            defaultSeason={defaultSeason}
            teams={teams}
            players={players}
            currentUser={currentUser}
            onSeasonChange={onSeasonChange}
          />
        </div>
        <div className="h-[calc(100vh-240px)]">
          <PlayerPanel
            player={players[1]}
            allStats={player2Stats}
            awards={player2Awards}
            allSeasonAwards={allSeasonAwards}
            seasons={seasons}
            defaultSeason={defaultSeason}
            teams={teams}
            players={players}
            currentUser={currentUser}
            onSeasonChange={onSeasonChange}
          />
        </div>
      </div>

      {/* Playoff Trees - Separate, stacked vertically, full width */}
      <div className="space-y-8 w-full max-w-full">
        {players.map((player, index) => {
          const playerStats =
            index === 0 ? player1Stats : player2Stats;
          // Only show playoff tree if a season is selected (not career view)
          if (!selectedSeason) return null;
          return (
            <div key={player.id} className="w-full">
              <PlayoffTree
                season={selectedSeason}
                playerId={player.id}
                playerStats={playerStats.filter((stat) => stat.is_playoff_game)}
                playerTeamName={player.team?.name}
                playerName={getDisplayPlayerName(player, currentUser)}
                teams={teams}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
