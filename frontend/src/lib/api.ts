import type { ComponentData } from '../types/editor';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function createComponent(code: string, name?: string): Promise<ComponentData> {
  const response = await fetch(`${API_BASE}/component`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, name: name || 'Untitled Component' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create component: ${response.statusText}`);
  }

  return response.json();
}

export async function getComponent(id: string): Promise<ComponentData> {
  const response = await fetch(`${API_BASE}/component/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to get component: ${response.statusText}`);
  }

  return response.json();
}

export async function updateComponent(id: string, code: string, name?: string): Promise<ComponentData> {
  const response = await fetch(`${API_BASE}/component/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, name }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update component: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteComponent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/component/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete component: ${response.statusText}`);
  }
}

export async function listComponents(): Promise<ComponentData[]> {
  const response = await fetch(`${API_BASE}/components`);

  if (!response.ok) {
    throw new Error(`Failed to list components: ${response.statusText}`);
  }

  return response.json();
}

// Debounce utility for auto-save
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
