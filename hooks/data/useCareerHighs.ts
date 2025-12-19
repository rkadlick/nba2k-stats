import { useState, useEffect, useCallback } from "react";
import { Player } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ToastProvider";

interface UseCareerHighsProps {
  currentUserPlayer: Player | null;
  onStatsUpdated: () => void;
}

interface UseCareerHighsReturn {
  careerHighs: Record<string, number | string>;
  setCareerHighs: React.Dispatch<React.SetStateAction<Record<string, number | string>>>;
  handleSaveCareerHighs: () => Promise<void>;
}

export const useCareerHighs = ({
  currentUserPlayer,
  onStatsUpdated
}: UseCareerHighsProps): UseCareerHighsReturn => {
  const { success, error: showError } = useToast();

  const [careerHighs, setCareerHighs] = useState<Record<string, number | string>>({});

  // Load career highs when player changes
  useEffect(() => {
    if (currentUserPlayer && currentUserPlayer.career_highs) {
      setCareerHighs(currentUserPlayer.career_highs);
    }
  }, [currentUserPlayer]);

  const handleSaveCareerHighs = useCallback(async () => {
    if (!currentUserPlayer || !supabase) return;

    try {
      const { error } = await supabase
        .from('players')
        .update({ career_highs: careerHighs })
        .eq('id', currentUserPlayer.id);

      if (error) throw error;

      onStatsUpdated();
      success('Career highs saved successfully!');
    } catch (error: unknown) {
      logger.error('Error saving career highs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save career highs';
      showError('Failed to save career highs: ' + errorMessage);
    }
  }, [currentUserPlayer, careerHighs, onStatsUpdated, success, showError]);

  return {
    careerHighs,
    setCareerHighs,
    handleSaveCareerHighs,
  };
};
