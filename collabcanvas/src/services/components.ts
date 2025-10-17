/**
 * Component Service
 * Handles Firestore operations for reusable components/symbols
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
import type { Component, ComponentCreateData, ComponentUpdateData } from '../utils/types';

const COMPONENTS_COLLECTION = 'components';

/**
 * Create a new component
 */
export async function createComponent(
  data: ComponentCreateData
): Promise<string> {
  try {
    // Build component data, excluding undefined fields
    const componentData: any = {
      name: data.name,
      shapes: data.shapes,
      width: data.width,
      height: data.height,
      createdBy: data.createdBy,
      canvasId: data.canvasId,
      createdAt: serverTimestamp(),
      lastModifiedBy: data.createdBy,
      lastModifiedAt: serverTimestamp(),
    };
    
    // Only include description if it's provided
    if (data.description) {
      componentData.description = data.description;
    }

    const docRef = await addDoc(collection(db, COMPONENTS_COLLECTION), componentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating component:', error);
    throw error;
  }
}

/**
 * Update an existing component
 */
export async function updateComponent(
  componentId: string,
  updates: ComponentUpdateData
): Promise<void> {
  try {
    const componentRef = doc(db, COMPONENTS_COLLECTION, componentId);
    await updateDoc(componentRef, {
      ...updates,
      lastModifiedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating component:', error);
    throw error;
  }
}

/**
 * Delete a component
 */
export async function deleteComponent(componentId: string): Promise<void> {
  try {
    const componentRef = doc(db, COMPONENTS_COLLECTION, componentId);
    await deleteDoc(componentRef);
  } catch (error) {
    console.error('Error deleting component:', error);
    throw error;
  }
}

/**
 * Get all components for a canvas
 */
export async function getComponents(canvasId: string): Promise<Component[]> {
  try {
    const q = query(
      collection(db, COMPONENTS_COLLECTION),
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
      } as Component;
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    throw error;
  }
}

/**
 * Subscribe to component changes for a canvas
 */
export function subscribeToComponents(
  canvasId: string,
  onUpdate: (components: Component[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COMPONENTS_COLLECTION),
    where('canvasId', '==', canvasId)
  );

  return onSnapshot(q, (snapshot) => {
    const components = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        lastModifiedAt: data.lastModifiedAt instanceof Timestamp ? data.lastModifiedAt.toMillis() : Date.now(),
      } as Component;
    });
    onUpdate(components);
  });
}

