/**
 * @fileoverview Connections state management for connectors between shapes
 * Handles CRUD operations with optimistic updates and Firestore sync
 */

import { useState, useMemo, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  addConnection as addConnectionService,
  updateConnection as updateConnectionService,
  deleteConnection as deleteConnectionService,
  getShapeConnections as getShapeConnectionsService,
} from '../../../services/connections';
import type { Connection, ConnectionCreateData, ConnectionUpdateData } from '../../../utils/types';
import { GLOBAL_CANVAS_ID } from '../../../utils/constants';

export interface ConnectionsState {
  connections: Connection[];
  selectedConnectionId: string | null;
}

export interface ConnectionsActions {
  addConnection: (connectionData: ConnectionCreateData, userId: string, onHistoryRecord?: (connectionId: string, data: any) => void) => Promise<string>;
  updateConnection: (id: string, updates: ConnectionUpdateData, userId: string) => Promise<void>;
  deleteConnection: (id: string, onHistoryRecord?: (connectionId: string, data: any) => void) => Promise<void>;
  selectConnection: (id: string | null) => void;
  getShapeConnections: (shapeId: string) => Connection[];
}

export type UseConnectionsStateReturn = ConnectionsState & ConnectionsActions;

interface UseConnectionsStateProps {
  connectionsFromFirestore: Connection[];
  currentUserId: string | null;
  onSelectConnection?: (id: string | null) => void;
}

/**
 * @description Manages connection state with optimistic updates
 * Handles arrow toggles, path recomputation (delegates geometry to utils/anchor-snapping.ts)
 */
export const useConnectionsState = ({
  connectionsFromFirestore,
  currentUserId,
  onSelectConnection,
}: UseConnectionsStateProps): UseConnectionsStateReturn => {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  
  // Local optimistic connection updates (to provide immediate UI feedback)
  const [optimisticConnectionUpdates, setOptimisticConnectionUpdates] = useState<Map<string, Partial<Connection>>>(new Map());

  // Merge Firestore connections with optimistic updates
  const connections = useMemo(() => {
    return connectionsFromFirestore.map(conn => {
      const optimisticUpdate = optimisticConnectionUpdates.get(conn.id);
      if (!optimisticUpdate) return conn;
      
      // Merge updates, and explicitly delete fields that are set to undefined
      const merged = { ...conn, ...optimisticUpdate };
      Object.keys(optimisticUpdate).forEach(key => {
        if (optimisticUpdate[key as keyof typeof optimisticUpdate] === undefined) {
          delete merged[key as keyof typeof merged];
        }
      });
      
      return merged;
    });
  }, [connectionsFromFirestore, optimisticConnectionUpdates]);

  /**
   * Add a connection between two shapes
   */
  const addConnection = useCallback(async (
    connectionData: ConnectionCreateData,
    userId: string,
    onHistoryRecord?: (connectionId: string, data: any) => void
  ): Promise<string> => {
    if (!userId) throw new Error('Must be logged in to add connections');
    
    try {
      const connectionId = await addConnectionService(GLOBAL_CANVAS_ID, connectionData);
      
      // Record connection creation in history if callback provided
      if (onHistoryRecord) {
        onHistoryRecord(connectionId, {
          ...connectionData,
          id: connectionId,
          type: 'connection' as any, // Mark as connection for history tracking
        });
      }
      
      return connectionId;
    } catch (error) {
      console.error('Error adding connection:', error);
      throw error;
    }
  }, []);

  /**
   * Update a connection
   */
  const updateConnection = useCallback(async (
    id: string,
    updates: ConnectionUpdateData,
    userId: string
  ): Promise<void> => {
    if (!userId) throw new Error('Must be logged in to update connections');
    
    // Include lastModifiedBy in the actual Firebase update (not just optimistic)
    const updatesWithMetadata = {
      ...updates,
      lastModifiedBy: userId,
    };
    
    // Optimistic update: immediately apply changes locally
    // IMPORTANT: Keep undefined values - they signal fields to be deleted
    const optimisticUpdate: any = {
      ...updatesWithMetadata,
      lastModifiedAt: Timestamp.now()
    };
    
    setOptimisticConnectionUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(id, optimisticUpdate);
      return newMap;
    });
    
    try {
      // Send update with lastModifiedBy to Firebase
      await updateConnectionService(GLOBAL_CANVAS_ID, id, updatesWithMetadata);
      
      // Clear optimistic update after Firebase confirms
      setOptimisticConnectionUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    } catch (error) {
      console.error('Error updating connection:', error);
      // Revert optimistic update on error
      setOptimisticConnectionUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      throw error;
    }
  }, []);

  /**
   * Delete a connection
   */
  const deleteConnection = useCallback(async (
    id: string,
    onHistoryRecord?: (connectionId: string, data: any) => void
  ): Promise<void> => {
    if (!currentUserId) throw new Error('Must be logged in to delete connections');
    
    try {
      // Find the connection before deleting for history
      const connection = connections.find(c => c.id === id);
      
      await deleteConnectionService(GLOBAL_CANVAS_ID, id);
      
      // Record connection deletion in history if callback provided
      if (onHistoryRecord && connection) {
        onHistoryRecord(id, {
          ...connection,
          type: 'connection' as any,
        });
      }
      
      // Clear selection if this connection was selected
      if (selectedConnectionId === id) {
        setSelectedConnectionId(null);
        onSelectConnection?.(null);
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  }, [connections, selectedConnectionId, currentUserId, onSelectConnection]);

  /**
   * Select a connection
   */
  const selectConnection = useCallback((id: string | null): void => {
    setSelectedConnectionId(id);
    onSelectConnection?.(id);
  }, [onSelectConnection]);

  /**
   * Get all connections for a specific shape
   */
  const getShapeConnections = useCallback((shapeId: string): Connection[] => {
    return getShapeConnectionsService(connections, shapeId);
  }, [connections]);

  return {
    connections,
    selectedConnectionId,
    addConnection,
    updateConnection,
    deleteConnection,
    selectConnection,
    getShapeConnections,
  };
};

