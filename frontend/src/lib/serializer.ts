import type { EditorNode } from '../types/editor';

export function serializeToJSX(node: EditorNode, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);

  if (node.type === 'text') {
    return node.textContent || '';
  }

  if (node.tagName === 'Fragment') {
    const children = node.children
      .map(child => serializeToJSX(child, indent))
      .join('\n');
    return `<>\n${children}\n${indentStr}</>`;
  }

  const tagName = node.tagName || 'div';
  const propsStr = serializeProps(node.props);
  const hasChildren = node.children.length > 0;

  if (!hasChildren) {
    return `${indentStr}<${tagName}${propsStr} />`;
  }

  // Check if all children are text
  const allTextChildren = node.children.every(c => c.type === 'text');

  if (allTextChildren && node.children.length === 1) {
    const textContent = node.children[0].textContent || '';
    return `${indentStr}<${tagName}${propsStr}>${textContent}</${tagName}>`;
  }

  const children = node.children
    .map(child => {
      if (child.type === 'text') {
        return `${indentStr}  ${child.textContent || ''}`;
      }
      return serializeToJSX(child, indent + 1);
    })
    .join('\n');

  return `${indentStr}<${tagName}${propsStr}>\n${children}\n${indentStr}</${tagName}>`;
}

function serializeProps(props: Record<string, unknown>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;

    if (key === 'style' && typeof value === 'object') {
      const styleStr = serializeStyle(value as Record<string, string>);
      if (styleStr) {
        parts.push(`style={${styleStr}}`);
      }
    } else if (typeof value === 'string') {
      // Use double quotes for string values
      parts.push(`${key}="${escapeString(value)}"`);
    } else if (typeof value === 'boolean') {
      if (value) {
        parts.push(key);
      }
    } else if (typeof value === 'number') {
      parts.push(`${key}={${value}}`);
    } else if (typeof value === 'object') {
      parts.push(`${key}={${JSON.stringify(value)}}`);
    }
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : '';
}

function serializeStyle(style: Record<string, string>): string {
  if (Object.keys(style).length === 0) return '';

  const parts: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined && value !== null && value !== '') {
      // Convert camelCase to the format needed for JSX style objects
      parts.push(`${key}: "${value}"`);
    }
  }

  return `{ ${parts.join(', ')} }`;
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

export function formatJSX(code: string): string {
  // Basic formatting - could be enhanced with prettier
  return code.trim();
}
