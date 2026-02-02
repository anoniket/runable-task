export interface EditorNode {
  id: string;
  type: 'element' | 'text';
  tagName?: string;
  props: Record<string, unknown>;
  children: EditorNode[];
  textContent?: string;
  originalSource?: string;
}

export interface EditorStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
}

export interface ComponentData {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface SelectionState {
  selectedId: string | null;
  selectedNode: EditorNode | null;
}
