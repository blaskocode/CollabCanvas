/**
 * Workflow Layout Algorithms
 * Auto-layout for workflow shapes created by AI agent
 */

import type { ShapeCreateData, ConnectionCreateData, AnchorPosition } from './types';

/**
 * Layout configuration
 */
export const LAYOUT_CONFIG = {
  horizontalGap: 200, // Gap between shapes horizontally
  verticalGap: 150,   // Gap between shapes vertically
  branchOffset: 100,  // Vertical offset for branches
  defaultShapeSize: {
    process: { width: 120, height: 60 },
    decision: { width: 100, height: 100 },
    startEnd: { width: 120, height: 60 },
    document: { width: 100, height: 80 },
    database: { width: 100, height: 80 },
  }
};

/**
 * Layout direction
 */
export type LayoutDirection = 'horizontal' | 'vertical';

/**
 * Node in workflow graph
 */
interface WorkflowNode {
  id: string;
  type: 'process' | 'decision' | 'startEnd' | 'document' | 'database';
  text: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

/**
 * Edge in workflow graph
 */
interface WorkflowEdge {
  from: string;
  to: string;
  label?: string;
  fromAnchor?: AnchorPosition;
  toAnchor?: AnchorPosition;
}

/**
 * Workflow graph for layout
 */
export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  direction?: LayoutDirection;
  startX?: number;
  startY?: number;
}

/**
 * Result of layout algorithm
 */
export interface LayoutResult {
  shapes: ShapeCreateData[];
  connections: Omit<ConnectionCreateData, 'createdBy'>[];
}

/**
 * Layout a workflow graph automatically
 * Uses simple left-to-right or top-to-bottom flow
 * 
 * @param graph - Workflow graph to layout
 * @param userId - User ID for creating shapes
 * @param viewportCenter - Center of viewport for default positioning
 * @returns Layout result with positioned shapes and connections
 */
export function layoutWorkflow(
  graph: WorkflowGraph,
  userId: string,
  viewportCenter: { x: number; y: number } = { x: 2500, y: 2500 }
): LayoutResult {
  const direction = graph.direction || 'horizontal';
  const startX = graph.startX ?? viewportCenter.x - 300; // Start left of center
  const startY = graph.startY ?? viewportCenter.y;
  
  // Build adjacency list for topological sort
  const adjacencyList = buildAdjacencyList(graph);
  
  // Perform topological sort to determine order
  const sortedNodes = topologicalSort(graph.nodes, adjacencyList);
  
  // Position nodes based on direction
  const positionedNodes = direction === 'horizontal'
    ? layoutHorizontal(sortedNodes, startX, startY, graph.edges, adjacencyList)
    : layoutVertical(sortedNodes, startX, startY, graph.edges, adjacencyList);
  
  // Convert to shape data
  const shapes: ShapeCreateData[] = positionedNodes.map(node => {
    const defaultSize = LAYOUT_CONFIG.defaultShapeSize[node.type] || { width: 100, height: 60 };
    
    return {
      type: node.type,
      x: node.x!,
      y: node.y!,
      width: node.width ?? defaultSize.width,
      height: node.height ?? defaultSize.height,
      fill: node.fill ?? getDefaultFillColor(node.type),
      text: node.text,
      fontSize: 16,
      createdBy: userId
    };
  });
  
  // Create connections with anchor points
  const connections: Omit<ConnectionCreateData, 'createdBy'>[] = graph.edges.map(edge => ({
    fromShapeId: edge.from,
    toShapeId: edge.to,
    fromAnchor: edge.fromAnchor ?? (direction === 'horizontal' ? 'right' : 'bottom'),
    toAnchor: edge.toAnchor ?? (direction === 'horizontal' ? 'left' : 'top'),
    arrowType: 'end',
    label: edge.label,
    stroke: '#000000',
    strokeWidth: 2
  }));
  
  return { shapes, connections };
}

/**
 * Layout nodes horizontally (left to right)
 */
function layoutHorizontal(
  nodes: WorkflowNode[],
  startX: number,
  startY: number,
  edges: WorkflowEdge[],
  adjacencyList: Map<string, string[]>
): WorkflowNode[] {
  const positioned: WorkflowNode[] = [];
  const nodePositions = new Map<string, { x: number; y: number }>();
  const nodeColumns = new Map<string, number>(); // Track column for each node
  
  let currentColumn = 0;
  const columnPositions = new Map<number, number>(); // Y positions for each column
  columnPositions.set(0, startY);
  
  // Find nodes with no incoming edges (start nodes)
  const incomingCount = new Map<string, number>();
  nodes.forEach(node => incomingCount.set(node.id, 0));
  edges.forEach(edge => {
    incomingCount.set(edge.to, (incomingCount.get(edge.to) || 0) + 1);
  });
  
  const queue: Array<{ node: WorkflowNode; column: number }> = [];
  nodes.forEach(node => {
    if (incomingCount.get(node.id) === 0) {
      queue.push({ node, column: 0 });
    }
  });
  
  // Process nodes level by level
  const processed = new Set<string>();
  
  while (queue.length > 0) {
    const { node, column } = queue.shift()!;
    
    if (processed.has(node.id)) continue;
    processed.add(node.id);
    
    const defaultSize = LAYOUT_CONFIG.defaultShapeSize[node.type as keyof typeof LAYOUT_CONFIG.defaultShapeSize] || { width: 100, height: 60 };
    const width = node.width ?? defaultSize.width;
    const height = node.height ?? defaultSize.height;
    
    // Get or initialize y position for this column
    let yPos = columnPositions.get(column) || startY;
    
    const xPos = startX + column * (LAYOUT_CONFIG.horizontalGap + 120);
    
    // Check if this is a branch (decision diamond has multiple outgoing edges)
    const outgoingEdges = edges.filter(e => e.from === node.id);
    const isBranch = outgoingEdges.length > 1;
    
    if (isBranch) {
      // Center the decision node for branches
      const branchSpacing = LAYOUT_CONFIG.branchOffset * (outgoingEdges.length - 1);
      yPos -= branchSpacing / 2;
    }
    
    nodePositions.set(node.id, { x: xPos, y: yPos });
    nodeColumns.set(node.id, column);
    positioned.push({ ...node, x: xPos, y: yPos, width, height });
    
    // Update column position for next node in same column
    columnPositions.set(column, yPos + height + LAYOUT_CONFIG.verticalGap / 2);
    
    // Queue children
    const children = adjacencyList.get(node.id) || [];
    children.forEach((childId, index) => {
      const childNode = nodes.find(n => n.id === childId);
      if (childNode) {
        let childY = yPos;
        if (isBranch && children.length > 1) {
          // Offset branches vertically
          childY = yPos + (index - (children.length - 1) / 2) * LAYOUT_CONFIG.branchOffset;
        }
        columnPositions.set(column + 1, childY);
        queue.push({ node: childNode, column: column + 1 });
      }
    });
  }
  
  return positioned;
}

/**
 * Layout nodes vertically (top to bottom)
 */
function layoutVertical(
  nodes: WorkflowNode[],
  startX: number,
  startY: number,
  edges: WorkflowEdge[],
  adjacencyList: Map<string, string[]>
): WorkflowNode[] {
  const positioned: WorkflowNode[] = [];
  const nodePositions = new Map<string, { x: number; y: number }>();
  
  // Similar to horizontal but with x/y swapped
  let currentY = startY;
  const processed = new Set<string>();
  
  // Find nodes with no incoming edges
  const incomingCount = new Map<string, number>();
  nodes.forEach(node => incomingCount.set(node.id, 0));
  edges.forEach(edge => {
    incomingCount.set(edge.to, (incomingCount.get(edge.to) || 0) + 1);
  });
  
  const queue: WorkflowNode[] = [];
  nodes.forEach(node => {
    if (incomingCount.get(node.id) === 0) {
      queue.push(node);
    }
  });
  
  while (queue.length > 0) {
    const node = queue.shift()!;
    
    if (processed.has(node.id)) continue;
    processed.add(node.id);
    
    const defaultSize = LAYOUT_CONFIG.defaultShapeSize[node.type as keyof typeof LAYOUT_CONFIG.defaultShapeSize] || { width: 100, height: 60 };
    const width = node.width ?? defaultSize.width;
    const height = node.height ?? defaultSize.height;
    
    nodePositions.set(node.id, { x: startX, y: currentY });
    positioned.push({ ...node, x: startX, y: currentY, width, height });
    
    currentY += height + LAYOUT_CONFIG.verticalGap;
    
    // Queue children
    const children = adjacencyList.get(node.id) || [];
    children.forEach(childId => {
      const childNode = nodes.find(n => n.id === childId);
      if (childNode) {
        queue.push(childNode);
      }
    });
  }
  
  return positioned;
}

/**
 * Build adjacency list from edges
 */
function buildAdjacencyList(graph: WorkflowGraph): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>();
  
  graph.nodes.forEach(node => {
    adjacencyList.set(node.id, []);
  });
  
  graph.edges.forEach(edge => {
    const neighbors = adjacencyList.get(edge.from) || [];
    neighbors.push(edge.to);
    adjacencyList.set(edge.from, neighbors);
  });
  
  return adjacencyList;
}

/**
 * Topological sort of nodes
 */
function topologicalSort(nodes: WorkflowNode[], adjacencyList: Map<string, string[]>): WorkflowNode[] {
  const visited = new Set<string>();
  const sorted: WorkflowNode[] = [];
  
  function visit(node: WorkflowNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    
    const neighbors = adjacencyList.get(node.id) || [];
    neighbors.forEach(neighborId => {
      const neighborNode = nodes.find(n => n.id === neighborId);
      if (neighborNode) {
        visit(neighborNode);
      }
    });
    
    sorted.unshift(node);
  }
  
  nodes.forEach(node => visit(node));
  
  return sorted;
}

/**
 * Get default fill color for shape type
 */
function getDefaultFillColor(type: string): string {
  const colors: Record<string, string> = {
    process: '#e0e7ff',      // Light blue
    decision: '#fef3c7',     // Light yellow
    startEnd: '#d1fae5',     // Light green
    document: '#f3f4f6',     // Light gray
    database: '#ede9fe',     // Light purple
  };
  
  return colors[type] || '#e5e7eb';
}

/**
 * Simple workflow builder for common patterns
 */
export class WorkflowBuilder {
  private nodes: WorkflowNode[] = [];
  private edges: WorkflowEdge[] = [];
  private nodeCounter = 0;
  
  /**
   * Add a process step
   */
  addProcess(text: string): string {
    const id = `node_${this.nodeCounter++}`;
    this.nodes.push({ id, type: 'process', text });
    return id;
  }
  
  /**
   * Add a decision point
   */
  addDecision(text: string): string {
    const id = `node_${this.nodeCounter++}`;
    this.nodes.push({ id, type: 'decision', text });
    return id;
  }
  
  /**
   * Add start node
   */
  addStart(text: string = 'Start'): string {
    const id = `node_${this.nodeCounter++}`;
    this.nodes.push({ id, type: 'startEnd', text });
    return id;
  }
  
  /**
   * Add end node
   */
  addEnd(text: string = 'End'): string {
    const id = `node_${this.nodeCounter++}`;
    this.nodes.push({ id, type: 'startEnd', text });
    return id;
  }
  
  /**
   * Add database node
   */
  addDatabase(text: string): string {
    const id = `node_${this.nodeCounter++}`;
    this.nodes.push({ id, type: 'database', text });
    return id;
  }
  
  /**
   * Add document node
   */
  addDocument(text: string): string {
    const id = `node_${this.nodeCounter++}`;
    this.nodes.push({ id, type: 'document', text });
    return id;
  }
  
  /**
   * Connect two nodes
   */
  connect(from: string, to: string, label?: string): void {
    this.edges.push({ from, to, label });
  }
  
  /**
   * Build the workflow graph
   */
  build(direction: LayoutDirection = 'horizontal'): WorkflowGraph {
    return {
      nodes: this.nodes,
      edges: this.edges,
      direction
    };
  }
}

