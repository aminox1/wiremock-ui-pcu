// src/services/serverService.js
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const fetchServers = async () => {
  try {
    console.log(`Tentative de récupération des serveurs depuis: ${API_BASE_URL}/servers`);
    const response = await axios.get(`${API_BASE_URL}/servers`);
    console.log(`Serveurs récupérés avec succès, nombre: ${response.data.length}`);
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('wiremock-servers', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des serveurs:', error);
    
    // Essayer de récupérer depuis le localStorage en cas d'erreur
    const savedServers = localStorage.getItem('wiremock-servers');
    if (savedServers) {
      console.log('Utilisation des serveurs sauvegardés dans le localStorage');
      return JSON.parse(savedServers);
    }
    
    // Si rien n'est disponible dans le localStorage, retourner un tableau vide
    console.log('Aucun serveur disponible. Retour d\'un tableau vide.');
    return [];
  }
};

export const addServer = async (serverData) => {
  try {
    console.log(`Tentative d'ajout d'un serveur: ${serverData.name} - ${serverData.url}`);
    const response = await axios.post(`${API_BASE_URL}/servers`, serverData);
    console.log(`Serveur ajouté avec succès, ID: ${response.data.id}`);
    
    // Sauvegarder également dans le localStorage pour la persistance locale
    const savedServers = localStorage.getItem('wiremock-servers');
    const servers = savedServers ? JSON.parse(savedServers) : [];
    servers.push(response.data);
    localStorage.setItem('wiremock-servers', JSON.stringify(servers));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du serveur:', error);
    
    // Fallback : ajouter directement au localStorage
    console.log('Utilisation du localStorage comme fallback pour l\'ajout du serveur');
    const newServer = {
      id: Date.now().toString(), // ID temporaire
      name: serverData.name,
      url: serverData.url,
      createdAt: new Date().toISOString()
    };
    
    const savedServers = localStorage.getItem('wiremock-servers');
    const servers = savedServers ? JSON.parse(savedServers) : [];
    servers.push(newServer);
    localStorage.setItem('wiremock-servers', JSON.stringify(servers));
    
    console.log(`Serveur ajouté au localStorage, ID temporaire: ${newServer.id}`);
    return newServer;
  }
};

export const deleteServer = async (serverId) => {
  try {
    console.log(`Tentative de suppression du serveur: ${serverId}`);
    await axios.delete(`${API_BASE_URL}/servers/${serverId}`);
    console.log(`Serveur supprimé avec succès: ${serverId}`);
    
    // Mettre à jour également le localStorage
    const savedServers = localStorage.getItem('wiremock-servers');
    if (savedServers) {
      const servers = JSON.parse(savedServers);
      const updatedServers = servers.filter(server => server.id !== serverId);
      localStorage.setItem('wiremock-servers', JSON.stringify(updatedServers));
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du serveur:', error);
    
    // Fallback : supprimer directement du localStorage
    console.log('Utilisation du localStorage comme fallback pour la suppression du serveur');
    const savedServers = localStorage.getItem('wiremock-servers');
    if (savedServers) {
      const servers = JSON.parse(savedServers);
      const updatedServers = servers.filter(server => server.id !== serverId);
      localStorage.setItem('wiremock-servers', JSON.stringify(updatedServers));
    }
    
    return true;
  }
};