"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { Player, PlayerGameStatsWithDetails, User } from "@/lib/types";
import { getDisplayHeadline } from "@/lib/playerNameUtils";

interface HeadlineDisplayContextValue {
  resolveHeadline: (game: PlayerGameStatsWithDetails) => string | null;
}

const HeadlineDisplayContext =
  createContext<HeadlineDisplayContextValue | null>(null);

interface HeadlineDisplayProviderProps {
  children: ReactNode;
  publicPlayers: Player[];
  privateNamesById: Record<string, string>;
  currentUser: User | null;
}

export function HeadlineDisplayProvider({
  children,
  publicPlayers,
  privateNamesById,
  currentUser,
}: HeadlineDisplayProviderProps) {
  const value = useMemo<HeadlineDisplayContextValue>(
    () => ({
      resolveHeadline(game: PlayerGameStatsWithDetails) {
        return getDisplayHeadline(
          game,
          publicPlayers,
          privateNamesById,
          currentUser
        );
      },
    }),
    [publicPlayers, privateNamesById, currentUser]
  );

  return (
    <HeadlineDisplayContext.Provider value={value}>
      {children}
    </HeadlineDisplayContext.Provider>
  );
}

export function useHeadlineDisplay(): HeadlineDisplayContextValue {
  const context = useContext(HeadlineDisplayContext);
  if (!context) {
    return {
      resolveHeadline(game) {
        if (game.headline) return game.headline;
        if (game.headline_status === "pending") return "Generating headline...";
        return null;
      },
    };
  }
  return context;
}
