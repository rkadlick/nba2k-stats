import { useState, useCallback } from "react";
import { v4 as uuid } from 'uuid';

interface UseDraftEditingProps<T> {
  // Optional initial state
  initialEditingRows?: Record<string, boolean>;
  initialDraftItems?: Record<string, Partial<T>>;
  initialPendingItems?: Record<string, string[]>;
}

interface UseDraftEditingReturn<T> {
  editingRows: Record<string, boolean>;
  draftItems: Record<string, Partial<T>>;
  pendingItems: Record<string, string[]>;

  // Helper functions
  stageEdit: (id: string, field: keyof T, value: T[keyof T]) => void;
  startEditing: (id: string, initialValues?: Partial<T>) => void;
  cancelEditing: (id: string) => void;
  addPending: (groupKey: string) => string;
  removePending: (groupKey: string, tempId: string) => void;
  saveItem: (id: string, onSave: (item: T) => void) => void;
  clearDrafts: () => void;
}

export function useDraftEditing<T extends Record<string, any>>({
  initialEditingRows = {},
  initialDraftItems = {},
  initialPendingItems = {},
}: UseDraftEditingProps<T> = {}): UseDraftEditingReturn<T> {
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>(initialEditingRows);
  const [draftItems, setDraftItems] = useState<Record<string, Partial<T>>>(initialDraftItems);
  const [pendingItems, setPendingItems] = useState<Record<string, string[]>>(initialPendingItems);

  // Stage an edit to a draft item
  const stageEdit = useCallback((id: string, field: keyof T, value: T[keyof T]) => {
    setDraftItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }, []);

  // Start editing an item (initialize draft with current values)
  const startEditing = useCallback((id: string, initialValues?: Partial<T>) => {
    if (initialValues) {
      setDraftItems((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...initialValues },
      }));
    }
    setEditingRows((prev) => ({ ...prev, [id]: true }));
  }, []);

  // Cancel editing (remove from editing rows and drafts)
  const cancelEditing = useCallback((id: string) => {
    setEditingRows((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setDraftItems((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }, []);

  // Add a new pending item to a group
  const addPending = useCallback((groupKey: string): string => {
    const tempId = `temp-${groupKey}-${uuid()}`;
    setPendingItems((prev) => ({
      ...prev,
      [groupKey]: [...(prev[groupKey] || []), tempId],
    }));
    return tempId;
  }, []);

  // Remove a pending item
  const removePending = useCallback((groupKey: string, tempId: string) => {
    setPendingItems((prev) => ({
      ...prev,
      [groupKey]: (prev[groupKey] || []).filter((id) => id !== tempId),
    }));
    setDraftItems((prev) => {
      const updated = { ...prev };
      delete updated[tempId];
      return updated;
    });
  }, []);

  // Save an item (clear editing state and drafts)
  const saveItem = useCallback((id: string, onSave: (item: T) => void) => {
    const draft = draftItems[id];
    if (draft) {
      onSave(draft as T);
    }

    // Clear editing state
    setEditingRows((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // Clear draft
    setDraftItems((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }, [draftItems]);

  // Clear all drafts and editing state
  const clearDrafts = useCallback(() => {
    setEditingRows({});
    setDraftItems({});
    setPendingItems({});
  }, []);

  return {
    editingRows,
    draftItems,
    pendingItems,
    stageEdit,
    startEditing,
    cancelEditing,
    addPending,
    removePending,
    saveItem,
    clearDrafts,
  };
}
