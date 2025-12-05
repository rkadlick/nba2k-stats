"use client";

import { PlayerWithTeam, PlayerGameStatsWithDetails, PlayerAwardInfo, Award, Season, Team, User, ViewMode } from "@/lib/types";
import PlayerPanel from "@/components/player-panel";
import PlayoffTree from "@/components/playoff-tree";
import { getDisplayPlayerName } from "@/lib/playerNameUtils";

interface PlayerViewProps {
  player: PlayerWithTeam;
  playerStats: PlayerGameStatsWithDetails[];
  playerAwards: PlayerAwardInfo[];
  allSeasonAwards: Award[];
  seasons: Season[];
  defaultSeason: Season;
  teams: Team[];
  currentUser: User | null;
  isEditMode: boolean;
  selectedSeason: Season | null;
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
  onStatsUpdated: () => void;
  onSeasonChange: (season: Season | string) => void;
}

export default function PlayerView({
  player,
  playerStats,
  playerAwards,
  allSeasonAwards,
  seasons,
  defaultSeason,
  teams,
  currentUser,
  isEditMode,
  selectedSeason,
  onEditGame,
  onDeleteGame,
  onStatsUpdated,
  onSeasonChange,
}: PlayerViewProps) {
  return (
    <>
      <div className="h-[calc(100vh-240px)] max-w-[90%] mx-auto">
        <PlayerPanel
          player={player}
          allStats={playerStats}
          awards={playerAwards}
          allSeasonAwards={allSeasonAwards}
          seasons={seasons}
          defaultSeason={defaultSeason}
          teams={teams}
          currentUser={currentUser}
          isEditMode={isEditMode}
          onEditGame={onEditGame}
          onDeleteGame={onDeleteGame}
          onStatsUpdated={onStatsUpdated}
          onSeasonChange={onSeasonChange}
        />
      </div>

      {/* Playoff Tree - Separate, full width */}
      <div className="w-full max-w-full mt-8">
        {(() => {
          if (!selectedSeason) return null; // Don't show in career view
          return (
            <PlayoffTree
              season={selectedSeason}
              playerId={player.id}
              playerStats={playerStats.filter((stat) => stat.is_playoff_game)}
              playerTeamName={player.team?.name}
              playerName={getDisplayPlayerName(player, currentUser)}
              teams={teams}
            />
          );
        })()}
      </div>
    </>
  );
}
