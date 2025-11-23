'use client';

import { Season } from '@/lib/types';

interface SeasonTotalsFormData {
  games_played: number;
  games_started: number;
  total_points: number;
  total_rebounds: number;
  total_assists: number;
  total_steals: number;
  total_blocks: number;
  total_turnovers: number;
  total_minutes: number;
  total_fouls: number;
  total_plus_minus: number;
  total_fg_made: number;
  total_fg_attempted: number;
  total_threes_made: number;
  total_threes_attempted: number;
  total_ft_made: number;
  total_ft_attempted: number;
  double_doubles: number;
  triple_doubles: number;
}

interface SeasonTotalsTabProps {
  selectedSeason: string;
  onSeasonChange: (seasonId: string) => void;
  seasons: Season[];
  loadingTotals: boolean;
  hasGamesInSeason: boolean;
  totalsFormData: SeasonTotalsFormData;
  onTotalsFormChange: (data: Partial<SeasonTotalsFormData>) => void;
  onSave: () => void;
  showAddSeasonForm: boolean;
  onToggleAddSeasonForm: () => void;
  newSeasonData: { year_start: number; year_end: number };
  onNewSeasonDataChange: (data: { year_start: number; year_end: number }) => void;
  onCreateSeason: () => void;
  creatingSeason: boolean;
  calculatePerGameAverage: (total: number) => number | null;
}

export default function SeasonTotalsTab({
  selectedSeason,
  onSeasonChange,
  seasons,
  loadingTotals,
  hasGamesInSeason,
  totalsFormData,
  onTotalsFormChange,
  onSave,
  showAddSeasonForm,
  onToggleAddSeasonForm,
  newSeasonData,
  onNewSeasonDataChange,
  onCreateSeason,
  creatingSeason,
  calculatePerGameAverage,
}: SeasonTotalsTabProps) {
  const statFields = [
    { key: 'games_played', label: 'Games Played', showAverage: false },
    { key: 'games_started', label: 'Games Started', showAverage: false },
    { key: 'total_points', label: 'Points', showAverage: true, avgLabel: 'PPG' },
    { key: 'total_rebounds', label: 'Rebounds', showAverage: true, avgLabel: 'RPG' },
    { key: 'total_assists', label: 'Assists', showAverage: true, avgLabel: 'APG' },
    { key: 'total_steals', label: 'Steals', showAverage: true, avgLabel: 'SPG' },
    { key: 'total_blocks', label: 'Blocks', showAverage: true, avgLabel: 'BPG' },
    { key: 'total_turnovers', label: 'Turnovers', showAverage: true, avgLabel: 'TOPG' },
    { key: 'total_minutes', label: 'Minutes', showAverage: true, avgLabel: 'MPG', step: 0.1 },
    { key: 'total_fouls', label: 'Fouls', showAverage: true, avgLabel: 'FPG' },
    { key: 'total_plus_minus', label: '+/-', showAverage: true, avgLabel: '+/-PG' },
    { key: 'total_fg_made', label: 'FG Made', showAverage: false },
    { key: 'total_fg_attempted', label: 'FG Attempted', showAverage: false, showPercentage: true },
    { key: 'total_threes_made', label: '3PT Made', showAverage: false },
    { key: 'total_threes_attempted', label: '3PT Attempted', showAverage: false, showPercentage: true },
    { key: 'total_ft_made', label: 'FT Made', showAverage: false },
    { key: 'total_ft_attempted', label: 'FT Attempted', showAverage: false, showPercentage: true },
    { key: 'double_doubles', label: 'Double-Doubles', showAverage: false },
    { key: 'triple_doubles', label: 'Triple-Doubles', showAverage: false },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-end gap-2 mb-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Season
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => onSeasonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 font-semibold"
            >
              {seasons.map(season => (
                <option key={season.id} value={season.id}>
                  {season.year_start}–{season.year_end}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onToggleAddSeasonForm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            {showAddSeasonForm ? 'Cancel' : '+ Add Season'}
          </button>
        </div>
        
        {showAddSeasonForm && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Create New Season</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Year *
                </label>
                <input
                  type="number"
                  value={newSeasonData.year_start}
                  onChange={(e) => {
                    const startYear = parseInt(e.target.value) || new Date().getFullYear();
                    onNewSeasonDataChange({
                      year_start: startYear,
                      year_end: startYear + 1,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                  min="2000"
                  max="2100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Year (auto-calculated)
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-semibold">
                  {newSeasonData.year_start + 1}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Seasons must be exactly one year apart
                </p>
              </div>
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={onCreateSeason}
                disabled={creatingSeason}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingSeason ? 'Creating...' : `Create Season ${newSeasonData.year_start}–${newSeasonData.year_start + 1}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {loadingTotals ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
        </div>
      ) : hasGamesInSeason ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            This season has games recorded. Season totals are calculated from games and cannot be manually edited.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {statFields.map(({ key, label, showAverage, avgLabel, step, showPercentage }) => {
              const value = totalsFormData[key as keyof SeasonTotalsFormData] as number;
              const isPercentage = showPercentage && key.includes('attempted');
              const madeKey = key.replace('attempted', 'made') as keyof SeasonTotalsFormData;
              const madeValue = totalsFormData[madeKey] as number;
              
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="number"
                    step={step || 1}
                    value={value}
                    onChange={(e) => {
                      const newValue = step ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0;
                      onTotalsFormChange({ [key]: newValue } as Partial<SeasonTotalsFormData>);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                    min="0"
                  />
                  {showAverage && totalsFormData.games_played > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {avgLabel}: {calculatePerGameAverage(value)?.toFixed(1) || '0.0'}
                    </p>
                  )}
                  {isPercentage && value > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {key.includes('fg') ? 'FG' : key.includes('threes') ? '3PT' : 'FT'}%: {((madeValue / value) * 100).toFixed(1)}% ({((madeValue / value)).toFixed(3)})
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={onSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Save Season Totals
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

