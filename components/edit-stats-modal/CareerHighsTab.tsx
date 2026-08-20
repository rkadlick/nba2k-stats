'use client';

import { CareerHigh } from '@/lib/types';
import { CAREER_HIGHS_FIELDS } from '@/lib/formUtils';

interface CareerHighsTabProps {
  careerHighs: Record<string, CareerHigh>;
  formValues: Record<string, string>;
  onFormValueChange: (key: string, value: string) => void;
  onSave: () => void;
  saving: boolean;
  playoffCareerHighs: Record<string, CareerHigh>;
  playoffFormValues: Record<string, string>;
  onPlayoffFormValueChange: (key: string, value: string) => void;
  onSavePlayoff: () => void;
  savingPlayoff: boolean;
}

interface CareerHighsFormProps {
  careerHighs: Record<string, CareerHigh>;
  formValues: Record<string, string>;
  onFormValueChange: (key: string, value: string) => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}

function CareerHighsForm({
  careerHighs,
  formValues,
  onFormValueChange,
  onSave,
  saving,
  saveLabel,
}: CareerHighsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {CAREER_HIGHS_FIELDS.map(({ key, label }) => {
          const existing = careerHighs[key];
          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {existing && (
                  <span className={`ml-2 text-xs font-normal ${existing.is_manual ? 'text-purple-600' : 'text-gray-500'}`}>
                    {existing.is_manual ? '(manual)' : '(from game)'}
                  </span>
                )}
              </label>
              <input
                type="number"
                value={formValues[key] ?? ''}
                onChange={(e) => onFormValueChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
                min="0"
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-primary px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : saveLabel}
        </button>
      </div>
    </div>
  );
}

export default function CareerHighsTab({
  careerHighs,
  formValues,
  onFormValueChange,
  onSave,
  saving,
  playoffCareerHighs,
  playoffFormValues,
  onPlayoffFormValueChange,
  onSavePlayoff,
  savingPlayoff,
}: CareerHighsTabProps) {

  return (
    <div className="space-y-8">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Career highs are calculated automatically from your logged games &mdash; regular season and
          playoffs are tracked separately. Enter a value here only to record a high from before you
          started tracking games; it acts as a floor and is automatically replaced once a logged game
          matches or beats it.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Regular Season</h3>
        <CareerHighsForm
          careerHighs={careerHighs}
          formValues={formValues}
          onFormValueChange={onFormValueChange}
          onSave={onSave}
          saving={saving}
          saveLabel="Save Career Highs"
        />
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Playoffs</h3>
        <CareerHighsForm
          careerHighs={playoffCareerHighs}
          formValues={playoffFormValues}
          onFormValueChange={onPlayoffFormValueChange}
          onSave={onSavePlayoff}
          saving={savingPlayoff}
          saveLabel="Save Playoff Career Highs"
        />
      </div>
    </div>
  );
}
