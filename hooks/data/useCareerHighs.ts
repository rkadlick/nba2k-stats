import { useState, useEffect, useCallback } from "react";
import { CareerHigh, Player } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import { useToast } from "@/components/ToastProvider";
import { CAREER_HIGHS_FIELDS } from "@/lib/formUtils";

interface UseCareerHighsProps {
  currentUserPlayer: Player | null;
  onStatsUpdated?: () => void;
  /** 'regular' (default) tracks career_highs; 'playoff' tracks playoff_career_highs. */
  scope?: 'regular' | 'playoff';
}

interface UseCareerHighsReturn {
  careerHighs: Record<string, CareerHigh>;
  formValues: Record<string, string>;
  onFormValueChange: (key: string, value: string) => void;
  handleSaveCareerHighs: () => Promise<void>;
  saving: boolean;
}

export const useCareerHighs = ({
  currentUserPlayer,
  onStatsUpdated,
  scope = 'regular',
}: UseCareerHighsProps): UseCareerHighsReturn => {
  const { success, error: showError } = useToast();
  const viewName = scope === 'playoff' ? 'playoff_career_highs_with_game' : 'career_highs_with_game';
  const tableName = scope === 'playoff' ? 'playoff_career_highs' : 'career_highs';
  const label = scope === 'playoff' ? 'Playoff career highs' : 'Career highs';

  const [careerHighs, setCareerHighs] = useState<Record<string, CareerHigh>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadCareerHighs = useCallback(async () => {
    if (!currentUserPlayer || !supabase) {
      setCareerHighs({});
      setFormValues({});
      return;
    }

    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .eq('player_id', currentUserPlayer.id);

    if (error) {
      logger.error(`Error loading ${label.toLowerCase()}:`, error);
      return;
    }

    const byKey: Record<string, CareerHigh> = {};
    (data || []).forEach((row) => {
      byKey[(row as CareerHigh).stat_key] = row as CareerHigh;
    });

    setCareerHighs(byKey);
    setFormValues(
      CAREER_HIGHS_FIELDS.reduce((acc, { key }) => {
        acc[key] = byKey[key] ? String(byKey[key].value) : '';
        return acc;
      }, {} as Record<string, string>)
    );
  }, [currentUserPlayer, viewName, label]);

  useEffect(() => {
    loadCareerHighs();
  }, [loadCareerHighs]);

  const onFormValueChange = useCallback((key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveCareerHighs = useCallback(async () => {
    if (!currentUserPlayer || !supabase) return;

    setSaving(true);
    try {
      const rejected: string[] = [];
      const upserts: {
        player_id: string;
        stat_key: string;
        value: number;
        is_manual: true;
        game_id: null;
        achieved_at: null;
      }[] = [];

      CAREER_HIGHS_FIELDS.forEach(({ key, label }) => {
        const raw = formValues[key];
        if (raw === undefined || raw === '') return;

        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) return;

        const existing = careerHighs[key];
        if (existing) {
          if (parsed === existing.value) return; // unchanged, nothing to do
          if (!existing.is_manual && parsed < existing.value) {
            // Never let a manual entry silently erase a value earned in a recorded game
            rejected.push(`${label} (current high is ${existing.value}, from a recorded game)`);
            return;
          }
        }

        upserts.push({
          player_id: currentUserPlayer.id,
          stat_key: key,
          value: parsed,
          is_manual: true,
          game_id: null,
          achieved_at: null,
        });
      });

      if (upserts.length > 0) {
        const { error } = await supabase
          .from(tableName)
          .upsert(upserts, { onConflict: 'player_id,stat_key' });

        if (error) throw error;
        success(`${label} saved successfully!`);
      }

      if (rejected.length > 0) {
        showError(`Not saved, already beaten by a recorded game: ${rejected.join(', ')}`);
      }

      await loadCareerHighs();
      onStatsUpdated?.();
    } catch (error: unknown) {
      logger.error(`Error saving ${label.toLowerCase()}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to save ${label.toLowerCase()}`;
      showError(`Failed to save ${label.toLowerCase()}: ` + errorMessage);
    } finally {
      setSaving(false);
    }
  }, [currentUserPlayer, formValues, careerHighs, onStatsUpdated, success, showError, loadCareerHighs, tableName, label]);

  return {
    careerHighs,
    formValues,
    onFormValueChange,
    handleSaveCareerHighs,
    saving,
  };
};
