const fs = require('fs');
const path = require('path');

// Chemin racine des mappings - utiliser le dossier existant
const MAPPINGS_ROOT = 'C:/Users/user/wiremock-mappings/mappings';

// Fonction utilitaire pour s'assurer qu'un dossier existe
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialiser la structure de dossiers si elle n'existe pas
exports.initFolderStructure = () => {
  // Créer le dossier racine s'il n'existe pas
  ensureDirectoryExists(MAPPINGS_ROOT);
  
  // Créer les dossiers par défaut
  const defaultFolders = ['LIZARD', 'OCM', 'TCRM/Party/individuel', 'TCRM/Party/organization', 'TMFAPI'];
  
  defaultFolders.forEach(folder => {
    const folderPath = path.join(MAPPINGS_ROOT, folder.replace(/\//g, path.sep));
    ensureDirectoryExists(folderPath);
  });
  
  console.log('Structure de dossiers initialisée dans:', MAPPINGS_ROOT);
};

// Récupérer la structure des dossiers
exports.getFolderStructure = (req, res) => {
  try {
    const { serverId } = req.params;
    
    console.log(`Récupération de la structure de dossiers pour le serveur ${serverId}`);
    
    // Vérifie que le dossier racine existe
    if (!fs.existsSync(MAPPINGS_ROOT)) {
      console.log(`Le dossier racine ${MAPPINGS_ROOT} n'existe pas, création...`);
      ensureDirectoryExists(MAPPINGS_ROOT);
      // Initialiser la structure par défaut
      this.initFolderStructure();
    }
    
    // Fonction récursive pour construire la structure des dossiers
    const buildFolderTree = (currentPath, relativePath = '') => {
      if (!fs.existsSync(currentPath)) {
        console.warn(`Le chemin ${currentPath} n'existe pas`);
        return [];
      }
      
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      const folders = [];
      
      entries.forEach(entry => {
        if (entry.isDirectory()) {
          const folderName = entry.name;
          
          // Ignorer les dossiers commençant par un point (cachés)
          if (folderName.startsWith('.')) {
            return;
          }
          
          const newRelativePath = relativePath ? `${relativePath}/${folderName}` : folderName;
          const fullPath = path.join(currentPath, folderName);
          
          const folder = {
            name: folderName,
            path: newRelativePath,
            parentPath: relativePath || null,
            children: buildFolderTree(fullPath, newRelativePath)
          };
          
          folders.push(folder);
        }
      });
      
      return folders;
    };
    
    const folderStructure = buildFolderTree(MAPPINGS_ROOT);
    
    // Si aucun dossier n'est trouvé, initialiser la structure par défaut
    if (folderStructure.length === 0) {
      console.log('Aucun dossier trouvé, initialisation de la structure par défaut');
      this.initFolderStructure();
      // Récupérer à nouveau la structure après initialisation
      const updatedStructure = buildFolderTree(MAPPINGS_ROOT);
      res.json(updatedStructure);
    } else {
      res.json(folderStructure);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure de dossiers:', error);
    res.status(500).json({ 
      error: 'Impossible de récupérer la structure de dossiers',
      details: error.message 
    });
  }
};

// Créer un nouveau dossier
exports.createFolder = (req, res) => {
  try {
    const { serverId } = req.params;
    const { folderPath } = req.body;
    
    console.log(`Création du dossier ${folderPath} pour le serveur ${serverId}`);
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Le chemin du dossier est requis' });
    }
    
    // Nettoyer et normaliser le chemin du dossier
    const cleanPath = folderPath.replace(/^\/+|\/+$/g, ''); // Supprimer les / au début et à la fin
    
    const fullPath = path.join(MAPPINGS_ROOT, cleanPath.replace(/\//g, path.sep));
    
    // Vérifie si le dossier existe déjà
    if (fs.existsSync(fullPath)) {
      return res.status(409).json({ error: 'Ce dossier existe déjà' });
    }
    
    // Créer le dossier
    ensureDirectoryExists(fullPath);
    console.log(`Dossier créé: ${fullPath}`);
    
    // Extraire les informations du dossier pour la réponse
    const folderName = path.basename(fullPath);
    const parentPath = path.relative(MAPPINGS_ROOT, path.dirname(fullPath)).replace(/\\/g, '/');
    
    // Renvoyer les informations du nouveau dossier
    res.status(201).json({
      name: folderName,
      path: cleanPath,
      parentPath: parentPath === '.' || parentPath === '' ? null : parentPath,
      children: []
    });
  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error);
    res.status(500).json({ 
      error: 'Impossible de créer le dossier',
      details: error.message 
    });
  }
};

// Supprimer un dossier
exports.deleteFolder = (req, res) => {
  try {
    const { serverId, folderPath } = req.params;
    
    console.log(`Suppression du dossier ${folderPath} pour le serveur ${serverId}`);
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Le chemin du dossier est requis' });
    }
    
    const fullPath = path.join(MAPPINGS_ROOT, folderPath.replace(/\//g, path.sep));
    
    // Vérifie si le dossier existe
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    
    // Vérifie si le dossier est vide
    const entries = fs.readdirSync(fullPath);
    if (entries.length > 0) {
      return res.status(409).json({ error: 'Le dossier n\'est pas vide' });
    }
    
    // Supprimer le dossier
    fs.rmdirSync(fullPath);
    console.log(`Dossier supprimé: ${fullPath}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du dossier:', error);
    res.status(500).json({ 
      error: 'Impossible de supprimer le dossier',
      details: error.message 
    });
  }
};