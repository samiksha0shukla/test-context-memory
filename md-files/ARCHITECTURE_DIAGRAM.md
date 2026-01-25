# MemoryGraph Component Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         MemoryGraph                             │
│                    (Main Orchestrator)                          │
│                        202 lines                                │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ├──────────────────────────────────────────────────┐
               │                                                  │
    ┌──────────▼──────────┐                          ┌───────────▼──────────┐
    │   Custom Hooks      │                          │    UI Components     │
    │                     │                          │                      │
    │ ┌─────────────────┐ │                          │ ┌─────────────────┐  │
    │ │ useMemoryData   │ │                          │ │ GraphControls   │  │
    │ │ (Data Fetch)    │ │                          │ │ (Zoom Buttons)  │  │
    │ └─────────────────┘ │                          │ └─────────────────┘  │
    │                     │                          │                      │
    │ ┌─────────────────┐ │                          │ ┌─────────────────┐  │
    │ │useMemorySelect  │ │                          │ │  GraphLegend    │  │
    │ │(Selection State)│ │                          │ │  (Memory Types) │  │
    │ └─────────────────┘ │                          │ └─────────────────┘  │
    │                     │                          │                      │
    │ ┌─────────────────┐ │                          │ ┌─────────────────┐  │
    │ │useGraphDimens   │ │                          │ │   GraphHint     │  │
    │ │(Viewport Size)  │ │                          │ │ (Control Text)  │  │
    │ └─────────────────┘ │                          │ └─────────────────┘  │
    │                     │                          │                      │
    │ ┌─────────────────┐ │                          │ ┌─────────────────┐  │
    │ │ useZoomControls │ │                          │ │  GraphStates    │  │
    │ │ (Zoom Actions)  │ │                          │ │ (Loading/Error) │  │
    │ └─────────────────┘ │                          │ └─────────────────┘  │
    └─────────────────────┘                          └──────────────────────┘
               │
               │
    ┌──────────▼──────────────────────────────────────────────────┐
    │                  D3 Visualization Logic                      │
    │                                                              │
    │  ┌────────────────────┐      ┌────────────────────┐         │
    │  │ initializeSVG      │      │    renderNodes     │         │
    │  │ - Setup SVG        │      │ - Prepare nodes    │         │
    │  │ - Add zoom         │      │ - Render bubbles   │         │
    │  │ - Create groups    │      │ - Update states    │         │
    │  └────────────────────┘      └────────────────────┘         │
    │                                                              │
    │  ┌────────────────────┐      ┌────────────────────┐         │
    │  │   createTooltip    │      │ renderConnections  │         │
    │  │ - Create element   │      │ - Prepare links    │         │
    │  │ - Attach handlers  │      │ - Render lines     │         │
    │  │ - Position logic   │      │ - Animate changes  │         │
    │  └────────────────────┘      └────────────────────┘         │
    │                                                              │
    │  ┌────────────────────────────────────────────────┐         │
    │  │           createSimulation                     │         │
    │  │ - Setup forces                                 │         │
    │  │ - Freeze positions                             │         │
    │  │ - Calculate initial zoom                       │         │
    │  └────────────────────────────────────────────────┘         │
    └──────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────┐
│  User Action     │
│  (Click/Hover)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│   MemoryGraph Component      │
│   - Receives user events     │
│   - Updates state via hooks  │
└────────┬─────────────────────┘
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
┌────────────────────┐          ┌────────────────────┐
│  State Hooks       │          │  D3 Modules        │
│  - Selection       │          │  - Update visuals  │
│  - Dimensions      │          │  - Run animations  │
│  - Data            │          │  - Handle physics  │
└────────┬───────────┘          └────────┬───────────┘
         │                                │
         │                                │
         └────────────┬───────────────────┘
                      │
                      ▼
              ┌────────────────┐
              │   DOM/SVG      │
              │   Updates      │
              └────────────────┘
                      │
                      ▼
              ┌────────────────┐
              │  User Sees     │
              │  Changes       │
              └────────────────┘
```

## Module Dependencies

```
MemoryGraph.tsx
  │
  ├── hooks/
  │   ├── useMemoryData ──────► SWR ──────► API
  │   ├── useMemorySelection ──► useState, useCallback
  │   ├── useGraphDimensions ──► useState, useEffect
  │   └── useZoomControls ─────► useCallback, D3
  │
  ├── d3/
  │   ├── initializeVisualization ──► D3 (zoom, SVG)
  │   ├── tooltip ──────────────────► D3, utils
  │   ├── simulation ───────────────► D3 (force)
  │   ├── renderNodes ──────────────► D3, utils
  │   └── renderConnections ────────► D3, utils
  │
  └── components/
      ├── GraphControls ────────────► Lucide icons
      ├── GraphLegend
      ├── GraphHint
      └── GraphStates ──────────────► Lucide icons
```

## Responsibility Matrix

| Module | Responsibility | State | Side Effects |
|--------|---------------|-------|--------------|
| **MemoryGraph** | Orchestration | Minimal | Coordinates |
| **useMemoryData** | Data fetching | SWR cache | API calls |
| **useMemorySelection** | Selection logic | Local state | None |
| **useGraphDimensions** | Viewport size | Local state | Window events |
| **useZoomControls** | Zoom actions | None | D3 transitions |
| **initializeSVG** | SVG setup | None | DOM creation |
| **tooltip** | Tooltip UI | None | DOM manipulation |
| **simulation** | Physics | D3 simulation | Animation |
| **renderNodes** | Bubble rendering | None | SVG creation |
| **renderConnections** | Link rendering | None | SVG creation |
| **GraphControls** | Zoom UI | None | Click events |
| **GraphLegend** | Legend UI | None | None |
| **GraphHint** | Hint UI | None | None |
| **GraphStates** | State UIs | None | None |

## Execution Flow

### 1. Initial Load
```
1. MemoryGraph mounts
2. useMemoryData fetches data
3. GraphLoading shows
4. Data arrives
5. useEffect triggers
6. initializeSVG creates structure
7. prepareNodes processes data
8. createSimulation starts physics
9. renderNodes creates bubbles
10. attachTooltipHandlers adds interactivity
11. calculateInitialZoom fits view
12. After 1.5s: freezeNodePositions locks layout
```

### 2. User Clicks Bubble
```
1. Click event on bubble
2. selectBubble called (via hook)
3. setSelectedId updates state
4. useEffect (selection) triggers
5. getVisibleLinks finds connections
6. getConnectedNodeIds finds neighbors
7. renderConnections draws lines
8. updateNodeStates highlights bubbles
9. MemoryDetailPanel opens
```

### 3. User Hovers Bubble
```
1. mouseenter event
2. tooltip shows (via D3 handler)
3. mousemove event
4. tooltip position updates
5. mouseleave event
6. tooltip hides
```

### 4. User Zooms
```
1. User clicks zoom button
2. handleZoomIn/Out called (hook)
3. D3 zoom transition runs
4. SVG transform updates
5. View changes smoothly
```

## File Size Breakdown

```
Main Component:                202 lines  ████████████████████  (19%)
─────────────────────────────────────────────────────────────
Hooks:                         180 lines  █████████████████     (17%)
  - useMemoryData               30 lines
  - useMemorySelection          78 lines
  - useGraphDimensions          27 lines
  - useZoomControls             45 lines
─────────────────────────────────────────────────────────────
D3 Modules:                    526 lines  ████████████████████  (50%)
  - initializeVisualization     41 lines
  - tooltip                     93 lines
  - simulation                 100 lines
  - renderNodes                123 lines
  - renderConnections          169 lines
─────────────────────────────────────────────────────────────
UI Components:                 136 lines  █████████████         (13%)
  - GraphControls               39 lines
  - GraphLegend                 34 lines
  - GraphHint                   11 lines
  - GraphStates                 52 lines
─────────────────────────────────────────────────────────────
Index/Barrel Exports:           12 lines  █                     (1%)
─────────────────────────────────────────────────────────────
TOTAL:                       1,056 lines
```

## Benefits of New Architecture

### 1. Maintainability
- **Find**: Easy to locate specific functionality
- **Change**: Modify one module without affecting others
- **Test**: Test individual modules in isolation

### 2. Scalability
- **Add features**: Create new modules
- **Remove features**: Delete specific files
- **Refactor**: Change internals without breaking API

### 3. Collaboration
- **Work in parallel**: Different developers on different modules
- **Code review**: Review smaller, focused changes
- **Onboarding**: New developers understand structure quickly

### 4. Performance
- **Code splitting**: Lazy load modules if needed
- **Tree shaking**: Remove unused exports
- **Memoization**: Cache hook results

### 5. Testing
- **Unit tests**: Test pure functions easily
- **Hook tests**: Test hooks with React Testing Library
- **Component tests**: Test UI components in isolation
- **Integration tests**: Test module interactions

## Best Practices Applied

✅ **Single Responsibility Principle**: Each module does one thing
✅ **Don't Repeat Yourself (DRY)**: No duplicated code
✅ **Keep It Simple (KISS)**: No over-engineering
✅ **Separation of Concerns**: Logic, UI, state separated
✅ **Composition over Inheritance**: Hooks and modules compose
✅ **Explicit over Implicit**: Clear function names and types
✅ **Principle of Least Surprise**: Code works as expected

## Anti-Patterns Avoided

❌ **God Object**: No more monolithic component
❌ **Spaghetti Code**: Clear structure and flow
❌ **Copy-Paste**: Reusable functions and modules
❌ **Magic Numbers**: Constants with clear names
❌ **Deep Nesting**: Flat module structure
❌ **Tight Coupling**: Loose coupling via clean interfaces

---

**Architecture Design**: Claude Sonnet 4.5
**Date**: January 22, 2026
