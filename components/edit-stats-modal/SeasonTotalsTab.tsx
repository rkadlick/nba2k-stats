'use client';

import { SeasonTotals } from '@/lib/types';
import { SEASON_TOTALS_FIELDS } from '@/lib/formUtils';
import SeasonForm from '../shared/SeasonForm';

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

  return (
    <div className="space-y-4">
      <SeasonForm
        showAddSeasonForm={showAddSeasonForm}
        onToggleAddSeasonForm={onToggleAddSeasonForm}
        newSeasonData={newSeasonData}
        onNewSeasonDataChange={onNewSeasonDataChange}
        onCreateSeason={onCreateSeason}
        creatingSeason={creatingSeason}
      />

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
            {SEASON_TOTALS_FIELDS.map(({ key, label, showAverage, avgLabel, step, showPercentage }) => {
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

