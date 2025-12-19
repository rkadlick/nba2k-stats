'use client';

interface StatInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  showAverage?: boolean;
  average?: number | null;
  avgLabel?: string;
  showPercentage?: boolean;
  percentage?: number | null;
  percentageLabel?: string;
  step?: number;
  min?: number;
}

export default function StatInput({
  label,
  value,
  onChange,
  showAverage = false,
  average = null,
  avgLabel,
  showPercentage = false,
  percentage = null,
  percentageLabel,
  step = 1,
  min = 0,
}: StatInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => {
          const newValue = step === 0.1 ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0;
          onChange(newValue);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
        min={min}
      />
      {showAverage && average !== null && average !== undefined && (
        <p className="text-xs text-gray-500 mt-1">
          {avgLabel}: {average.toFixed(1)}
        </p>
      )}
      {showPercentage && percentage !== null && percentage !== undefined && (
        <p className="text-xs text-gray-500 mt-1">
          {percentageLabel}: {(percentage * 100).toFixed(1)}% ({percentage.toFixed(3)})
        </p>
      )}
    </div>
  );
}
