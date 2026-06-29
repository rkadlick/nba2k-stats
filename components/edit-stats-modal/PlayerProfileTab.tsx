"use client";

import { ALL_TEAMS } from "@/lib/teams";
import { formatGameVersionLabel } from "@/lib/playerUtils";
import { PlayerProfileFormData } from "@/hooks/data/usePlayerProfile";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

interface PlayerProfileTabProps {
  gameVersion?: string;
  formData: PlayerProfileFormData;
  onFormChange: (updates: Partial<PlayerProfileFormData>) => void;
  onSave: () => void;
  saving: boolean;
}

export default function PlayerProfileTab({
  gameVersion,
  formData,
  onFormChange,
  onSave,
  saving,
}: PlayerProfileTabProps) {
  const teams = ALL_TEAMS.sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6 max-w-xl">
      {gameVersion && (
        <p className="text-sm text-gray-600">
          Editing profile for{" "}
          <span className="font-semibold text-gray-900">
            {formatGameVersionLabel(gameVersion)}
          </span>
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Player Name
          </label>
          <input
            type="text"
            value={formData.player_name}
            onChange={(e) => onFormChange({ player_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
            placeholder="MyPlayer name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              value={formData.position}
              onChange={(e) => onFormChange({ position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
            >
              <option value="">Select position</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              value={formData.team_id}
              onChange={(e) => onFormChange({ team_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (inches)
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) =>
                onFormChange({
                  height: e.target.value ? parseInt(e.target.value, 10) : "",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
              min={60}
              max={96}
              placeholder="e.g. 75"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (lbs)
            </label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) =>
                onFormChange({
                  weight: e.target.value ? parseInt(e.target.value, 10) : "",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
              min={150}
              max={350}
              placeholder="e.g. 190"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Archetype
          </label>
          <input
            type="text"
            value={formData.archetype}
            onChange={(e) => onFormChange({ archetype: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
            placeholder="e.g. Playmaking Shot Creator"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-primary px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Player Profile"}
        </button>
      </div>
    </div>
  );
}
