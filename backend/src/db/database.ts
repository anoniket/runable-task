import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use a JSON file for simple storage (works everywhere without native deps)
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'components.json');

// Ensure the directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export interface ComponentRow {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

interface Database {
  components: ComponentRow[];
}

function loadDb(): Database {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
  return { components: [] };
}

function saveDb(db: Database): void {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function createComponent(id: string, code: string, name: string = 'Untitled Component'): ComponentRow {
  const db = loadDb();
  const now = new Date().toISOString();

  const component: ComponentRow = {
    id,
    name,
    code,
    created_at: now,
    updated_at: now,
  };

  db.components.push(component);
  saveDb(db);

  return component;
}

export function getComponent(id: string): ComponentRow | undefined {
  const db = loadDb();
  return db.components.find(c => c.id === id);
}

export function updateComponent(id: string, code: string, name?: string): ComponentRow | undefined {
  const db = loadDb();
  const index = db.components.findIndex(c => c.id === id);

  if (index === -1) {
    return undefined;
  }

  const component = db.components[index];
  component.code = code;
  component.updated_at = new Date().toISOString();

  if (name !== undefined) {
    component.name = name;
  }

  saveDb(db);
  return component;
}

export function deleteComponent(id: string): boolean {
  const db = loadDb();
  const index = db.components.findIndex(c => c.id === id);

  if (index === -1) {
    return false;
  }

  db.components.splice(index, 1);
  saveDb(db);
  return true;
}

export function listComponents(limit: number = 50): ComponentRow[] {
  const db = loadDb();
  return db.components
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);
}
