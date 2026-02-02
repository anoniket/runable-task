import React from 'react';
import type { EditorNode } from '../types/editor';
import { renderNode } from '../lib/renderer';

interface LivePreviewProps {
  ast: EditorNode | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  editingId: string | null;
  onTextEdit: (id: string, newText: string) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
}

export function LivePreview({ ast, selectedId, onSelect, editingId, onTextEdit, onStartEditing, onStopEditing }: LivePreviewProps) {
  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the background
    if (e.target === e.currentTarget) {
      onSelect(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">Live Preview</span>
        <span className="text-xs text-gray-500">Click to select, double-click to edit text</span>
      </div>
      <div
        className="flex-1 p-4 overflow-auto bg-white"
        onClick={handleBackgroundClick}
      >
        {ast ? (
          <div className="min-h-full">
            {renderNode(ast, {
              onSelect: (id) => onSelect(id),
              selectedId,
              editingId,
              onTextEdit,
              onStartEditing,
              onStopEditing,
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <p className="text-lg">No component to preview</p>
              <p className="mt-1 text-sm">Paste JSX code in the editor</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
