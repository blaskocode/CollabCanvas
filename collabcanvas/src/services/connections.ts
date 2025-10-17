/**
 * Connection Service
 * Manages CRUD operations for workflow connections in Firestore
 */

import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Connection, ConnectionCreateData, ConnectionUpdateData } from '../utils/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Add a connection to the canvas
 * 
 * @param canvasId - Canvas document ID
 * @param connectionData - Connection data to add
 * @returns Promise resolving to the new connection ID
 */
export async function addConnection(
  canvasId: string,
  connectionData: ConnectionCreateData
): Promise<string> {
  const canvasRef = doc(db, 'canvases', canvasId);
  
  // Generate ID if not provided
  const connectionId = connectionData.id || `conn_${uuidv4()}`;
  
  // Create full connection object (only include defined fields)
  // Note: Using Timestamp.now() instead of serverTimestamp() because arrayUnion doesn't support sentinel values
  const connection: any = {
    id: connectionId,
    fromShapeId: connectionData.fromShapeId,
    fromAnchor: connectionData.fromAnchor,
    toShapeId: connectionData.toShapeId,
    toAnchor: connectionData.toAnchor,
    arrowType: connectionData.arrowType || 'end',
    stroke: connectionData.stroke || '#000000',
    strokeWidth: connectionData.strokeWidth || 2,
    createdBy: connectionData.createdBy,
    createdAt: Timestamp.now(),
  };
  
  // Only add optional fields if they're defined
  if (connectionData.label !== undefined && connectionData.label !== null) {
    connection.label = connectionData.label;
  }
  
  // Add to connections array
  await updateDoc(canvasRef, {
    connections: arrayUnion(connection),
    lastUpdated: serverTimestamp(),
  });
  
  return connectionId;
}

/**
 * Update a connection
 * 
 * @param canvasId - Canvas document ID
 * @param connectionId - Connection ID to update
 * @param updates - Partial connection updates
 */
export async function updateConnection(
  canvasId: string,
  connectionId: string,
  updates: ConnectionUpdateData
): Promise<void> {
  const canvasRef = doc(db, 'canvases', canvasId);
  const canvasDoc = await getDoc(canvasRef);
  
  if (!canvasDoc.exists()) {
    throw new Error('Canvas not found');
  }
  
  const data = canvasDoc.data();
  const connections = data.connections || [];
  
  // Find and update the connection
  const updatedConnections = connections.map((conn: Connection) => {
    if (conn.id === connectionId) {
      return {
        ...conn,
        ...updates,
        lastModifiedAt: Timestamp.now(),
      };
    }
    return conn;
  });
  
  await updateDoc(canvasRef, {
    connections: updatedConnections,
    lastUpdated: serverTimestamp(),
  });
}

/**
 * Delete a connection
 * 
 * @param canvasId - Canvas document ID
 * @param connectionId - Connection ID to delete
 */
export async function deleteConnection(
  canvasId: string,
  connectionId: string
): Promise<void> {
  const canvasRef = doc(db, 'canvases', canvasId);
  const canvasDoc = await getDoc(canvasRef);
  
  if (!canvasDoc.exists()) {
    throw new Error('Canvas not found');
  }
  
  const data = canvasDoc.data();
  const connections = data.connections || [];
  
  // Find the connection to remove
  const connectionToRemove = connections.find((conn: Connection) => conn.id === connectionId);
  
  if (connectionToRemove) {
    await updateDoc(canvasRef, {
      connections: arrayRemove(connectionToRemove),
      lastUpdated: serverTimestamp(),
    });
  }
}

/**
 * Get all connections for a specific shape
 * 
 * @param connections - All connections
 * @param shapeId - Shape ID to find connections for
 * @returns Array of connections involving this shape
 */
export function getShapeConnections(
  connections: Connection[],
  shapeId: string
): Connection[] {
  return connections.filter(
    conn => conn.fromShapeId === shapeId || conn.toShapeId === shapeId
  );
}

/**
 * Delete all connections for a shape (when shape is deleted)
 * 
 * @param canvasId - Canvas document ID
 * @param shapeId - Shape ID whose connections to delete
 */
export async function deleteShapeConnections(
  canvasId: string,
  shapeId: string
): Promise<void> {
  const canvasRef = doc(db, 'canvases', canvasId);
  const canvasDoc = await getDoc(canvasRef);
  
  if (!canvasDoc.exists()) {
    return;
  }
  
  const data = canvasDoc.data();
  const connections = data.connections || [];
  
  // Filter out connections involving this shape
  const remainingConnections = connections.filter(
    (conn: Connection) => conn.fromShapeId !== shapeId && conn.toShapeId !== shapeId
  );
  
  if (remainingConnections.length !== connections.length) {
    await updateDoc(canvasRef, {
      connections: remainingConnections,
      lastUpdated: serverTimestamp(),
    });
  }
}

/**
 * Batch add multiple connections (for AI-generated workflows)
 * 
 * @param canvasId - Canvas document ID
 * @param connectionsData - Array of connections to add
 * @returns Promise resolving to array of created connection IDs
 */
export async function batchAddConnections(
  canvasId: string,
  connectionsData: ConnectionCreateData[]
): Promise<string[]> {
  const canvasRef = doc(db, 'canvases', canvasId);
  
  // Create full connection objects (only include defined fields)
  // Note: Using Timestamp.now() instead of serverTimestamp() because arrayUnion doesn't support sentinel values
  const connections: Connection[] = connectionsData.map(connData => {
    const connection: any = {
      id: connData.id || `conn_${uuidv4()}`,
      fromShapeId: connData.fromShapeId,
      fromAnchor: connData.fromAnchor,
      toShapeId: connData.toShapeId,
      toAnchor: connData.toAnchor,
      arrowType: connData.arrowType || 'end',
      stroke: connData.stroke || '#000000',
      strokeWidth: connData.strokeWidth || 2,
      createdBy: connData.createdBy,
      createdAt: Timestamp.now(),
    };
    
    // Only add optional fields if they're defined
    if (connData.label !== undefined && connData.label !== null) {
      connection.label = connData.label;
    }
    
    return connection;
  });
  
  // Get current connections
  const canvasDoc = await getDoc(canvasRef);
  const currentConnections = canvasDoc.exists() ? (canvasDoc.data().connections || []) : [];
  
  // Merge and update
  await updateDoc(canvasRef, {
    connections: [...currentConnections, ...connections],
    lastUpdated: serverTimestamp(),
  });
  
  return connections.map(c => c.id);
}

/**
 * Validate connection (check if shapes exist)
 * 
 * @param connection - Connection to validate
 * @param shapes - Available shapes
 * @returns true if connection is valid
 */
export function validateConnection(
  connection: Connection,
  shapes: { id: string }[]
): boolean {
  const fromExists = shapes.some(s => s.id === connection.fromShapeId);
  const toExists = shapes.some(s => s.id === connection.toShapeId);
  return fromExists && toExists;
}

