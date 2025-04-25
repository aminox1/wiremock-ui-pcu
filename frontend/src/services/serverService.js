// src/services/serverService.js
import axios from 'axios';
import { API_BASE_URL, DEFAULT_SERVER } from '../config';

// Fonction pour récupérer tous les serveurs

export const fetchServers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/servers`);
    console.log("Serveurs récupérés de l'API:", response.data);
    
    // S'assurer que les données sont bien formatées
    const formattedData = response.data.map(server => ({
      ...server,
      host: server.host || 'localhost',
      port: parseInt(server.port) || 9090
    }));
    
    // Sauvegarder les serveurs dans le localStorage pour une utilisation hors ligne
    localStorage.setItem('wiremock-servers', JSON.stringify(formattedData));
    
    return formattedData;
  } catch (error) {
    console.error('Erreur lors de la récupération des serveurs:', error);
    
    // Fallback : récupérer depuis le localStorage ou générer un serveur par défaut
    try {
      const savedServers = localStorage.getItem('wiremock-servers');
      if (savedServers) {
        const parsedServers = JSON.parse(savedServers);
        console.log("Serveurs récupérés du localStorage:", parsedServers);
        return parsedServers;
      }
    } catch (localStorageError) {
      console.error('Erreur lors de la récupération des serveurs du localStorage:', localStorageError);
    }
    
    // Serveur par défaut si le backend n'est pas disponible
    const defaultServers = [
      {
        id: 'default',
        ...DEFAULT_SERVER
      }
    ];
    
    console.log("Utilisation des serveurs par défaut:", defaultServers);
    localStorage.setItem('wiremock-servers', JSON.stringify(defaultServers));
    return defaultServers;
  }
};

// Fonction pour créer un nouveau serveur
export const createServer = async (server) => {
  try {
    // Vérifier que le serveur contient les propriétés nécessaires
    if (!server.name || !server.host || !server.port) {
      throw new Error('Le nom, l\'hôte et le port sont requis');
    }
    
    // Validation supplémentaire de l'hôte
    const validHostPattern = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)$/;
    if (!validHostPattern.test(server.host)) {
      throw new Error('L\'hôte est invalide. Utilisez un nom d\'hôte ou une adresse IP valide.');
    }
    
    // Vérifier et convertir le port en nombre si nécessaire
    const serverData = {
      ...server,
      port: parseInt(server.port, 10),
      allowDuplicate: true // Permettre les doublons
    };
    
    console.log("Création du serveur avec les données:", serverData);
    
    const response = await axios.post(`${API_BASE_URL}/servers`, serverData);
    console.log("Serveur créé:", response.data);
    
    // Mise à jour du localStorage
    try {
      const savedServers = localStorage.getItem('wiremock-servers');
      if (savedServers) {
        const parsedServers = JSON.parse(savedServers);
        parsedServers.push(response.data);
        localStorage.setItem('wiremock-servers', JSON.stringify(parsedServers));
      }
    } catch (localStorageError) {
      console.error('Erreur lors de la mise à jour des serveurs dans le localStorage:', localStorageError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création du serveur:', error);
    
    // Amélioration de la gestion des erreurs
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      const errorMessage = error.response.data.error || 'Erreur lors de la création du serveur';
      console.error('Détails de l\'erreur serveur:', error.response.status, error.response.data);
      throw new Error(errorMessage);
    } else if (error.request) {
      // La requête a été envoyée mais pas de réponse
      throw new Error('Le backend est inaccessible. Vérifiez qu\'il est bien démarré.');
    } else {
      // Autre type d'erreur
      throw error;
    }
  }
};

// Fonction pour mettre à jour un serveur existant
export const updateServer = async (serverId, server) => {
  try {
    // Vérifier que le serveur contient les propriétés nécessaires
    if (!server.name || !server.host || !server.port) {
      throw new Error('Le nom, l\'hôte et le port sont requis');
    }
    
    // Validation supplémentaire de l'hôte
    const validHostPattern = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)$/;
    if (!validHostPattern.test(server.host)) {
      throw new Error('L\'hôte est invalide. Utilisez un nom d\'hôte ou une adresse IP valide.');
    }
    
    // Vérifier et convertir le port en nombre si nécessaire
    const serverData = {
      ...server,
      port: parseInt(server.port, 10),
      allowDuplicate: true // Permettre les doublons
    };
    
    const response = await axios.put(`${API_BASE_URL}/servers/${serverId}`, serverData);
    console.log("Serveur mis à jour:", response.data);
    
    // Mise à jour du localStorage
    try {
      const savedServers = localStorage.getItem('wiremock-servers');
      if (savedServers) {
        let parsedServers = JSON.parse(savedServers);
        parsedServers = parsedServers.map(s => s.id === serverId ? response.data : s);
        localStorage.setItem('wiremock-servers', JSON.stringify(parsedServers));
      }
    } catch (localStorageError) {
      console.error('Erreur lors de la mise à jour des serveurs dans le localStorage:', localStorageError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du serveur:', error);
    
    // Amélioration de la gestion des erreurs
    if (error.response) {
      const errorMessage = error.response.data.error || 'Erreur lors de la mise à jour du serveur';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Le backend est inaccessible.');
    } else {
      throw error;
    }
  }
};

// Fonction pour supprimer un serveur
export const deleteServer = async (serverId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/servers/${serverId}`);
    console.log("Serveur supprimé:", response.data);
    
    // Mise à jour du localStorage
    try {
      const savedServers = localStorage.getItem('wiremock-servers');
      if (savedServers) {
        let parsedServers = JSON.parse(savedServers);
        parsedServers = parsedServers.filter(s => s.id !== serverId);
        localStorage.setItem('wiremock-servers', JSON.stringify(parsedServers));
      }
    } catch (localStorageError) {
      console.error('Erreur lors de la mise à jour des serveurs dans le localStorage:', localStorageError);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du serveur:', error);
    
    // Amélioration de la gestion des erreurs
    if (error.response) {
      const errorMessage = error.response.data.error || 'Erreur lors de la suppression du serveur';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Le backend est inaccessible.');
    } else {
      throw error;
    }
  }
};

// Fonction pour vérifier la disponibilité d'un serveur Wiremock
export const checkServerConnection = async (host, port) => {
  try {
    // Validation de l'hôte
    const validHostPattern = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)$/;
    if (!validHostPattern.test(host)) {
      return { 
        status: 'error', 
        message: 'L\'hôte est invalide. Utilisez un nom d\'hôte ou une adresse IP valide.',
      };
    }
    
    const response = await axios.post(`${API_BASE_URL}/servers/check-connection`, { host, port });
    return response.data;
  } catch (error) {
    console.error('Erreur de vérification de la connexion au serveur Wiremock:', error);
    
    if (error.response) {
      return { 
        status: 'error', 
        message: error.response.data.error || 'Erreur lors de la vérification de la connexion',
      };
    } else if (error.request) {
      return { 
        status: 'error', 
        message: 'Le backend est inaccessible',
      };
    } else {
      return { 
        status: 'error', 
        message: `Erreur: ${error.message}`,
      };
    }
  }
};