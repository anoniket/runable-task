import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { CodeInput } from './CodeInput';
import { LivePreview } from './LivePreview';
import { PropertyPanel } from './PropertyPanel';
import { parseJSX, findNodeById, updateNodeStyle, updateNodeText } from '../lib/parser';
import { serializeToJSX } from '../lib/serializer';
import { createComponent, updateComponent, getComponent, debounce } from '../lib/api';
import type { EditorNode } from '../types/editor';

const DEFAULT_CODE = `<div className="p-6 bg-blue-500 rounded-lg">
  <h1 className="text-3xl font-bold text-white mb-2">Hello World</h1>
  <p className="text-white text-lg">Click any element to edit its properties</p>
  <button className="mt-4 px-4 py-2 bg-white text-blue-500 rounded font-medium">
    Click Me
  </button>
</div>`;

// Example UI components for quick loading
const EXAMPLES = {
  card: `<div className="max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
  <div className="p-6">
    <h2 className="text-xl font-bold text-gray-800 mb-2">Card Title</h2>
    <p className="text-gray-600 mb-4">This is a simple card component with some description text.</p>
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">Learn More</button>
  </div>
</div>`,
  hero: `<section className="bg-gradient-to-r from-purple-600 to-blue-500 py-20 px-8 text-center">
  <h1 className="text-5xl font-bold text-white mb-4">Welcome to Our Site</h1>
  <p className="text-xl text-white mb-8">Build something amazing today</p>
  <div className="flex justify-center gap-4">
    <button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold">Get Started</button>
    <button className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-bold">Learn More</button>
  </div>
</section>`,
  pricing: `<div className="bg-white rounded-2xl shadow-xl p-8 max-w-xs">
  <h3 className="text-lg font-medium text-gray-500 mb-2">Pro Plan</h3>
  <div className="text-4xl font-bold text-gray-900 mb-4">$29/mo</div>
  <ul className="space-y-3 mb-6">
    <li className="text-gray-600">Unlimited projects</li>
    <li className="text-gray-600">Priority support</li>
    <li className="text-gray-600">Custom domain</li>
  </ul>
  <button className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold">Subscribe</button>
</div>`,
  navbar: `<nav className="bg-gray-900 px-6 py-4">
  <div className="flex items-center justify-between">
    <div className="text-xl font-bold text-white">Logo</div>
    <div className="flex gap-6">
      <a className="text-gray-300 hover:text-white">Home</a>
      <a className="text-gray-300 hover:text-white">About</a>
      <a className="text-gray-300 hover:text-white">Services</a>
      <a className="text-gray-300 hover:text-white">Contact</a>
    </div>
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">Sign Up</button>
  </div>
</nav>`,
};

interface WebsiteEditorProps {
  /** Initial JSX code to edit */
  component?: string;
  /** Callback fired when component is saved (with serialized JSX) */
  onSave?: (serializedComponent: string) => void;
  /** Auto-save delay in ms (default: 2000). Set to 0 to disable auto-save */
  autoSaveDelay?: number;
  /** Whether to sync with backend (default: true) */
  enableBackend?: boolean;
}

export function WebsiteEditor({
  component,
  onSave,
  autoSaveDelay = 2000,
  enableBackend = true,
}: WebsiteEditorProps = {}) {
  const [code, setCode] = useState(component || DEFAULT_CODE);
  const [ast, setAst] = useState<EditorNode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [componentId, setComponentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Track if code change came from visual editor (to avoid re-parsing)
  const isVisualEditRef = useRef(false);

  // Parse code into AST
  useEffect(() => {
    // Skip parsing if change came from visual editor
    if (isVisualEditRef.current) {
      isVisualEditRef.current = false;
      return;
    }

    try {
      const parsed = parseJSX(code);
      if (parsed) {
        setAst(parsed);
        setParseError(null);
        // Clear selection when code is manually edited
        setSelectedId(null);
      } else if (code.trim()) {
        setParseError('Invalid JSX. Paste static JSX only (no functions, hooks, or imports).');
      } else {
        setAst(null);
        setParseError(null);
      }
    } catch (err) {
      setParseError(`Parse error: ${err instanceof Error ? err.message : 'Invalid JSX'}`);
    }
  }, [code]);

  // Initial parse on mount
  useEffect(() => {
    const initialCode = component || DEFAULT_CODE;
    const parsed = parseJSX(initialCode);
    if (parsed) {
      setAst(parsed);
    }
  }, [component]);

  // Load component from URL if present and backend is enabled
  useEffect(() => {
    if (!enableBackend) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      getComponent(id)
        .then((data) => {
          setCode(data.code);
          setComponentId(data.id);
        })
        .catch((err) => {
          console.error('Failed to load component:', err);
        });
    }
  }, [enableBackend]);

  // Get selected node from AST
  const selectedNode = useMemo(() => {
    if (!ast || !selectedId) return null;
    return findNodeById(ast, selectedId);
  }, [ast, selectedId]);

  // Auto-save debounced function
  const debouncedSave = useMemo(() => {
    if (autoSaveDelay <= 0) return null;

    return debounce(async (id: string | null, codeToSave: string) => {
      try {
        setSaving(true);

        // Call parent onSave callback
        if (onSave) {
          onSave(codeToSave);
        }

        // Save to backend if enabled and we have an ID
        if (enableBackend && id) {
          await updateComponent(id, codeToSave);
        }

        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setSaving(false);
      }
    }, autoSaveDelay);
  }, [autoSaveDelay, onSave, enableBackend]);

  // Trigger auto-save when code changes
  useEffect(() => {
    if (!parseError && debouncedSave) {
      debouncedSave(componentId, code);
    }
  }, [componentId, code, parseError, debouncedSave]);

  const handleCodeChange = useCallback((newCode: string) => {
    isVisualEditRef.current = false;
    setCode(newCode);
  }, []);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleStartEditing = useCallback((id: string) => {
    setEditingId(id);
  }, []);

  const handleStopEditing = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleInlineTextEdit = useCallback((id: string, newText: string) => {
    if (!ast) return;

    const updatedAst = updateNodeText(ast, id, newText);
    setAst(updatedAst);
    isVisualEditRef.current = true;
    const newCode = serializeToJSX(updatedAst);
    setCode(newCode);
  }, [ast]);

  const handleUpdateStyle = useCallback((styleUpdates: Record<string, string>) => {
    if (!ast || !selectedId) return;

    const updatedAst = updateNodeStyle(ast, selectedId, styleUpdates);
    setAst(updatedAst);

    // Mark as visual edit to prevent re-parsing
    isVisualEditRef.current = true;

    // Regenerate code from AST
    const newCode = serializeToJSX(updatedAst);
    setCode(newCode);
  }, [ast, selectedId]);

  const handleUpdateText = useCallback((text: string) => {
    if (!ast || !selectedId) return;

    const node = findNodeById(ast, selectedId);
    if (!node) return;

    let updatedAst: EditorNode;

    if (node.type === 'text') {
      updatedAst = updateNodeText(ast, selectedId, text);
    } else {
      const textChild = node.children.find(c => c.type === 'text');
      if (textChild) {
        updatedAst = updateNodeText(ast, textChild.id, text);
      } else {
        updatedAst = {
          ...ast,
          children: ast.id === selectedId
            ? [{ id: `text-${Date.now()}`, type: 'text', props: {}, children: [], textContent: text }]
            : ast.children,
        };
      }
    }

    setAst(updatedAst);
    isVisualEditRef.current = true;
    const newCode = serializeToJSX(updatedAst);
    setCode(newCode);
  }, [ast, selectedId]);

  const handleSave = async () => {
    if (parseError) return;

    try {
      setSaving(true);

      if (onSave) {
        onSave(code);
      }

      if (enableBackend) {
        if (componentId) {
          await updateComponent(componentId, code);
        } else {
          const data = await createComponent(code);
          setComponentId(data.id);
          window.history.pushState({}, '', `?id=${data.id}`);
        }
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save component');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (componentId) {
      const url = `${window.location.origin}?id=${componentId}`;
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } else {
      alert('Save the component first to get a shareable link');
    }
  };

  const loadExample = (key: keyof typeof EXAMPLES) => {
    setCode(EXAMPLES[key]);
    setSelectedId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-800">React Component Editor</h1>
          {componentId && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              ID: {componentId.slice(0, 8)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Example Templates */}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
            <span className="text-xs text-gray-500 mr-1">Templates:</span>
            <button
              onClick={() => loadExample('card')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-white rounded"
            >
              Card
            </button>
            <button
              onClick={() => loadExample('hero')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-white rounded"
            >
              Hero
            </button>
            <button
              onClick={() => loadExample('pricing')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-white rounded"
            >
              Pricing
            </button>
            <button
              onClick={() => loadExample('navbar')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-white rounded"
            >
              Navbar
            </button>
          </div>

          {lastSaved && (
            <span className="text-xs text-gray-500">
              {saving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !!parseError}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {enableBackend && (
            <button
              onClick={handleShare}
              disabled={!componentId}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Share
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code Input Panel */}
        <div className="w-1/4 min-w-[300px] border-r border-gray-200 bg-gray-900">
          <CodeInput code={code} onChange={handleCodeChange} error={parseError} />
        </div>

        {/* Live Preview Panel */}
        <div className="flex-1 min-w-[400px]">
          <LivePreview
            ast={ast}
            selectedId={selectedId}
            onSelect={handleSelect}
            editingId={editingId}
            onTextEdit={handleInlineTextEdit}
            onStartEditing={handleStartEditing}
            onStopEditing={handleStopEditing}
          />
        </div>

        {/* Property Panel */}
        <div className="w-1/4 min-w-[280px] border-l border-gray-200 bg-white">
          <PropertyPanel
            selectedNode={selectedNode}
            onUpdateStyle={handleUpdateStyle}
            onUpdateText={handleUpdateText}
          />
        </div>
      </div>
    </div>
  );
}
