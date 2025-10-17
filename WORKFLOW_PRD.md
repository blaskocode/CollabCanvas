# Workflow Creator - Product Requirements Document

**Project**: CollabCanvas Workflow Creator Enhancement  
**Version**: 2.0  
**Date**: October 17, 2025  
**Status**: In Development

---

## Executive Summary

Transform CollabCanvas from a general-purpose collaborative canvas into a specialized workflow creation tool. This enhancement adds flowchart-specific shapes, smart connectors with arrow capabilities, anchor-point snapping, and an AI-powered workflow builder that can generate complete workflow diagrams from natural language (text or voice) input.

---

## Vision & Goals

### Vision
Empower teams to rapidly design, visualize, and collaborate on workflows through natural language input and intelligent diagram generation.

### Primary Goals
1. **Workflow-First Design**: Add industry-standard flowchart shapes (process, decision, start/end, document, database)
2. **Smart Connections**: Implement connectors that snap to anchor points and maintain relationships as shapes move
3. **AI-Powered Creation**: Enable users to describe workflows verbally or in text and have complete diagrams generated automatically
4. **Voice Integration**: Support both text and voice input for workflow creation
5. **Maintain Collaboration**: Preserve all existing real-time collaboration features

---

## Target Users

### Primary: Workflow Designers
- Business analysts designing process flows
- Software architects creating system workflows
- Project managers planning task sequences
- DevOps engineers documenting CI/CD pipelines

### Secondary: Teams Collaborating on Workflows
- Cross-functional teams brainstorming processes
- Remote teams working on workflow documentation
- Technical writers documenting procedures

---

## Core Features

### 1. Workflow Shape Library

#### Standard Flowchart Shapes

**Process Box**
- Type: `process`
- Visual: Rectangle with rounded corners
- Use Case: Standard process step or action
- Default Size: 120px × 60px
- Text: Centered, supports multi-line
- Anchor Points: 4 (top, right, bottom, left)

**Decision Diamond**
- Type: `decision`
- Visual: Diamond/rhombus shape
- Use Case: Decision points, yes/no branching
- Default Size: 100px × 100px (rotated square)
- Text: Centered, typically questions
- Anchor Points: 4 (top, right, bottom, left)
- Common Labels: "Yes/No", "Pass/Fail", "True/False"

**Start/End Oval**
- Type: `startEnd`
- Visual: Oval/ellipse shape
- Use Case: Workflow start and end points
- Default Size: 120px × 60px
- Text: Centered, typically "Start" or "End"
- Anchor Points: 4 (top, right, bottom, left)

**Document**
- Type: `document`
- Visual: Rectangle with wavy bottom edge
- Use Case: Document generation, reports, forms
- Default Size: 100px × 80px
- Text: Centered
- Anchor Points: 4 (top, right, bottom, left)

**Database**
- Type: `database`
- Visual: Cylinder shape (3D effect)
- Use Case: Data storage, database operations
- Default Size: 100px × 80px
- Text: Centered
- Anchor Points: 4 (top, right, bottom, left)

#### Existing Shapes (Preserved)
- Rectangle: General-purpose boxes
- Circle: Annotations, markers
- Text: Labels, notes
- Line: Basic connections (deprecated in favor of connectors)

---

### 2. Smart Connector System

#### Connector Features

**Anchor Point Snapping**
- Each shape has 4 anchor points (top, right, bottom, left)
- Magnetic snapping within 15-20px radius
- Visual feedback: Anchor points highlight on hover
- Snap indicator: Anchor point enlarges when connector is near

**Arrow Types**
- `none`: Plain line, no arrows
- `end`: Single arrowhead at destination
- `both`: Arrowheads at both ends
- Arrowhead size: Scales with stroke width
- Arrowhead style: Solid, 30-degree angle

**Connection Persistence**
- Connections stored separately from shapes
- Connections update automatically when shapes move
- Deleting a shape deletes all connected connectors
- Connections maintain references to shape IDs and anchor points

**Visual Properties**
- Stroke color: Customizable (default: #000000)
- Stroke width: 2-6px (default: 2px)
- Line style: Solid (future: dashed, dotted)
- Path: Straight lines (future: bezier curves)

**Labels**
- Optional text labels on connectors
- Common use: "Yes"/"No" on decision branches
- Position: Near the start of the connector
- Background: White with slight padding
- Font size: 14px

#### Connection Mode

**Creation Flow**
1. User clicks "Connection" tool in toolbar
2. Canvas enters connection mode
3. User clicks source shape anchor point
4. User drags to target shape anchor point
5. Connector created and persisted
6. Canvas exits connection mode (or stays for multiple connections)

**Editing Flow**
- Click connector to select
- Delete key removes connector
- Future: Drag endpoints to change connections
- Future: Click and drag label to reposition

---

### 3. Double-Click Text Editing

#### Feature Specification

**Trigger**
- Double-click any workflow shape (process, decision, startEnd, document, database)
- Existing text shapes use existing text editing behavior

**Inline Editor**
- Appears as an overlay positioned over the shape
- Input field styled to match shape dimensions
- Text centered within shape bounds
- Auto-focus on editor when opened
- Click outside or press Escape to close

**Text Properties**
- Font family: Arial, Helvetica, sans-serif
- Font size: Auto-scaled to fit shape (min 12px, max 24px)
- Font weight: Normal (bold for emphasis in certain shapes)
- Text align: Center
- Vertical align: Middle
- Color: Black (contrast with shape fill)
- Multi-line support: Word wrap within shape bounds

**Persistence**
- Text stored as `text` property on shape object
- Real-time sync across all collaborators
- Undo/redo support

---

### 4. AI-Powered Workflow Generation

#### Natural Language Understanding

**Supported Patterns**

**Sequential Workflows**
```
Input: "Design code, then write code, then test code, then deploy code"
Output: 
- 4 process boxes labeled "Design code", "Write code", "Test code", "Deploy code"
- Connected left-to-right with arrows
- Evenly spaced (200px horizontal gap)
```

**Conditional Branching**
```
Input: "If tests pass, deploy code. If not, send email."
Output:
- Decision diamond labeled "Tests pass?"
- "Yes" branch → Process box "Deploy code"
- "No" branch → Process box "Send email"
- Labels on connectors: "Yes" and "No"
```

**Complex Workflows**
```
Input: "Start workflow, fetch data from database, check if valid, 
        if yes save to database, if no log error, end"
Output:
- Start oval "Start"
- Process box "Fetch data"
- Database shape "Database" (connected to fetch)
- Decision diamond "Valid?"
- Yes branch → Database shape "Database" (save)
- No branch → Process box "Log error"
- Both branches → End oval "End"
```

**Keywords Recognition**
- Start/Begin/Initialize → Start oval
- End/Complete/Finish → End oval
- If/Check/Validate/Decide → Decision diamond
- Database/Store/Fetch/Query → Database shape
- Document/Report/Form/Export → Document shape
- Process/Execute/Run/Perform → Process box

#### Auto-Layout Algorithm

**Layout Direction**
- Default: Left-to-right (horizontal)
- Alternative: Top-to-bottom (vertical)
- Auto-detect: Based on workflow complexity

**Spacing Rules**
- Horizontal gap: 200px between shapes
- Vertical gap: 150px between rows
- Decision branches: 100px vertical offset
- Grid alignment: Shapes align to virtual grid

**Positioning Strategy**
1. Start at viewport center or specified origin
2. Place shapes in sequence along primary axis
3. For branches, offset along secondary axis
4. Rejoin branches at next common node
5. Maintain consistent spacing throughout

**Collision Avoidance**
- Check for overlapping shapes
- Adjust positions to prevent overlap
- Maintain minimum 50px clearance

#### AI Tool Functions

**createWorkflowShape**
```typescript
{
  name: 'createWorkflowShape',
  parameters: {
    type: 'process' | 'decision' | 'startEnd' | 'document' | 'database',
    text: string,
    x: number,
    y: number,
    fill?: string
  }
}
```

**createConnection**
```typescript
{
  name: 'createConnection',
  parameters: {
    fromShapeId: string,
    toShapeId: string,
    fromAnchor?: 'top' | 'right' | 'bottom' | 'left',
    toAnchor?: 'top' | 'right' | 'bottom' | 'left',
    arrowType?: 'none' | 'end' | 'both',
    label?: string
  }
}
```

---

### 5. Voice Input Integration

#### Speech Recognition

**Technology**
- Web Speech API (browser native)
- Supported browsers: Chrome, Edge, Safari (iOS 14+)
- Fallback: Text input for unsupported browsers

**User Experience**

**Voice Input Flow**
1. User clicks microphone button in AI input panel
2. Browser requests microphone permission (first time only)
3. Recording state indicated by pulsing microphone icon
4. Real-time transcription appears in input field
5. User clicks stop or speaks "stop recording"
6. Transcribed text sent to AI agent
7. Workflow generated on canvas

**Visual Indicators**
- Microphone icon: Blue when idle, pulsing red when recording
- Transcription display: Live text updates as user speaks
- Error states: Clear messaging for unsupported browsers
- Permission denied: Instructions to enable microphone

**Voice Commands**
- "Create workflow..."
- "Start workflow with..."
- "Add process step..."
- "Connect X to Y"
- "Delete last shape"
- "Stop recording"

#### Text/Voice Toggle
- Toggle button switches between text and voice input
- Preference saved in localStorage
- Default: Text input
- Keyboard shortcut: Ctrl/Cmd + M (toggle microphone)

---

### 6. Connection Data Model

#### Firestore Schema

**Canvas Document Structure**
```json
{
  "canvasId": "global-canvas-v1",
  "shapes": [
    {
      "id": "shape_uuid_1",
      "type": "process",
      "x": 100,
      "y": 200,
      "width": 120,
      "height": 60,
      "fill": "#e0e7ff",
      "text": "Design code",
      "createdBy": "user_id",
      "createdAt": "timestamp",
      "lastModifiedBy": "user_id",
      "lastModifiedAt": "timestamp"
    }
  ],
  "connections": [
    {
      "id": "conn_uuid_1",
      "fromShapeId": "shape_uuid_1",
      "fromAnchor": "right",
      "toShapeId": "shape_uuid_2",
      "toAnchor": "left",
      "arrowType": "end",
      "label": "",
      "stroke": "#000000",
      "strokeWidth": 2,
      "createdBy": "user_id",
      "createdAt": "timestamp"
    }
  ],
  "lastUpdated": "timestamp"
}
```

#### Connection Interface
```typescript
interface Connection {
  id: string;
  fromShapeId: string;
  fromAnchor: 'top' | 'right' | 'bottom' | 'left';
  toShapeId: string;
  toAnchor: 'top' | 'right' | 'bottom' | 'left';
  arrowType: 'none' | 'end' | 'both';
  stroke?: string;
  strokeWidth?: number;
  label?: string;
  createdBy: string;
  createdAt: Timestamp;
}
```

---

## User Interface Updates

### Toolbar Additions

**Workflow Shapes Section**
- Process box button (icon: rounded rectangle)
- Decision diamond button (icon: diamond)
- Start/End oval button (icon: oval)
- Document button (icon: document shape)
- Database button (icon: cylinder)

**Connection Tools**
- Connector button (icon: arrow)
- Toggle between straight/curved lines (future)

**AI Panel Enhancements**
- Microphone button (voice input)
- Text/voice toggle switch
- Voice status indicator
- Example workflow prompts

### Visual Design

**Workflow Shape Colors (Defaults)**
- Process: Light blue (#e0e7ff)
- Decision: Light yellow (#fef3c7)
- Start/End: Light green (#d1fae5)
- Document: Light gray (#f3f4f6)
- Database: Light purple (#ede9fe)

**Connector Styles**
- Default stroke: Black (#000000)
- Selected: Blue (#2563eb)
- Locked by other: Red (#ef4444)
- Stroke width: 2px (default)

---

## Technical Architecture

### Component Structure

```
src/
├── components/
│   └── Canvas/
│       ├── shapes/
│       │   ├── ProcessBox.tsx          [NEW]
│       │   ├── DecisionDiamond.tsx     [NEW]
│       │   ├── StartEndOval.tsx        [NEW]
│       │   ├── DocumentShape.tsx       [NEW]
│       │   ├── DatabaseShape.tsx       [NEW]
│       │   └── Connector.tsx           [NEW]
│       ├── AnchorPoint.tsx             [NEW]
│       └── InlineTextEditor.tsx        [NEW]
├── services/
│   └── connections.ts                   [NEW]
├── utils/
│   ├── workflow-layout.ts              [NEW]
│   ├── anchor-snapping.ts              [NEW]
│   └── types.ts                        [MODIFIED]
```

### State Management

**CanvasContext Updates**
```typescript
interface CanvasContextType {
  // ... existing properties
  connections: Connection[];
  selectedConnectionId: string | null;
  addConnection: (connection: ConnectionCreateData) => Promise<string>;
  updateConnection: (id: string, updates: Partial<Connection>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  getShapeConnections: (shapeId: string) => Connection[];
  isConnectionMode: boolean;
  setConnectionMode: (enabled: boolean) => void;
}
```

---

## Real-Time Collaboration

### Connection Synchronization

**Firestore Listeners**
- Listen to `connections` array in canvas document
- Broadcast connection creation to all users
- Broadcast connection updates (drag endpoints, label changes)
- Broadcast connection deletion

**Optimistic Updates**
- Create connection locally immediately
- Sync to Firestore
- Rollback on error

**Conflict Resolution**
- Connection creation: Last write wins
- Connection deletion: Tombstone approach (mark as deleted)
- Shape deletion: Cascade delete all connections

---

## Performance Considerations

### Optimization Strategies

**Connection Rendering**
- Use Konva Arrow or Line primitives
- Limit redraws to changed connections only
- Batch connection updates during shape drag

**Anchor Point Calculation**
- Memoize anchor positions
- Recalculate only when shape moves or resizes
- Cache anchor positions in component state

**AI Agent Performance**
- Limit workflow generation to 50 shapes per request
- Stream responses for large workflows (future)
- Show progress indicator during generation

---

## Success Metrics

### Feature Adoption
- % of users creating workflow shapes vs basic shapes
- Average number of connections per canvas
- % of workflows created via AI vs manual
- Voice input usage rate

### Performance
- Connection rendering: 60 FPS with 100+ connections
- AI workflow generation: < 3 seconds for 10-shape workflows
- Voice transcription accuracy: > 90%
- Real-time sync latency: < 100ms

### User Satisfaction
- Task completion rate: > 90% for workflow creation
- Error rate: < 5% for AI workflow generation
- Voice input satisfaction: > 4/5 stars

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Create PRD document
- ✅ Update type definitions
- ✅ Create workflow shape components
- ✅ Add shapes to canvas controls
- ✅ Test rendering and basic interaction

### Phase 2: Connection System (Week 1-2)
- ✅ Implement anchor points
- ✅ Create connector component
- ✅ Add connection mode to canvas
- ✅ Implement snapping logic
- ✅ Add connection persistence

### Phase 3: Text Editing (Week 2)
- ✅ Create inline text editor
- ✅ Add double-click handling
- ✅ Integrate text into workflow shapes

### Phase 4: AI Enhancement (Week 2-3)
- ✅ Add workflow-specific AI tools
- ✅ Implement auto-layout algorithms
- ✅ Update AI prompts for workflow understanding
- ✅ Test complex workflow generation

### Phase 5: Voice Integration (Week 3)
- ✅ Implement Web Speech API
- ✅ Update AI input component
- ✅ Add voice UI controls
- ✅ Test voice workflow creation

---

## Testing Strategy

### Unit Tests
- Anchor point calculation
- Connection path computation
- Workflow layout algorithms
- Shape text fitting

### Integration Tests
- Connection creation and persistence
- Shape movement with connected connectors
- AI workflow generation end-to-end
- Voice input transcription

### Manual Testing Scenarios

**Scenario 1: Simple Sequential Workflow**
1. User says "Design, develop, test, deploy"
2. AI creates 4 process boxes connected with arrows
3. User double-clicks each to edit labels
4. User moves shapes, connections follow

**Scenario 2: Decision Tree**
1. User says "If user logged in, show dashboard. If not, show login."
2. AI creates decision diamond with two branches
3. Labels "Yes" and "No" appear on connectors
4. User adds more steps to each branch

**Scenario 3: Complex Database Workflow**
1. User says "Fetch user from database, check if active, if yes update profile in database, if no send email, then end"
2. AI creates complete workflow with database shapes, decision, processes
3. All connections maintain relationships as user rearranges

---

## Known Limitations & Future Enhancements

### Current Limitations
- Straight-line connectors only (no bezier curves)
- Manual connector routing (no auto-routing around shapes)
- No connector rerouting by dragging
- Voice input in English only
- 4 anchor points per shape (no dynamic anchors)

### Future Enhancements
- Curved connector paths (bezier, spline)
- Auto-routing to avoid shape overlaps
- Swimlanes for multi-department workflows
- Connector styles (dashed, dotted)
- Export workflows as images (PNG, SVG)
- Import from other flowchart tools
- Template library for common workflows
- Workflow validation (detect incomplete paths)
- Multi-language voice support

---

## Risk Mitigation

### Technical Risks

**Risk 1: Voice API Browser Support**
- Mitigation: Fallback to text input, clear browser requirements
- Testing: Test on Chrome, Edge, Safari, Firefox

**Risk 2: Connection Performance with Many Shapes**
- Mitigation: Limit connections per canvas, optimize rendering
- Testing: Stress test with 200+ shapes and connections

**Risk 3: AI Workflow Complexity**
- Mitigation: Start with simple patterns, iterate based on usage
- Testing: Test edge cases, ambiguous inputs

**Risk 4: Real-Time Connection Sync**
- Mitigation: Optimistic updates, conflict resolution strategy
- Testing: Multi-user connection creation scenarios

---

## Accessibility

### Keyboard Navigation
- Tab through workflow shapes
- Arrow keys to select adjacent shapes
- Enter to edit shape text
- Escape to exit text editing
- Delete/Backspace to remove shape or connection

### Screen Reader Support
- Announce shape type when selected
- Announce connection creation
- Announce workflow generation complete

### Color Contrast
- All shape colors meet WCAG AA standards
- Connection labels have high contrast backgrounds

---

## Documentation

### User Documentation
- Workflow shape guide with visual examples
- Connection creation tutorial
- AI workflow prompts cheat sheet
- Voice input quick start guide

### Developer Documentation
- Component API documentation
- Connection system architecture
- AI tool integration guide
- Custom shape creation guide

---

## Appendix

### Flowchart Standards Reference
- ANSI/ISO standard flowchart symbols
- BPMN (Business Process Model and Notation) basics
- UML activity diagram elements

### Glossary
- **Anchor Point**: Connection point on shape perimeter
- **Connector**: Smart arrow that connects two shapes
- **Workflow Shape**: Specialized shape for flowchart diagrams
- **Connection Mode**: Canvas state for creating connections
- **Auto-Layout**: Algorithm that positions shapes in workflows
- **Voice Transcription**: Converting speech to text

---

**Document Version**: 1.0  
**Last Updated**: October 17, 2025  
**Next Review**: November 1, 2025

