// server.js
console.log('Initialisation du serveur backend...');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Configuration des middlewares...');
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Dossier de stockage des données
const DATA_DIR = path.join(__dirname, 'data');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const MAPPINGS_DIR = path.join(DATA_DIR, 'mappings');

console.log('Vérification des dossiers de données...');
// Créer les dossiers si nécessaire
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
  console.log(`Dossier créé: ${DATA_DIR}`);
}

if (!fs.existsSync(MAPPINGS_DIR)) {
  fs.mkdirSync(MAPPINGS_DIR);
  console.log(`Dossier créé: ${MAPPINGS_DIR}`);
}

// Initialiser le fichier des serveurs s'il n'existe pas
if (!fs.existsSync(SERVERS_FILE)) {
  fs.writeFileSync(SERVERS_FILE, JSON.stringify([]));
  console.log(`Fichier créé: ${SERVERS_FILE}`);
}

// Fonctions utilitaires
const readServers = () => {
  const data = fs.readFileSync(SERVERS_FILE);
  return JSON.parse(data);
};

const writeServers = (servers) => {
  fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2));
};

const getServerMappingsFile = (serverId) => {
  return path.join(MAPPINGS_DIR, `${serverId}.json`);
};

const readMappings = (serverId) => {
  const mappingsFile = getServerMappingsFile(serverId);
  if (!fs.existsSync(mappingsFile)) {
    fs.writeFileSync(mappingsFile, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(mappingsFile);
  return JSON.parse(data);
};

const writeMappings = (serverId, mappings) => {
  const mappingsFile = getServerMappingsFile(serverId);
  fs.writeFileSync(mappingsFile, JSON.stringify(mappings, null, 2));
};

console.log('Définition des routes API...');
// API pour gérer les serveurs
app.get('/api/servers', (req, res) => {
  console.log('GET /api/servers - Récupération des serveurs');
  try {
    const servers = readServers();
    console.log(`Nombre de serveurs trouvés: ${servers.length}`);
    res.json(servers);
  } catch (error) {
    console.error('Erreur lors de la récupération des serveurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des serveurs' });
  }
});

app.post('/api/servers', (req, res) => {
  console.log('POST /api/servers - Création d\'un serveur', req.body);
  try {
    const servers = readServers();
    const newServer = {
      id: uuidv4(),
      name: req.body.name,
      url: req.body.url,
      createdAt: new Date().toISOString()
    };
    servers.push(newServer);
    writeServers(servers);
    console.log(`Serveur créé avec ID: ${newServer.id}`);
    res.status(201).json(newServer);
  } catch (error) {
    console.error('Erreur lors de la création du serveur:', error);
    res.status(500).json({ error: 'Erreur lors de la création du serveur' });
  }
});

app.delete('/api/servers/:id', (req, res) => {
  console.log(`DELETE /api/servers/${req.params.id} - Suppression d'un serveur`);
  try {
    const { id } = req.params;
    const servers = readServers();
    const updatedServers = servers.filter(server => server.id !== id);
    
    if (servers.length === updatedServers.length) {
      console.log(`Serveur non trouvé: ${id}`);
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    writeServers(updatedServers);
    
    // Supprimer aussi le fichier des mappings associés
    const mappingsFile = getServerMappingsFile(id);
    if (fs.existsSync(mappingsFile)) {
      fs.unlinkSync(mappingsFile);
      console.log(`Fichier de mappings supprimé: ${mappingsFile}`);
    }
    
    console.log(`Serveur supprimé avec succès: ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du serveur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du serveur' });
  }
});

// API pour gérer les mappings
app.get('/api/servers/:serverId/mappings', async (req, res) => {
  console.log(`GET /api/servers/${req.params.serverId}/mappings - Récupération des mappings`);
  try {
    const { serverId } = req.params;
    const servers = readServers();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      console.log(`Serveur non trouvé: ${serverId}`);
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    // D'abord, vérifier si on peut récupérer les mappings depuis le serveur Wiremock
    try {
      console.log(`Tentative de récupération des mappings depuis Wiremock: ${server.url}/__admin/mappings`);
      const response = await axios.get(`${server.url}/__admin/mappings`);
      const wiremockMappings = response.data.mappings;
      
      // Sauvegarder les mappings récupérés
      writeMappings(serverId, wiremockMappings);
      console.log(`Mappings récupérés depuis Wiremock: ${wiremockMappings.length}`);
      
      return res.json(wiremockMappings);
    } catch (wiremockError) {
      console.warn(`Impossible de récupérer les mappings depuis le serveur Wiremock: ${wiremockError.message}`);
      
      // Si on ne peut pas récupérer depuis Wiremock, utiliser notre copie locale
      const mappings = readMappings(serverId);
      console.log(`Mappings récupérés depuis la copie locale: ${mappings.length}`);
      res.json(mappings);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des mappings:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des mappings' });
  }
});

app.post('/api/servers/:serverId/mappings', async (req, res) => {
  console.log(`POST /api/servers/${req.params.serverId}/mappings - Création d'un mapping`);
  try {
    const { serverId } = req.params;
    const servers = readServers();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      console.log(`Serveur non trouvé: ${serverId}`);
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    const newMapping = {
      ...req.body,
      id: uuidv4()
    };
    
    // Essayer d'ajouter le mapping au serveur Wiremock
    try {
      console.log(`Tentative d'ajout du mapping à Wiremock: ${server.url}/__admin/mappings`);
      await axios.post(`${server.url}/__admin/mappings`, newMapping);
      console.log('Mapping ajouté à Wiremock avec succès');
    } catch (wiremockError) {
      console.warn(`Impossible d'ajouter le mapping au serveur Wiremock: ${wiremockError.message}`);
    }
    
    // Ajouter aussi à notre copie locale
    const mappings = readMappings(serverId);
    mappings.push(newMapping);
    writeMappings(serverId, mappings);
    console.log(`Mapping créé avec ID: ${newMapping.id}`);
    
    res.status(201).json(newMapping);
  } catch (error) {
    console.error('Erreur lors de la création du mapping:', error);
    res.status(500).json({ error: 'Erreur lors de la création du mapping' });
  }
});

app.put('/api/servers/:serverId/mappings/:mappingId', async (req, res) => {
  console.log(`PUT /api/servers/${req.params.serverId}/mappings/${req.params.mappingId} - Mise à jour d'un mapping`);
  try {
    const { serverId, mappingId } = req.params;
    const servers = readServers();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      console.log(`Serveur non trouvé: ${serverId}`);
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    const mappings = readMappings(serverId);
    const mappingIndex = mappings.findIndex(m => m.id === mappingId);
    
    if (mappingIndex === -1) {
      console.log(`Mapping non trouvé: ${mappingId}`);
      return res.status(404).json({ error: 'Mapping non trouvé' });
    }
    
    const updatedMapping = {
      ...req.body,
      id: mappingId
    };
    
    // Essayer de mettre à jour le mapping sur le serveur Wiremock
    try {
      console.log(`Tentative de mise à jour du mapping sur Wiremock: ${server.url}/__admin/mappings/${mappingId}`);
      await axios.put(`${server.url}/__admin/mappings/${mappingId}`, updatedMapping);
      console.log('Mapping mis à jour sur Wiremock avec succès');
    } catch (wiremockError) {
      console.warn(`Impossible de mettre à jour le mapping sur le serveur Wiremock: ${wiremockError.message}`);
    }
    
    // Mettre à jour notre copie locale
    mappings[mappingIndex] = updatedMapping;
    writeMappings(serverId, mappings);
    console.log(`Mapping mis à jour: ${mappingId}`);
    
    res.json(updatedMapping);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mapping:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du mapping' });
  }
});

app.delete('/api/servers/:serverId/mappings/:mappingId', async (req, res) => {
  console.log(`DELETE /api/servers/${req.params.serverId}/mappings/${req.params.mappingId} - Suppression d'un mapping`);
  try {
    const { serverId, mappingId } = req.params;
    const servers = readServers();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      console.log(`Serveur non trouvé: ${serverId}`);
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    const mappings = readMappings(serverId);
    const updatedMappings = mappings.filter(m => m.id !== mappingId);
    
    if (mappings.length === updatedMappings.length) {
      console.log(`Mapping non trouvé: ${mappingId}`);
      return res.status(404).json({ error: 'Mapping non trouvé' });
    }
    
    // Essayer de supprimer le mapping du serveur Wiremock
    try {
      console.log(`Tentative de suppression du mapping sur Wiremock: ${server.url}/__admin/mappings/${mappingId}`);
      await axios.delete(`${server.url}/__admin/mappings/${mappingId}`);
      console.log('Mapping supprimé de Wiremock avec succès');
    } catch (wiremockError) {
      console.warn(`Impossible de supprimer le mapping du serveur Wiremock: ${wiremockError.message}`);
    }
    
    // Mettre à jour notre copie locale
    writeMappings(serverId, updatedMappings);
    console.log(`Mapping supprimé: ${mappingId}`);
    
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression du mapping:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du mapping' });
  }
});

// Restauration des mappings
app.post('/api/servers/:serverId/restore', async (req, res) => {
  console.log(`POST /api/servers/${req.params.serverId}/restore - Restauration des mappings`);
  try {
    const { serverId } = req.params;
    const servers = readServers();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      console.log(`Serveur non trouvé: ${serverId}`);
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    const mappings = readMappings(serverId);
    console.log(`Nombre de mappings à restaurer: ${mappings.length}`);
    
    // Essayer de restaurer tous les mappings sur le serveur Wiremock
    let successCount = 0;
    let errorCount = 0;
    
    // D'abord, effacer tous les mappings existants
    try {
      console.log(`Tentative de suppression de tous les mappings sur Wiremock: ${server.url}/__admin/mappings`);
      await axios.delete(`${server.url}/__admin/mappings`);
      console.log('Tous les mappings existants ont été supprimés avec succès');
    } catch (error) {
      console.warn(`Impossible de supprimer les mappings existants: ${error.message}`);
    }
    
    // Puis ajouter chaque mapping
    for (const mapping of mappings) {
      try {
        await axios.post(`${server.url}/__admin/mappings`, mapping);
        successCount++;
        console.log(`Mapping restauré avec succès: ${mapping.id}`);
      } catch (error) {
        console.error(`Erreur lors de la restauration du mapping ${mapping.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`Restauration terminée. Succès: ${successCount}, Échecs: ${errorCount}`);
    res.json({
      success: true,
      totalMappings: mappings.length,
      successCount,
      errorCount
    });
  } catch (error) {
    console.error('Erreur lors de la restauration des mappings:', error);
    res.status(500).json({ error: 'Erreur lors de la restauration des mappings' });
  }
});

// Route pour tester si le serveur est en cours d'exécution
app.get('/api/health', (req, res) => {
  console.log('GET /api/health - Vérification de la santé du serveur');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrer le serveur
try {
  app.listen(PORT, () => {
    console.log(`Serveur démarré avec succès sur le port ${PORT}`);
    console.log(`Routes disponibles:`);
    console.log(`- GET    /api/servers`);
    console.log(`- POST   /api/servers`);
    console.log(`- DELETE /api/servers/:id`);
    console.log(`- GET    /api/servers/:serverId/mappings`);
    console.log(`- POST   /api/servers/:serverId/mappings`);
    console.log(`- PUT    /api/servers/:serverId/mappings/:mappingId`);
    console.log(`- DELETE /api/servers/:serverId/mappings/:mappingId`);
    console.log(`- POST   /api/servers/:serverId/restore`);
    console.log(`- GET    /api/health`);
  });
} catch (error) {
  console.error('Erreur critique lors du démarrage du serveur:', error);
}