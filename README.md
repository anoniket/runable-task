# React Component Visual Editor

A web application that allows users to paste React JSX snippets, preview them live, and visually edit element properties (text, colors, sizing, boldness) by clicking on elements.

![React Component Editor](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-blue)

## Features

- **Live JSX Preview** - Paste JSX code and see it rendered instantly
- **Click-to-Select** - Click any element in the preview to select it
- **Inline Text Editing** - Double-click any text to edit it directly in the preview
- **Visual Property Editing** - Edit properties via intuitive controls:
  - Text content
  - Font size (slider)
  - Font weight (bold toggle)
  - Text color (color picker)
  - Background color (solid or gradient)
  - Gradient editor (direction, from/to colors)
  - Padding & margin (sliders)
- **Bidirectional Sync** - Changes in preview update code, and vice versa
- **Auto-save** - Automatically saves to backend with debouncing
- **Shareable Links** - Save and share components via URL
- **Template Library** - Quick-start templates (Card, Hero, Pricing, Navbar)

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Babel Parser** - JSX parsing (parser, traverse, types)

### Backend
- **Node.js** - Runtime
- **Express** - HTTP server
- **JSON File Storage** - Simple persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd react-component-editor

# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev
```

**Frontend**: http://localhost:5173
**Backend**: http://localhost:3001

### Running Separately

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## Usage

1. **Open** http://localhost:5173
2. **Paste JSX** in the left code panel, or click a template button
3. **Click elements** in the preview to select them
4. **Double-click text** to edit it directly in the preview
5. **Edit properties** in the right panel (colors, fonts, spacing, gradients)
6. **Save** to persist to backend
7. **Share** to copy shareable link

### Example JSX

```jsx
<div className="p-6 bg-blue-500 rounded-lg">
  <h1 className="text-3xl font-bold text-white">Hello World</h1>
  <p className="text-white">Click any element to edit</p>
  <button className="mt-4 px-4 py-2 bg-white text-blue-500 rounded">
    Click Me
  </button>
</div>
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/component` | Create new component |
| `GET` | `/api/component/:id` | Get component by ID |
| `PUT` | `/api/component/:id` | Update component |
| `DELETE` | `/api/component/:id` | Delete component |
| `GET` | `/api/components` | List all components |
| `GET` | `/api/preview/:id` | Get HTML preview |

## Project Structure

```
react-component-editor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WebsiteEditor.tsx   # Main editor orchestrator
│   │   │   ├── CodeInput.tsx       # Code textarea panel
│   │   │   ├── LivePreview.tsx     # Visual preview with selection
│   │   │   └── PropertyPanel.tsx   # Property editing controls
│   │   ├── lib/
│   │   │   ├── parser.ts           # JSX → AST (using Babel)
│   │   │   ├── renderer.ts         # AST → React elements
│   │   │   ├── serializer.ts       # AST → JSX string
│   │   │   └── api.ts              # Backend API client
│   │   └── types/
│   │       └── editor.ts           # TypeScript interfaces
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.ts                # Express server
│   │   ├── routes/
│   │   │   └── components.ts       # CRUD API routes
│   │   └── db/
│   │       └── database.ts         # JSON file storage
│   └── package.json
└── package.json                     # Workspace root
```

## Architecture

### How It Works

1. **Parsing**: User pastes JSX → Babel parses into AST → Convert to `EditorNode` tree
2. **Rendering**: `EditorNode` tree → React elements with `data-editor-id` attributes
3. **Selection**: Click handler captures `data-editor-id` → Updates selection state
4. **Editing**: Property panel updates → Modify `EditorNode` → Re-serialize to JSX
5. **Persistence**: Auto-save with debounce → POST/PUT to backend API

### Key Design Decisions

- **Custom AST** (`EditorNode`): Simplified tree structure for easy manipulation
- **Bidirectional sync**: Code ↔ Preview stays in sync via shared AST
- **No drag-and-drop**: Click-to-select for simpler UX and implementation
- **Static JSX only**: No hooks/state/imports (matches GrapesJS/TipTap scope)

## Deployment

Both frontend and backend are configured for easy deployment.

### Frontend (Vercel)

1. Push repo to GitHub
2. Import project in Vercel: https://vercel.com/new
3. Set root directory to `frontend`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.railway.app` (your Railway URL)
5. Deploy

Configuration is in `frontend/vercel.json`.

### Backend (Railway)

1. Go to Railway: https://railway.app/new
2. Deploy from GitHub repo
3. Set root directory to `backend`
4. Add environment variables:
   - `PORT` = `3001`
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app` (your Vercel URL)
5. Deploy

Configuration is in `backend/railway.json`.

### After Deployment

1. Copy your Railway backend URL
2. Update Vercel env var `VITE_API_URL` with the Railway URL
3. Copy your Vercel frontend URL
4. Update Railway env var `CORS_ORIGIN` with the Vercel URL
5. Redeploy both if needed

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build both for production |

## License

MIT
