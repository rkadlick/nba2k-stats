'use client';

import React, { useState, useMemo } from 'react';
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
  onAwardFormChange: (data: {
    award_name?: string;
    winner_player_name?: string;
    winner_team_id?: string;
  }) => void;
  onAddAward: () => void;
  onUpdateAward: (award: Award) => void;
  onDeleteAward: (awardId: string) => void;
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
  onDeleteAward,
  teams,
}: AwardsTabProps) {
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [draftAwards, setDraftAwards] = useState<Record<string, Partial<Award>>>({});

  const awardsMasterList = useMemo(
    () => [
      { name: 'MVP', maxWinners: 1 },
      { name: 'Rookie of the Year', maxWinners: 1 },
      { name: 'Most Improved Player', maxWinners: 1 },
      { name: 'Sixth Man of the Year', maxWinners: 1 },
      { name: 'Defensive Player of the Year', maxWinners: 1 },
      { name: 'Finals MVP', maxWinners: 1 },
      { name: 'Clutch Player of the Year', maxWinners: 1 },
      { name: 'Coach of the Year', maxWinners: 1 },
      { name: '1st Team All-NBA', maxWinners: 5 },
      { name: '2nd Team All-NBA', maxWinners: 5 },
      { name: '3rd Team All-NBA', maxWinners: 5 },
      { name: '1st Team All-Defense', maxWinners: 5 },
      { name: '2nd Team All-Defense', maxWinners: 5 },
      { name: '1st Team All-Rookie', maxWinners: 5 },
      { name: '2nd Team All-Rookie', maxWinners: 5 },
      { name: 'All-Star', maxWinners: 5 },
      { name: 'All-Star MVP', maxWinners: 1 }
    ],
    []
  );

  const stageEdit = (id: string, field: keyof Award, value: string) => {
    setDraftAwards((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const saveEdit = (award: Award) => {
    const staged = draftAwards[award.id];
    const isTemp = award.id?.startsWith('temp-');
    const updated: Partial<Award> = { ...award, ...staged };
  
    // ✅ Clean up temp IDs entirely (not undefined)
    if (isTemp) {
      delete updated.id;
    }
  
    // Send only defined keys
    const payload = JSON.parse(JSON.stringify(updated)); // removes undefined/null keys safely
  
    onUpdateAward(payload as Award);
  
    setEditingRows((prev) => ({ ...prev, [award.id]: false }));
    setDraftAwards((prev) => {
      const copy = { ...prev };
      delete copy[award.id];
      return copy;
    });
  };

  return (
    <div className="space-y-8 w-full">

      {/* SEASON SELECTOR */}
      <div className="px-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Season
        </label>
        <select
          value={selectedSeason}
          onChange={(e) => onSeasonChange(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.year_start}–{s.year_end}
            </option>
          ))}
        </select>
      </div>

      {/* PREDEFINED AWARDS */}
      <div>
        <h3 className="px-4 text-lg font-semibold text-gray-900 mb-3">
          League Awards
        </h3>
        <p className="px-4 text-xs text-gray-500 mb-4">
          Leave blank if no player received the award.
        </p>

        {awardsMasterList.map((awardTemplate, index) => {
          const existing = awards.filter(
            (a) => a.award_name === awardTemplate.name
          );

          const rows: Award[] =
            existing.length > 0
              ? existing
              : ([
                  {
                    id: `temp-${awardTemplate.name}-0`,
                    award_name: awardTemplate.name,
                  },
                ] as Award[]);

          const max = awardTemplate.maxWinners || 1;

          return (
            <div key={awardTemplate.name} className="relative py-4 w-[95%] mx-auto">
              {index !== 0 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] border-t border-gray-200" />
              )}

              {rows.map((awardRow, rIdx) => {
                const isEditing =
                  editingRows[awardRow.id] ?? !awardRow.winner_player_name;
                const draft = draftAwards[awardRow.id] ?? {};

                return (
                  <div
                    key={awardRow.id}
                    className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1"
                  >
                    {/* Award Name */}
                    {rIdx === 0 ? (
                      <div className="w-56 text-gray-900 font-semibold">
                        {awardTemplate.name}
                      </div>
                    ) : (
                      <div className="w-56" />
                    )}

                    {/* Player Field */}
                    <div className="flex-1 flex items-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={
                            draft.winner_player_name ??
                            awardRow.winner_player_name ??
                            ''
                          }
                          onChange={(e) =>
                            stageEdit(
                              awardRow.id,
                              'winner_player_name',
                              e.target.value
                            )
                          }
                          placeholder="Player name"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex flex-1 items-center justify-between border border-transparent rounded text-sm text-gray-800 px-3 py-[6px] min-h-[36px]">
                          <span className="truncate">
                            {awardRow.winner_player_name}
                          </span>
                          <button
                            onClick={() =>
                              setEditingRows((prev) => ({
                                ...prev,
                                [awardRow.id]: true,
                              }))
                            }
                            className="text-xs text-blue-600 hover:underline ml-3 whitespace-nowrap"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Team column (input-style uniform) */}
                    {isEditing ? (
                      <select
                        value={
                          draft.winner_team_id ?? awardRow.winner_team_id ?? ''
                        }
                        onChange={(e) =>
                          stageEdit(
                            awardRow.id,
                            'winner_team_id',
                            e.target.value
                          )
                        }
                        className="w-44 text-sm px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select team</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-44 text-sm text-gray-800 px-3 py-[6px] border border-transparent min-h-[36px] flex items-center">
                        {
                          teams.find((t) => t.id === awardRow.winner_team_id)
                            ?.name || ''
                        }
                      </div>
                    )}

                    {/* Save / Delete Buttons */}
                    <div className="flex items-center h-[36px]">
                      {isEditing && (
                        <button
                          onClick={() => saveEdit(awardRow)}
                          className="text-xs text-green-600 hover:underline mr-3"
                        >
                          Save
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteAward(awardRow.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

              {max > 1 && (
                <div className="ml-56 mt-2">
                  <button
                    onClick={() => {
                      const newAward = {
                        award_name: awardTemplate.name,
                        winner_player_name: '',
                        winner_team_id: '',
                      };
                      onAwardFormChange(newAward);
                      onAddAward();
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Add Winner
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CUSTOM AWARDS */}
      <div className="pt-6">
        <h3 className="px-4 text-lg font-semibold text-gray-900 mb-2">
          Custom Awards
        </h3>

        {awards
          .filter(
            (a) =>
              !awardsMasterList.some((m) => m.name === a.award_name)
          )
          .map((award, index) => (
            <div key={award.id} className="relative py-4 w-[95%] mx-auto">
              {index !== 0 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] border-t border-gray-200" />
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <input
                  type="text"
                  value={award.award_name}
                  onChange={(e) =>
                    stageEdit(award.id, 'award_name', e.target.value)
                  }
                  placeholder="Award Title"
                  className="w-56 px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={
                    draftAwards[award.id]?.winner_player_name ??
                    award.winner_player_name ??
                    ''
                  }
                  onChange={(e) =>
                    stageEdit(award.id, 'winner_player_name', e.target.value)
                  }
                  placeholder="Winner Name"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={
                    draftAwards[award.id]?.winner_team_id ??
                    award.winner_team_id ??
                    ''
                  }
                  onChange={(e) =>
                    stageEdit(award.id, 'winner_team_id', e.target.value)
                  }
                  className="w-44 px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center h-[36px]">
                  <button
                    onClick={() => saveEdit(award)}
                    className="text-xs text-green-600 hover:underline mr-3"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => onDeleteAward(award.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

        <div className="ml-56 mt-3">
          <button
            onClick={() =>
              onAwardFormChange({
                award_name: '',
                winner_player_name: '',
                winner_team_id: '',
              })
            }
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Custom Award
          </button>
        </div>
      </div>
    </div>
  );
}