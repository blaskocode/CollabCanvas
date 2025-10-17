/**
 * Comments Service
 * Handles Firestore operations for collaborative comments/annotations
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Comment, CommentCreateData, CommentUpdateData } from '../utils/types';

const COMMENTS_COLLECTION = 'comments';

/**
 * Create a new comment
 */
export async function createComment(
  data: CommentCreateData
): Promise<string> {
  try {
    // Build comment data, excluding undefined fields
    const commentData: any = {
      shapeId: data.shapeId,
      canvasId: data.canvasId,
      text: data.text,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: serverTimestamp(),
      lastModifiedAt: serverTimestamp(),
      resolved: false,
    };
    
    // Only include optional fields if they're provided
    if (data.x !== undefined) {
      commentData.x = data.x;
    }
    if (data.y !== undefined) {
      commentData.y = data.y;
    }
    if (data.parentId) {
      commentData.parentId = data.parentId;
    }

    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), commentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

/**
 * Update an existing comment
 */
export async function updateComment(
  commentId: string,
  updates: CommentUpdateData
): Promise<void> {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      ...updates,
      lastModifiedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

/**
 * Resolve a comment
 */
export async function resolveComment(commentId: string, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      resolved: true,
      resolvedBy: userId,
      resolvedAt: serverTimestamp(),
      lastModifiedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resolving comment:', error);
    throw error;
  }
}

/**
 * Unresolve a comment
 */
export async function unresolveComment(commentId: string): Promise<void> {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    await updateDoc(commentRef, {
      resolved: false,
      resolvedBy: null,
      resolvedAt: null,
      lastModifiedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error unresolving comment:', error);
    throw error;
  }
}

/**
 * Get all comments for a canvas
 */
export async function getComments(canvasId: string): Promise<Comment[]> {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('canvasId', '==', canvasId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        lastModifiedAt: data.lastModifiedAt instanceof Timestamp ? data.lastModifiedAt.toMillis() : Date.now(),
        resolvedAt: data.resolvedAt instanceof Timestamp ? data.resolvedAt.toMillis() : undefined,
      } as Comment;
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * Subscribe to comment changes for a canvas
 */
export function subscribeToComments(
  canvasId: string,
  onUpdate: (comments: Comment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COMMENTS_COLLECTION),
    where('canvasId', '==', canvasId)
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        lastModifiedAt: data.lastModifiedAt instanceof Timestamp ? data.lastModifiedAt.toMillis() : Date.now(),
        resolvedAt: data.resolvedAt instanceof Timestamp ? data.resolvedAt.toMillis() : undefined,
      } as Comment;
    });
    onUpdate(comments);
  });
}

