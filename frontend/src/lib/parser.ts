import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';

// Handle both ESM and CJS default export
const traverse = (traverseModule as unknown as { default: typeof traverseModule }).default || traverseModule;
import { v4 as uuidv4 } from 'uuid';
import type { EditorNode } from '../types/editor';

export function parseJSX(code: string): EditorNode | null {
  try {
    // Wrap in a fragment if needed
    let wrappedCode = code.trim();
    if (!wrappedCode.startsWith('<')) {
      return null;
    }

    // Parse the JSX
    const ast = parser.parse(wrappedCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let rootNode: EditorNode | null = null;

    traverse(ast, {
      JSXElement(path) {
        // Only process the root element
        if (path.parentPath.isProgram() || path.parentPath.isExpressionStatement()) {
          rootNode = convertJSXElement(path.node);
          path.stop();
        }
      },
      JSXFragment(path) {
        if (path.parentPath.isProgram() || path.parentPath.isExpressionStatement()) {
          rootNode = convertJSXFragment(path.node);
          path.stop();
        }
      },
    });

    return rootNode;
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}

function convertJSXElement(node: t.JSXElement): EditorNode {
  const tagName = getTagName(node.openingElement.name);
  const props = extractProps(node.openingElement.attributes);
  const children = convertChildren(node.children);

  return {
    id: uuidv4(),
    type: 'element',
    tagName,
    props,
    children,
  };
}

function convertJSXFragment(node: t.JSXFragment): EditorNode {
  const children = convertChildren(node.children);

  return {
    id: uuidv4(),
    type: 'element',
    tagName: 'Fragment',
    props: {},
    children,
  };
}

function getTagName(name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName): string {
  if (t.isJSXIdentifier(name)) {
    return name.name;
  }
  if (t.isJSXMemberExpression(name)) {
    const object = getTagName(name.object);
    const property = name.property.name;
    return `${object}.${property}`;
  }
  if (t.isJSXNamespacedName(name)) {
    return `${name.namespace.name}:${name.name.name}`;
  }
  return 'unknown';
}

function extractProps(attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[]): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (const attr of attributes) {
    if (t.isJSXAttribute(attr)) {
      const name = t.isJSXIdentifier(attr.name) ? attr.name.name : String(attr.name);

      if (attr.value === null) {
        props[name] = true;
      } else if (t.isStringLiteral(attr.value)) {
        props[name] = attr.value.value;
      } else if (t.isJSXExpressionContainer(attr.value)) {
        const expr = attr.value.expression;
        if (t.isStringLiteral(expr)) {
          props[name] = expr.value;
        } else if (t.isNumericLiteral(expr)) {
          props[name] = expr.value;
        } else if (t.isBooleanLiteral(expr)) {
          props[name] = expr.value;
        } else if (t.isObjectExpression(expr)) {
          props[name] = extractObjectExpression(expr);
        } else if (t.isTemplateLiteral(expr)) {
          // Handle template literals - just use the quasis
          props[name] = expr.quasis.map(q => q.value.raw).join('');
        }
      }
    }
  }

  return props;
}

function extractObjectExpression(expr: t.ObjectExpression): Record<string, unknown> {
  const obj: Record<string, unknown> = {};

  for (const prop of expr.properties) {
    if (t.isObjectProperty(prop) && (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) {
      const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;

      if (t.isStringLiteral(prop.value)) {
        obj[key] = prop.value.value;
      } else if (t.isNumericLiteral(prop.value)) {
        obj[key] = prop.value.value;
      } else if (t.isBooleanLiteral(prop.value)) {
        obj[key] = prop.value.value;
      }
    }
  }

  return obj;
}

function convertChildren(children: (t.JSXElement | t.JSXText | t.JSXExpressionContainer | t.JSXSpreadChild | t.JSXFragment)[]): EditorNode[] {
  const result: EditorNode[] = [];

  for (const child of children) {
    if (t.isJSXElement(child)) {
      result.push(convertJSXElement(child));
    } else if (t.isJSXFragment(child)) {
      result.push(convertJSXFragment(child));
    } else if (t.isJSXText(child)) {
      const text = child.value.trim();
      if (text) {
        result.push({
          id: uuidv4(),
          type: 'text',
          props: {},
          children: [],
          textContent: text,
        });
      }
    } else if (t.isJSXExpressionContainer(child)) {
      const expr = child.expression;
      if (t.isStringLiteral(expr)) {
        result.push({
          id: uuidv4(),
          type: 'text',
          props: {},
          children: [],
          textContent: expr.value,
        });
      } else if (t.isTemplateLiteral(expr)) {
        const text = expr.quasis.map(q => q.value.raw).join('');
        if (text.trim()) {
          result.push({
            id: uuidv4(),
            type: 'text',
            props: {},
            children: [],
            textContent: text,
          });
        }
      }
    }
  }

  return result;
}

export function findNodeById(root: EditorNode, id: string): EditorNode | null {
  if (root.id === id) {
    return root;
  }

  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) {
      return found;
    }
  }

  return null;
}

export function updateNodeById(root: EditorNode, id: string, updates: Partial<EditorNode>): EditorNode {
  if (root.id === id) {
    return { ...root, ...updates };
  }

  return {
    ...root,
    children: root.children.map(child => updateNodeById(child, id, updates)),
  };
}

export function updateNodeStyle(root: EditorNode, id: string, styleUpdates: Record<string, string>): EditorNode {
  if (root.id === id) {
    const currentStyle = (root.props.style as Record<string, string>) || {};
    return {
      ...root,
      props: {
        ...root.props,
        style: { ...currentStyle, ...styleUpdates },
      },
    };
  }

  return {
    ...root,
    children: root.children.map(child => updateNodeStyle(child, id, styleUpdates)),
  };
}

export function updateNodeText(root: EditorNode, id: string, textContent: string): EditorNode {
  if (root.id === id) {
    return { ...root, textContent };
  }

  return {
    ...root,
    children: root.children.map(child => updateNodeText(child, id, textContent)),
  };
}
