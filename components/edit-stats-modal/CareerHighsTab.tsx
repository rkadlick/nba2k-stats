'use client';

interface CareerHighsTabProps {
  careerHighs: Record<string, number | string>;
  onCareerHighsChange: (careerHighs: Record<string, number | string>) => void;
  onSave: () => void;
}

export default function CareerHighsTab({
  careerHighs,
  onCareerHighsChange,
  onSave,
}: CareerHighsTabProps) {
  const statFields = [
    { key: 'points', label: 'Points' },
    { key: 'rebounds', label: 'Rebounds' },
    { key: 'assists', label: 'Assists' },
    { key: 'steals', label: 'Steals' },
    { key: 'blocks', label: 'Blocks' },
    { key: 'minutes', label: 'Minutes' },
    { key: 'fg_made', label: 'Field Goals Made' },
    { key: 'threes_made', label: 'Three-Pointers Made' },
    { key: 'ft_made', label: 'Free Throws Made' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Enter career highs manually. These can override calculated values from game statistics.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statFields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="number"
              value={(careerHighs[key] as number) || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                onCareerHighsChange({
                  ...careerHighs,
                  [key]: value !== undefined ? value : '',
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
              min="0"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Save Career Highs
        </button>
      </div>
    </div>
  );
}

