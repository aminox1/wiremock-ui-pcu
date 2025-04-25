const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');
const folderController = require('./controllers/folderController');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Autoriser uniquement le frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Augmenter la limite de la taille des requêtes pour les payloads JSON volumineux
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// S'assurer que les dossiers nécessaires existent
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// S'assurer que le fichier servers.json existe
const serversFile = path.join(dataDir, 'servers.json');
if (!fs.existsSync(serversFile)) {
  // Créer un fichier servers.json avec un serveur Wiremock par défaut
  const defaultServers = [
    {
      id: 'default',
      name: 'Wiremock Local',
      host: 'localhost',
      port: 9090,
      description: 'Serveur Wiremock local par défaut'
    }
  ];
  
  fs.writeFileSync(serversFile, JSON.stringify(defaultServers, null, 2));
}

// Vérifier si les serveurs ont des valeurs host et port valides
try {
  const serversData = JSON.parse(fs.readFileSync(serversFile, 'utf8'));
  const validServers = serversData.map(server => {
    if (!server.host || !server.port) {
      return {
        ...server,
        host: server.host || 'localhost',
        port: server.port || 9090
      };
    }
    return server;
  });

  // Mettre à jour les serveurs si nécessaire
  if (JSON.stringify(validServers) !== JSON.stringify(serversData)) {
    fs.writeFileSync(serversFile, JSON.stringify(validServers, null, 2));
    console.log('Serveurs mis à jour avec des valeurs host et port par défaut');
  }
} catch (error) {
  console.error('Erreur lors de la validation des serveurs:', error);
}

// Initialiser la structure de dossiers
folderController.initFolderStructure();

// Routes API
app.use('/api', routes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ 
    error: 'Erreur interne du serveur', 
    message: err.message, 
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`URL API: http://localhost:${PORT}/api`);
  console.log(`URL Health Check: http://localhost:${PORT}/health`);
});

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('Arrêt du serveur...');
  process.exit(0);
});