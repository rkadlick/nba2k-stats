'use client';

import { useState } from 'react';

interface DeleteConfirmButtonProps {
  onConfirm: () => void;
  label?: string;
  confirmLabel?: string;
  className?: string;
}

export default function DeleteConfirmButton({
  onConfirm,
  label = 'Delete',
  confirmLabel = 'Confirm',
  className = 'px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 font-medium',
}: DeleteConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClick = () => {
    if (isConfirming) {
      // Second click - actually delete
      onConfirm();
      setIsConfirming(false);
    } else {
      // First click - show confirmation
      setIsConfirming(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={isConfirming
        ? 'px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-medium'
        : className
      }
    >
      {isConfirming ? confirmLabel : label}
    </button>
  );
}
