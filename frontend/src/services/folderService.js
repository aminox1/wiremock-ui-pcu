// src/services/folderService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Fonction pour récupérer la structure des dossiers pour un serveur donné
export const fetchFolderStructure = async (serverId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/servers/${serverId}/folders`);
    console.log("Réponse API des dossiers:", response.data);
    
    // Sauvegarder dans le localStorage pour la persistance locale
    localStorage.setItem(`wiremock-folders-${serverId}`, JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la structure de dossiers:', error);
    
    // Fallback : récupérer depuis le localStorage ou générer une structure par défaut
    const savedFolders = localStorage.getItem(`wiremock-folders-${serverId}`);
    if (savedFolders) {
      return JSON.parse(savedFolders);
    }
    
    // Structure par défaut si le backend n'est pas disponible
    return buildDefaultFolderStructure();
  }
};

// Fonction pour créer un nouveau dossier
export const createFolder = async (serverId, folderPath) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/folders`, { folderPath });
    console.log("Dossier créé:", response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du dossier:', error);
    throw error;
  }
};

// Fonction pour supprimer un dossier vide
export const deleteFolder = async (serverId, folderPath) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/servers/${serverId}/folders/${folderPath}`);
    console.log("Dossier supprimé:", response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du dossier:', error);
    throw error;
  }
};

// Construire une structure de dossiers par défaut
export const buildDefaultFolderStructure = () => {
  console.log("Création d'une structure de dossiers par défaut");
  const defaultFolders = ['LIZARD', 'OCM', 'TCRM', 'TMFAPI'];
  const rootFolders = [];

  defaultFolders.forEach(folderName => {
    const folder = {
      name: folderName,
      path: folderName,
      parentPath: null,
      children: []
    };

    // Ajouter quelques sous-dossiers d'exemple
    if (folderName === 'TCRM') {
      folder.children = [
        {
          name: 'Party',
          path: 'TCRM/Party',
          parentPath: 'TCRM',
          children: [
            {
              name: 'individuel',
              path: 'TCRM/Party/individuel',
              parentPath: 'TCRM/Party',
              children: []
            },
            {
              name: 'organization',
              path: 'TCRM/Party/organization',
              parentPath: 'TCRM/Party',
              children: []
            }
          ]
        }
      ];
    }

    rootFolders.push(folder);
  });

  return rootFolders;
};

// Fonction pour construire une structure de dossiers à partir des mappings
export const buildFolderStructureFromMappings = (mappings) => {
  const folderMap = {};
  const rootFolders = [];

  // Parcourir les mappings pour extraire les chemins de dossiers
  mappings.forEach(mapping => {
    if (mapping.folderPath) {
      const pathParts = mapping.folderPath.split('/').filter(part => part.trim() !== '');
      let currentPath = '';
      let parentPath = null;
      
      pathParts.forEach((folderName, index) => {
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        
        // Créer le dossier s'il n'existe pas déjà
        if (!folderMap[currentPath]) {
          const newFolder = {
            name: folderName,
            path: currentPath,
            parentPath,
            children: []
          };
          
          folderMap[currentPath] = newFolder;
          
          // Ajouter comme enfant du parent ou à la racine
          if (parentPath) {
            folderMap[parentPath].children.push(newFolder);
          } else {
            rootFolders.push(newFolder);
          }
        }
        
        parentPath = currentPath;
      });
    }
  });

  // Si aucun dossier n'est trouvé, ajouter des dossiers par défaut
  if (rootFolders.length === 0) {
    return buildDefaultFolderStructure();
  }

  return rootFolders;
};