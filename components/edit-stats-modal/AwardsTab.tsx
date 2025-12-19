'use client';

import React, { useMemo } from 'react';
import { Award } from '@/lib/types';
import { ALL_TEAMS } from '@/lib/teams';
import { AWARDS_MASTER_LIST } from '@/lib/constants';
import { useDraftEditing } from '@/hooks/ui/useDraftEditing';

interface AwardsTabProps {
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
  onAddAward: (newAward: {
    award_name: string;
    winner_player_name: string;
    winner_team_id: string;
    allstar_starter?: boolean;
  }) => void;
  onUpdateAward: (award: Award) => void;
  onDeleteAward: (awardId: string) => void;
}

export default function AwardsTab({
  awards,
  onAwardFormChange,
  onAddAward,
  onUpdateAward,
  onDeleteAward,
}: AwardsTabProps) {
  const teams = ALL_TEAMS;

  // Use draft editing hook for state management
  const {
    editingRows,
    draftItems: draftAwards,
    pendingItems: pendingAwards,
    stageEdit,
    startEditing,
    addPending: addPendingAward,
    saveItem,
  } = useDraftEditing<Award>();


  /* ----------------------------------------- */
  /*   SAVE HANDLERS                           */
  /* ----------------------------------------- */
  const handleSave = (awardRow: Award) => {
    saveItem(awardRow.id, (item) => {
      const isTemp = !awardRow.id || awardRow.id.startsWith('temp-');

      if (isTemp) {
        onAddAward({
          award_name: item.award_name!,
          winner_player_name: item.winner_player_name!,
          winner_team_id: item.winner_team_id!,
          allstar_starter: item.allstar_starter ?? false,
        });
      } else {
        onUpdateAward(item);
      }
    });
  };

  const savePendingAward = (awardName: string, tempId: string, draft: Partial<Award>) => {
    if (!draft?.winner_player_name || !draft?.winner_team_id) return;

    onAddAward({
      award_name: awardName,
      winner_player_name: draft.winner_player_name,
      winner_team_id: draft.winner_team_id,
      allstar_starter: draft.allstar_starter ?? false,
    });

    // Clean up the temporary item using hook methods
    // Note: The pending item will be removed by the hook when saveItem is called
  };


  /* ----------------------------------------- */
  /*   RENDER                                  */
  /* ----------------------------------------- */
  return (
    <div className="space-y-8 w-full">
      {/* All Awards */}
      <div>
        <h3 className="px-4 text-lg font-semibold text-gray-900 mb-3">League Awards</h3>
        <p className="px-4 text-xs text-gray-500 mb-4">
          Leave blank if no player received the award.
        </p>

        {AWARDS_MASTER_LIST.map((awardTemplate, index) => {
          const existing = awards.filter((a) => a.award_name === awardTemplate.name);
          // Sort All-Star awards so starters appear first
          const sortedExisting = awardTemplate.name === 'All-Star'
            ? existing.sort((a, b) => {
                const aIsStarter = a.allstar_starter ?? false;
                const bIsStarter = b.allstar_starter ?? false;
                // Starters first: if a is starter and b is not, a comes first (-1)
                // if b is starter and a is not, b comes first (1)
                // if both are starters or both are not, maintain current order (0)
                if (aIsStarter && !bIsStarter) return -1;
                if (!aIsStarter && bIsStarter) return 1;
                return 0;
              })
            : existing;
          const rows: Award[] =
            sortedExisting.length > 0
              ? sortedExisting
              : ([{ id: `temp-${awardTemplate.name}-0`, award_name: awardTemplate.name }] as Award[]);
          const max = awardTemplate.maxWinners || 1;
          const isAllStar = awardTemplate.name === 'All-Star';

          return (
            <div key={awardTemplate.name} className="relative py-4 w-[95%] mx-auto">
              {index !== 0 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] border-t border-gray-200" />
              )}

              {/* Existing awards */}
              {rows.map((awardRow, rIdx) => {
                const isEditing = editingRows[awardRow.id] ?? !awardRow.winner_player_name;
                const draft = draftAwards[awardRow.id] ?? {};

                /** 🧠 Determine which buttons to show: Edit/Delete only when not editing */
                const showEditDelete = !isEditing && !!awardRow.winner_player_name;

                return (
                  <div key={awardRow.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1">
                    {rIdx === 0 ? (
                      <div className="w-56 text-gray-900 font-semibold">{awardTemplate.name}</div>
                    ) : (
                      <div className="w-56" />
                    )}

                    {/* Player Input */}
                    <div className="flex-1 flex items-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={draft.winner_player_name ?? awardRow.winner_player_name ?? ''}
                          onChange={(e) =>
                            stageEdit(awardRow.id, 'winner_player_name', e.target.value)
                          }
                          placeholder="Player name"
                          className="font-normal flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                          style={{ fontWeight: 400 }}
                        />
                      ) : (
                        <div className="flex flex-1 items-center justify-between text-sm text-gray-800 px-3 py-[6px] min-h-[36px]">
                          <span className={`truncate ${isAllStar && awardRow.allstar_starter === true ? 'font-bold' : ''}`}>
                            {awardRow.winner_player_name}
                          </span>

                          {showEditDelete && (
                            <button
                              onClick={() => startEditing(awardRow.id, {
                                winner_player_name: awardRow.winner_player_name,
                                winner_team_id: awardRow.winner_team_id,
                                allstar_starter: awardRow.allstar_starter,
                              })}
                              className="text-xs text-blue-600 hover:underline ml-3 whitespace-nowrap"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Team Select */}
                    {isEditing ? (
                      <select
                        value={draft.winner_team_id ?? awardRow.winner_team_id ?? ''}
                        onChange={(e) =>
                          stageEdit(awardRow.id, 'winner_team_id', e.target.value)
                        }
                        className="w-44 text-sm px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" disabled>Select team</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-44 text-sm text-gray-800 px-3 py-[6px] min-h-[36px] flex items-center">
                        {teams.find((t) => t.id === awardRow.winner_team_id)?.fullName || ''}
                      </div>
                    )}

                    {/* Starter Checkbox - Only for All-Star when editing */}
                    {isAllStar && isEditing && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`starter-${awardRow.id}`}
                          checked={draft.allstar_starter ?? false}
                          onChange={(e) =>
                            stageEdit(awardRow.id, 'allstar_starter', e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`starter-${awardRow.id}`}
                          className="text-sm text-gray-700 whitespace-nowrap"
                        >
                          Starter
                        </label>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex items-center h-[36px]">
                      {isEditing && (
                        <button
                          onClick={() => handleSave(awardRow)}
                          className="text-xs text-green-600 hover:underline mr-3"
                        >
                          Save
                        </button>
                      )}

                      {showEditDelete && (
                        <button
                          onClick={() => {
                            onDeleteAward(awardRow.id);
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pending unsaved rows */}
              {(pendingAwards[awardTemplate.name] || []).map((tempId) => {
                const draft = draftAwards[tempId] ?? {};
                return (
                  <div key={tempId} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1">
                    <div className="w-56" />
                    <input
                      type="text"
                      value={draft.winner_player_name ?? ''}
                      onChange={(e) => stageEdit(tempId, 'winner_player_name', e.target.value)}
                      placeholder="Player name"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={draft.winner_team_id ?? ''}
                      onChange={(e) => stageEdit(tempId, 'winner_team_id', e.target.value)}
                      className="w-44 text-sm px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName}
                        </option>
                      ))}
                    </select>
                    {/* Starter Checkbox - Only for All-Star pending awards */}
                    {isAllStar && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`starter-${tempId}`}
                          checked={draft.allstar_starter ?? false}
                          onChange={(e) =>
                            stageEdit(tempId, 'allstar_starter', e.target.checked ? true : false)
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`starter-${tempId}`}
                          className="text-sm text-gray-700 whitespace-nowrap"
                        >
                          Starter
                        </label>
                      </div>
                    )}
                    
                    <div className="flex items-center h-[36px]">
                      <button
                        onClick={() => savePendingAward(awardTemplate.name, tempId, draftAwards[tempId])}
                        className="text-xs text-green-600 hover:underline mr-3"
                      >
                        Save
                      </button>
                      {/* No delete here for unsaved; user can just overwrite or clear */}
                    </div>
                  </div>
                );
              })}
              

              {/* Add button */}
              {max > 1 && (
                <div className="ml-56 mt-2">
                  <button
                    onClick={() => addPendingAward(awardTemplate.name)}
                    disabled={
                      rows.length + (pendingAwards[awardTemplate.name]?.length || 0) >= max
                    }
                    className={`text-xs ${
                      rows.length + (pendingAwards[awardTemplate.name]?.length || 0) >= max
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:underline'
                    }`}
                  >
                    + Add Winner
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}