const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');
const apiLogic = require('./apiLogic');

const app = express();
const apiRouter = express.Router();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================================
// API Routes on Router
// ==========================================================
// All API routes are now defined on the apiRouter object.
// Their paths are relative to the '/api' mount point.

apiRouter.get('/initial-data', (req, res) => {
    try {
        const data = db;
        return res.json(data);
    } catch (error) {
        console.error("Error during initial data serialization:", error);
        return res.status(500).json({ message: 'Failed to serialize initial data', error: error.message });
    }
});

apiRouter.post('/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const user = apiLogic.authenticateUser(email, password);
        return res.json(user);
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
});

apiRouter.post('/master-data/:type', (req, res) => {
    try {
        const newItem = apiLogic.createMasterDataItem(req.params.type, req.body.name);
        return res.status(201).json(newItem);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

apiRouter.delete('/master-data/:type/:id', (req, res) => {
    try {
        apiLogic.deleteMasterDataItem(req.params.type, req.params.id);
        return res.status(204).end();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

// Generic CRUD routes
const crudEndpoints = ['orders', 'styles', 'employees', 'staff', 'operations'];
crudEndpoints.forEach(endpoint => {
    const handler = apiLogic.createCrud(endpoint);
    apiRouter.post(`/${endpoint}`, (req, res) => { try { const newItem = handler.create(req.body); return res.status(201).json(newItem); } catch (e) { return res.status(400).json({ message: e.message }); }});
    apiRouter.put(`/${endpoint}/:id`, (req, res) => { try { const updatedItem = handler.update(req.body); return res.json(updatedItem); } catch (e) { return res.status(404).json({ message: e.message }); }});
    apiRouter.delete(`/${endpoint}/:id`, (req, res) => { try { handler.delete(req.params.id); return res.status(204).end(); } catch (e) { return res.status(400).json({ message: e.message }); }});
});

apiRouter.put('/machines', (req, res) => { try { const updatedMachines = apiLogic.updateMachines(req.body); return res.json(updatedMachines); } catch (error) { return res.status(400).json({ message: error.message }); } });

// Complex routes
apiRouter.post('/production-entries', (req, res) => { try { const result = apiLogic.createProductionEntries(req.body); return res.status(201).json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.put('/production-entries/:id', (req, res) => { try { const result = apiLogic.updateProductionEntry(req.body); return res.json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.delete('/production-entries/:id', (req, res) => {
    try {
        const result = apiLogic.deleteProductionEntry(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
apiRouter.post('/kanban-entries', (req, res) => { try { const result = apiLogic.saveKanbanEntry(req.body); return res.status(201).json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.post('/line-allocations', (req, res) => { try { const result = apiLogic.saveLineAllocation(req.body); return res.status(201).json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.post('/permissions', (req, res) => { try { const result = apiLogic.savePermissions(req.body); return res.json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.post('/kanban-settings', (req, res) => { try { const result = apiLogic.saveKanbanSettings(req.body); return res.json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.post('/allowance-settings', (req, res) => { try { const result = apiLogic.saveAllowanceSettings(req.body); return res.json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.post('/grade-settings', (req, res) => { try { const result = apiLogic.saveGradePerformanceSettings(req.body); return res.json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.post('/output-settings', (req, res) => { try { const result = apiLogic.saveOutputSettings(req.body); return res.json(result); } catch(error) { return res.status(400).json({ message: error.message }); } });
apiRouter.post('/time-studies', (req, res) => { try { const newStudy = apiLogic.createTimeStudy(req.body); return res.status(201).json(newStudy); } catch(error) { return res.status(400).json({ message: error.message }); } });
apiRouter.put('/time-studies/:id', (req, res) => { try { const updatedStudy = apiLogic.updateTimeStudy(req.body); return res.json(updatedStudy); } catch(error) { return res.status(400).json({ message: error.message }); } });
apiRouter.post('/in-line-audits', (req, res) => { try { const result = apiLogic.createInLineAudit(req.body); return res.status(201).json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.post('/end-line-checks', (req, res) => { try { const result = apiLogic.createEndLineCheck(req.body); return res.status(201).json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.put('/end-line-checks/:id', (req, res) => { try { const result = apiLogic.updateEndLineCheck(req.body); return res.json(result); } catch(error) { return res.status(400).json({ message: error.message }); } });
apiRouter.post('/aql-inspections', (req, res) => { try { const result = apiLogic.createAqlInspection(req.body); return res.status(201).json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });
apiRouter.post('/nc-reports', (req, res) => { try { const result = apiLogic.saveNcReport(req.body); return res.status(201).json(result); } catch (e) { return res.status(400).json({ message: e.message }); } });

// API 404 handler - This should be the last middleware on the router
apiRouter.use((req, res) => {
    return res.status(404).json({ message: 'API endpoint not found.' });
});

// Mount the API router before static assets
app.use('/api', apiRouter);

// ==========================================================
// Static File Server & SPA Fallback
// ==========================================================
const publicPath = path.resolve(__dirname, '..');
app.use(express.static(publicPath));

// This is the SPA fallback. It sends the index.html for any non-API request
// that hasn't been handled by the static server.
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});