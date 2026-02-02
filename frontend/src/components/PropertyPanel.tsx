import { useState, useEffect } from 'react';
import type { EditorNode, EditorStyle } from '../types/editor';
import { extractStyleFromNode, getComputedStylesFromClassName } from '../lib/renderer';

interface PropertyPanelProps {
  selectedNode: EditorNode | null;
  onUpdateStyle: (styleUpdates: Record<string, string>) => void;
  onUpdateText: (text: string) => void;
}

type BackgroundType = 'solid' | 'gradient';

const GRADIENT_DIRECTIONS = [
  { value: 'to right', label: '→ Right' },
  { value: 'to left', label: '← Left' },
  { value: 'to bottom', label: '↓ Down' },
  { value: 'to top', label: '↑ Up' },
  { value: 'to bottom right', label: '↘ Diagonal' },
  { value: 'to top right', label: '↗ Diagonal' },
];

export function PropertyPanel({ selectedNode, onUpdateStyle, onUpdateText }: PropertyPanelProps) {
  const [localStyle, setLocalStyle] = useState<EditorStyle>({});
  const [localText, setLocalText] = useState('');
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('solid');
  const [gradientFrom, setGradientFrom] = useState('#8b5cf6');
  const [gradientTo, setGradientTo] = useState('#3b82f6');
  const [gradientDirection, setGradientDirection] = useState('to right');

  useEffect(() => {
    if (selectedNode) {
      // Merge inline styles with computed styles from className
      const inlineStyles = extractStyleFromNode(selectedNode);
      const classStyles = typeof selectedNode.props.className === 'string'
        ? getComputedStylesFromClassName(selectedNode.props.className)
        : {};

      const mergedStyles = { ...classStyles, ...inlineStyles };
      setLocalStyle(mergedStyles);

      // Detect if current background is gradient
      const bgImage = inlineStyles.backgroundImage || '';
      if (bgImage.includes('linear-gradient')) {
        setBackgroundType('gradient');
        // Try to parse gradient colors
        const match = bgImage.match(/linear-gradient\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
        if (match) {
          setGradientDirection(match[1]);
          setGradientFrom(match[2].trim());
          setGradientTo(match[3].trim());
        }
      } else if (mergedStyles.backgroundColor) {
        setBackgroundType('solid');
      }

      // Get text content from first text child or the node itself
      if (selectedNode.type === 'text') {
        setLocalText(selectedNode.textContent || '');
      } else {
        const textChild = selectedNode.children.find(c => c.type === 'text');
        setLocalText(textChild?.textContent || '');
      }
    } else {
      setLocalStyle({});
      setLocalText('');
    }
  }, [selectedNode]);

  const handleStyleChange = (key: string, value: string) => {
    setLocalStyle(prev => ({ ...prev, [key]: value }));
    onUpdateStyle({ [key]: value });
  };

  const handleTextChange = (text: string) => {
    setLocalText(text);
    onUpdateText(text);
  };

  const handleBackgroundTypeChange = (type: BackgroundType) => {
    setBackgroundType(type);
    if (type === 'solid') {
      // Clear gradient, set solid color
      onUpdateStyle({
        backgroundImage: 'none',
        backgroundColor: localStyle.backgroundColor || '#ffffff'
      });
    } else {
      // Set gradient
      applyGradient(gradientDirection, gradientFrom, gradientTo);
    }
  };

  const applyGradient = (direction: string, from: string, to: string) => {
    const gradient = `linear-gradient(${direction}, ${from}, ${to})`;
    setLocalStyle(prev => ({ ...prev, backgroundImage: gradient }));
    onUpdateStyle({
      backgroundImage: gradient,
      backgroundColor: 'transparent'
    });
  };

  const handleGradientChange = (type: 'direction' | 'from' | 'to', value: string) => {
    let newDirection = gradientDirection;
    let newFrom = gradientFrom;
    let newTo = gradientTo;

    if (type === 'direction') {
      newDirection = value;
      setGradientDirection(value);
    } else if (type === 'from') {
      newFrom = value;
      setGradientFrom(value);
    } else {
      newTo = value;
      setGradientTo(value);
    }

    applyGradient(newDirection, newFrom, newTo);
  };

  if (!selectedNode) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Properties</span>
        </div>
        <div className="flex items-center justify-center flex-1 p-4 text-gray-400">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            <p className="text-sm">Select an element</p>
            <p className="mt-1 text-xs">Click on any element in the preview</p>
          </div>
        </div>
      </div>
    );
  }

  const isTextNode = selectedNode.type === 'text';
  const hasTextChild = selectedNode.children.some(c => c.type === 'text');

  // Check if element has a gradient class from Tailwind
  const className = String(selectedNode.props.className || '');
  const hasTailwindGradient = className.includes('bg-gradient') || className.includes('from-') || className.includes('to-');

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Properties</span>
        <span className="ml-2 text-xs text-gray-500">
          {isTextNode ? 'Text' : `<${selectedNode.tagName}>`}
        </span>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Text Content */}
        {(isTextNode || hasTextChild) && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Text Content
            </label>
            <textarea
              value={localText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        )}

        {/* Typography */}
        {!isTextNode && (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Typography</h3>

              {/* Font Size */}
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="72"
                    value={parseInt(localStyle.fontSize || '16')}
                    onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="10"
                    max="72"
                    value={parseInt(localStyle.fontSize || '16')}
                    onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>

              {/* Font Weight */}
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">Font Weight</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStyleChange('fontWeight', 'normal')}
                    className={`px-3 py-1.5 text-xs rounded border ${
                      localStyle.fontWeight !== 'bold' && localStyle.fontWeight !== '700'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => handleStyleChange('fontWeight', 'bold')}
                    className={`px-3 py-1.5 text-xs rounded border font-bold ${
                      localStyle.fontWeight === 'bold' || localStyle.fontWeight === '700'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Bold
                  </button>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Colors</h3>

              {/* Text Color */}
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={localStyle.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localStyle.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Background Type Toggle */}
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">Background</label>
                {hasTailwindGradient && (
                  <div className="flex items-center gap-1 px-2 py-1 mb-1 text-xs text-amber-700 bg-amber-50 rounded">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Has Tailwind gradient class</span>
                  </div>
                )}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => handleBackgroundTypeChange('solid')}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
                      backgroundType === 'solid'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => handleBackgroundTypeChange('gradient')}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded ${
                      backgroundType === 'gradient'
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {/* Solid Color */}
              {backgroundType === 'solid' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localStyle.backgroundColor || '#ffffff'}
                      onChange={(e) => {
                        setLocalStyle(prev => ({ ...prev, backgroundColor: e.target.value }));
                        onUpdateStyle({ backgroundColor: e.target.value, backgroundImage: 'none' });
                      }}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localStyle.backgroundColor || ''}
                      onChange={(e) => {
                        setLocalStyle(prev => ({ ...prev, backgroundColor: e.target.value }));
                        onUpdateStyle({ backgroundColor: e.target.value, backgroundImage: 'none' });
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              )}

              {/* Gradient Editor */}
              {backgroundType === 'gradient' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  {/* Gradient Preview */}
                  <div
                    className="h-8 rounded-md border border-gray-200"
                    style={{
                      backgroundImage: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`
                    }}
                  />

                  {/* Direction */}
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-600">Direction</label>
                    <select
                      value={gradientDirection}
                      onChange={(e) => handleGradientChange('direction', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
                    >
                      {GRADIENT_DIRECTIONS.map(dir => (
                        <option key={dir.value} value={dir.value}>{dir.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* From Color */}
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-600">From Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={gradientFrom}
                        onChange={(e) => handleGradientChange('from', e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={gradientFrom}
                        onChange={(e) => handleGradientChange('from', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  {/* To Color */}
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-600">To Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={gradientTo}
                        onChange={(e) => handleGradientChange('to', e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={gradientTo}
                        onChange={(e) => handleGradientChange('to', e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Spacing */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Spacing</h3>

              {/* Padding */}
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">Padding</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="64"
                    value={parseInt(localStyle.padding || '0')}
                    onChange={(e) => handleStyleChange('padding', `${e.target.value}px`)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={parseInt(localStyle.padding || '0')}
                    onChange={(e) => handleStyleChange('padding', `${e.target.value}px`)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>

              {/* Margin */}
              <div className="space-y-1">
                <label className="block text-xs text-gray-600">Margin</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="64"
                    value={parseInt(localStyle.margin || '0')}
                    onChange={(e) => handleStyleChange('margin', `${e.target.value}px`)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={parseInt(localStyle.margin || '0')}
                    onChange={(e) => handleStyleChange('margin', `${e.target.value}px`)}
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
            </div>

            {/* Class Name (read-only info) */}
            {selectedNode.props.className && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">CSS Classes</h3>
                <div className="p-2 text-xs font-mono text-gray-600 bg-gray-100 rounded break-all">
                  {String(selectedNode.props.className)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
