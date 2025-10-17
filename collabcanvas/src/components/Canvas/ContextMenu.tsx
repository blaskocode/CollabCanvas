import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSelectAllOfType?: () => void;
  shapeType?: string;
  isLockedByOther?: boolean;
  hasClipboardData?: boolean;
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
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onSelectAllOfType,
  shapeType,
  isLockedByOther = false,
  hasClipboardData = false,
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

      {/* Clipboard Actions */}
      <MenuItem onClick={onCopy} disabled={isLockedByOther} shortcut="Ctrl+C">
        Copy
      </MenuItem>
      <MenuItem onClick={onCut} disabled={isLockedByOther} shortcut="Ctrl+X">
        Cut
      </MenuItem>
      <MenuItem onClick={onPaste} disabled={!hasClipboardData} shortcut="Ctrl+V">
        Paste
      </MenuItem>
      
      {/* Selection Actions */}
      {onSelectAllOfType && shapeType && (
        <>
          <Divider />
          <MenuItem onClick={onSelectAllOfType}>
            Select All {shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}s
          </MenuItem>
        </>
      )}

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

