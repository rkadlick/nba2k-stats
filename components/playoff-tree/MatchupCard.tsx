import React from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PlayerGameStatsWithDetails } from "@/lib/types";
import { PlayoffSeriesWithGames } from "@/hooks/filter/usePlayoffSeries";
import { getStatsFromGame } from "@/lib/statHelpers";
import { getTeamAbbreviation } from "@/lib/teamAbbreviations";
import { getTeamColor } from "@/lib/teamColors";
import { getTeamLogoUrl } from "@/lib/teamLogos";
import Image from "next/image";

interface MatchupCardProps {
  series: PlayoffSeriesWithGames;
  isSelected?: boolean;
  onClick?: () => void;
}

export function MatchupCard({ series, isSelected, onClick }: MatchupCardProps) {
  const hasPlayerGames = series.games && series.games.length > 0;
  console.log("hasPlayerGames", series.games);

  // Determine if this is a play-in round (round_number = 0 or contains "play-in")
  const isPlayInRound =
    series.round_number === 0 ||
    series.round_name.toLowerCase().includes("play-in") ||
    series.round_name.toLowerCase().includes("play in");

  const winnerId = series.winner_team_id;
  // For play-in rounds, a team wins with just 1 win (best of 1)
  const team1Won =
    winnerId === series.team1_id ||
    (isPlayInRound && series.team1_wins === 1 && series.team2_wins === 0);
  const team2Won =
    winnerId === series.team2_id ||
    (isPlayInRound && series.team2_wins === 1 && series.team1_wins === 0);
  const isComplete =
    series.is_complete || (isPlayInRound && (team1Won || team2Won));

  // Get team colors for winners
  const team1Team = series.team1_id
    ? { id: series.team1_id, name: series.team1Display || "" }
    : null;
  const team2Team = series.team2_id
    ? { id: series.team2_id, name: series.team2Display || "" }
    : null;

  const team1Primary = team1Team
    ? getTeamColor(team1Team.name, "primary")
    : "#000000";
  const team1OnPrimary = team1Team
    ? getTeamColor(team1Team.name, "onPrimary")
    : "#ffffff";
  const team2Primary = team2Team
    ? getTeamColor(team2Team.name, "primary")
    : "#000000";
  const team2OnPrimary = team2Team
    ? getTeamColor(team2Team.name, "onPrimary")
    : "#ffffff";

  return (
    <div
      className={`relative bg-white p-2 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? "border-purple-500 shadow-md"
          : isSelected
          ? "border-amber-400 bg-amber-50"
          : "border-gray-200 hover:border-gray-400"
      } shadow-sm`}
      onClick={onClick}
    >
      {/* Team 1 */}
      <div
        className={`flex items-center justify-between py-1 px-1.5 rounded text-xs ${
          team1Won && isComplete ? `border` : "bg-gray-50"
        }`}
        style={
          team1Won && isComplete
            ? {
                backgroundColor: team1Primary,
                color: team1OnPrimary,
                borderColor: team1Primary,
              }
            : {}
        }
      >
        <div className="flex items-center gap-1.5">
          {series.team1_seed && (
            <span
              className={`text-[10px] font-bold ${
                team1Won && isComplete ? "opacity-90" : "text-gray-700"
              }`}
            >
              ({series.team1_seed})
            </span>
          )}
          {getTeamLogoUrl(series.team1Display) && (
            <Image
              src={getTeamLogoUrl(series.team1Display)!}
              alt={`${series.team1Display} logo`}
              width={16}
              height={16}
              className="flex-shrink-0"
            />
          )}
          <span
            className={`font-semibold ${
              team1Won && isComplete ? "" : "text-gray-900"
            }`}
          >
            {series.team1Abbrev}
          </span>
        </div>
        {series.team1_wins !== undefined && (
          <span
            className={`font-bold text-xs ${
              team1Won && isComplete ? "" : "text-gray-600"
            }`}
          >
            {series.team1_wins}
          </span>
        )}
      </div>

      {/* Team 2 */}
      <div
        className={`flex items-center justify-between py-1 px-1.5 rounded mt-0.5 text-xs ${
          team2Won && isComplete ? `border` : "bg-gray-50"
        }`}
        style={
          team2Won && isComplete
            ? {
                backgroundColor: team2Primary,
                color: team2OnPrimary,
                borderColor: team2Primary,
              }
            : {}
        }
      >
        <div className="flex items-center gap-1.5">
          {series.team2_seed && (
            <span
              className={`text-[10px] font-bold ${
                team2Won && isComplete ? "opacity-90" : "text-gray-700"
              }`}
            >
              ({series.team2_seed})
            </span>
          )}
          {getTeamLogoUrl(series.team2Display) && (
            <Image
              src={getTeamLogoUrl(series.team2Display)!}
              alt={`${series.team2Display} logo`}
              width={16}
              height={16}
              className="flex-shrink-0"
            />
          )}
          <span
            className={`font-semibold ${
              team2Won && isComplete ? "" : "text-gray-900"
            }`}
          >
            {series.team2Abbrev}
          </span>
        </div>
        {series.team2_wins !== undefined && (
          <span
            className={`font-bold text-xs ${
              team2Won && isComplete ? "" : "text-gray-600"
            }`}
          >
            {series.team2_wins}
          </span>
        )}
      </div>

      {/* Player games indicator */}
      {hasPlayerGames && (
        <div className="mt-1 text-[10px] text-blue-600 font-medium text-center">
          {series.games?.length} game{series.games?.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Expanded games view */}
      {isSelected && hasPlayerGames && series.games && (
        <div className="border-t border-gray-200 bg-white py-1 text-center rounded-b">
          <div className="space-y-1">
            {series.games.map((game, gameIdx) => {
              const opponentName =
                game.opponent_team?.name ||
                game.opponent_team_name ||
                "Unknown";
              const opponentAbbrev = getTeamAbbreviation(opponentName);
              const isHome = game.is_home;
              const gameStats = getStatsFromGame(game);
              return (
                <div
                  key={game.id || gameIdx}
                  className="w-full p-1 border-b border-gray-200 text-[10px]"
                >
                  <div className="flex justify-between items-center mb-0.5">
  {/* Game number on left */}
  <div className="text-[9px] text-gray-600 font-medium">
    Game {game.playoff_game_number || (gameIdx + 1)}
  </div>
  
  {/* Score and W/L on right */}
  <div className="font-medium text-gray-900">
    {game.player_score}-{game.opponent_score}{" "}
    <span
      className={`font-bold ${
        game.is_win ? "text-green-600" : "text-red-600"
      }`}
    >
      {game.is_win ? "W" : "L"}
    </span>
  </div>
</div>
                  <div className="grid grid-cols-3 gap-2 text-center mt-1">
                    {/* Labels row */}
                    <div className="text-[8px] text-gray-500 uppercase tracking-wider">
                      PTS
                    </div>
                    <div className="text-[8px] text-gray-500 uppercase tracking-wider">
                      REB
                    </div>
                    <div className="text-[8px] text-gray-500 uppercase tracking-wider">
                      AST
                    </div>

                    {/* Numbers row */}
                    <div className="text-[9px] font-semibold text-gray-800">
                      {game.points || 0}
                    </div>
                    <div className="text-[9px] font-semibold text-gray-800">
                      {game.rebounds || 0}
                    </div>
                    <div className="text-[9px] font-semibold text-gray-800">
                      {game.assists || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
