import { useState, useEffect, useCallback } from "react";
import { Player } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ToastProvider";

export interface PlayerProfileFormData {
  player_name: string;
  position: string;
  height: number | "";
  weight: number | "";
  archetype: string;
  team_id: string;
}

const emptyForm: PlayerProfileFormData = {
  player_name: "",
  position: "",
  height: "",
  weight: "",
  archetype: "",
  team_id: "",
};

function playerToForm(player: Player): PlayerProfileFormData {
  return {
    player_name: player.player_name ?? "",
    position: player.position ?? "",
    height: player.height ?? "",
    weight: player.weight ?? "",
    archetype: player.archetype ?? "",
    team_id: player.team_id ?? "",
  };
}

interface UsePlayerProfileProps {
  currentUserPlayer: Player | null;
  onStatsUpdated?: () => void;
}

export function usePlayerProfile({
  currentUserPlayer,
  onStatsUpdated,
}: UsePlayerProfileProps) {
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState<PlayerProfileFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUserPlayer) {
      setFormData(playerToForm(currentUserPlayer));
    } else {
      setFormData(emptyForm);
    }
  }, [currentUserPlayer]);

  const onFormChange = useCallback(
    (updates: Partial<PlayerProfileFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!currentUserPlayer || !supabase) return;

    const trimmedName = formData.player_name.trim();
    if (!trimmedName) {
      showError("Player name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        player_name: trimmedName,
        position: formData.position || null,
        height: formData.height === "" ? null : Number(formData.height),
        weight: formData.weight === "" ? null : Number(formData.weight),
        archetype: formData.archetype.trim() || null,
        team_id: formData.team_id || null,
      };

      const { error } = await supabase
        .from("players")
        .update(payload)
        .eq("id", currentUserPlayer.id);

      if (error) throw error;

      success("Player profile saved successfully!");
      onStatsUpdated?.();
    } catch (error: unknown) {
      logger.error("Error saving player profile:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save player profile";
      showError("Failed to save player profile: " + message);
    } finally {
      setSaving(false);
    }
  }, [currentUserPlayer, formData, onStatsUpdated, success, showError]);

  return {
    formData,
    onFormChange,
    handleSave,
    saving,
  };
}
