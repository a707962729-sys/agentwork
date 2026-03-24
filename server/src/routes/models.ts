/**
 * Model Configuration API Routes
 */

import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../../dist/db/index.js';

const router = Router();

// Helper to get DB (initialized in index.ts)
function getDb(req: Request): DatabaseManager {
  return req.app.locals.db;
}

// ============================================================
// Model Configuration CRUD
// ============================================================

// GET /api/v1/models — list all models
router.get('/', (req: Request, res: Response) => {
  const db = getDb(req);
  try {
    const models = db.listModels();
    res.json({ models, total: models.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/models — create model
router.post('/', (req: Request, res: Response) => {
  const db = getDb(req);
  try {
    const { name, modelId, type, baseUrl, apiKey, isDefault, supports } = req.body;
    if (!name || !modelId) {
      return res.status(400).json({ error: 'name and modelId are required' });
    }
    const model = db.createModel({ name, modelId, type, baseUrl, apiKey, isDefault, supports });
    res.status(201).json(model);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/models/:id — update model
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb(req);
  try {
    const model = db.updateModel(req.params.id, req.body);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.json(model);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/models/:id — delete model
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb(req);
  try {
    const success = db.deleteModel(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Model Routing Rules CRUD
// ============================================================

// GET /api/v1/models/routing — list routing rules
router.get('/routing', (req: Request, res: Response) => {
  const db = getDb(req);
  try {
    const rules = db.listModelRoutingRules();
    res.json({ rules, total: rules.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/models/routing — create routing rule
router.post('/routing', (req: Request, res: Response) => {
  const db = getDb(req);
  try {
    const { name, agentType, taskType, keywords, modelId, enabled } = req.body;
    if (!name || !modelId) {
      return res.status(400).json({ error: 'name and modelId are required' });
    }
    const rule = db.createModelRoutingRule({ name, agentType, taskType, keywords, modelId, enabled });
    res.status(201).json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/models/routing/:id — update routing rule
router.put('/routing/:id', (req: Request, res: Response) => {
  const db = getDb(req);
  try {
    const rule = db.updateModelRoutingRule(req.params.id, req.body);
    if (!rule) {
      return res.status(404).json({ error: 'Routing rule not found' });
    }
    res.json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/models/routing/:id — delete routing rule
router.delete('/routing/:id', (req: Request, res: Response) => {
  const db = getDb(req);
  try {
    const success = db.deleteModelRoutingRule(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Routing rule not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
