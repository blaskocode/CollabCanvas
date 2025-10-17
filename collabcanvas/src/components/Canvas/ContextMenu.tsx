import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isLockedByOther?: boolean;
}

/**
 * ContextMenu Component
 * Right-click context menu for shape operations
 * Appears at cursor position with layer ordering and common actions
 */
const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  isLockedByOther = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const MenuItem = ({ onClick, disabled, shortcut, children }: { 
    onClick: () => void; 
    disabled?: boolean; 
    shortcut?: string; 
    children: React.ReactNode 
  }) => (
    <button
      onClick={() => !disabled && handleAction(onClick)}
      disabled={disabled}
      className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${
        disabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <span>{children}</span>
      {shortcut && <span className="text-xs text-gray-400 ml-4">{shortcut}</span>}
    </button>
  );

  const Divider = () => <div className="border-t border-gray-200 my-1" />;

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[180px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Layer Ordering */}
      <MenuItem onClick={onBringForward} disabled={isLockedByOther} shortcut="Ctrl+]">
        Bring Forward
      </MenuItem>
      <MenuItem onClick={onSendBackward} disabled={isLockedByOther} shortcut="Ctrl+[">
        Send Backward
      </MenuItem>
      <MenuItem onClick={onBringToFront} disabled={isLockedByOther}>
        Bring to Front
      </MenuItem>
      <MenuItem onClick={onSendToBack} disabled={isLockedByOther}>
        Send to Back
      </MenuItem>

      <Divider />

      {/* Common Actions */}
      <MenuItem onClick={onDuplicate} disabled={isLockedByOther} shortcut="Ctrl+D">
        Duplicate
      </MenuItem>
      <MenuItem onClick={onDelete} disabled={isLockedByOther} shortcut="Del">
        Delete
      </MenuItem>
    </div>
  );
};

export default ContextMenu;

