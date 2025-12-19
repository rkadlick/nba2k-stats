'use client';

import React, { useMemo } from 'react';
import { RosterEntry } from '@/lib/types';
import { useDraftEditing } from '@/hooks/ui/useDraftEditing';

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

interface RosterTabProps {
  roster: RosterEntry[];
  onAddRoster?: (payload: Partial<RosterEntry>) => void;
  onUpdateRoster: (row: RosterEntry) => void;
  onDeleteRoster: (id: string) => void;
  seasonId?: string;
}

function RosterSection({
  title,
  rows,
  pendingRows,
  editingRows,
  draftRoster,
  stageEdit,
  startEditing,
  addPendingRoster,
  saveItem,
  removePending,
  onAddRoster,
  onUpdateRoster,
  onDeleteRoster,
  seasonId,
  startEndValue,
}: {
  title: string;
  rows: RosterEntry[];
  pendingRows: string[];
  editingRows: Record<string, boolean>;
  draftRoster: Record<string, Partial<RosterEntry>>;
  stageEdit: (id: string, field: keyof RosterEntry, value: RosterEntry[keyof RosterEntry]) => void;
  startEditing: (id: string, initialValues?: Partial<RosterEntry>) => void;
  addPendingRoster: (groupKey: string) => string;
  saveItem: (id: string, onSave: (item: RosterEntry) => void) => void;
  removePending: (groupKey: string, tempId: string) => void;
  onAddRoster?: (payload: Partial<RosterEntry>) => void;
  onUpdateRoster: (row: RosterEntry) => void;
  onDeleteRoster: (id: string) => void;
  seasonId?: string;
  startEndValue: 'start' | 'end';
}) {
  // Only show rows that have been saved (have an ID)
  const displayRows: RosterEntry[] = rows.filter(row => row.id);

  const handleSave = (row: RosterEntry) => {
    const rowId = String(row.id || '');
    saveItem(rowId, (draft) => {
      const isTemp = !rowId || (typeof rowId === 'string' && rowId.startsWith('temp-'));
      // Merge draft changes with row, ensuring is_starter from draft takes precedence
      const updated: RosterEntry = { 
        ...row, 
        ...draft,
        // Explicitly set is_starter from draft if it exists, otherwise keep row value
        is_starter: 'is_starter' in draft ? (draft.is_starter ?? false) : (row.is_starter ?? false),
        start_end: startEndValue,
      };

      if (isTemp) {
        if (!updated.player_name || !updated.position) return;
        onAddRoster?.({
          player_name: updated.player_name,
          position: updated.position,
          secondary_position: updated.secondary_position || null,
          is_starter: updated.is_starter ?? false,
          season_id: seasonId ?? updated.season_id,
          start_end: startEndValue,
        });
      } else {
        onUpdateRoster(updated);
      }
    });
  };

  const savePendingRoster = (tempId: string, draft: Partial<RosterEntry>) => {
    if (!draft?.player_name || !draft?.position) return;

    onAddRoster?.({
      player_name: draft.player_name,
      position: draft.position,
      secondary_position: draft.secondary_position || null,
      is_starter: draft.is_starter ?? false,
      season_id: seasonId ?? '',
      start_end: startEndValue,
    });
    
    // Remove the pending item after saving
    removePending(startEndValue, tempId);
  };

  const canAddMore = rows.length + pendingRows.length < 20;

  return (
    <div className="relative py-4 w-[95%] mx-auto">
      <h4 className="px-4 text-md font-semibold text-gray-900 mb-3">{title}</h4>
      
      {/* Existing roster rows */}
      {displayRows.map((row) => {
        // All rows in displayRows should have IDs since we filter them
        const rowId = String(row.id);
        const isEditing = editingRows[rowId] ?? false;
        const draft = draftRoster[rowId] ?? {};

        /** Determine which buttons to show: Edit/Delete only when not editing */
        const showEditDelete = !isEditing && !!row.player_name;

        return (
          <div key={rowId} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1">
            <div className="w-56" />

            {/* Player Input */}
            <div className="flex-1 flex items-center">
              {isEditing ? (
                <input
                  type="text"
                  value={draft.player_name ?? row.player_name ?? ''}
                  onChange={(e) => stageEdit(rowId, 'player_name', e.target.value)}
                  placeholder="Player name"
                  className="font-normal flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                  style={{ fontWeight: 400 }}
                />
              ) : (
                <div className="flex flex-1 items-center justify-between text-sm text-gray-800 px-3 py-[6px] min-h-[36px]">
                  <span className={`truncate ${row.is_starter === true ? 'font-bold' : ''}`}>
                    {row.player_name}
                  </span>

                  {showEditDelete && (
                    <button
                      onClick={() =>
                        startEditing(rowId, {
                          player_name: row.player_name,
                          position: row.position,
                          secondary_position: row.secondary_position,
                          is_starter: row.is_starter,
                        })
                      }
                      className="text-xs text-blue-600 hover:underline ml-3 whitespace-nowrap"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Position Select */}
            {isEditing ? (
              <select
                value={draft.position ?? row.position ?? ''}
                onChange={(e) => stageEdit(rowId, 'position', e.target.value)}
                className="w-44 text-sm px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select position</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-44 text-sm text-gray-800 px-3 py-[6px] min-h-[36px] flex items-center">
                {row.position || ''}
              </div>
            )}

            {/* Secondary Position Select */}
            {isEditing ? (
              <select
                value={draft.secondary_position ?? row.secondary_position ?? ''}
                onChange={(e) =>
                  stageEdit(rowId, 'secondary_position', e.target.value || null)
                }
                className="w-44 text-sm px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-44 text-sm text-gray-800 px-3 py-[6px] min-h-[36px] flex items-center">
                {row.secondary_position || ''}
              </div>
            )}

            {/* Starter Checkbox - Only when editing */}
            {isEditing && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`starter-${rowId}`}
                  checked={draft.is_starter ?? row.is_starter ?? false}
                  onChange={(e) => stageEdit(rowId, 'is_starter', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor={`starter-${rowId}`}
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
                  onClick={() => handleSave(row)}
                  className="text-xs text-green-600 hover:underline mr-3"
                >
                  Save
                </button>
              )}

              {showEditDelete && (
                <button
                  onClick={() => {
                    onDeleteRoster(rowId);
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
      {pendingRows.map((tempId) => {
        const draft = draftRoster[tempId] ?? {};
        return (
          <div key={tempId} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1">
            <div className="w-56" />
            <input
              type="text"
              value={draft.player_name ?? ''}
              onChange={(e) => stageEdit(tempId, 'player_name', e.target.value)}
              placeholder="Player name"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={draft.position ?? ''}
              onChange={(e) => stageEdit(tempId, 'position', e.target.value)}
              className="w-44 text-sm px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select position</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            <select
              value={draft.secondary_position ?? ''}
              onChange={(e) => stageEdit(tempId, 'secondary_position', e.target.value || null)}
              className="w-44 text-sm px-3 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            {/* Starter Checkbox for pending roster */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`starter-${tempId}`}
                checked={draft.is_starter ?? false}
                onChange={(e) =>
                  stageEdit(tempId, 'is_starter', e.target.checked ? true : false)
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`starter-${tempId}`} className="text-sm text-gray-700 whitespace-nowrap">
                Starter
              </label>
            </div>

            <div className="flex items-center h-[36px]">
              <button
                onClick={() => savePendingRoster(tempId, draftRoster[tempId])}
                className="text-xs text-green-600 hover:underline mr-3"
              >
                Save
              </button>
            </div>
          </div>
        );
      })}

      {/* Add button */}
      {canAddMore && (
        <div className="ml-56 mt-2">
          <button
            onClick={() => addPendingRoster(startEndValue)}
            disabled={rows.length + pendingRows.length >= 20}
            className={`text-xs ${
              rows.length + pendingRows.length >= 20
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:underline'
            }`}
          >
            + Add Player
          </button>
        </div>
      )}
    </div>
  );
}

export default function RosterTab({
  roster,
  onUpdateRoster,
  onDeleteRoster,
  onAddRoster,
  seasonId,
}: RosterTabProps) {
  const {
    editingRows,
    draftItems: draftRoster,
    pendingItems: pendingRoster,
    stageEdit,
    startEditing,
    addPending: addPendingRoster,
    saveItem,
    removePending,
  } = useDraftEditing<RosterEntry>();

  // Split roster into start and end
  const startRoster = useMemo(() => roster.filter((r) => r.start_end === 'start' || !r.start_end), [roster]);
  const endRoster = useMemo(() => roster.filter((r) => r.start_end === 'end'), [roster]);

  const startPending = (pendingRoster?.['start'] || []) as string[];
  const endPending = (pendingRoster?.['end'] || []) as string[];

  return (
    <div className="space-y-8 w-full">
      <div>
        <h3 className="px-4 text-lg font-semibold text-gray-900 mb-3">Roster</h3>
        <p className="px-4 text-xs text-gray-500 mb-4">
          You can add up to 20 players for the start and end of the season.
        </p>

        {/* Start of Season Roster */}
        <RosterSection
          title="Start of Season"
          rows={startRoster}
          pendingRows={startPending}
          editingRows={editingRows}
          draftRoster={draftRoster}
          stageEdit={stageEdit}
          startEditing={startEditing}
          addPendingRoster={addPendingRoster}
          saveItem={saveItem}
          removePending={removePending}
          onAddRoster={onAddRoster}
          onUpdateRoster={onUpdateRoster}
          onDeleteRoster={onDeleteRoster}
          seasonId={seasonId}
          startEndValue="start"
        />

        {/* End of Season Roster */}
        <div className="mt-8">
          <RosterSection
            title="End of Season"
            rows={endRoster}
            pendingRows={endPending}
            editingRows={editingRows}
            draftRoster={draftRoster}
            stageEdit={stageEdit}
            startEditing={startEditing}
            addPendingRoster={addPendingRoster}
            saveItem={saveItem}
            removePending={removePending}
            onAddRoster={onAddRoster}
            onUpdateRoster={onUpdateRoster}
            onDeleteRoster={onDeleteRoster}
            seasonId={seasonId}
            startEndValue="end"
          />
        </div>
      </div>
    </div>
  );
}
