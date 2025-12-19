import { useState, useEffect } from 'react';
import { Season } from '@/lib/types';

interface UseSeasonSelectionProps {
  playerSeasons: Season[];
}

export function useSeasonSelection({ playerSeasons }: UseSeasonSelectionProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>(() => {
    // Default to the most recent season (first in array, sorted most recent first)
    return playerSeasons[0]?.id || '';
  });

  // Initialize global season when seasons prop changes
  useEffect(() => {
    if (playerSeasons.length > 0 && !selectedSeason) {
      // Default to the most recent season (first in array, sorted most recent first)
      setSelectedSeason(playerSeasons[0].id);
    }
  }, [playerSeasons, selectedSeason]);

  return {
    selectedSeason,
    setSelectedSeason,
  };
}
