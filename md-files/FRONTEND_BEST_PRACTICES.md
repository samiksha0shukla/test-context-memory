# ContextMemory Frontend Development Best Practices

> **Purpose**: This document outlines the architectural patterns, component structures, and implementation standards for building the ContextMemory visualization frontend. Reference this document when building or extending the application.

---

## 🏗️ Architecture Principles

### 1. Component Architecture

**Use Composition Over Inheritance**
- Build complex UIs by composing smaller, focused components
- Each component should have a single, well-defined responsibility
- Favor functional components with hooks over class components

**Component Hierarchy**
```
app/
├── page.tsx (Main orchestrator)
├── components/
│   ├── chat/              # Chat-related components
│   │   ├── ChatPanel.tsx
│   │   ├── MessageList.tsx
│   │   └── ChatInput.tsx
│   ├── visualization/     # Memory bubble visualization
│   │   ├── MemoryGraph.tsx
│   │   ├── BubbleNode.tsx
│   │   ├── ConnectionLine.tsx
│   │   └── MemoryDetails.tsx
│   ├── layout/           # Layout components
│   │   ├── SplitView.tsx
│   │   └── Header.tsx
│   └── ui/               # Reusable UI primitives (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
```

### 2. State Management Pattern

**Co-location Principle**
- Keep state as close to where it's used as possible
- Lift state only when truly needed by multiple components
- Use Context for truly global state (theme, user preferences)
- Use local state for UI-specific concerns (modals, hover states)

**State Structure**
```typescript
// Local UI state
const [isHovering, setIsHovering] = useState(false);

// Shared application state (lifted)
const [memories, setMemories] = useState<Memory[]>([]);
const [messages, setMessages] = useState<Message[]>([]);

// Global app state (Context)
const { theme, setTheme } = useTheme();
```

---

## 🎨 Design System Standards

### 1. shadcn/ui Integration

**Why shadcn/ui?**
- Component source code is in your project (full control)
- Built on Radix UI primitives (accessibility built-in)
- Tailwind CSS for styling consistency
- Customizable without fighting the framework

**Installation Pattern**
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog input textarea
```

**Component Usage**
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Always use variants for consistency
<Button variant="default" size="lg">Send</Button>
<Button variant="ghost" size="sm">Cancel</Button>
```

### 2. Tailwind CSS Conventions

**Utility-First Approach**
```typescript
// ✅ Good: Utility classes
<div className="flex items-center gap-4 rounded-lg border p-4">

// ❌ Avoid: Inline styles
<div style={{ display: 'flex', gap: '16px' }}>
```

**Responsive Design**
```typescript
// Mobile-first approach
<div className="flex flex-col md:flex-row lg:gap-8">
  {/* Stacks on mobile, row on desktop */}
</div>
```

**Custom Design Tokens**
```css
/* globals.css */
@layer base {
  :root {
    --bubble-blue: 214 100% 70%;
    --bubble-amber: 36 100% 70%;
    --connection-opacity: 0.15;
  }
}

/* Usage in components */
<div className="bg-[hsl(var(--bubble-blue))]">
```

### 3. Color Palette (Pickle OS Inspired)

```typescript
const colorPalette = {
  bubbles: {
    episodic: 'hsl(214, 100%, 70%)',    // Soft blue
    semantic: 'hsl(36, 100%, 70%)',     // Warm amber
    active: 'hsl(142, 76%, 36%)',       // Green (0-7 days)
    warm: 'hsl(45, 93%, 47%)',          // Yellow (7-30 days)
    cold: 'hsl(217, 91%, 60%)',         // Blue (30-90 days)
  },
  connections: {
    strong: 'rgba(0, 0, 0, 0.3)',       // opacity based on score
    medium: 'rgba(0, 0, 0, 0.15)',
    weak: 'rgba(0, 0, 0, 0.05)',
  },
  background: {
    canvas: 'hsl(0, 0%, 98%)',          // Soft off-white
    panel: 'hsl(0, 0%, 100%)',          // Pure white
  },
};
```

---

## 🔄 Data Flow Patterns

### 1. API Communication

**Use SWR for Data Fetching**
```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function MemoryGraph({ conversationId }: Props) {
  const { data, error, mutate } = useSWR(
    `/api/memories/${conversationId}`,
    fetcher,
    { refreshInterval: 0 } // Don't auto-refresh
  );

  // mutate() to manually refresh after chat
  return <div>...</div>;
}
```

**API Client Pattern**
```typescript
// lib/api.ts
export class ContextMemoryAPI {
  constructor(private baseUrl: string) {}

  async chat(message: string, conversationId: number) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
    if (!res.ok) throw new Error('Chat failed');
    return res.json();
  }

  async getMemories(conversationId: number) {
    const res = await fetch(`${this.baseUrl}/api/memories/${conversationId}`);
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  }
}

// Usage
const api = new ContextMemoryAPI('http://localhost:8000');
```

### 2. Real-time Updates

**Optimistic UI Updates**
```typescript
const sendMessage = async (message: string) => {
  // 1. Optimistically add message to UI
  setMessages(prev => [...prev, { role: 'user', content: message }]);

  try {
    // 2. Send to API
    const response = await api.chat(message, conversationId);

    // 3. Add AI response
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response.response
    }]);

    // 4. Trigger memory graph refresh
    mutateMemories();
  } catch (error) {
    // 5. Rollback on error
    setMessages(prev => prev.slice(0, -1));
    toast.error('Failed to send message');
  }
};
```

---

## 📊 Visualization Best Practices

### 1. D3.js Integration with React

**Force-Directed Graph**
```typescript
import * as d3 from 'd3';
import { useRef, useEffect } from 'react';

function MemoryGraph({ nodes, links }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 10));

    // Cleanup
    return () => simulation.stop();
  }, [nodes, links]);

  return <svg ref={svgRef} />;
}
```

**Performance Optimization**
- Use `useMemo` for expensive calculations
- Debounce zoom/pan handlers
- Limit number of visible nodes (virtualization for 100+ nodes)

### 2. Animation Patterns

**Bubble Creation Animation**
```typescript
// Use Framer Motion for React animations
import { motion } from 'framer-motion';

<motion.circle
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{
    type: 'spring',
    stiffness: 260,
    damping: 20
  }}
  cx={x}
  cy={y}
  r={radius}
/>
```

**Connection Line Animation**
```typescript
<motion.line
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 0.3 }}
  transition={{ duration: 0.5 }}
/>
```

### 3. Bubble Sizing Formula

```typescript
/**
 * Calculate bubble radius based on importance score
 * Range: 20px (low importance) to 60px (high importance)
 */
const getBubbleRadius = (importance: number): number => {
  const minRadius = 20;
  const maxRadius = 60;
  return minRadius + (importance * (maxRadius - minRadius));
};

// Apply exponential scaling for visual prominence
const getVisualRadius = (importance: number): number => {
  const baseRadius = getBubbleRadius(importance);
  return Math.pow(baseRadius / 20, 1.5) * 20;
};
```

---

## 🧩 TypeScript Standards

### 1. Type Definitions

**Domain Models**
```typescript
// types/memory.ts
export interface Memory {
  id: number;
  text: string;
  type: 'semantic' | 'bubble';
  importance: number;
  created_at: string;
  connections: Connection[];
}

export interface Connection {
  target_id: number;
  score: number;
}

export interface MemoryNode extends Memory {
  x?: number;  // D3 simulation adds these
  y?: number;
  fx?: number | null;
  fy?: number | null;
}
```

**API Response Types**
```typescript
// types/api.ts
export interface ChatResponse {
  response: string;
  extracted_memories: {
    semantic: string[];
    bubbles: string[];
  };
  relevant_memories: Array<{
    memory_id: number;
    memory: string;
    type: string;
    score: number;
  }>;
}

export interface MemoriesResponse {
  nodes: Memory[];
  links: Array<{
    source: number;
    target: number;
    strength: number;
  }>;
}
```

### 2. Component Props

**Always Define Prop Types**
```typescript
interface ChatPanelProps {
  conversationId: number;
  onMessageSent?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ChatPanel({
  conversationId,
  onMessageSent,
  className,
  disabled = false
}: ChatPanelProps) {
  // ...
}
```

---

## ♿ Accessibility

### 1. Keyboard Navigation

```typescript
// Bubble nodes should be focusable
<g
  role="button"
  tabIndex={0}
  aria-label={`Memory: ${memory.text}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleBubbleClick(memory);
    }
  }}
>
  <circle />
  <text />
</g>
```

### 2. Screen Reader Support

```typescript
// Provide text alternatives for visual information
<div role="region" aria-label="Memory visualization">
  <svg aria-describedby="graph-desc">
    <desc id="graph-desc">
      Interactive graph showing {nodes.length} memories
      with {links.length} connections
    </desc>
  </svg>
</div>
```

---

## 🎯 Performance Optimization

### 1. Component Memoization

```typescript
// Memoize expensive components
const BubbleNode = memo(({ memory, onClick }: Props) => {
  return <g onClick={onClick}>...</g>;
}, (prev, next) => {
  // Custom comparison for re-render control
  return prev.memory.id === next.memory.id &&
         prev.memory.x === next.memory.x &&
         prev.memory.y === next.memory.y;
});
```

### 2. Virtualization

```typescript
// For large lists (100+ messages)
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
});

const items = virtualizer.getVirtualItems();
```

---

## 🧪 Testing Patterns

### 1. Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('ChatInput', () => {
  it('sends message on Enter key', () => {
    const onSend = jest.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Hello');
  });
});
```

### 2. API Mocking

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/chat', (req, res, ctx) => {
    return res(ctx.json({
      response: 'Test response',
      extracted_memories: { semantic: [], bubbles: [] },
      relevant_memories: [],
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 📁 File Organization

```
src/
├── app/
│   ├── page.tsx                 # Main page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   └── api/                     # API routes (if using Next.js API)
├── components/
│   ├── chat/                    # Chat components
│   ├── visualization/           # Visualization components
│   ├── layout/                  # Layout components
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── api.ts                   # API client
│   ├── utils.ts                 # Utility functions
│   └── constants.ts             # Constants
├── types/
│   ├── memory.ts                # Domain types
│   └── api.ts                   # API types
├── hooks/
│   ├── useMemories.ts           # Custom hooks
│   └── useChat.ts
└── utils/
    ├── memory-calculations.ts   # Bubble sizing, scoring
    └── graph-layout.ts          # D3 force simulation helpers
```

---

## 🚀 Development Workflow

### 1. Development Server

```bash
# Frontend
npm run dev

# Backend
cd backend
python -m uvicorn main:app --reload
```

### 2. Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Code Quality

```json
// package.json scripts
{
  "lint": "next lint",
  "format": "prettier --write .",
  "type-check": "tsc --noEmit"
}
```

---

## 📚 Key Dependencies

### Core
- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety

### UI
- **shadcn/ui**: Component library
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible primitives
- **Lucide React**: Icons

### Visualization
- **D3.js**: Force-directed graph
- **Framer Motion**: Animations

### Data Fetching
- **SWR**: Data fetching & caching

### Utilities
- **clsx**: Conditional classes
- **tailwind-merge**: Merge Tailwind classes

---

## 🎨 Visual Design Principles

### 1. Hierarchy
- Use size to indicate importance (bubble radius)
- Use color to indicate type (blue=episodic, amber=semantic)
- Use opacity to indicate age (recency decay)

### 2. Consistency
- All interactive elements have hover states
- Consistent spacing (4px, 8px, 16px, 24px, 32px)
- Consistent border radius (rounded-lg = 8px)

### 3. Feedback
- Loading states for async operations
- Success/error toasts for actions
- Smooth transitions (300ms default)

---

## 🔒 Security Considerations

### 1. API Security
```typescript
// Never expose API keys in frontend
// Use environment variables for API URL only
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Validate/sanitize user input
const sanitizeMessage = (message: string) => {
  return message.trim().slice(0, 2000); // Limit length
};
```

### 2. XSS Prevention
```typescript
// React escapes by default, but for HTML content:
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(userContent);
```

---

## ✅ Pre-Build Checklist

Before considering the frontend complete, verify:

- [ ] All components are properly typed (no `any`)
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Accessibility: keyboard navigation, ARIA labels
- [ ] Loading states for all async operations
- [ ] Error handling with user feedback
- [ ] Performance: memoization for expensive renders
- [ ] Consistent design tokens (colors, spacing, typography)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Documentation: comments for complex logic
- [ ] Clean console (no warnings or errors)

---

**Last Updated**: January 2026
**Version**: 1.0.0
