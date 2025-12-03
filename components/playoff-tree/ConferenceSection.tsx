import React from 'react';
import { PlayoffSeriesWithGames } from '@/hooks/usePlayoffSeries';
import { RoundColumn } from './RoundColumn';
import { PlayInColumn } from './PlayInColumn';

interface ConferenceSectionProps {
  conference: 'East' | 'West';
  roundSeries: Record<number, PlayoffSeriesWithGames[]>;
  playInSeries: PlayoffSeriesWithGames[];
}

// ConferenceSection is no longer used - layout moved to main component
export function ConferenceSection() {
  return null;
}
