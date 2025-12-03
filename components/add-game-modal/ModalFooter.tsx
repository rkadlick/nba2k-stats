"use client";

interface ModalFooterProps {
  onClose: () => void;
  onClear: () => void;
  isSubmitting: boolean;
  manualSeasonBlocked: boolean;
  isEditing: boolean;
}

export function ModalFooter({
  onClose,
  onClear,
  isSubmitting,
  manualSeasonBlocked,
  isEditing,
}: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onClear}
        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        Clear Form
      </button>

      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={isSubmitting || manualSeasonBlocked}
        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Game"}
      </button>
    </div>
  );
}