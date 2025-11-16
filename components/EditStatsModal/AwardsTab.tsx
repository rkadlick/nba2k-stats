'use client';

import { Season, Award, Team } from '@/lib/types';

interface AwardsTabProps {
  selectedSeason: string;
  onSeasonChange: (seasonId: string) => void;
  seasons: Season[];
  awards: Award[];
  awardFormData: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
  };
  onAwardFormChange: (data: { award_name?: string; winner_player_name?: string; winner_team_id?: string }) => void;
  onAddAward: () => void;
  onUpdateAward: (award: Award) => void;
  teams: Team[];
}

export default function AwardsTab({
  selectedSeason,
  onSeasonChange,
  seasons,
  awards,
  awardFormData,
  onAwardFormChange,
  onAddAward,
  onUpdateAward,
  teams,
}: AwardsTabProps) {
  return (
    <div className="space-y-4">
      <div>
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
      
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Award</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Award Name *</label>
            <input
              type="text"
              value={awardFormData.award_name}
              onChange={(e) => onAwardFormChange({ award_name: e.target.value })}
              placeholder="e.g., MVP, Finals MVP, DPOY"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Winner Player Name</label>
            <input
              type="text"
              value={awardFormData.winner_player_name}
              onChange={(e) => onAwardFormChange({ winner_player_name: e.target.value })}
              placeholder="Player name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Winner Team</label>
            <select
              value={awardFormData.winner_team_id}
              onChange={(e) => onAwardFormChange({ winner_team_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-semibold"
            >
              <option value="">Select team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={onAddAward}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Award
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Awards</h3>
        {awards.length > 0 ? (
          <div className="space-y-2">
            {awards.map(award => (
              <div key={award.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{award.award_name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Winner Player</label>
                    <input
                      type="text"
                      value={award.winner_player_name || ''}
                      onChange={(e) => {
                        const updated = { ...award, winner_player_name: e.target.value };
                        onUpdateAward(updated);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Winner Team</label>
                    <select
                      value={award.winner_team_id || ''}
                      onChange={(e) => {
                        const updated = { ...award, winner_team_id: e.target.value };
                        onUpdateAward(updated);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="">Select team...</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No awards found for this season.
          </div>
        )}
      </div>
    </div>
  );
}

