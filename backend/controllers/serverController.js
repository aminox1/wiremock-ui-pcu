const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Chemin du fichier contenant les informations des serveurs
const DATA_DIR = path.join(__dirname, '../data');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');

// S'assurer que le dossier data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Fonction utilitaire pour lire le fichier des serveurs
const readServersFile = () => {
  try {
    if (!fs.existsSync(SERVERS_FILE)) {
      // Créer un fichier par défaut si celui-ci n'existe pas
      const defaultServers = [
        {
          id: 'default',
          name: 'Wiremock Local',
          host: 'localhost',
          port: 9090,
          description: 'Serveur Wiremock local par défaut'
        }
      ];
      
      fs.writeFileSync(SERVERS_FILE, JSON.stringify(defaultServers, null, 2));
      return defaultServers;
    }
    
    const data = fs.readFileSync(SERVERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier des serveurs:', error);
    return [];
  }
};

// Fonction utilitaire pour écrire dans le fichier des serveurs
const writeServersFile = (servers) => {
  try {
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(servers, null, 2));
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'écriture dans le fichier des serveurs:', error);
    return false;
  }
};

// Récupérer tous les serveurs
exports.getServers = (req, res) => {
  try {
    const servers = readServersFile();
    
    // Vérifier si les serveurs ont des valeurs host et port définies
    const validServers = servers.map(server => {
      // Si host ou port est undefined, définir des valeurs par défaut
      if (!server.host || !server.port) {
        return {
          ...server,
          host: server.host || 'localhost',
          port: server.port || 9090
        };
      }
      return server;
    });
    
    // Sauvegarder les serveurs modifiés si nécessaire
    if (JSON.stringify(validServers) !== JSON.stringify(servers)) {
      writeServersFile(validServers);
      console.log('Serveurs mis à jour avec des valeurs host et port par défaut');
    }
    
    res.json(validServers);
  } catch (error) {
    console.error('Erreur lors de la récupération des serveurs:', error);
    res.status(500).json({ error: 'Impossible de récupérer les serveurs' });
  }
};

// Créer un nouveau serveur
exports.createServer = (req, res) => {
  try {
    const { name, host, port, description, allowDuplicate = false } = req.body;
    
    // Validation des données
    if (!name || !host || !port) {
      return res.status(400).json({ error: 'Le nom, l\'hôte et le port sont requis' });
    }
    
    // Valider que le port est un nombre
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      return res.status(400).json({ error: 'Le port doit être un nombre entre 1 et 65535' });
    }
    
    // Validation supplémentaire de l'hôte
    const validHostPattern = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)$/;
    if (!validHostPattern.test(host)) {
      return res.status(400).json({ error: 'L\'hôte est invalide. Utilisez un nom d\'hôte ou une adresse IP valide.' });
    }
    
    const servers = readServersFile();
    
    // Vérification des doublons seulement si allowDuplicate est false
    if (!allowDuplicate) {
      // Vérifier si un serveur avec le même nom existe déjà
      const existingServerName = servers.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (existingServerName) {
        return res.status(409).json({ error: 'Un serveur avec ce nom existe déjà' });
      }
      
      // Vérifier si un serveur avec la même combinaison hôte/port existe déjà
      const existingServer = servers.find(s => s.host === host && parseInt(s.port) === portNum);
      if (existingServer) {
        return res.status(409).json({ error: 'Un serveur avec cette combinaison hôte/port existe déjà' });
      }
    }
    
    // Créer le nouveau serveur
    const newServer = {
      id: uuidv4(),
      name,
      host,
      port: portNum,
      description: description || '',
      createdAt: new Date().toISOString()
    };
    
    // Ajouter le nouveau serveur à la liste
    servers.push(newServer);
    
    // Enregistrer la liste mise à jour
    if (writeServersFile(servers)) {
      console.log('Nouveau serveur créé avec succès:', newServer);
      res.status(201).json(newServer);
    } else {
      res.status(500).json({ error: 'Impossible d\'enregistrer le nouveau serveur' });
    }
  } catch (error) {
    console.error('Erreur lors de la création du serveur:', error);
    res.status(500).json({ error: 'Impossible de créer le serveur: ' + error.message });
  }
};

// Mettre à jour un serveur existant
exports.updateServer = (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, host, port, description, allowDuplicate = false } = req.body;
    
    // Validation des données
    if (!name || !host || !port) {
      return res.status(400).json({ error: 'Le nom, l\'hôte et le port sont requis' });
    }
    
    // Valider que le port est un nombre
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      return res.status(400).json({ error: 'Le port doit être un nombre entre 1 et 65535' });
    }
    
    // Validation supplémentaire de l'hôte
    const validHostPattern = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)$/;
    if (!validHostPattern.test(host)) {
      return res.status(400).json({ error: 'L\'hôte est invalide. Utilisez un nom d\'hôte ou une adresse IP valide.' });
    }
    
    const servers = readServersFile();
    
    // Trouver l'index du serveur à mettre à jour
    const serverIndex = servers.findIndex(s => s.id === serverId);
    if (serverIndex === -1) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    // Vérification des doublons seulement si allowDuplicate est false
    if (!allowDuplicate) {
      // Vérifier si un autre serveur avec le même nom existe déjà
      const existingServerName = servers.find(s => s.id !== serverId && s.name.toLowerCase() === name.toLowerCase());
      if (existingServerName) {
        return res.status(409).json({ error: 'Un autre serveur avec ce nom existe déjà' });
      }
      
      // Vérifier si un autre serveur avec la même combinaison hôte/port existe déjà
      const existingServer = servers.find(s => s.id !== serverId && s.host === host && parseInt(s.port) === portNum);
      if (existingServer) {
        return res.status(409).json({ error: 'Un autre serveur avec cette combinaison hôte/port existe déjà' });
      }
    }
    
    // Mettre à jour le serveur
    const updatedServer = {
      ...servers[serverIndex],
      name,
      host,
      port: portNum,
      description: description || '',
      updatedAt: new Date().toISOString()
    };
    
    // Remplacer l'ancien serveur par le nouveau
    servers[serverIndex] = updatedServer;
    
    // Enregistrer la liste mise à jour
    if (writeServersFile(servers)) {
      res.json(updatedServer);
    } else {
      res.status(500).json({ error: 'Impossible d\'enregistrer les modifications du serveur' });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du serveur:', error);
    res.status(500).json({ error: 'Impossible de mettre à jour le serveur' });
  }
};

// Supprimer un serveur
exports.deleteServer = (req, res) => {
  try {
    const { serverId } = req.params;
    
    const servers = readServersFile();
    
    // Vérifier si le serveur existe
    const serverIndex = servers.findIndex(s => s.id === serverId);
    if (serverIndex === -1) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    // Supprimer le serveur de la liste
    servers.splice(serverIndex, 1);
    
    // Enregistrer la liste mise à jour
    if (writeServersFile(servers)) {
      res.json({ success: true, id: serverId });
    } else {
      res.status(500).json({ error: 'Impossible d\'enregistrer les modifications après suppression' });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du serveur:', error);
    res.status(500).json({ error: 'Impossible de supprimer le serveur' });
  }
};

// Vérifier la connexion à un serveur Wiremock
exports.checkServerConnection = async (req, res) => {
  try {
    const { host, port } = req.body;
    
    if (!host || !port) {
      return res.status(400).json({ error: 'L\'hôte et le port sont requis' });
    }
    
    // Validation supplémentaire de l'hôte
    const validHostPattern = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)$/;
    if (!validHostPattern.test(host)) {
      return res.status(400).json({ error: 'L\'hôte est invalide. Utilisez un nom d\'hôte ou une adresse IP valide.' });
    }
    
    try {
      // Essayer de se connecter au serveur Wiremock
      const response = await axios.get(`http://${host}:${port}/__admin/mappings`, { timeout: 5000 });
      
      res.json({ 
        status: 'success', 
        message: 'Connexion établie avec succès',
        mappingsCount: response.data.mappings ? response.data.mappings.length : 0
      });
    } catch (error) {
      res.status(502).json({ 
        status: 'error', 
        message: `Impossible de se connecter au serveur Wiremock: ${error.message}`,
        error: error.message
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de la connexion' });
  }
};