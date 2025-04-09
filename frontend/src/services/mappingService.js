import axios from 'axios';
import { API_BASE_URL } from '../config';

export const fetchMappings = async (serverId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/servers/${serverId}/mappings`);
    
    // Sauvegarder également dans le localStorage pour la persistance locale
    localStorage.setItem(`wiremock-mappings-${serverId}`, JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des mappings:', error);
    
    // Essayer de récupérer depuis le localStorage en cas d'erreur
    const savedMappings = localStorage.getItem(`wiremock-mappings-${serverId}`);
    if (savedMappings) {
      return JSON.parse(savedMappings);
    }
    
    throw error;
  }
};

export const addMapping = async (serverId, mappingData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/servers/${serverId}/mappings`, mappingData);
    
    // Mettre à jour également le localStorage
    const savedMappings = localStorage.getItem(`wiremock-mappings-${serverId}`);
    const mappings = savedMappings ? JSON.parse(savedMappings) : [];
    mappings.push(response.data);
    localStorage.setItem(`wiremock-mappings-${serverId}`, JSON.stringify(mappings));
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du mapping:', error);
    throw error;
  }
};

export const updateMapping = async (serverId, mappingId, mappingData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/servers/${serverId}/mappings/${mappingId}`, mappingData);
    
    // Mettre à jour également le localStorage
    const savedMappings = localStorage.getItem(`wiremock-mappings-${serverId}`);
    if (savedMappings) {
      const mappings = JSON.parse(savedMappings);
      const updatedMappings = mappings.map(mapping => 
        mapping.id === mappingId ? response.data : mapping
      );
      localStorage.setItem(`wiremock-mappings-${serverId}`, JSON.stringify(updatedMappings));
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mapping:', error);
    throw error;
  }
};

export const deleteMapping = async (serverId, mappingId) => {
  try {
    await axios.delete(`${API_BASE_URL}/servers/${serverId}/mappings/${mappingId}`);
    
    // Mettre à jour également le localStorage
    const savedMappings = localStorage.getItem(`wiremock-mappings-${serverId}`);
    if (savedMappings) {
      const mappings = JSON.parse(savedMappings);
      const updatedMappings = mappings.filter(mapping => mapping.id !== mappingId);
      localStorage.setItem(`wiremock-mappings-${serverId}`, JSON.stringify(updatedMappings));
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du mapping:', error);
    throw error;
  }
};