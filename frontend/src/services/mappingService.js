// src/services/mappingService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Fonction pour récupérer tous les mappings d'un serveur
export const fetchMappings = async (serverId) => {
  try {
    console.log(`Récupération des mappings pour le serveur ${serverId}`);
    const response = await axios.get(`${API_BASE_URL}/servers/${serverId}/mappings`);
    console.log(`${response.data.length} mappings récupérés`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des mappings:', error);
    
    if (error.response && error.response.data) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
    
    throw error;
  }
};

// Fonction pour récupérer les mappings d'un dossier spécifique
export const fetchMappingsByFolder = async (serverId, folderPath) => {
  try {
    console.log(`Récupération des mappings pour le dossier ${folderPath}`);
    const encodedFolderPath = encodeURIComponent(folderPath);
    const response = await axios.get(`${API_BASE_URL}/servers/${serverId}/folders/${encodedFolderPath}/mappings`);
    console.log(`${response.data.length} mappings trouvés dans le dossier ${folderPath}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des mappings du dossier:', error);
    
    if (error.response && error.response.data) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
    
    // Si le dossier n'a pas été trouvé, retourner un tableau vide
    if (error.response && error.response.status === 404) {
      return [];
    }
    
    throw error;
  }
};

// Fonction pour ajouter un mapping
export const addMapping = async (serverId, mapping, folderPath) => {
  try {
    console.log(`Tentative d'ajout d'un mapping dans le dossier ${folderPath} pour le serveur ${serverId}`);
    
    const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/mappings`, {
      mapping,
      folderPath
    });
    
    console.log('Mapping ajouté avec succès:', response.data);
    
    // Vérifier si le mapping a été ajouté mais non synchronisé avec Wiremock
    if (response.data.wiremockSynced === false) {
      console.warn('Le mapping a été ajouté localement mais n\'a pas pu être synchronisé avec Wiremock');
      console.warn('Raison:', response.data.syncError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du mapping:', error);
    
    // Logger les détails de l'erreur pour le débogage
    if (error.response) {
      console.error('Erreur de réponse:', error.response.status, error.response.data);
    }
    
    console.error('Erreur détaillée lors de la création du mapping:', error);
    
    throw error;
  }
};

// Fonction pour mettre à jour un mapping
export const updateMapping = async (serverId, mappingId, mapping, folderPath) => {
  try {
    console.log(`Mise à jour du mapping ${mappingId} dans le dossier ${folderPath} pour le serveur ${serverId}`);
    
    const response = await axios.put(`${API_BASE_URL}/servers/${serverId}/mappings/${mappingId}`, {
      mapping,
      folderPath
    });
    
    console.log('Mapping mis à jour avec succès:', response.data);
    
    // Vérifier si le mapping a été mis à jour mais non synchronisé avec Wiremock
    if (response.data.wiremockSynced === false) {
      console.warn('Le mapping a été mis à jour localement mais n\'a pas pu être synchronisé avec Wiremock');
      console.warn('Raison:', response.data.syncError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mapping:', error);
    
    if (error.response && error.response.data) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
    
    throw error;
  }
};

// Fonction pour supprimer un mapping
export const deleteMapping = async (serverId, mappingId) => {
  try {
    console.log(`Suppression du mapping ${mappingId} pour le serveur ${serverId}`);
    
    const response = await axios.delete(`${API_BASE_URL}/servers/${serverId}/mappings/${mappingId}`);
    
    console.log('Mapping supprimé avec succès:', response.data);
    
    // Vérifier si le mapping a été supprimé mais non synchronisé avec Wiremock
    if (response.data.wiremockSynced === false) {
      console.warn('Le mapping a été supprimé localement mais n\'a pas pu être synchronisé avec Wiremock');
      console.warn('Raison:', response.data.syncError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du mapping:', error);
    
    if (error.response && error.response.data) {
      console.error('Détails de l\'erreur:', error.response.data);
    }
    
    throw error;
  }
};

// Fonction pour restaurer tous les mappings vers un serveur Wiremock
export const restoreMappings = async (serverId) => {
  try {
    console.log(`Restauration de tous les mappings vers le serveur ${serverId}`);
    
    const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/restore`);
    
    console.log('Résultat de la restauration:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la restauration des mappings:', error);
    
    if (error.response && error.response.data) {
      console.error('Détails de l\'erreur:', error.response.data);
      
      // Si c'est une erreur 503 (Service Unavailable), gérer spécifiquement
      if (error.response.status === 503) {
        throw new Error(error.response.data.details || 'Serveur Wiremock indisponible');
      }
    }
    
    throw error;
  }
};