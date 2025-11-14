'use client';

import { Season } from '@/lib/types';

interface SeasonSelectorProps {
  seasons: Season[];
  selectedSeason: Season | null;
  onSelectSeason: (season: Season) => void;
}

export default function SeasonSelector({
  seasons,
  selectedSeason,
  onSelectSeason,
}: SeasonSelectorProps) {
  return (
    <select
      value={selectedSeason?.id || ''}
      onChange={(e) => {
        const season = seasons.find((s) => s.id === e.target.value);
        if (season) onSelectSeason(season);
      }}
      className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {seasons.map((season) => (
        <option key={season.id} value={season.id}>
          {season.year_start}–{season.year_end}
        </option>
      ))}
    </select>
  );
}

