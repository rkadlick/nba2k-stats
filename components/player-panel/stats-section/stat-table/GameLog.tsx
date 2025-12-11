import { PlayerGameStatsWithDetails } from "@/lib/types";
import React, { useEffect, useMemo, useState } from "react";
import { getTeamAbbreviation } from "@/lib/teams";
import { getStatsFromGame } from "@/lib/statHelpers";
import { getTeamLogoUrl } from "@/lib/teams";
import Image from "next/image";
import {
  TbTournament,
  TbTrophyFilled,
  TbKeyFilled,
  TbDeviceDesktop,
  TbAlarmFilled,
  TbHandRingFinger,
  TbGhost2,
  TbGiftFilled,
  TbConfetti,
  TbHeartFilled,
  TbClover2,
} from "react-icons/tb";
import { tableSurfaces } from "@/components/stat-table/theme";

export function GameLog({
  games,
  statKeys,
  getStatTooltip,
  getStatLabel,
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
      game.opponent_team?.fullName || game.opponent_team_name || "Unknown";
    const teamIdOrName =
      game.opponent_team?.id || game.opponent_team_id || teamName;
    const abbrev = getTeamAbbreviation(teamIdOrName);
    const teamLogo = getTeamLogoUrl(teamIdOrName);
    return game.is_home ? (
      <>
        vs{" "}
        <Image
          src={teamLogo || ""} // fallback optional
          alt={teamName}
          width={20}
          height={20}
          className="shrink-0 min-w-0 max-w-[20px]"
        />{" "}
        {abbrev}
      </>
    ) : (
      <>
        @{" "}
        <Image
          src={teamLogo || ""}
          alt={teamName}
          width={20}
          height={20}
          className="shrink-0 min-w-0 max-w-[20px]"
        />{" "}
        {abbrev}
      </>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getHolidayIcon = (
    dateStr: string,
    color: string
  ): React.ReactElement | null => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;

    const month = date.getMonth();
    const day = date.getDate();

    if (month === 0 && day === 1) {
      return (
        <TbConfetti
          key="new-years"
          size={16}
          className="flex-shrink-0"
          style={{ color: color || "#000000" }}
          title="New Year's Day"
        />
      );
    }

    if (month === 11 && day === 25) {
      return (
        <TbGiftFilled
          key="christmas"
          size={16}
          className="flex-shrink-0"
          style={{ color: color || "#000000" }}
          title="Christmas"
        />
      );
    }

    if (month === 9 && day === 31) {
      return (
        <TbGhost2
          key="halloween"
          size={16}
          className="flex-shrink-0"
          style={{ color: color || "#000000" }}
          title="Halloween"
        />
      );
    }

    if (month === 1 && day === 14) {
      return (
        <TbHeartFilled
          key="valentines"
          size={16}
          className="flex-shrink-0"
          style={{ color: color || "#000000" }}
          title="Valentine's Day"
        />
      );
    }

    if (month === 2 && day === 17) {
      return (
        <TbClover2
          key="st-patricks"
          size={16}
          className="flex-shrink-0"
          style={{ color: color || "#000000" }}
          title="St. Patrick's Day"
        />
      );
    }

    return null;
  };

  const formatStatValue = (
    game: PlayerGameStatsWithDetails,
    key: string
  ): string => {
    const gameStats = getStatsFromGame(game);
    // Note: double_doubles and triple_doubles should not appear in game rows
    // They are only calculated for season totals

    // Handle combined shooting stats
    if (key === "fg") {
      const made = gameStats.fg_made;
      const attempted = gameStats.fg_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return "–";
    }
    if (key === "threes") {
      const made = gameStats.threes_made;
      const attempted = gameStats.threes_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return "–";
    }
    if (key === "ft") {
      const made = gameStats.ft_made;
      const attempted = gameStats.ft_attempted;
      if (made !== undefined && attempted !== undefined) {
        return `${made}/${attempted}`;
      }
      return "–";
    }

    const value = gameStats[key];
    if (value !== null && value !== undefined) {
      return typeof value === "number"
        ? value.toFixed(value % 1 === 0 ? 0 : 1)
        : String(value);
    }
    return "–";
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
        <table className={`min-w-full table-auto border-collapse ${tableSurfaces.tableBg} ${tableSurfaces.border}`}>
          <thead className={`sticky top-0 z-10 border-b-2 ${tableSurfaces.header} ${tableSurfaces.border}`}>
            <tr>
              <th className="text-left px-1.5 py-1 font-semibold text-xs text-[color:var(--color-text)]">
                Date
              </th>
              <th className="text-left px-1.5 py-1 font-semibold text-xs text-[color:var(--color-text)]">
                Opp
              </th>
              <th className="text-left px-1.5 py-1 font-semibold text-xs text-[color:var(--color-text)]"></th>
              <th className="text-center px-1.5 py-1 font-semibold text-xs text-[color:var(--color-text)]">
                W/L
              </th>
              {isEditMode && (
                <th className="text-center px-1 py-1 font-semibold text-xs text-[color:var(--color-text)] w-16">
                  Actions
                </th>
              )}
              {statKeys.map((key) => {
                const tooltip = getStatTooltip(key);
                return (
                  <th
                    key={key}
                    className="text-right px-1.5 py-1 font-semibold text-xs text-[color:var(--color-text)] whitespace-nowrap"
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
                  className={`border-b ${tableSurfaces.border} ${tableSurfaces.rowHover} ${tableSurfaces.rowFocus} transition-colors`}
                >
                  <td className="px-1.5 py-0.5 text-xs text-[color:var(--color-text)] whitespace-nowrap">
                    {formatDate(game.game_date || game.created_at || "")}
                  </td>
                  <td className="px-1.5 py-0.5 text-xs font-medium text-[color:var(--color-text)] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {getOpponentDisplay(game)}
                    </div>
                  </td>
                  <td className="px-1.5 sm:px-2 md:px-2.5 lg:px-0.75 py-0.5 text-center w-[54px] align-middle">
                    <div className="flex justify-center items-center gap-0.5">
                      {(() => {
                        // Priority: holiday > playoffs > cup games > key games > simulated > overtime
                        const icons = [];

                        // Holiday games (highest priority) - New Year, Christmas, Halloween, Valentine's, St. Patrick's
                        const holidayIcon = getHolidayIcon(
                          game.game_date || "",
                          playerTeamColor || "#000000"
                        );

                        if (holidayIcon) {
                          icons.push(holidayIcon);
                        }

                        // Playoff game (next priority) - TbTournament icon
                        if (game.is_playoff_game) {
                          if (/-fnl(?:-\d+)?$/.test(game.playoff_series_id || "")) {
                            icons.push(
                            <TbHandRingFinger 
                                key="playoff"
                              size={16}
                                className="flex-shrink-0"
                                style={{ color: playerTeamColor || "#000000" }}
                                title="Playoff Game"
                              />
                            );
                          } else {
                            icons.push(
                              <TbTournament
                                key="playoff"
                              size={16}
                                className="flex-shrink-0"
                                style={{ color: playerTeamColor || "#000000" }}
                                title="Playoff Game"
                              />
                            );
                          }

                        }

                        // Cup game (second priority) - TbTrophyFilled icon
                        if (
                          (game as PlayerGameStatsWithDetails & { is_cup_game?: boolean }).is_cup_game &&
                          icons.length < 3
                        ) {
                          icons.push(
                            <TbTrophyFilled
                              key="cup"
                              size={16}
                              className="flex-shrink-0"
                              style={{ color: playerTeamColor || "#000000" }}
                              title="Cup Game"
                            />
                          );
                        }

                        // Key game (third priority) - TbKeyFilled icon
                        if (
                          game.is_key_game &&
                          showKeyGames &&
                          icons.length < 3
                        ) {
                          icons.push(
                            <TbKeyFilled
                              key="key"
                              size={16}
                              className="flex-shrink-0"
                              style={{ color: playerTeamColor || "#000000" }}
                              title="Key Game"
                            />
                          );
                        }

                        // Simulated game (fourth priority) - TbDeviceDesktop icon
                        if (
                          (
                            game as PlayerGameStatsWithDetails & {
                              is_simulated?: boolean;
                            }
                          ).is_simulated &&
                          icons.length < 3
                        ) {
                          icons.push(
                            <TbDeviceDesktop
                              key="simulated"
                              size={16}
                              className="flex-shrink-0"
                              style={{ color: playerTeamColor || "#000000" }}
                              title="Simulated Game"
                            />
                          );
                        }

                        // Overtime game (lowest priority) - TbAlarmFilled icon
                        if (
                          (
                            game as PlayerGameStatsWithDetails & {
                              is_overtime?: boolean;
                            }
                          ).is_overtime &&
                          icons.length < 3
                        ) {
                          icons.push(
                            <TbAlarmFilled
                              key="overtime"
                              size={16}
                              className="flex-shrink-0"
                              style={{ color: playerTeamColor || "#000000" }}
                              title="Overtime Game"
                            />
                          );
                        }

                        // If no icons, show blank spacer for layout consistency
                        if (icons.length === 0) {
                          return (
                            <span className="inline-block w-[16px] h-[16px]" />
                          );
                        }

                        return icons;
                      })()}
                    </div>
                  </td>

                  <td className="px-1.5 py-0.5 text-center text-xs text-[color:var(--color-text)]">
                    <div
                      className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{
                        backgroundColor: game.is_win
                          ? "var(--color-win-bg)"
                          : "var(--color-loss-bg)",
                        color: game.is_win
                          ? "var(--color-win-text)"
                          : "var(--color-loss-text)",
                      }}
                    >
                      {game.is_win ? "W" : "L"}
                    </div>
                    <div className="text-[10px] text-[color:var(--color-text-muted)] mt-0.5">
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
                        className="text-right px-1.5 py-0.5 text-xs text-[color:var(--color-text)] whitespace-nowrap"
                      >
                        {formatStatValue(game, key)}
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
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] transition-colors">
          {hasMoreGames && (
            <button
              onClick={handleShowMore}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            >
              Show More ({sortedGames.length - visibleGamesCount} remaining)
            </button>
          )}
          {canShowLess && (
            <button
              onClick={handleShowLess}
              className="px-3 py-1.5 text-xs font-medium text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)] rounded transition-colors"
            >
              Show Less
            </button>
          )}
        </div>
      )}
    </>
  );
}
