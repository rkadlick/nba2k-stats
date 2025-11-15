'use client';

import { Season } from '@/lib/types';
import { CAREER_SEASON_ID } from '@/lib/types';

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeason: Season | null | string;
  onSelectSeason: (season: Season | string) => void;
}

export default function SeasonSelector({
  seasons,
  selectedSeason,
  onSelectSeason,
}: SeasonSelectorProps) {
  const selectedValue = typeof selectedSeason === 'string' 
    ? selectedSeason 
    : selectedSeason?.id || '';

  return (
    <select
      value={selectedValue}
      onChange={(e) => {
        if (e.target.value === CAREER_SEASON_ID) {
          onSelectSeason(CAREER_SEASON_ID);
        } else {
          const season = seasons.find((s) => s.id === e.target.value);
          if (season) onSelectSeason(season);
        }
      }}
      className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value={CAREER_SEASON_ID} className="text-gray-900">Career</option>
      {seasons.map((season) => (
        <option key={season.id} value={season.id} className="text-gray-900">
          {season.year_start}–{season.year_end}
        </option>
      ))}
    </select>
  );
}
