const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Chemin du dossier des mappings
// const MAPPINGS_DIR = path.join(__dirname, '../data/mappings');
const MAPPINGS_DIR = path.resolve('C:/Users/user/wiremock-mappings/mappings');
console.log('>>> MAPPINGS_DIR =', MAPPINGS_DIR);



// S'assurer que le dossier existe
if (!fs.existsSync(MAPPINGS_DIR)) {
  fs.mkdirSync(MAPPINGS_DIR, { recursive: true });
  console.log(`Dossier racine des mappings créé: ${MAPPINGS_DIR}`);
}

// Fonction utilitaire pour lire le fichier des serveurs
const readServersFile = () => {
  try {
    const serversFilePath = path.join(__dirname, '../data/servers.json');
    if (!fs.existsSync(serversFilePath)) {
      return [];
    }
    
    const data = fs.readFileSync(serversFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier des serveurs:', error);
    return [];
  }
};

// Fonction pour préparer un mapping pour Wiremock
const prepareWiremockMapping = (mapping) => {
  // Créer un nouvel objet pour éviter de modifier l'original
  const wiremockMapping = {};
  
  // Conserver uniquement les propriétés que Wiremock reconnaît
  wiremockMapping.id = mapping.id;
  
  if (mapping.name) {
    wiremockMapping.name = mapping.name;
  }
  
  // Construire la partie request
  wiremockMapping.request = {
    method: mapping.request?.method || "GET",
    url: mapping.request?.url || "/"
  };
  
  // Ajouter d'autres propriétés à request si elles existent
  if (mapping.request?.headers) {
    wiremockMapping.request.headers = mapping.request.headers;
  }
  
  if (mapping.request?.queryParameters) {
    wiremockMapping.request.queryParameters = mapping.request.queryParameters;
  }
  
  if (mapping.request?.bodyPatterns) {
    wiremockMapping.request.bodyPatterns = mapping.request.bodyPatterns;
  }
  
  // Construire la partie response
  wiremockMapping.response = {
    status: mapping.response?.status || 200
  };
  
  // Ajouter les headers s'ils existent
  if (mapping.response?.headers) {
    wiremockMapping.response.headers = mapping.response.headers;
  }
  
  // Traiter le body correctement selon le type de contenu
  if (mapping.response?.body !== undefined) {
    const contentType = mapping.response?.headers?.['Content-Type'] || '';
    
    if (contentType.includes('application/json')) {
      // Pour JSON, convertir l'objet en chaîne JSON
      if (typeof mapping.response.body === 'string') {
        wiremockMapping.response.body = mapping.response.body;
      } else {
        // Convertir l'objet en chaîne JSON
        wiremockMapping.response.body = JSON.stringify(mapping.response.body);
      }
    } else {
      // Pour les autres types, garder comme chaîne
      wiremockMapping.response.body = String(mapping.response.body);
    }
  }
  
  console.log('Mapping préparé pour Wiremock:', JSON.stringify(wiremockMapping, null, 2));
  
  return wiremockMapping;
};

// Récupérer tous les mappings pour un serveur
exports.getMappings = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // Vérifier si le dossier mappings existe
    if (!fs.existsSync(MAPPINGS_DIR)) {
      return res.json([]);
    }
    
    // Liste pour stocker tous les mappings
    const allMappings = [];
    
    // Fonction récursive pour parcourir les dossiers
    const processFolder = (folderPath, relativePath = '') => {
      const items = fs.readdirSync(folderPath);
      
      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const itemStat = fs.statSync(itemPath);
        
        if (itemStat.isDirectory()) {
          // Ignorer le dossier _files qui est utilisé par Wiremock pour les fichiers statiques
          if (item !== '_files') {
            const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
            processFolder(itemPath, newRelativePath);
          }
        } else if (itemStat.isFile() && item.endsWith('.json')) {
          try {
            const fileContent = fs.readFileSync(itemPath, 'utf8');
            const mapping = JSON.parse(fileContent);
            
            // Ajouter le chemin du dossier au mapping
            mapping.folderPath = relativePath;
            
            allMappings.push(mapping);
          } catch (fileError) {
            console.error(`Erreur lors de la lecture du fichier ${itemPath}:`, fileError);
          }
        }
      }
    };
    
    // Commencer le traitement à partir du dossier racine des mappings
    processFolder(MAPPINGS_DIR);
    
    res.json(allMappings);
  } catch (error) {
    console.error('Erreur lors de la récupération des mappings:', error);
    res.status(500).json({ error: 'Impossible de récupérer les mappings' });
  }
};

// Récupérer les mappings pour un dossier spécifique
exports.getMappingsByFolder = async (req, res) => {
  try {
    const { serverId, folderPath } = req.params;
    
    // Chemin du dossier des mappings
    const folderMappingsPath = path.join(MAPPINGS_DIR, folderPath);
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(folderMappingsPath)) {
      return res.json([]);
    }
    
    // Liste pour stocker les mappings du dossier
    const folderMappings = [];
    
    // Lire les fichiers du dossier
    const files = fs.readdirSync(folderMappingsPath);
    
    // Traiter chaque fichier JSON
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(folderMappingsPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const mapping = JSON.parse(fileContent);
          
          // Ajouter le chemin du dossier au mapping
          mapping.folderPath = folderPath;
          
          folderMappings.push(mapping);
        } catch (fileError) {
          console.error(`Erreur lors de la lecture du fichier ${file}:`, fileError);
        }
      }
    }
    
    res.json(folderMappings);
  } catch (error) {
    console.error('Erreur lors de la récupération des mappings du dossier:', error);
    res.status(500).json({ error: 'Impossible de récupérer les mappings du dossier' });
  }
};

// Créer un nouveau mapping
exports.createMapping = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { mapping, folderPath } = req.body;
    
    console.log("Données reçues pour créer un mapping:", {
      serverId,
      folderPath,
      mapping
    });
    
    // Récupérer les infos du serveur
    const servers = readServersFile();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    // Chemin complet du dossier où enregistrer le mapping
    const mappingsFolderPath = path.join(MAPPINGS_DIR, folderPath);
    
    // S'assurer que le dossier existe (créer tous les dossiers parents si nécessaire)
    if (!fs.existsSync(mappingsFolderPath)) {
      fs.mkdirSync(mappingsFolderPath, { recursive: true });
      console.log(`Dossier créé: ${mappingsFolderPath}`);
    }
    
    // Générer un ID unique pour le mapping s'il n'en a pas
    if (!mapping.id) {
      mapping.id = uuidv4();
    }
    
    // Sauvegarder le mapping dans le fichier
    const mappingFileName = `${mapping.id}.json`;
    const mappingFilePath = path.join(mappingsFolderPath, mappingFileName);
    
    // Écrire le fichier JSON avec une indentation pour lisibilité
    fs.writeFileSync(mappingFilePath, JSON.stringify(mapping, null, 2));
    console.log(`Mapping sauvegardé dans: ${mappingFilePath}`);
    
    // Essayer de synchroniser avec Wiremock, mais continuer même en cas d'échec
    let wiremockSyncSuccess = false;
    let syncError = null;
    
    try {
      // Préparer le mapping pour Wiremock
      const wiremockMapping = prepareWiremockMapping(mapping);
      
      // Envoyer à Wiremock
      const response = await axios.post(`http://${server.host}:${server.port}/__admin/mappings`, wiremockMapping, { timeout: 5000 });
      console.log('Mapping synchronisé avec succès avec Wiremock:', response.data);
      wiremockSyncSuccess = true;
    } catch (syncErr) {
      console.error(`Échec maj Wiremock: ${syncErr.message}`);
      
      // Afficher les détails complets de l'erreur
      if (syncErr.response) {
        console.error('Status:', syncErr.response.status);
        console.error('Headers:', syncErr.response.headers);
        console.error('Data:', JSON.stringify(syncErr.response.data, null, 2));
      }
      
      syncError = syncErr.message;
      wiremockSyncSuccess = false;
    }
    
    // Ajouter le chemin du dossier et les infos de synchronisation au mapping pour le retour
    const newMapping = {
      ...mapping,
      folderPath,
      wiremockSynced: wiremockSyncSuccess,
      syncError: syncError
    };
    
    return res.status(201).json(newMapping);
  } catch (error) {
    console.error('Erreur lors de la création du mapping:', error);
    return res.status(500).json({ 
      error: 'Impossible de créer le mapping', 
      details: error.message 
    });
  }
};

// Mettre à jour un mapping existant
exports.updateMapping = async (req, res) => {
  try {
    const { serverId, mappingId } = req.params;
    const { mapping, folderPath } = req.body;
    
    console.log("Données reçues pour mettre à jour un mapping:", {
      serverId,
      mappingId,
      folderPath,
      mapping
    });
    
    // Récupérer les infos du serveur
    const servers = readServersFile();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    // Vérifier si l'ID du mapping correspond
    if (mapping.id !== mappingId) {
      return res.status(400).json({ error: 'L\'ID du mapping ne correspond pas' });
    }
    
    // Trouver l'ancien fichier du mapping (qui peut être dans un autre dossier)
    let oldMappingPath = null;
    const findMapping = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const itemStat = fs.statSync(itemPath);
        
        if (itemStat.isDirectory() && item !== '_files') {
          const result = findMapping(itemPath);
          if (result) return result;
        } else if (itemStat.isFile() && item === `${mappingId}.json`) {
          return itemPath;
        }
      }
      
      return null;
    };
    
    oldMappingPath = findMapping(MAPPINGS_DIR);
    
    if (!oldMappingPath) {
      return res.status(404).json({ error: 'Mapping non trouvé' });
    }
    
    console.log(`Ancien fichier mapping trouvé: ${oldMappingPath}`);
    
    // Supprimer l'ancien fichier
    fs.unlinkSync(oldMappingPath);
    console.log(`Ancien fichier mapping supprimé`);
    
    // Créer le nouveau fichier dans le dossier spécifié
    const newFolderPath = path.join(MAPPINGS_DIR, folderPath);
    
    // S'assurer que le dossier existe
    if (!fs.existsSync(newFolderPath)) {
      fs.mkdirSync(newFolderPath, { recursive: true });
      console.log(`Nouveau dossier créé: ${newFolderPath}`);
    }
    
    const newMappingPath = path.join(newFolderPath, `${mappingId}.json`);
    fs.writeFileSync(newMappingPath, JSON.stringify(mapping, null, 2));
    console.log(`Mapping mis à jour dans: ${newMappingPath}`);
    
    // Essayer de mettre à jour le mapping sur Wiremock
    let wiremockSyncSuccess = false;
    let syncError = null;
    
    try {
      // D'abord supprimer l'ancien mapping
      try {
        await axios.delete(`http://${server.host}:${server.port}/__admin/mappings/${mappingId}`, { timeout: 5000 });
        console.log('Ancien mapping supprimé de Wiremock');
      } catch (deleteError) {
        console.warn('Impossible de supprimer l\'ancien mapping de Wiremock:', deleteError.message);
        // Continuer même si la suppression échoue
      }
      
      // Préparer le mapping pour Wiremock
      const wiremockMapping = prepareWiremockMapping(mapping);
      
      // Créer un nouveau mapping plutôt que mettre à jour
      const response = await axios.post(`http://${server.host}:${server.port}/__admin/mappings`, wiremockMapping, { timeout: 5000 });
      console.log('Mapping mis à jour avec succès sur Wiremock:', response.data);
      wiremockSyncSuccess = true;
    } catch (error) {
      console.error(`Échec maj Wiremock: ${error.message}`);
      
      // Afficher les détails complets de l'erreur
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      syncError = error.message;
      wiremockSyncSuccess = false;
    }
    
    // Ajouter le chemin du dossier au mapping pour le retour
    const updatedMapping = {
      ...mapping,
      folderPath,
      wiremockSynced: wiremockSyncSuccess,
      syncError: syncError
    };
    
    return res.json(updatedMapping);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mapping:', error);
    return res.status(500).json({ 
      error: 'Impossible de mettre à jour le mapping', 
      details: error.message 
    });
  }
};

// Supprimer un mapping
exports.deleteMapping = async (req, res) => {
  try {
    const { serverId, mappingId } = req.params;
    
    // Récupérer les infos du serveur
    const servers = readServersFile();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    // Trouver le fichier du mapping
    let mappingPath = null;
    let mappingFolderPath = null;
    
    const findMapping = (dir, relativePath = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const itemStat = fs.statSync(itemPath);
        
        if (itemStat.isDirectory() && item !== '_files') {
          const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
          const result = findMapping(itemPath, newRelativePath);
          if (result) return result;
        } else if (itemStat.isFile() && item === `${mappingId}.json`) {
          return { path: itemPath, folderPath: relativePath };
        }
      }
      
      return null;
    };
    
    const result = findMapping(MAPPINGS_DIR);
    
    if (!result) {
      return res.status(404).json({ error: 'Mapping non trouvé' });
    }
    
    mappingPath = result.path;
    mappingFolderPath = result.folderPath;
    
    // Supprimer le fichier
    fs.unlinkSync(mappingPath);
    console.log(`Fichier mapping supprimé: ${mappingPath}`);
    
    // Essayer de supprimer le mapping sur Wiremock
    let wiremockSyncSuccess = false;
    let syncError = null;
    
    try {
      // Supprimer le mapping sur Wiremock
      await axios.delete(`http://${server.host}:${server.port}/__admin/mappings/${mappingId}`, { timeout: 5000 });
      console.log('Mapping supprimé avec succès sur Wiremock');
      wiremockSyncSuccess = true;
    } catch (error) {
      console.error(`Échec maj Wiremock: ${error.message}`);
      
      // Afficher les détails complets de l'erreur
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      syncError = error.message;
      wiremockSyncSuccess = false;
    }
    
    return res.json({
      id: mappingId,
      folderPath: mappingFolderPath,
      deleted: true,
      wiremockSynced: wiremockSyncSuccess,
      syncError: syncError
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du mapping:', error);
    return res.status(500).json({ 
      error: 'Impossible de supprimer le mapping', 
      details: error.message 
    });
  }
};

// Restaurer tous les mappings vers un serveur Wiremock
exports.restoreMappings = async (req, res) => {
  try {
    const { serverId } = req.params;
    
    // Récupérer les infos du serveur
    const servers = readServersFile();
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }
    
    // Vérifier d'abord si le serveur Wiremock est disponible
    try {
      await axios.get(`http://${server.host}:${server.port}/__admin/mappings`, { timeout: 3000 });
    } catch (error) {
      console.warn(`Avertissement: Serveur Wiremock non disponible sur ${server.host}:${server.port}`);
      return res.status(503).json({
        error: 'Serveur Wiremock indisponible',
        details: `Impossible de se connecter au serveur Wiremock sur ${server.host}:${server.port}.`
      });
    }
    
    // Récupérer tous les mappings locaux
    const allMappings = [];
    
    // Fonction récursive pour parcourir les dossiers
    const processFolder = (folderPath, relativePath = '') => {
      const items = fs.readdirSync(folderPath);
      
      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const itemStat = fs.statSync(itemPath);
        
        if (itemStat.isDirectory()) {
          // Ignorer le dossier _files qui est utilisé par Wiremock pour les fichiers statiques
          if (item !== '_files') {
            const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
            processFolder(itemPath, newRelativePath);
          }
        } else if (itemStat.isFile() && item.endsWith('.json')) {
          try {
            const fileContent = fs.readFileSync(itemPath, 'utf8');
            const mapping = JSON.parse(fileContent);
            
            // Ajouter le chemin du dossier au mapping
            mapping.folderPath = relativePath;
            
            allMappings.push(mapping);
          } catch (fileError) {
            console.error(`Erreur lors de la lecture du fichier ${itemPath}:`, fileError);
          }
        }
      }
    };
    
    // Commencer le traitement à partir du dossier racine des mappings
    if (fs.existsSync(MAPPINGS_DIR)) {
      processFolder(MAPPINGS_DIR);
    }
    
    // Maintenant, envoyer tous les mappings à Wiremock
    let successCount = 0;
    let failedCount = 0;
    
    // D'abord, effacer tous les mappings existants sur Wiremock
    try {
      await axios.delete(`http://${server.host}:${server.port}/__admin/mappings`);
      console.log('Tous les mappings existants ont été supprimés de Wiremock');
    } catch (error) {
      console.error('Erreur lors de la suppression des mappings existants sur Wiremock:', error);
      return res.status(500).json({ 
        error: 'Impossible de supprimer les mappings existants sur Wiremock', 
        details: error.message 
      });
    }
    
    // Ensuite, ajouter tous les mappings locaux
    for (const mapping of allMappings) {
      try {
        // Préparer le mapping pour Wiremock
        const wiremockMapping = prepareWiremockMapping(mapping);
        
        // Toujours utiliser POST pour ajouter un nouveau mapping
        await axios.post(`http://${server.host}:${server.port}/__admin/mappings`, wiremockMapping);
        successCount++;
      } catch (error) {
        console.error(`Erreur lors de la restauration du mapping ${mapping.id}:`, error);
        if (error.response) {
          console.error('Détails:', JSON.stringify(error.response.data, null, 2));
        }
        failedCount++;
      }
    }
    
    return res.json({ 
      restored: successCount, 
      failed: failedCount,
      message: `${successCount} mappings restaurés avec succès, ${failedCount} échecs.`
    });
    
  } catch (error) {
    console.error('Erreur lors de la restauration des mappings:', error);
    return res.status(500).json({ 
      error: 'Impossible de restaurer les mappings', 
      details: error.message 
    });
  }
};