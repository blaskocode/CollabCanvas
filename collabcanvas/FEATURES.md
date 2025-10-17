# CollabCanvas Features

Comprehensive guide to all features in CollabCanvas.

## Table of Contents
- [Core Collaboration](#core-collaboration)
- [Shape Tools](#shape-tools)
- [Advanced Editing](#advanced-editing)
- [Selection & Organization](#selection--organization)
- [User Experience](#user-experience)
- [AI Integration](#ai-integration)

---

## Core Collaboration

### Real-Time Synchronization
- **Sub-100ms shape sync**: Changes to shapes propagate to all users in under 100 milliseconds
- **Sub-50ms cursor sync**: Cursor positions update at ~30 FPS for smooth tracking
- **Firestore for persistence**: All shapes and canvas state stored in Firebase Firestore
- **Realtime Database for cursors**: Low-latency cursor and presence updates

### Object Locking
- **First-to-drag wins**: First user to select/drag a shape acquires an exclusive lock
- **Visual indicators**: Locked shapes show who has locked them
- **Auto-release**: Locks automatically release when drag completes
- **5-second timeout**: Locks expire after 5 seconds of inactivity
- **Conflict prevention**: Other users cannot move locked shapes

### Multiplayer Cursors
- **Real-time cursor tracking**: See where other users are pointing
- **User names displayed**: Each cursor shows the user's name
- **Color-coded**: Each user gets a unique color
- **30 FPS update rate**: Smooth cursor movement without overwhelming the network

### Presence Awareness
- **Active user list**: Navbar shows all currently online users
- **Join/leave notifications**: Toast notifications when users join or leave
- **Connection status**: Visual indicator of your own connection state

### Offline Support
- **Offline queue**: Changes made offline are queued for sync
- **Auto-reconnect**: Automatically reconnects and syncs when connection restored
- **Firestore persistence**: Works offline with local cache

---

## Shape Tools

### Shape Types

#### Basic Shapes
- **Rectangle**: Standard rectangular shapes
- **Circle**: Perfect circles with radius control
- **Text**: Editable text boxes with formatting options
- **Line**: Straight lines with adjustable endpoints

#### Workflow Shapes
- **Process Box**: Rounded rectangles for process steps
- **Decision Diamond**: Diamond shapes for decision points
- **Start/End Oval**: Oval shapes for start and end nodes
- **Document**: Document-style shapes with wavy bottom
- **Database**: Cylinder shapes for database representations

### Drawing Modes

#### Draw Mode
- Activated by clicking a shape button
- Click and drag to create shape with custom size
- Visual preview shows shape outline while dragging
- Works for rectangles, circles, and text boxes

#### Placement Mode
- Activated by clicking workflow shape buttons
- Click once to place shape at cursor position
- Fixed size shapes (can resize after placement)
- Ghost preview follows cursor
- Works for all workflow shapes

### Shape Styling
- **Fill Color**: Full color picker with HSV/RGB controls
- **Stroke Color**: Independent border color control
- **Stroke Width**: Adjustable border thickness
- **Opacity**: Transparency control (0-100%)
- **Corner Radius**: Rounded corners for rectangles
- **Text Properties**: Font size, weight, alignment, style

### Resize & Rotate
- **Transform handles**: Click and drag corner handles to resize
- **Maintain aspect ratio**: Hold Shift while resizing (workflow shapes)
- **Rotation**: Rotate shapes with rotation handle
- **Bounds enforcement**: Cannot resize/move outside canvas boundaries

### Shape Connections
- **Visual connectors**: Lines connecting workflow shapes
- **Anchor points**: 4 connection points per shape (top, right, bottom, left)
- **Auto-routing**: Connections update automatically when shapes move
- **Arrow types**: Solid line with arrow end
- **Connection styling**: Color and width customization

---

## Advanced Editing

### Multi-Select
- **Box select**: Click and drag on empty space to select multiple shapes
- **Lasso select**: Press `L` to switch to freeform selection
- **Select all of type**: Right-click context menu option to select all shapes of same type
- **Unified operations**: Move, delete, duplicate, group selected shapes together

### Grouping
- **Create groups**: `Ctrl+G` to group selected shapes
- **Nested groups**: Groups can contain other groups
- **Ungroup**: `Ctrl+Shift+G` to break apart a group
- **Group movement**: Moving a group moves all contained shapes
- **Visual indicators**: Dotted outline shows grouped shapes
- **Recursive operations**: Deleting a group deletes all contained shapes

### Undo/Redo System
- **Full history tracking**: Every create, update, delete, and style change
- **Keyboard shortcuts**: `Ctrl+Z` to undo, `Ctrl+Y` to redo
- **Visual feedback**: Button states show when undo/redo available
- **Multi-user support**: Each user has their own history stack

### Clipboard Operations

#### Copy (`Ctrl+C`)
- Copies selected shape(s) to internal clipboard
- Preserves all shape properties except IDs and timestamps
- Works with single shapes and multi-select

#### Cut (`Ctrl+X`)
- Copies to clipboard then deletes original shapes
- Atomic operation ensures no data loss

#### Paste (`Ctrl+V`)
- Pastes shapes at center of current viewport
- Each successive paste offsets by 20px to prevent overlap
- Generates new IDs for pasted shapes
- Resets paste offset when copying new shapes

#### Duplicate (`Ctrl+D`)
- Quick duplicate without using clipboard
- Offsets duplicate by 20px from original

### Alignment Tools
- **Align Left**: Align shapes to leftmost edge
- **Align Center**: Align shapes to horizontal center
- **Align Right**: Align shapes to rightmost edge
- **Align Top**: Align shapes to topmost edge
- **Align Middle**: Align shapes to vertical middle
- **Align Bottom**: Align shapes to bottommost edge
- **Distribute Horizontally**: Space shapes evenly along X-axis
- **Distribute Vertically**: Space shapes evenly along Y-axis

### Z-Index Management
- **Bring to Front**: Move shape to top of stack
- **Send to Back**: Move shape to bottom of stack
- **Bring Forward**: Move shape up one layer
- **Send Backward**: Move shape down one layer
- **Visual feedback**: Context menu and keyboard shortcuts

### Layer Panel
- **Visual hierarchy**: See all shapes and their z-order
- **Drag to reorder**: Click and drag to change z-index
- **Nested groups**: Expandable/collapsible group hierarchy
- **Click to select**: Click layer to select shape on canvas

---

## Selection & Organization

### Selection Tools

#### Box Select (Default)
- Click and drag on empty space to create selection rectangle
- All shapes completely or partially inside rectangle are selected
- Visual blue dashed outline shows selection area

#### Lasso Select (Press `L` to toggle)
- Click to start drawing lasso path
- Move mouse to draw freeform selection polygon
- Click again to complete selection
- All shapes inside polygon are selected
- Press `Escape` to cancel active lasso

#### Select All of Type
- Right-click context menu option
- Selects all shapes of the same type as clicked shape
- Useful for bulk styling or operations

### Grid & Smart Guides

#### Visual Grid
- **Toggle with `Ctrl+'`**: Show/hide grid overlay
- **20px grid size**: Consistent spacing for alignment
- **White background**: Ensures grid lines are always visible
- **Subtle appearance**: Low opacity for non-intrusive guidance

#### Snap to Grid
- **Automatic snapping**: When grid enabled, shapes snap to grid points
- **20px increments**: Shapes align to nearest grid intersection
- **Applies to**: Shape creation, movement, and paste

#### Smart Alignment Guides
- **Auto-detection**: Guides appear when dragging shapes
- **Edge alignment**: Aligns edges of moving shape with edges of other shapes
- **Center alignment**: Aligns centers horizontally and vertically
- **Cross-edge alignment**: Aligns left edge to right edge (for adjacent placement)
- **Visual feedback**: Purple guide lines show alignment
- **5px snap threshold**: Snaps when within 5px of alignment

### Component System

#### Creating Components
- Select one or more shapes
- Press `C` to open component library
- Click "New Component" button
- Enter name and optional description
- Component saved with relative positions

#### Using Components
- Press `C` to open component library
- Browse saved components
- Click "Insert" to place instance on canvas
- Instances are independent copies, not linked

#### Managing Components
- **Delete**: Remove component from library
- **Preview**: See component details and shape count
- **Dimensions**: View bounding box width and height

### Comments & Annotations

#### Adding Comments
- Select a shape
- Press `M` to open comments panel
- Type comment text
- `Ctrl+Enter` or click "Add Comment" to submit

#### Comment Threads
- **Replies**: Click "Reply" to respond to a comment
- **Threading**: Replies nested under parent comments
- **Timestamps**: Relative time display (e.g., "2h ago")
- **User attribution**: Shows comment author name

#### Comment Actions
- **Edit**: Comment author can edit their comments
- **Delete**: Comment author can delete their comments
- **Resolve**: Mark comment as resolved to hide from default view
- **Reopen**: Un-resolve a comment to bring back to active view

#### Comment Filtering
- **Show/Hide Resolved**: Toggle to view resolved comments
- **Per-Shape**: Comments attached to specific shapes
- **Persistent**: Comments stored in Firestore, survives page refresh

---

## User Experience

### Color Picker
- **HSV Selector**: Visual color picker with hue/saturation/value controls
- **RGB Input**: Direct numeric input for precise colors
- **Hex Input**: Paste hex color codes
- **Recent Colors**: Last 10 used colors automatically saved
- **Saved Palettes**: Create named color palettes
- **Palette Management**: Add colors to palettes, rename, delete
- **Local Storage**: Recent colors and palettes persist across sessions

### Export Canvas

#### Export Formats
- **PNG**: Raster image format
- **SVG**: Vector format (coming soon)

#### Export Types
- **Full Canvas**: Exports entire 5000x5000px canvas
- **Visible Area**: Exports current viewport
- **Selection**: Exports only selected shapes (with padding)

#### Export Features
- **High Resolution**: 2x scale for crisp exports
- **Clean Export**: Removes selection indicators before export
- **Automatic Download**: Triggers browser download
- **Filename**: Auto-generated with timestamp

### Property Panel
- **Shape Properties**: X, Y, Width, Height, Rotation
- **Style Properties**: Fill, Stroke, Opacity, Corner Radius
- **Text Properties**: Font Size, Weight, Alignment, Style
- **Real-time Updates**: Changes apply immediately
- **Multi-select**: Edit multiple shapes at once (coming soon)

### Context Menu
- **Right-click activation**: Context-sensitive menu
- **Common Actions**: Copy, Cut, Paste, Duplicate, Delete
- **Organization**: Group, Ungroup, Bring Forward, Send Back
- **Selection**: Select All of [Type]
- **Keyboard hints**: Shows shortcuts next to actions

### Toast Notifications
- **Action Feedback**: Confirm operations (copied, deleted, etc.)
- **Error Messages**: Alert on failures with clear messaging
- **Success Messages**: Positive reinforcement for successful actions
- **Auto-dismiss**: Fade out after 3 seconds
- **Non-blocking**: Doesn't interrupt workflow

---

## AI Integration

### AI Canvas Agent

#### Natural Language Commands
- Open AI input panel (blue "AI" button in bottom-right)
- Type natural language requests
- Examples:
  - "Create a login workflow"
  - "Add 3 circles in a row"
  - "Generate a data processing pipeline"

#### Function Calling
- AI agent has access to canvas operations
- Can create shapes, set properties, position elements
- Understands workflow diagrams and common patterns

#### Workflow Generation
- **Flowchart Generation**: Describe workflow, AI generates complete diagram
- **Auto-layout**: AI positions shapes intelligently
- **Connections**: Automatically creates connectors between steps
- **Styling**: Applies appropriate colors and styles

#### Smart Layouts
- **Auto-arrange**: AI can rearrange existing shapes
- **Grid layouts**: Organize shapes in rows/columns
- **Hierarchical**: Tree-like structures for org charts
- **Flow layouts**: Left-to-right or top-to-bottom sequences

#### AI Capabilities
- Shape creation (all types)
- Property modification
- Position and layout
- Workflow diagram generation
- UI component scaffolding
- Data visualization structures

---

## Performance & Scalability

### Tested Limits
- **500+ shapes**: Maintains 60 FPS with hundreds of shapes
- **5+ concurrent users**: No performance degradation
- **Sub-100ms sync**: Shape updates sync in under 100ms
- **Sub-50ms cursor**: Cursor positions update at ~30 FPS

### Optimization Techniques
- **Efficient rendering**: Konva.js canvas-based rendering
- **Throttled updates**: Cursor positions throttled to 30 FPS
- **Selective sync**: Only changed properties synced
- **Local state**: Immediate UI updates before Firestore confirmation
- **Indexed queries**: Firestore indexes for fast queries

### Browser Compatibility
- **Chrome/Edge**: Best performance (recommended)
- **Firefox**: Good performance
- **Safari**: Supported (may show persistence warnings)
- **Mobile**: Not optimized (desktop-only for now)

---

## Security & Privacy

### Authentication
- **Firebase Auth**: Secure email/password and Google Sign-In
- **Required for access**: Must be authenticated to use canvas

### Data Security
- **Firestore Rules**: Authenticated users only
- **Realtime Database Rules**: Authenticated users only
- **User isolation**: Comments and shapes track creator

### Privacy
- **No tracking**: No analytics or tracking beyond Firebase
- **User data**: Only email and display name stored
- **Shared canvas**: All users see same canvas (no private workspaces in MVP)

---

## Troubleshooting

### Common Issues

#### Shapes Not Syncing
1. Check internet connection
2. Verify authentication status
3. Check browser console for errors
4. Refresh page

#### Performance Issues
1. Close unnecessary browser tabs
2. Use Chrome for best performance
3. Zoom in to focus on specific area
4. Consider clearing some shapes if 1000+

#### Firestore Warnings
- "Persistence failed" in Safari is safe to ignore
- App works in network-only mode

### Getting Help
- Check console for error messages
- Review `README.md` for setup issues
- Check `TROUBLESHOOTING.md` for specific problems

---

## Future Enhancements

### Planned Features
- **Templates**: Pre-made canvas templates
- **Layers**: Visual layer management beyond z-index
- **Shapes Library**: More shape types and icons
- **Advanced Text**: Rich text formatting, markdown
- **Image Support**: Import and place images
- **Collaboration Features**: @mentions in comments, assign tasks
- **Version History**: Time-travel through canvas changes
- **Permissions**: Role-based access control
- **Private Workspaces**: Multiple canvases per user
- **Real-time Chat**: Built-in messaging
- **Mobile Support**: Touch-optimized interface

---

**Built with ❤️ using React, TypeScript, Firebase, Konva.js, and OpenAI**

