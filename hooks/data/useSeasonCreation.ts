import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/ToastProvider';

interface UseSeasonCreationProps {
  onSeasonCreated: (seasonId: string) => void;
  onStatsUpdated: () => void;
}

export function useSeasonCreation({
  onSeasonCreated,
  onStatsUpdated,
}: UseSeasonCreationProps) {
  const { success, error: showError, warning } = useToast();

  const [showAddSeasonForm, setShowAddSeasonForm] = useState(false);
  const [newSeasonData, setNewSeasonData] = useState({
    year_start: new Date().getFullYear(),
    year_end: new Date().getFullYear() + 1,
  });
  const [creatingSeason, setCreatingSeason] = useState(false);

  const handleCreateSeason = useCallback(async () => {
    if (!newSeasonData.year_start || !supabase) {
      if (!newSeasonData.year_start) {
        warning('Please enter a start year');
      }
      return;
    }

    const endYear = newSeasonData.year_start + 1;

    setCreatingSeason(true);
    try {
      const seasonId = `season-${newSeasonData.year_start}-${endYear}`;

      const { error } = await supabase.from('seasons').insert([
        {
          id: seasonId,
          year_start: newSeasonData.year_start,
          year_end: endYear,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          warning('This season already exists!');
        } else {
          throw error;
        }
      } else {
        setShowAddSeasonForm(false);
        setNewSeasonData({ year_start: endYear, year_end: endYear + 1 });
        onSeasonCreated(seasonId);
        onStatsUpdated();
        success('Season created successfully!');
      }
    } catch (error: unknown) {
      logger.error('Error creating season:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create season';
      showError('Failed to create season: ' + errorMessage);
    } finally {
      setCreatingSeason(false);
    }
  }, [newSeasonData, onSeasonCreated, onStatsUpdated, success, showError, warning]);

  const handleNewSeasonDataChange = useCallback((data: { year_start: number; year_end: number }) => {
    setNewSeasonData(data);
  }, []);

  return {
    showAddSeasonForm,
    setShowAddSeasonForm,
    newSeasonData,
    setNewSeasonData: handleNewSeasonDataChange,
    creatingSeason,
    handleCreateSeason,
  };
}
