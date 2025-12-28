'use client';

import React, { useMemo } from 'react';
import { RosterEntry, Player } from '@/lib/types';
import { useDraftEditing } from '@/hooks/ui/useDraftEditing';

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
const HARDCODED_PLAYER_ID = 'hardcoded-player';

// Position order for sorting starters
const getPositionOrder = (position: string): number => {
  const order: Record<string, number> = { 'PG': 0, 'SG': 1, 'SF': 2, 'PF': 3, 'C': 4 };
  return order[position] ?? 99; // Unknown positions go to end
};

// Helper function to create hardcoded player entry
function createHardcodedPlayerEntry(player: Player | null, startEnd: 'start' | 'end'): RosterEntry {
  return {
    id: `${HARDCODED_PLAYER_ID}-${startEnd}`,
    player_id: player?.id,
    season_id: '',
    player_name: player?.player_name || 'Player',
    position: 'PG',
    secondary_position: null,
    is_starter: true,
    overall: 99,
    start_end: startEnd,
  };
}

interface RosterTabProps {
  roster: RosterEntry[];
  onAddRoster?: (payload: Partial<RosterEntry>) => void;
  onUpdateRoster: (row: RosterEntry) => void;
  onDeleteRoster: (id: string) => void;
  seasonId?: string;
  currentUserPlayer?: Player | null;
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
  hardcodedPlayer,
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
  hardcodedPlayer?: RosterEntry | null;
}) {
  // Only show rows that have been saved (have an ID) and are not hardcoded
  const filteredRows: RosterEntry[] = rows.filter(row => row.id && !String(row.id).startsWith(HARDCODED_PLAYER_ID));
  
  // Sort rows: starters by position, bench by overall
  const displayRows: RosterEntry[] = filteredRows.sort((a, b) => {
    const aIsStarter = a.is_starter === true;
    const bIsStarter = b.is_starter === true;
    
    // Starters come first
    if (aIsStarter && !bIsStarter) return -1;
    if (!aIsStarter && bIsStarter) return 1;
    
    // If both are starters, sort by position
    if (aIsStarter && bIsStarter) {
      const aOrder = getPositionOrder(a.position || '');
      const bOrder = getPositionOrder(b.position || '');
      return aOrder - bOrder;
    }
    
    // If both are bench, sort by overall (highest to lowest)
    const aOverall = a.overall ?? 0;
    const bOverall = b.overall ?? 0;
    return bOverall - aOverall; // Descending order
  });

  const handleSave = (row: RosterEntry) => {
    const rowId = String(row.id || '');
    saveItem(rowId, (item) => {
      const isTemp = !rowId || (typeof rowId === 'string' && rowId.startsWith('temp-'));

      if (isTemp) {
        if (!item.player_name || !item.position) return;
        onAddRoster?.({
          player_name: item.player_name,
          position: item.position,
          secondary_position: item.secondary_position || null,
          is_starter: item.is_starter ?? false,
          overall: item.overall ?? undefined,
          season_id: seasonId ?? row.season_id,
          start_end: startEndValue,
        });
      } else {
        // For updates, ensure id is always included from the original row
        // The draft (item) only contains edited fields, so we need to merge with original
        onUpdateRoster({
          ...row, // Start with original row to get all fields including id
          ...item, // Override with edited fields from draft
          id: row.id, // Always preserve id from original
          start_end: startEndValue,
        } as RosterEntry);
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
      overall: draft.overall ?? undefined,
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
      
      {/* Hardcoded player entry - always shown, uneditable, undeletable */}
      {hardcodedPlayer && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-1 mb-2 pb-2 border-b border-gray-200">
          <div className="w-56" />
          <div className="flex flex-1 items-center text-sm text-gray-800 px-3 py-[6px] min-h-[36px]">
            <span className="font-bold">{hardcodedPlayer.player_name}</span>
          </div>
          <div className="w-20 text-sm text-gray-800 px-2 py-[6px] min-h-[36px] flex items-center">
            {hardcodedPlayer.position}
          </div>
          <div className="w-20 text-sm text-gray-800 px-2 py-[6px] min-h-[36px] flex items-center">
            {hardcodedPlayer.secondary_position || ''}
          </div>
          <div className="w-16 text-sm text-gray-800 px-2 py-[6px] min-h-[36px] flex items-center">
            {hardcodedPlayer.overall}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 whitespace-nowrap">Starter</span>
          </div>
          <div className="flex items-center h-[36px]">
            <span className="text-xs text-gray-400">You</span>
          </div>
        </div>
      )}
      
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
                          overall: row.overall,
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
                className="w-20 text-sm px-2 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pos</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-20 text-sm text-gray-800 px-2 py-[6px] min-h-[36px] flex items-center">
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
                className="w-20 text-sm px-2 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sec</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-20 text-sm text-gray-800 px-2 py-[6px] min-h-[36px] flex items-center">
                {row.secondary_position || ''}
              </div>
            )}

            {/* Overall Input */}
            {isEditing ? (
              <input
                type="number"
                value={draft.overall ?? row.overall ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : Number(e.target.value);
                  stageEdit(rowId, 'overall', value);
                }}
                placeholder="OVR"
                className="w-16 text-sm px-2 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
                min="0"
                max="99"
              />
            ) : (
              <div className="w-16 text-sm text-gray-800 px-2 py-[6px] min-h-[36px] flex items-center">
                {row.overall ?? ''}
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
                    onDeleteRoster(row.id);
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
              className="w-20 text-sm px-2 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pos</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            <select
              value={draft.secondary_position ?? ''}
              onChange={(e) => stageEdit(tempId, 'secondary_position', e.target.value || null)}
              className="w-20 text-sm px-2 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sec</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
            {/* Overall Input for pending roster */}
            <input
              type="number"
              value={draft.overall ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : Number(e.target.value);
                stageEdit(tempId, 'overall', value);
              }}
              placeholder="OVR"
              className="w-16 text-sm px-2 py-1.5 border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500"
              min="0"
              max="99"
            />
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
  currentUserPlayer,
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

  // Split roster into start and end (excluding hardcoded entries)
  const startRoster = useMemo(() => 
    roster.filter((r) => (r.start_end === 'start' || !r.start_end) && r.id && !String(r.id).startsWith(HARDCODED_PLAYER_ID)), 
    [roster]
  );
  const endRoster = useMemo(() => 
    roster.filter((r) => r.start_end === 'end' && r.id && !String(r.id).startsWith(HARDCODED_PLAYER_ID)), 
    [roster]
  );

  const startPending = (pendingRoster?.['start'] || []) as string[];
  const endPending = (pendingRoster?.['end'] || []) as string[];

  // Create hardcoded player entries
  const hardcodedStartPlayer = currentUserPlayer ? createHardcodedPlayerEntry(currentUserPlayer, 'start') : null;
  const hardcodedEndPlayer = currentUserPlayer ? createHardcodedPlayerEntry(currentUserPlayer, 'end') : null;

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
          hardcodedPlayer={hardcodedStartPlayer}
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
            hardcodedPlayer={hardcodedEndPlayer}
          />
        </div>
      </div>
    </div>
  );
}
