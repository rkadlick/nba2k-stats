"use client";

import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { User, Player } from "@/lib/types";
import { logger } from "@/lib/logger";
import { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fix: Don't set state in this function, just return the data
  const getPlayerIdForUser = async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("players")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (error) {
      logger.error("Error loading player id for user:", error);
      return null;
    }
    // Return the full player data instead of just setting state
    return data as Player;
  };

  const loadUserProfile = async (userId: string) => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      logger.error("Error loading user profile:", error);
      return null;
    }

    return data as User;
  };

  const handleLogout = async () => {
    try {
      // Clear local state first to prevent any race conditions
      setCurrentUser(null);
      setCurrentPlayer(null);
      setUserId(null);
      setLoading(true); // This is fine here since it's in an async function

      if (isSupabaseConfigured && supabase) {
        // Sign out and wait for it to complete
        const { error } = await supabase.auth.signOut();
        if (error) {
          logger.error("Error signing out:", error);
        }

        // Clear all Supabase auth-related localStorage items
        // This ensures the session is fully cleared in localhost
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

        // Wait a moment to ensure everything is cleared
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Use window.location.href for a hard redirect to ensure session is cleared
      // This works better in localhost where router.push might not fully clear state
      window.location.href = "/login";
    } catch (error) {
      logger.error("Error during logout:", error);
      // Force redirect even on error
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    // Check authentication and load data (allow public access)
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase?.auth.getSession() as { data: { session: Session } };
        
        if (session) {
          // Load user profile and player data
          const [userProfile, playerData] = await Promise.all([
            loadUserProfile(session.user.id),
            getPlayerIdForUser(session.user.id)
          ]);
          
          // Set all state at once to avoid cascading renders
          setCurrentUser(userProfile);
          setCurrentPlayer(playerData);
          setUserId(session.user.id);
        } else {
          setCurrentUser(null);
          setCurrentPlayer(null);
          setUserId(null);
        }
      } catch (error) {
        logger.error("Error initializing auth:", error);
        setCurrentUser(null);
        setCurrentPlayer(null);
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
    loading,
    handleLogout,
    userId,
  };
}