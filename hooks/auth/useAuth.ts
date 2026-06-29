"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { User, Player } from "@/lib/types";
import { logger } from "@/lib/logger";
import { Session } from "@supabase/supabase-js";
import { DEFAULT_GAME_VERSION } from "@/lib/constants";
import { getPlayerForUser } from "@/lib/playerUtils";

export function useAuth(gameVersion: string = DEFAULT_GAME_VERSION) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userPlayers, setUserPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const currentPlayer = useMemo(
    () =>
      userId
        ? getPlayerForUser(userPlayers, userId, gameVersion) ?? userPlayers[0] ?? null
        : null,
    [userPlayers, userId, gameVersion]
  );

  const loadPlayersForUser = async (uid: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error loading players for user:", error);
      return [];
    }
    return (data ?? []) as Player[];
  };

  const loadUserProfile = async (uid: string) => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (error) {
      logger.error("Error loading user profile:", error);
      return null;
    }

    return data as User;
  };

  const handleLogout = async () => {
    try {
      setCurrentUser(null);
      setUserPlayers([]);
      setUserId(null);
      setLoading(true);

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error("Error signing out:", error);
        }

        if (typeof window !== "undefined") {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              (key.startsWith("sb-") || key.includes("supabase.auth"))
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      window.location.href = "/login";
    } catch (error) {
      logger.error("Error during logout:", error);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase?.auth.getSession() as { data: { session: Session } };

        if (session) {
          const [userProfile, playersData] = await Promise.all([
            loadUserProfile(session.user.id),
            loadPlayersForUser(session.user.id),
          ]);

          setCurrentUser(userProfile);
          setUserPlayers(playersData);
          setUserId(session.user.id);
        } else {
          setCurrentUser(null);
          setUserPlayers([]);
          setUserId(null);
        }
      } catch (error) {
        logger.error("Error initializing auth:", error);
        setCurrentUser(null);
        setUserPlayers([]);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return {
    currentUser,
    currentPlayer,
    userPlayers,
    loading,
    handleLogout,
    userId,
  };
}
