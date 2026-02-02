import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createComponent,
  getComponent,
  updateComponent,
  deleteComponent,
  listComponents,
} from '../db/database.js';

export const componentsRouter = Router();

// Create a new component
componentsRouter.post('/component', (req: Request, res: Response) => {
  try {
    const { code, name } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Code is required and must be a string' });
      return;
    }

    const id = uuidv4();
    const component = createComponent(id, code, name);

    res.status(201).json({
      id: component.id,
      name: component.name,
      code: component.code,
      createdAt: component.created_at,
      updatedAt: component.updated_at,
    });
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
});

// Get a component by ID
componentsRouter.get('/component/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const component = getComponent(id);

    if (!component) {
      res.status(404).json({ error: 'Component not found' });
      return;
    }

    res.json({
      id: component.id,
      name: component.name,
      code: component.code,
      createdAt: component.created_at,
      updatedAt: component.updated_at,
    });
  } catch (error) {
    console.error('Error getting component:', error);
    res.status(500).json({ error: 'Failed to get component' });
  }
});

// Update a component
componentsRouter.put('/component/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Code is required and must be a string' });
      return;
    }

    const existing = getComponent(id);
    if (!existing) {
      res.status(404).json({ error: 'Component not found' });
      return;
    }

    const component = updateComponent(id, code, name);

    if (!component) {
      res.status(500).json({ error: 'Failed to update component' });
      return;
    }

    res.json({
      id: component.id,
      name: component.name,
      code: component.code,
      createdAt: component.created_at,
      updatedAt: component.updated_at,
    });
  } catch (error) {
    console.error('Error updating component:', error);
    res.status(500).json({ error: 'Failed to update component' });
  }
});

// Delete a component
componentsRouter.delete('/component/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = deleteComponent(id);

    if (!deleted) {
      res.status(404).json({ error: 'Component not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting component:', error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
});

// List all components
componentsRouter.get('/components', (_req: Request, res: Response) => {
  try {
    const components = listComponents();

    res.json(
      components.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))
    );
  } catch (error) {
    console.error('Error listing components:', error);
    res.status(500).json({ error: 'Failed to list components' });
  }
});

// Preview endpoint - returns HTML page with component
componentsRouter.get('/preview/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const component = getComponent(id);

    if (!component) {
      res.status(404).json({ error: 'Component not found' });
      return;
    }

    // Return a simple HTML page that renders the component
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${component.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root">${component.code}</div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error previewing component:', error);
    res.status(500).json({ error: 'Failed to preview component' });
  }
});
