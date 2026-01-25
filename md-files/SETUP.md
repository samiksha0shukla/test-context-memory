# ContextMemory Setup Guide

Complete setup instructions for the ContextMemory visualization system.

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **PostgreSQL** database (or use SQLite for development)

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn main:app --reload
```

Backend will run on [http://localhost:8000](http://localhost:8000)

### 2. Frontend Setup

```bash
# Open new terminal
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on [http://localhost:3000](http://localhost:3000)

### 3. Verify Setup

1. Open [http://localhost:8000/docs](http://localhost:8000/docs) - FastAPI docs
2. Open [http://localhost:3000](http://localhost:3000) - Frontend app
3. Send a message: "Hi, I'm testing ContextMemory!"
4. Watch memory bubbles appear in real-time

## 🗂️ Project Structure

```
test-cm2/
├── backend/
│   ├── main.py                        # FastAPI server
│   ├── requirements.txt               # Python dependencies
│   └── venv/                         # Virtual environment
├── web/
│   ├── app/
│   │   ├── page.tsx                  # Main page
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── chat/
│   │   │   └── ChatPanel.tsx         # Chat interface
│   │   ├── visualization/
│   │   │   └── MemoryGraph.tsx       # D3 bubble visualization
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts                    # API client
│   │   └── utils.ts                  # Utilities
│   ├── types/                        # TypeScript definitions
│   ├── package.json
│   └── tsconfig.json
├── chatbot.py                        # Terminal chatbot demo
├── requirements.txt                  # Root Python dependencies
├── README.md                         # Project documentation
├── ARCHITECTURE_FLOW_DIAGRAM_FINAL.md # System architecture
├── FRONTEND_BEST_PRACTICES.md       # Frontend guidelines
└── SETUP.md                         # This file
```

## 🔧 Configuration

### Backend Configuration

Edit `backend/main.py` lines 31-36:

```python
OPENROUTER_API_KEY = "your-key-here"
DATABASE_URL = "your-database-url"
LLM_MODEL = "openai/gpt-4o-mini"
EXTRACTION_MODEL = "anthropic/claude-sonnet-4.5"
EMBEDDING_MODEL = "openai/text-embedding-3-small"
```

### Frontend Configuration

Edit `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📦 Install Additional Dependencies

### Backend

```bash
pip install fastapi uvicorn contextmemory openai python-dotenv sqlalchemy psycopg2-binary
```

### Frontend

```bash
npm install next react react-dom d3 framer-motion swr tailwindcss
npm install @types/node @types/react @types/d3 typescript
npm install lucide-react sonner clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-tooltip
```

## 🐛 Troubleshooting

### Backend Issues

**Error: "Module not found: contextmemory"**
```bash
pip install contextmemory
```

**Error: "Connection refused to database"**
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Or use SQLite: Remove `database_url` from `configure()`

**Error: "OpenRouter API key invalid"**
- Get key from [openrouter.ai](https://openrouter.ai)
- Update OPENROUTER_API_KEY in main.py

### Frontend Issues

**Error: "Cannot find module '@/...'**
```bash
npm install
```

**Error: "Failed to fetch memories"**
- Check backend is running on port 8000
- Verify NEXT_PUBLIC_API_URL in .env.local
- Check browser console for CORS errors

**Error: "D3 is not defined"**
- D3 is loaded dynamically to avoid SSR issues
- Check that MemoryGraph uses `dynamic import`

**Build errors**
```bash
cd web
rm -rf .next node_modules
npm install
npm run build
```

## 🧪 Testing

### Test Backend

```bash
# Check API is running
curl http://localhost:8000

# Test chat endpoint
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "conversation_id": 1}'

# Test memories endpoint
curl http://localhost:8000/api/memories/1
```

### Test Frontend

```bash
cd web
npm run type-check  # TypeScript checking
npm run lint       # ESLint
npm run format     # Prettier formatting
```

## 🚢 Production Deployment

### Backend (Docker)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Vercel)

```bash
cd web
vercel --prod
```

Or use any Node.js hosting:

```bash
npm run build
npm start
```

## 📚 Development Workflow

1. **Start both servers** (backend + frontend)
2. **Make changes** to code
3. **Hot reload** happens automatically
4. **Test** in browser at localhost:3000
5. **Commit** changes with git

### Development Tips

- Use `npm run format` before committing
- Check [FRONTEND_BEST_PRACTICES.md](./FRONTEND_BEST_PRACTICES.md)
- View API docs at http://localhost:8000/docs
- Use browser DevTools for debugging

## 🔐 Environment Variables

### Backend (optional)

Create `backend/.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_URL=postgresql://...
```

Then update `main.py` to use:

```python
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
```

### Frontend

Required: `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📖 Additional Resources

- **ContextMemory Docs**: [PyPI Package](https://pypi.org/project/contextmemory/)
- **Architecture**: [ARCHITECTURE_FLOW_DIAGRAM_FINAL.md](./ARCHITECTURE_FLOW_DIAGRAM_FINAL.md)
- **Frontend Guide**: [FRONTEND_BEST_PRACTICES.md](./FRONTEND_BEST_PRACTICES.md)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **D3.js Docs**: [d3js.org](https://d3js.org)
- **FastAPI Docs**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)

## ✅ Checklist

Before starting development:

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can send chat messages
- [ ] Bubbles appear in visualization
- [ ] No console errors
- [ ] Database connected

## 💡 Next Steps

After setup:

1. **Read Architecture**: [ARCHITECTURE_FLOW_DIAGRAM_FINAL.md](./ARCHITECTURE_FLOW_DIAGRAM_FINAL.md)
2. **Review Best Practices**: [FRONTEND_BEST_PRACTICES.md](./FRONTEND_BEST_PRACTICES.md)
3. **Explore Code**: Start with `app/page.tsx` and `components/`
4. **Customize**: Change colors in `globals.css`
5. **Extend**: Add new features (filters, search, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following best practices
4. Test thoroughly
5. Submit pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/samiksha0shukla/context-memory/issues)
- **Docs**: Project README files
- **Examples**: chatbot.py for terminal demo

---

**Happy coding!** 🎉
