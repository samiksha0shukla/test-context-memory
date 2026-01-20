# Getting Started with ContextMemory Visualization

This guide will help you get up and running with ContextMemory in 5 minutes.

## 🎯 What You're Building

A beautiful web application where users can:
1. Chat with an AI that remembers everything
2. Watch memories form as interactive bubbles
3. See connections between related memories
4. Explore their conversation history visually

**Inspired by Pickle OS design** - Beautiful, minimalist, functional.

## ⚡ Quick Install

### Option 1: Automated Install (Recommended)

```bash
cd test-cm2
./install.sh
```

This script will:
- ✅ Check prerequisites (Python 3.9+, Node 18+)
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Set up environment variables
- ✅ Display startup instructions

### Option 2: Manual Install

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Frontend
```bash
cd web
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

## 🚀 Start the Application

You need **two terminals**:

### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload
```

✅ Backend running at [http://localhost:8000](http://localhost:8000)

### Terminal 2: Frontend
```bash
cd web
npm run dev
```

✅ Frontend running at [http://localhost:3000](http://localhost:3000)

## 🎮 Try It Out

### First Message

Open [http://localhost:3000](http://localhost:3000) and send:

```
Hi! I'm testing ContextMemory. I love Python programming and building AI apps.
```

**Watch what happens:**
1. AI responds with context
2. Memory bubbles appear on the right
3. Semantic fact: "User loves Python programming"
4. Bubble: "User is testing ContextMemory"

### Second Message

```
Can you help me build a FastAPI backend?
```

**Observe:**
1. AI remembers you love Python
2. New bubble appears
3. Connects to existing "Python" memory
4. Network grows organically

### Explore

- **Drag bubbles** to rearrange
- **Click bubbles** to see details
- **Scroll** to zoom in/out
- **Hover** to highlight

## 🎨 What You See

### Bubble Colors

- **🟡 Amber**: Semantic facts (stable truths)
  - "User prefers Python"
  - "User is a developer"

- **🔵 Blue**: Episodic bubbles (moments)
  - "Building FastAPI backend"
  - "Learning about memory systems"

### Bubble Sizes

- **Larger** = More important (0.8-1.0)
- **Medium** = Important (0.5-0.7)
- **Smaller** = Less important (0.0-0.4)

### Connection Lines

- **Thicker, darker** = Strong connection (0.8+)
- **Medium** = Related (0.6-0.8)
- **Thin, light** = Weak connection (0.6)

## 📁 Project Structure Explained

```
test-cm2/
├── backend/              # Python FastAPI server
│   ├── main.py          # API endpoints + ContextMemory
│   └── requirements.txt
│
├── web/                  # Next.js frontend
│   ├── app/             # Pages
│   │   ├── page.tsx    # Main split-screen view
│   │   └── layout.tsx  # Root layout
│   ├── components/      # React components
│   │   ├── chat/       # Chat interface
│   │   └── visualization/ # D3 bubble graph
│   └── lib/             # Utilities
│
├── chatbot.py            # Terminal demo (optional)
├── README.md             # Main documentation
├── SETUP.md              # Detailed setup guide
├── ARCHITECTURE_FLOW_DIAGRAM_FINAL.md  # System architecture
├── FRONTEND_BEST_PRACTICES.md  # Development guidelines
└── PROJECT_SUMMARY.md    # Complete overview
```

## 🔧 Configuration

### Backend API Keys

Edit `backend/main.py` lines 31-36:

```python
OPENROUTER_API_KEY = "sk-or-v1-..."  # Get from openrouter.ai
DATABASE_URL = "postgresql://..."     # Or omit for SQLite
```

### Database Options

**Option 1: SQLite (Default)**
- No setup required
- Great for development
- Data stored in local file

**Option 2: PostgreSQL (Production)**
- Set DATABASE_URL in main.py
- Better for production
- Example provided in chatbot.py line 32

### Frontend API URL

Edit `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Change to your deployed backend URL for production.

## 🎓 Understanding the System

### How Memory Extraction Works

```
User: "I love Python programming"
         ↓
OpenRouter LLM analyzes message
         ↓
Extracts:
  - Semantic: "User loves Python programming" (importance: 0.8)
         ↓
Stores in PostgreSQL with embedding
         ↓
Finds similar existing memories
         ↓
Creates connections automatically
```

### How Visualization Works

```
Frontend requests: GET /api/memories/1
         ↓
Backend returns nodes + links
         ↓
D3.js creates force simulation
         ↓
Bubbles position themselves
         ↓
Connections drawn between related bubbles
         ↓
Interactive SVG rendered
```

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to backend"

**Symptom**: Frontend shows "Failed to load memories"

**Solution**:
```bash
# Check backend is running
curl http://localhost:8000

# If not, start it:
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload
```

### Issue 2: "Module not found: contextmemory"

**Symptom**: Backend won't start

**Solution**:
```bash
cd backend
source venv/bin/activate
pip install contextmemory
```

### Issue 3: Bubbles not appearing

**Symptom**: Chat works but no visualization

**Solution**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify: `curl http://localhost:8000/api/memories/1`
4. Should return JSON with nodes and links

### Issue 4: TypeScript errors

**Solution**:
```bash
cd web
npm run type-check
```

### Issue 5: Build fails

**Solution**:
```bash
cd web
rm -rf .next node_modules
npm install
npm run build
```

## 📚 Next Steps

### Learn More

1. **Architecture**: Read [ARCHITECTURE_FLOW_DIAGRAM_FINAL.md](./ARCHITECTURE_FLOW_DIAGRAM_FINAL.md)
   - Complete system flow
   - Memory extraction process
   - Scoring formulas
   - Connection algorithm

2. **Frontend Guide**: Read [FRONTEND_BEST_PRACTICES.md](./FRONTEND_BEST_PRACTICES.md)
   - Component patterns
   - TypeScript standards
   - Performance tips
   - Customization guide

3. **API Docs**: Visit [http://localhost:8000/docs](http://localhost:8000/docs)
   - Interactive API explorer
   - Request/response schemas
   - Try endpoints live

### Customize

**Change bubble colors**:
```css
/* web/app/globals.css */
:root {
  --bubble-blue: 214 100% 70%;   /* Your color here */
  --bubble-amber: 36 100% 70%;
}
```

**Adjust bubble sizes**:
```typescript
// web/lib/utils.ts
export function getBubbleRadius(importance: number): number {
  const minRadius = 30;  // Increase for larger bubbles
  const maxRadius = 70;
  return minRadius + importance * (maxRadius - minRadius);
}
```

**Change force simulation**:
```typescript
// web/components/visualization/MemoryGraph.tsx
.force("link", d3.forceLink(links).distance(150))  // Spread out more
.force("charge", d3.forceManyBody().strength(-500)) // Stronger repulsion
```

### Add Features

Ideas from [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md):

- [ ] Dark mode toggle
- [ ] Memory search
- [ ] Export graph as image
- [ ] Filter by type
- [ ] Timeline view
- [ ] Multiple conversations
- [ ] Memory editing
- [ ] Voice input

### Deploy

**Backend** (Example with Railway):
```bash
# Push backend/ to Railway
# Set environment variables
# Deploy!
```

**Frontend** (Example with Vercel):
```bash
cd web
vercel --prod
```

See [SETUP.md](./SETUP.md#production-deployment) for details.

## 🎯 Usage Examples

### Example 1: Personal Assistant

```
You: I prefer vegetarian food
AI: I'll remember that! [Creates semantic fact]

You: Suggest a restaurant for dinner
AI: Based on your preference for vegetarian food, I recommend...
```

### Example 2: Learning Assistant

```
You: I'm learning React hooks
AI: Great! [Creates bubble]

You: How do I use useEffect?
AI: Since you're learning React hooks... [Connects to previous bubble]
```

### Example 3: Project Tracking

```
You: Working on FastAPI project
AI: Got it! [Creates bubble with timestamp]

You: What was I working on yesterday?
AI: You were working on your FastAPI project...
```

## 🤝 Getting Help

1. **Check Documentation**:
   - [SETUP.md](./SETUP.md) - Detailed setup
   - [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Complete overview
   - [FRONTEND_BEST_PRACTICES.md](./FRONTEND_BEST_PRACTICES.md) - Development guide

2. **Check API Status**:
   - Backend: [http://localhost:8000](http://localhost:8000)
   - API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Frontend: [http://localhost:3000](http://localhost:3000)

3. **Verify Installation**:
   ```bash
   # Backend
   cd backend
   source venv/bin/activate
   python -c "import contextmemory; print('✅ OK')"

   # Frontend
   cd web
   npm run type-check
   ```

4. **Report Issues**: Include:
   - Error message
   - Browser console logs
   - Steps to reproduce
   - Your environment (OS, Python version, Node version)

## ✅ Success Checklist

You're ready when:

- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:3000
- [ ] Can send a chat message
- [ ] AI responds
- [ ] Bubbles appear in visualization
- [ ] Can drag and zoom bubbles
- [ ] Clicking bubbles shows details
- [ ] No errors in browser console

## 🎉 You're Ready!

Congratulations! You now have:

✅ A working AI chatbot with long-term memory
✅ Beautiful Pickle OS-inspired visualization
✅ Interactive bubble network
✅ Real-time memory extraction
✅ Full TypeScript frontend
✅ Production-ready backend

**Happy building!** 🚀

---

Need more help? Check:
- [SETUP.md](./SETUP.md) - Detailed setup
- [ARCHITECTURE_FLOW_DIAGRAM_FINAL.md](./ARCHITECTURE_FLOW_DIAGRAM_FINAL.md) - How it works
- [FRONTEND_BEST_PRACTICES.md](./FRONTEND_BEST_PRACTICES.md) - Development guidelines
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Complete overview
