"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Player, Award, User } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";

interface UseAwardsDataProps {
  selectedSeason?: string | null;
  currentUser?: User | null;
  currentUserPlayer?: Player | null;
  players?: Player[];
  onStatsUpdated?: () => void;
}

interface UseAwardsDataReturn {
  awards: Award[];
  awardFormData: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter: boolean;
  };
  setAwardFormData: React.Dispatch<
    React.SetStateAction<{
      award_name: string;
      winner_player_name: string;
      winner_team_id: string;
      allstar_starter: boolean;
    }>
  >;
  handleAddAward: (newAward?: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter?: boolean;
  }) => Promise<void>;
  handleUpdateAward: (award: Award) => Promise<void>;
  handleDeleteAward: (awardId: string) => Promise<void>;
  onAwardFormChange: (data: Partial<{
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter: boolean;
  }>) => void;
  reload: () => Promise<void>;
  loading: boolean;
}

export const useAwardsData = ({
  selectedSeason = null,
  currentUser = null,
  currentUserPlayer = null,
  players = [],
  onStatsUpdated,
}: UseAwardsDataProps = {}): UseAwardsDataReturn => {
  const [awards, setAwards] = useState<Award[]>([]);
  const [awardFormData, setAwardFormData] = useState({
    award_name: "",
    winner_player_name: "",
    winner_team_id: "",
    allstar_starter: false,
  });
  const [loading, setLoading] = useState(true);
  const { success, error: showError, warning } = useToast();

  const loadAwards = useCallback(async () => {
    setLoading(true);
    if (!supabase) return;

    const tableName = currentUser ? "awards" : "awards_public";

    try {
      let query = supabase.from(tableName).select("*").order("award_name");

      // Only filter by season if provided
      if (selectedSeason) {
        query = query.eq("season_id", selectedSeason);
      }
      
      // ALWAYS filter by player_id when currentUserPlayer is provided
      // This ensures AwardsTab only shows the current player's awards
      // When logged out, we want all awards from awards_public (no player_id filter)
      if (currentUserPlayer?.id) {
        query = query.eq("player_id", currentUserPlayer.id);
      }

      const { data, error, status } = await query;


      if (error) {
        console.error("Error loading awards:", error);
      } else {
        setAwards(data || []);
      }
    } catch (error) {
      console.error("Error loading awards:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentUserPlayer, selectedSeason]);

  useEffect(() => {
    loadAwards();
  }, [loadAwards]);

  const handleAddAward = async (newAward?: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter?: boolean;
  }) => {
    const data = newAward || awardFormData;
    console.log("data", data);
    if (!data.award_name || !supabase || !currentUser) {
      if (!data.award_name) warning("Please enter an award name");
      return;
    }

    try {
      const winnerPlayerName = data.winner_player_name?.trim();
      let winnerPlayerId: string | null = null;

      if (winnerPlayerName) {
        const match = players.find(
          (p) =>
            p.player_name.trim().toLowerCase() ===
            winnerPlayerName.toLowerCase()
        );
        winnerPlayerId = match?.id || null;
      }

      const insertPayload: any = {
        player_id: currentUserPlayer?.id || null,
        season_id: selectedSeason,
        award_name: data.award_name,
        winner_player_name: winnerPlayerName || null,
        winner_player_id: winnerPlayerId || null,
        winner_team_id: data.winner_team_id || null,
        is_league_award: true,
        allstar_starter: data.allstar_starter ?? false,
      };

      delete insertPayload.id;

      const { error } = await supabase.from("awards").insert([insertPayload]);
      if (error) throw error;

      setAwardFormData({
        award_name: "",
        winner_player_name: "",
        winner_team_id: "",
        allstar_starter: false,
      });

      await loadAwards();
      success("Award added successfully");
      // Only call onStatsUpdated if provided (for main page refresh, not modal)
      // Modal handles its own state updates via loadAwards()
      onStatsUpdated?.();
    } catch (err: any) {
      console.error("Error adding award:", err);
      showError("Failed to add award: " + (err.message || "Unknown error"));
    }
  };

  const handleUpdateAward = async (award: Award) => {
    if (!supabase || !currentUser || !currentUserPlayer) return;

    // Validate that we have a valid award ID
    if (!award.id || award.id.startsWith("temp-")) {
      console.error("Cannot update award without valid ID:", award.id);
      return;
    }

    try {
      const winnerPlayerName = award.winner_player_name?.trim();
      let winnerPlayerId: string | null = null;

      if (winnerPlayerName) {
        const match = players.find(
          (p) =>
            p.player_name.trim().toLowerCase() ===
            winnerPlayerName.toLowerCase()
        );
        winnerPlayerId = match?.id || null;
      }

      // Don't include id in update payload - Supabase doesn't allow updating primary keys
      const updatePayload: any = {
        player_id: currentUserPlayer.id,
        award_name: award.award_name,
        winner_player_name: winnerPlayerName || null,
        winner_player_id: winnerPlayerId || null,
        winner_team_id: award.winner_team_id || null,
        allstar_starter: award.allstar_starter ?? false,
      };

      const { error } = await supabase
        .from("awards")
        .update(updatePayload)
        .eq("id", award.id);

      if (error) throw error;

      await loadAwards();
      success("Award updated successfully");
      onStatsUpdated?.();
    } catch (err: any) {
      console.error("Error updating award:", err);
      showError("Failed to update award: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteAward = async (awardId: string) => {
    if (!supabase || !currentUser) return;

    try {
      const { error } = await supabase
        .from("awards")
        .delete()
        .eq("id", awardId);

      if (error) throw error;

      await loadAwards();
      success("Award deleted successfully");
      onStatsUpdated?.();
    } catch (err: any) {
      console.error("Error deleting award:", err);
      showError("Failed to delete award: " + (err.message || "Unknown error"));
    }
  };

  const onAwardFormChange = (data: Partial<{
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter: boolean;
  }>) => {
    setAwardFormData((prev) => ({ ...prev, ...data }));
  };

  return {
    awards,
    awardFormData,
    setAwardFormData,
    handleAddAward,
    handleUpdateAward,
    handleDeleteAward,
    onAwardFormChange,
    reload: loadAwards,
    loading,
  };
};