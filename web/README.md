# ContextMemory Frontend - Pickle OS Inspired Visualization

Beautiful memory bubble visualization for ContextMemory AI conversations, inspired by Pickle OS design.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Backend (Terminal 1)

```bash
cd backend
python -m uvicorn main:app --reload
```

### 4. Start Frontend (Terminal 2)

```bash
cd web
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

```
web/
├── app/
│   ├── layout.tsx          # Root layout with Toaster
│   ├── page.tsx            # Main page with split view
│   └── globals.css         # Global styles + design tokens
├── components/
│   ├── chat/               # Chat components
│   │   ├── ChatPanel.tsx
│   │   ├── MessageList.tsx
│   │   └── ChatInput.tsx
│   ├── visualization/      # Memory visualization
│   │   ├── MemoryGraph.tsx
│   │   ├── BubbleNode.tsx
│   │   └── MemoryDetails.tsx
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/
│   ├── api.ts              # API client
│   └── utils.ts            # Utility functions
└── types/
    ├── memory.ts           # Domain types
    └── api.ts              # API types
```

## 🎨 Design System

### Colors (Pickle OS Inspired)

- **Semantic Facts**: Warm amber (`hsl(36, 100%, 70%)`)
- **Episodic Bubbles**:
  - Active (0-7 days): Green (`hsl(142, 76%, 36%)`)
  - Warm (7-30 days): Yellow (`hsl(45, 93%, 47%)`)
  - Cold (30+ days): Blue (`hsl(217, 91%, 60%)`)

### Bubble Sizing

```typescript
// Radius: 24px (low) to 56px (high) based on importance
radius = 24 + (importance * 32)
```

### Connection Lines

- **Thickness**: 1-4px based on connection strength
- **Opacity**: 0.05-0.35 based on connection strength

## 📝 Component Examples

### Using the Memory Graph

```typescript
import { MemoryGraph } from '@/components/visualization/MemoryGraph';

<MemoryGraph
  conversationId={1}
  onBubbleClick={(memory) => console.log(memory)}
/>
```

### Using the Chat Panel

```typescript
import { ChatPanel } from '@/components/chat/ChatPanel';

<ChatPanel
  conversationId={1}
  onMessageSent={() => refreshMemories()}
/>
```

## 🔄 Data Flow

1. **User sends message** → ChatPanel
2. **ChatPanel** → API `/api/chat`
3. **API returns** → AI response + extracted memories
4. **ChatPanel triggers refresh** → MemoryGraph
5. **MemoryGraph fetches** → `/api/memories/{id}`
6. **D3 Force Simulation** → Layout bubbles
7. **Render** → SVG bubbles with connections

## 🛠️ Key Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **D3.js**: Force-directed graph layout
- **Framer Motion**: Smooth animations
- **SWR**: Data fetching with caching
- **shadcn/ui**: Accessible UI components
- **Sonner**: Toast notifications

## 📚 Best Practices

See [FRONTEND_BEST_PRACTICES.md](../FRONTEND_BEST_PRACTICES.md) for comprehensive development guidelines.

Key principles:
- ✅ Component composition over inheritance
- ✅ TypeScript for all files (no `any`)
- ✅ Accessibility (ARIA labels, keyboard nav)
- ✅ Responsive design (mobile-first)
- ✅ Performance optimization (memoization, virtualization)
- ✅ Consistent design tokens

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 🚢 Production Build

```bash
npm run build
npm start
```

## 📖 API Endpoints Used

### POST `/api/chat`
Send message, get AI response + extracted memories

**Request:**
```json
{
  "message": "I love Python",
  "conversation_id": 1
}
```

**Response:**
```json
{
  "response": "That's great! Python is...",
  "extracted_memories": {
    "semantic": ["User loves Python"],
    "bubbles": []
  },
  "relevant_memories": [...]
}
```

### GET `/api/memories/{conversation_id}`
Get all memories as nodes and links for visualization

**Response:**
```json
{
  "nodes": [
    {
      "id": 1,
      "text": "User loves Python",
      "type": "semantic",
      "importance": 0.8,
      "created_at": "2026-01-20T10:00:00",
      "connections": [
        {"target_id": 2, "score": 0.85}
      ]
    }
  ],
  "links": [
    {
      "source": 1,
      "target": 2,
      "strength": 0.85
    }
  ]
}
```

### GET `/api/memory/{memory_id}`
Get detailed information about a specific memory

### DELETE `/api/memory/{memory_id}`
Delete a memory

## 🎯 Features

### Implemented
- ✅ Split-screen layout (chat + visualization)
- ✅ Real-time memory bubble creation
- ✅ Force-directed graph layout
- ✅ Connection visualization with strength
- ✅ Bubble sizing by importance
- ✅ Color coding by type and age
- ✅ Hover effects and tooltips
- ✅ Click to view memory details
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

### Optional Enhancements
- 🔲 Zoom and pan controls
- 🔲 Filter by type (semantic/bubbles)
- 🔲 Search memories
- 🔲 Export graph as image
- 🔲 Dark mode toggle
- 🔲 Memory timeline view
- 🔲 Keyboard shortcuts
- 🔲 Undo/redo for deleted memories

## 🐛 Troubleshooting

### Backend not connecting
- Check backend is running on `http://localhost:8000`
- Verify `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check CORS is enabled in backend

### Bubbles not appearing
- Check browser console for errors
- Verify API returns data: `curl http://localhost:8000/api/memories/1`
- Check if conversations table has data

### TypeScript errors
```bash
npm run type-check
```

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📜 License

MIT License - See root LICENSE file

## 🤝 Contributing

1. Follow [FRONTEND_BEST_PRACTICES.md](../FRONTEND_BEST_PRACTICES.md)
2. Use TypeScript for all new files
3. Add proper type definitions
4. Test responsive design
5. Run `npm run format` before committing

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/samiksha0shukla/context-memory/issues)
- Documentation: [README.md](../README.md)
- Architecture: [ARCHITECTURE_FLOW_DIAGRAM_FINAL.md](../ARCHITECTURE_FLOW_DIAGRAM_FINAL.md)

---

**Built with ❤️ for ContextMemory**
