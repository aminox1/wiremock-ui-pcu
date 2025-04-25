// backend/routes.js
const express = require('express');
const router = express.Router();

const serverController = require('./controllers/serverController');
const mappingController = require('./controllers/mappingController');
const folderController = require('./controllers/folderController');

// Routes des serveurs
router.get('/servers', serverController.getServers);
router.post('/servers', serverController.createServer);

// Cette route doit être AVANT les routes avec :serverId
router.post('/servers/check-connection', serverController.checkServerConnection);

// Autres routes de serveurs
router.put('/servers/:serverId', serverController.updateServer);
router.delete('/servers/:serverId', serverController.deleteServer);

// Routes des mappings
router.get('/servers/:serverId/mappings', mappingController.getMappings);
router.get('/servers/:serverId/folders/:folderPath/mappings', mappingController.getMappingsByFolder);
router.post('/servers/:serverId/mappings', mappingController.createMapping);
router.put('/servers/:serverId/mappings/:mappingId', mappingController.updateMapping);
router.delete('/servers/:serverId/mappings/:mappingId', mappingController.deleteMapping);
router.post('/servers/:serverId/restore', mappingController.restoreMappings);

// Routes des dossiers
router.get('/servers/:serverId/folders', folderController.getFolderStructure);

module.exports = router;