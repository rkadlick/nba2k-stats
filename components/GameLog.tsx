import { PlayerGameStatsWithDetails } from "@/lib/types";
import React, { useEffect, useMemo, useState } from "react";
import { getTeamAbbreviation } from "@/lib/teamAbbreviations";

export function GameLog({
  games,
  statKeys,
  getStatTooltip,
  getStatLabel,
  getStatValue,
  isEditMode,
  onEditGame,
  onDeleteGame,
  playerTeamColor,
  showKeyGames,
}: {
  games: PlayerGameStatsWithDetails[];
  statKeys: string[];
  getStatTooltip: (key: string) => string;
  getStatLabel: (key: string) => string;
  getStatValue: (game: PlayerGameStatsWithDetails, key: string) => string;
  isEditMode: boolean;
  onEditGame: (game: PlayerGameStatsWithDetails) => void;
  onDeleteGame: (gameId: string) => void;
  playerTeamColor: string;
  showKeyGames: boolean;
}) {
  // Pagination state: show most recent 10 games initially
  const INITIAL_GAMES_COUNT = 10;
  const GAMES_PER_PAGE = 10;
  const [visibleGamesCount, setVisibleGamesCount] =
    useState(INITIAL_GAMES_COUNT);

  // Reset pagination when stats change (e.g., switching seasons or views)
  // Using stats array reference ensures reset when switching between filtered views (Home/Away/Key Games)
  useEffect(() => {
    setTimeout(() => {
      setVisibleGamesCount(INITIAL_GAMES_COUNT);
    }, 0);
  }, [games]);
  const getOpponentDisplay = (game: PlayerGameStatsWithDetails) => {
    const teamName =
      game.opponent_team?.name || game.opponent_team_name || "Unknown";
    const abbrev = getTeamAbbreviation(teamName);
    return game.is_home ? `vs ${abbrev}` : `@ ${abbrev}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Sort games by date (most recent first) and slice to visible count
  const sortedGames = useMemo(() => {
    return [...games].sort(
      (a, b) =>
        new Date(b.game_date || b.created_at || "").getTime() -
        new Date(a.game_date || a.created_at || "").getTime()
    );
  }, [games]);

  const visibleGames = sortedGames.slice(0, visibleGamesCount);
  const hasMoreGames = sortedGames.length > visibleGamesCount;
  const canShowLess = visibleGamesCount > INITIAL_GAMES_COUNT;

  const handleShowMore = () => {
    setVisibleGamesCount((prev) =>
      Math.min(prev + GAMES_PER_PAGE, sortedGames.length)
    );
  };

  const handleShowLess = () => {
    setVisibleGamesCount(INITIAL_GAMES_COUNT);
  };
  return (
    <>
      {/* Scrollable table body */}
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="text-left px-1.5 py-1 font-semibold text-xs text-gray-700">
                Date
              </th>
              <th className="text-left px-1.5 py-1 font-semibold text-xs text-gray-700">
                Opp
              </th>
              <th className="text-center px-1.5 py-1 font-semibold text-xs text-gray-700">
                W/L
              </th>
              {isEditMode && (
                <th className="text-center px-1 py-1 font-semibold text-xs text-gray-700 w-16">
                  Actions
                </th>
              )}
              {statKeys.map((key) => {
                const tooltip = getStatTooltip(key);
                return (
                  <th
                    key={key}
                    className="text-right px-1.5 py-1 font-semibold text-xs text-gray-700 whitespace-nowrap"
                    title={tooltip || undefined}
                  >
                    {getStatLabel(key)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleGames.map((game) => {
              return (
                <tr
                  key={game.id}
                  className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                >
                  <td className="px-1.5 py-0.5 text-xs text-gray-900 whitespace-nowrap">
                    {formatDate(game.game_date || game.created_at || "")}
                  </td>
                  <td className="px-1.5 py-0.5 text-xs font-medium text-gray-900">
                    <div className="flex items-center gap-1">
                      {getOpponentDisplay(game)}
                      {showKeyGames && game.is_key_game && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="inline-block align-middle flex-shrink-0"
                          style={{
                            color: playerTeamColor || "#000000",
                          }}
                        >
                          <title>Key Game</title>
                          {/* Fancy 4-pointed star */}
                          <path
                            d="M12 2L14.5 9L22 9L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9L9.5 9L12 2Z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="0.5"
                          />
                        </svg>
                      )}
                    </div>
                    {game.is_playoff_game && (
                      <div className="text-[10px] text-purple-600 font-semibold mt-0.5">
                        PO
                      </div>
                    )}
                  </td>
                  <td className="px-1.5 py-0.5 text-center text-xs text-gray-900">
                    <div
                      className={`inline-block px-1 py-0.5 text-[10px] font-semibold rounded ${
                        game.is_win
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {game.is_win ? "W" : "L"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {game.is_win
                        ? `${game.player_score}-${game.opponent_score}`
                        : `${game.opponent_score}-${game.player_score}`}
                    </div>
                  </td>
                  {isEditMode && (
                    <td className="px-1 py-0.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {onEditGame && (
                          <button
                            onClick={() => onEditGame(game)}
                            className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Edit game"
                          >
                            Edit
                          </button>
                        )}
                        {onDeleteGame && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this game?"
                                )
                              ) {
                                onDeleteGame(game.id);
                              }
                            }}
                            className="px-1.5 py-0.5 text-[10px] font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Delete game"
                          >
                            Del
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  {statKeys.map((key) => {
                    return (
                      <td
                        key={key}
                        className="text-right px-1.5 py-0.5 text-xs text-gray-700 whitespace-nowrap"
                      >
                        {getStatValue(game, key)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      {(hasMoreGames || canShowLess) && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-gray-200 bg-gray-50">
          {hasMoreGames && (
            <button
              onClick={handleShowMore}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              Show More ({sortedGames.length - visibleGamesCount} remaining)
            </button>
          )}
          {canShowLess && (
            <button
              onClick={handleShowLess}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              Show Less
            </button>
          )}
        </div>
      )}
    </>
  );
}
