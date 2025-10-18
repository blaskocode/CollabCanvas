import React, { useState, useMemo } from 'react';
import { useCanvasContext } from '../../contexts/canvas';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { Comment } from '../../utils/types';

interface CommentsPanelProps {
  onClose: () => void;
  zIndex?: number;
}

/**
 * CommentsPanel Component
 * Panel for viewing and managing comments on selected shapes
 */
const CommentsPanel: React.FC<CommentsPanelProps> = ({ onClose, zIndex = 40 }) => {
  const { selectedIds, shapes, comments, createComment, updateComment, deleteComment, resolveComment, unresolveComment, getShapeComments } = useCanvasContext();
  const { currentUser } = useAuth();
  const toast = useToast();
  
  const [newCommentText, setNewCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  // Get comments for selected shape(s)
  const selectedShapeId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedShape = selectedShapeId ? shapes.find(s => s.id === selectedShapeId) : null;
  
  const shapeComments = useMemo(() => {
    if (!selectedShapeId) return [];
    
    const allComments = getShapeComments(selectedShapeId);
    
    // Filter by resolved status
    const filtered = showResolved ? allComments : allComments.filter(c => !c.resolved);
    
    // Separate top-level comments and replies
    const topLevel = filtered.filter(c => !c.parentId);
    
    // Sort by creation time (newest first)
    return topLevel.sort((a, b) => b.createdAt - a.createdAt);
  }, [selectedShapeId, comments, showResolved, getShapeComments]);

  const getReplies = (parentId: string): Comment[] => {
    return comments
      .filter(c => c.parentId === parentId && (showResolved || !c.resolved))
      .sort((a, b) => a.createdAt - b.createdAt);
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedShapeId) return;

    try {
      await createComment(newCommentText.trim(), selectedShapeId);
      setNewCommentText('');
      toast.success('Comment added');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || !selectedShapeId) return;

    try {
      await createComment(replyText.trim(), selectedShapeId, undefined, parentId);
      setReplyText('');
      setReplyToId(null);
      toast.success('Reply added');
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return;

    try {
      await updateComment(commentId, { text: editText.trim() });
      setEditingCommentId(null);
      setEditText('');
      toast.success('Comment updated');
    } catch (error: any) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await deleteComment(commentId);
        toast.success('Comment deleted');
      } catch (error: any) {
        console.error('Error deleting comment:', error);
        toast.error('Failed to delete comment');
      }
    }
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      if (resolved) {
        await unresolveComment(commentId);
        toast.success('Comment reopened');
      } else {
        await resolveComment(commentId);
        toast.success('Comment resolved');
      }
    } catch (error: any) {
      console.error('Error toggling comment resolution:', error);
      toast.error('Failed to update comment');
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwner = currentUser?.uid === comment.createdBy;
    const replies = getReplies(comment.id);
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyToId === comment.id;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-3'}`}>
        <div className={`bg-white border-2 rounded-lg p-3 ${comment.resolved ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-gray-800">{comment.createdByName}</span>
                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                {comment.resolved && (
                  <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full font-medium">
                    Resolved
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditComment(comment.id)}
                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditText('');
                  }}
                  className="text-xs px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
              
              <div className="flex items-center gap-2 mt-2">
                {!isReply && (
                  <button
                    onClick={() => setReplyToId(comment.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Reply
                  </button>
                )}
                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditText(comment.text);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </>
                )}
                {!isReply && (
                  <button
                    onClick={() => handleResolveComment(comment.id, comment.resolved)}
                    className={`text-xs font-medium ${comment.resolved ? 'text-gray-600 hover:text-gray-800' : 'text-green-600 hover:text-green-800'}`}
                  >
                    {comment.resolved ? 'Reopen' : 'Resolve'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reply input */}
        {isReplying && (
          <div className="ml-8 mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleReply(comment.id)}
                disabled={!replyText.trim()}
                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded font-medium transition-colors"
              >
                Reply
              </button>
              <button
                onClick={() => {
                  setReplyToId(null);
                  setReplyText('');
                }}
                className="text-xs px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Render replies */}
        {replies.length > 0 && (
          <div className="mt-2">
            {replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed right-0 top-16 bottom-0 w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col" style={{ zIndex }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span>Comments</span>
        </h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Close comments panel"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!selectedShapeId ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <p className="text-gray-500 font-medium mb-2">No Shape Selected</p>
            <p className="text-sm text-gray-400">
              Select a shape to view or add comments
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Selected Shape Info */}
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{selectedShape?.type}</span>
              {selectedShape?.text && `: "${selectedShape.text}"`}
            </p>
          </div>

          {/* Filter */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <label className="flex items-center space-x-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">Show resolved comments</span>
            </label>
          </div>

          {/* New Comment Input */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleAddComment();
                }
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Add Comment
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4">
            {shapeComments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {showResolved ? 'No comments yet' : 'No unresolved comments'}
              </div>
            ) : (
              <div className="space-y-2">
                {shapeComments.map(comment => renderComment(comment))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommentsPanel;

