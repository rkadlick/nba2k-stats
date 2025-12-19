'use client';

interface SeasonFormProps {
  showAddSeasonForm: boolean;
  onToggleAddSeasonForm: () => void;
  newSeasonData: { year_start: number; year_end: number };
  onNewSeasonDataChange: (data: { year_start: number; year_end: number }) => void;
  onCreateSeason: () => void;
  creatingSeason: boolean;
}

export default function SeasonForm({
  showAddSeasonForm,
  onToggleAddSeasonForm,
  newSeasonData,
  onNewSeasonDataChange,
  onCreateSeason,
  creatingSeason,
}: SeasonFormProps) {
  return (
    <div>
      <div className="flex items-end gap-2 mb-2">
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
  );
}
