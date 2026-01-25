
# ContextMemory Visual Chatbot - Complete Project Summary

This document provides a comprehensive summary of the ContextMemory visualization project, including all work done across multiple sessions.

---

## Project Overview

**ContextMemory Visual Chatbot** is a Next.js application that visualizes an AI memory system inspired by Pickle OS. It features:
- Real-time bubble network visualization of AI memories
- Split-screen design with chat interface and visualization
- D3.js force-directed graph with conditional connections
- FastAPI/Python backend integrated with PostgreSQL

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript 5 |
| Styling | Tailwind CSS, shadcn/ui |
| Visualization | D3.js v7.9 force-directed graph |
| Data Fetching | SWR with controlled refresh |
| Backend | FastAPI, Python, Pydantic |
| Database | PostgreSQL with JSON metadata |
| Memory System | ContextMemory Python library |

---

## Application Architecture

### Layout
- **Left (40%)**: Chat interface with message history
- **Right (60%)**: Memory network visualization with bubbles

### Key Components

| Component | Purpose |
|-----------|---------|
| `page.tsx` | Main layout with split-screen design |
| `MemoryGraph.tsx` | D3 force-directed bubble visualization |
| `MemoryDetailPanel.tsx` | Slide-in panel showing memory details |
| `ChatPanel.tsx` | Chat interface with input and messages |
| `main.py` | FastAPI backend with ContextMemory integration |

---

## Features Implemented

### Visualization Features
| Feature | Description |
|---------|-------------|
| Bubble Display | Shows memory ID numbers in sized/colored circles |
| Color by Type | Amber = semantic facts, Green = fresh episodic |
| Color by Age | Fresh (green) → Warm (yellow) → Cold (blue) |
| Click Selection | Single bubble selection with detail panel |
| Connections | Lines appear only for selected bubble's connections |
| Connected Pull | Connected bubbles animate closer on selection |
| Unconnected Dim | Non-connected bubbles dim to 40% opacity |
| Click-to-Deselect | Click empty space to clear selection |
| Hover Tooltips | Shows memory text, type, connection count |
| Zoom Controls | +/- buttons and reset view |
| Pan & Zoom | Mouse wheel and drag interactions |

### Chat Features
| Feature | Description |
|---------|-------------|
| Message Input | Text area with Enter to send |
| AI Responses | Displays responses from OpenRouter API |
| Timestamps | Relative time on each message |
| Memory Stats | Header shows facts, bubbles, links count |
| Extraction Indicator | Shows "+X facts, +X bubbles" on responses |
| New Conversation | Button to start fresh |
| Clear Chat | Button to clear history |

---

## Key Technical Patterns

### 1. D3 Force Simulation with Stable Positions
```typescript
// Positions stored in refs, preserved across re-renders
const positionsRef = useRef<Map<number, NodePosition>>(new Map());

// Simulation initializes only once
const initializedRef = useRef(false);
useEffect(() => {
  if (initializedRef.current) return;
  initializedRef.current = true;
  // ... create simulation
}, [data]);
```

### 2. Conditional Connection Display
```typescript
// Only show connections from clicked bubble's metadata
let visibleLinks: MemoryLink[] = [];
if (selectedId) {
  const selectedNode = nodes.find((n) => n.id === selectedId);
  if (selectedNode?.connections) {
    const connectedIds = new Set(
      selectedNode.connections.map((conn) => conn.target_id)
    );
    visibleLinks = links.filter((link) => {
      const sourceId = typeof link.source === 'number' ? link.source : link.source.id;
      return sourceId === selectedId && connectedIds.has(targetId);
    });
  }
}
```

### 3. CSS-Only Hover Effects
```css
/* Prevents D3 simulation interference */
.memory-bubble circle {
  transition: all 0.3s ease;
}
.memory-bubble:hover circle {
  filter: brightness(1.15);
}
```

### 4. Click-to-Deselect
```typescript
// SVG click handler clears selection
svg.on("click", (event) => {
  if (event.target === svgRef.current) {
    handleClearSelection();
  }
});
```

---

## Errors Fixed (Session History)

### Error 1: Missing tailwindcss-animate
- **Fix**: `npm install tailwindcss-animate`

### Error 2: D3 "node not found: 51"
- **Cause**: Links referenced non-existent nodes
- **Fix**: Filter links to only include valid node IDs

### Error 3: Bubble Shaking on Hover
- **Cause**: JS hover handlers triggered simulation
- **Fix**: Use pure CSS hover effects

### Error 4: Incorrect Connection Count
- **Cause**: Showed all links where bubble appeared
- **Fix**: Only show explicit connections from bubble's metadata

### Error 5: Bubble Positions Resetting on Click
- **Cause**: D3 simulation restarted on each selection
- **Fix**: Store positions in refs, update only visual elements

---

## File Structure

```
test-cm2/
├── backend/
│   ├── main.py              # FastAPI backend
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Virtual environment
├── web/
│   ├── app/
│   │   ├── globals.css      # Global styles + animations
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page component
│   ├── components/
│   │   ├── chat/
│   │   │   └── ChatPanel.tsx
│   │   ├── ui/
│   │   │   └── button.tsx
│   │   └── visualization/
│   │       ├── MemoryGraph.tsx
│   │       └── MemoryDetailPanel.tsx
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── utils.ts         # Helper functions
│   ├── types/
│   │   ├── api.ts           # API types
│   │   └── memory.ts        # Memory types
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.ts
├── SUMMARY.MD               # This file
└── README.md
```

---

## Running the Application

### Backend
```bash
cd backend
source venv/bin/activate
python main.py
# Runs on http://localhost:8000
```

### Frontend
```bash
cd web
npm run dev
# Runs on http://localhost:3001
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message, get AI response |
| `/api/memories/{id}` | GET | Get all memories as nodes/links |
| `/api/memory/{id}` | GET | Get single memory details |
| `/api/memory/{id}` | DELETE | Delete a memory |

---

## Database Structure

Memories are stored with JSON metadata:
```json
{
  "connections": {
    "bubble_ids": [2, 5],
    "scores": {"2": 0.721, "5": 0.653}
  }
}
```

---

## Session 2 Additions (January 20, 2026)

### New Features Added
1. **Hover Tooltips** - Rich tooltips showing memory text and metadata
2. **Click-to-Deselect** - Click empty space to clear selection
3. **Dim Unconnected Bubbles** - 40% opacity for non-related bubbles
4. **Zoom Controls** - +/- buttons and reset view in top-left
5. **Message Timestamps** - Relative time on each message
6. **Memory Stats Header** - Shows facts, bubbles, links count
7. **New Conversation Button** - Start fresh conversations
8. **Clear Chat Button** - Clear current chat history
9. **Extraction Indicators** - Shows memory count on AI responses

### Files Modified
- `web/components/visualization/MemoryGraph.tsx` - Added tooltips, zoom, deselect, dim logic
- `web/components/chat/ChatPanel.tsx` - Added stats, timestamps, buttons
- `web/types/memory.ts` - Added extractedMemories to Message type
- `web/app/globals.css` - Updated bubble and connection styles

---

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set root directory to `web`
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Environment Variables
```
NEXT_PUBLIC_API_URL=https://your-backend.com
```

---

## Future Enhancements (Optional)

- [ ] Date range filters
- [ ] Importance threshold slider
- [ ] Semantic/episodic toggle filters
- [ ] New bubble pulse animation
- [ ] Archived memories toggle
- [ ] Mobile responsive design