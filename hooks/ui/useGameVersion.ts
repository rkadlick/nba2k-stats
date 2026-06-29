"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_GAME_VERSION,
  GAME_VERSION_STORAGE_KEY,
  GameVersion,
} from "@/lib/constants";
import { getAvailableGameVersions } from "@/lib/playerUtils";
import { Player } from "@/lib/types";

export function useGameVersion(players: Player[]) {
  const availableVersions = getAvailableGameVersions(players);
  const [gameVersion, setGameVersionState] = useState<GameVersion>(
    DEFAULT_GAME_VERSION
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(GAME_VERSION_STORAGE_KEY);
    if (stored) {
      setGameVersionState(stored as GameVersion);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || availableVersions.length === 0) return;
    if (!availableVersions.includes(gameVersion)) {
      setGameVersionState(availableVersions[0] as GameVersion);
    }
  }, [availableVersions, gameVersion, hydrated]);

  const setGameVersion = useCallback((version: GameVersion) => {
    setGameVersionState(version);
    localStorage.setItem(GAME_VERSION_STORAGE_KEY, version);
  }, []);

  const versionsForSelect =
    availableVersions.length > 0 ? availableVersions : [DEFAULT_GAME_VERSION];

  return {
    gameVersion,
    setGameVersion,
    availableVersions: versionsForSelect,
    hydrated,
  };
}
