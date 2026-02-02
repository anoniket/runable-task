import React from 'react';
import type { EditorNode } from '../types/editor';

interface RenderOptions {
  onSelect: (id: string) => void;
  onTextEdit?: (id: string, newText: string) => void;
  selectedId: string | null;
  editingId: string | null;
  onStartEditing?: (id: string) => void;
  onStopEditing?: () => void;
}

export function renderNode(node: EditorNode, options: RenderOptions): React.ReactNode {
  if (node.type === 'text') {
    // If this text node is being edited, render an input
    if (options.editingId === node.id && options.onTextEdit) {
      return React.createElement(EditableText, {
        key: node.id,
        initialText: node.textContent || '',
        onSave: (newText: string) => {
          options.onTextEdit!(node.id, newText);
          options.onStopEditing?.();
        },
        onCancel: () => options.onStopEditing?.(),
      });
    }
    return node.textContent || '';
  }

  if (node.tagName === 'Fragment') {
    return React.createElement(
      React.Fragment,
      { key: node.id },
      node.children.map(child => renderNode(child, options))
    );
  }

  // Get the tag name - convert custom components to divs for preview
  const tagName = getValidTagName(node.tagName || 'div');

  // Check if this element has a direct text child
  const textChild = node.children.find(c => c.type === 'text');
  const hasDirectText = !!textChild;

  // Build props
  const props: Record<string, unknown> = {
    ...node.props,
    key: node.id,
    'data-editor-id': node.id,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      options.onSelect(node.id);
    },
    onDoubleClick: hasDirectText ? (e: React.MouseEvent) => {
      e.stopPropagation();
      if (textChild && options.onStartEditing) {
        options.onStartEditing(textChild.id);
      }
    } : undefined,
    style: {
      ...(node.props.style as Record<string, unknown> || {}),
      cursor: 'pointer',
      outline: options.selectedId === node.id ? '2px solid #3b82f6' : undefined,
      outlineOffset: options.selectedId === node.id ? '2px' : undefined,
    },
  };

  // Convert className with Tailwind to actual styles for better preview
  const className = node.props.className;
  if (typeof className === 'string') {
    props.className = className;
  }

  // Render children
  const children = node.children.length > 0
    ? node.children.map(child => renderNode(child, options))
    : undefined;

  return React.createElement(tagName, props, children);
}

// Editable text component for inline editing
interface EditableTextProps {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

function EditableText({ initialText, onSave, onCancel }: EditableTextProps) {
  const [text, setText] = React.useState(initialText);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(text);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return React.createElement('input', {
    ref: inputRef,
    type: 'text',
    value: text,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value),
    onBlur: () => onSave(text),
    onKeyDown: handleKeyDown,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    style: {
      font: 'inherit',
      color: 'inherit',
      background: 'rgba(59, 130, 246, 0.1)',
      border: '2px solid #3b82f6',
      borderRadius: '4px',
      padding: '2px 4px',
      margin: '-4px',
      outline: 'none',
      width: '100%',
      minWidth: '50px',
    },
  });
}

function getValidTagName(tagName: string): string {
  // List of valid HTML tags we support
  const validTags = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'button', 'input', 'textarea', 'select', 'option',
    'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
    'form', 'label', 'img', 'video', 'audio', 'canvas',
    'header', 'footer', 'nav', 'main', 'section', 'article', 'aside',
    'strong', 'em', 'b', 'i', 'u', 'code', 'pre', 'blockquote',
    'br', 'hr', 'svg', 'path', 'circle', 'rect', 'line', 'polygon',
  ];

  const lowerTag = tagName.toLowerCase();
  if (validTags.includes(lowerTag)) {
    return lowerTag;
  }

  // For custom components, render as div
  return 'div';
}

export function extractStyleFromNode(node: EditorNode): Record<string, string> {
  const style = (node.props.style as Record<string, string>) || {};
  return { ...style };
}

export function getComputedStylesFromClassName(className: string): Record<string, string> {
  // This is a simplified Tailwind-to-style converter for common classes
  const styles: Record<string, string> = {};
  const classes = className.split(/\s+/);

  for (const cls of classes) {
    // Font size
    if (cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)$/)) {
      const sizes: Record<string, string> = {
        'xs': '12px', 'sm': '14px', 'base': '16px', 'lg': '18px',
        'xl': '20px', '2xl': '24px', '3xl': '30px', '4xl': '36px',
        '5xl': '48px', '6xl': '60px',
      };
      const size = cls.replace('text-', '');
      styles.fontSize = sizes[size] || '16px';
    }

    // Font weight
    if (cls === 'font-bold') styles.fontWeight = 'bold';
    if (cls === 'font-semibold') styles.fontWeight = '600';
    if (cls === 'font-medium') styles.fontWeight = '500';
    if (cls === 'font-normal') styles.fontWeight = 'normal';
    if (cls === 'font-light') styles.fontWeight = '300';

    // Text colors
    const textColorMatch = cls.match(/^text-(\w+)(-\d+)?$/);
    if (textColorMatch && !['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'].includes(textColorMatch[1])) {
      const colorMap: Record<string, string> = {
        'white': '#ffffff', 'black': '#000000',
        'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db',
        'gray-400': '#9ca3af', 'gray-500': '#6b7280', 'gray-600': '#4b5563',
        'gray-700': '#374151', 'gray-800': '#1f2937', 'gray-900': '#111827',
        'red-500': '#ef4444', 'blue-500': '#3b82f6', 'green-500': '#22c55e',
        'yellow-500': '#eab308', 'purple-500': '#a855f7', 'pink-500': '#ec4899',
      };
      const colorKey = textColorMatch[2] ? `${textColorMatch[1]}${textColorMatch[2]}` : textColorMatch[1];
      if (colorMap[colorKey]) {
        styles.color = colorMap[colorKey];
      }
    }

    // Background colors
    const bgColorMatch = cls.match(/^bg-(\w+)(-\d+)?$/);
    if (bgColorMatch) {
      const colorMap: Record<string, string> = {
        'white': '#ffffff', 'black': '#000000',
        'gray-100': '#f3f4f6', 'gray-200': '#e5e7eb', 'gray-300': '#d1d5db',
        'gray-400': '#9ca3af', 'gray-500': '#6b7280', 'gray-600': '#4b5563',
        'gray-700': '#374151', 'gray-800': '#1f2937', 'gray-900': '#111827',
        'red-500': '#ef4444', 'blue-500': '#3b82f6', 'green-500': '#22c55e',
        'yellow-500': '#eab308', 'purple-500': '#a855f7', 'pink-500': '#ec4899',
      };
      const colorKey = bgColorMatch[2] ? `${bgColorMatch[1]}${bgColorMatch[2]}` : bgColorMatch[1];
      if (colorMap[colorKey]) {
        styles.backgroundColor = colorMap[colorKey];
      }
    }

    // Padding
    const paddingMatch = cls.match(/^p-(\d+)$/);
    if (paddingMatch) {
      styles.padding = `${parseInt(paddingMatch[1]) * 4}px`;
    }
    const pxMatch = cls.match(/^px-(\d+)$/);
    if (pxMatch) {
      styles.paddingLeft = `${parseInt(pxMatch[1]) * 4}px`;
      styles.paddingRight = `${parseInt(pxMatch[1]) * 4}px`;
    }
    const pyMatch = cls.match(/^py-(\d+)$/);
    if (pyMatch) {
      styles.paddingTop = `${parseInt(pyMatch[1]) * 4}px`;
      styles.paddingBottom = `${parseInt(pyMatch[1]) * 4}px`;
    }

    // Margin
    const marginMatch = cls.match(/^m-(\d+)$/);
    if (marginMatch) {
      styles.margin = `${parseInt(marginMatch[1]) * 4}px`;
    }
    const mxMatch = cls.match(/^mx-(\d+)$/);
    if (mxMatch) {
      styles.marginLeft = `${parseInt(mxMatch[1]) * 4}px`;
      styles.marginRight = `${parseInt(mxMatch[1]) * 4}px`;
    }
    const myMatch = cls.match(/^my-(\d+)$/);
    if (myMatch) {
      styles.marginTop = `${parseInt(myMatch[1]) * 4}px`;
      styles.marginBottom = `${parseInt(myMatch[1]) * 4}px`;
    }

    // Border radius
    if (cls === 'rounded') styles.borderRadius = '4px';
    if (cls === 'rounded-lg') styles.borderRadius = '8px';
    if (cls === 'rounded-full') styles.borderRadius = '9999px';

    // Flex
    if (cls === 'flex') styles.display = 'flex';
    if (cls === 'flex-col') styles.flexDirection = 'column';
    if (cls === 'items-center') styles.alignItems = 'center';
    if (cls === 'justify-center') styles.justifyContent = 'center';
    if (cls === 'gap-2') styles.gap = '8px';
    if (cls === 'gap-4') styles.gap = '16px';
  }

  return styles;
}
