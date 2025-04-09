// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import ServerList from './components/ServerList';
import ServerForm from './components/ServerForm';
import MappingList from './components/MappingList';
import MappingForm from './components/MappingForm';
import { fetchServers, addServer, deleteServer } from './services/serverService';
import { fetchMappings, addMapping, deleteMapping, updateMapping } from './services/mappingService';

function App() {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [showServerForm, setShowServerForm] = useState(false);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Charger les serveurs au démarrage
  useEffect(() => {
    loadServers();
  }, []);

  // Charger les mappings lorsqu'un serveur est sélectionné
  useEffect(() => {
    if (selectedServer) {
      loadMappings(selectedServer.id);
    }
  }, [selectedServer]);

  const loadServers = async () => {
    try {
      const data = await fetchServers();
      setServers(data);
      
      // Si aucun serveur n'est sélectionné et qu'il y a des serveurs disponibles, sélectionner le premier
      if (!selectedServer && data.length > 0) {
        setSelectedServer(data[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des serveurs:', error);
    }
  };

  const loadMappings = async (serverId) => {
    try {
      const data = await fetchMappings(serverId);
      setMappings(data);
    } catch (error) {
      console.error('Erreur lors du chargement des mappings:', error);
    }
  };

  const handleAddServer = async (serverData) => {
    try {
      const newServer = await addServer(serverData);
      setServers([...servers, newServer]);
      setShowServerForm(false);
      setSelectedServer(newServer); // Sélectionner automatiquement le nouveau serveur
    } catch (error) {
      console.error('Erreur lors de l\'ajout du serveur:', error);
    }
  };

  const handleDeleteServer = async (serverId) => {
    try {
      await deleteServer(serverId);
      const updatedServers = servers.filter(server => server.id !== serverId);
      setServers(updatedServers);
      
      // Si le serveur supprimé était sélectionné, réinitialiser la sélection
      if (selectedServer && selectedServer.id === serverId) {
        setSelectedServer(updatedServers.length > 0 ? updatedServers[0] : null);
        setMappings([]);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du serveur:', error);
    }
  };

  const handleAddMapping = async (mappingData) => {
    try {
      const newMapping = await addMapping(selectedServer.id, mappingData);
      setMappings([...mappings, newMapping]);
      setShowMappingForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du mapping:', error);
    }
  };

  const handleUpdateMapping = async (mappingId, mappingData) => {
    try {
      const updatedMapping = await updateMapping(selectedServer.id, mappingId, mappingData);
      const updatedMappings = mappings.map(mapping => 
        mapping.id === mappingId ? updatedMapping : mapping
      );
      setMappings(updatedMappings);
      setShowMappingForm(false);
      setIsEditing(false);
      setSelectedMapping(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mapping:', error);
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    try {
      await deleteMapping(selectedServer.id, mappingId);
      setMappings(mappings.filter(mapping => mapping.id !== mappingId));
    } catch (error) {
      console.error('Erreur lors de la suppression du mapping:', error);
    }
  };

  const handleEditMapping = (mapping) => {
    setSelectedMapping(mapping);
    setIsEditing(true);
    setShowMappingForm(true);
  };

  return (
    <div className="app-container">
      <Header />
      
      <div className="app-content">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Serveurs</h2>
            <button onClick={() => setShowServerForm(true)}>Ajouter un serveur</button>
          </div>
          
          <ServerList 
            servers={servers} 
            selectedServer={selectedServer} 
            onSelectServer={setSelectedServer}
            onDeleteServer={handleDeleteServer}
          />
          
          {showServerForm && (
            <ServerForm 
              onSubmit={handleAddServer} 
              onCancel={() => setShowServerForm(false)} 
            />
          )}
        </div>
        
        <div className="main-content">
          {selectedServer ? (
            <>
              <div className="mappings-header">
                <h2>Mappings - {selectedServer.name}</h2>
                <button onClick={() => {
                  setSelectedMapping(null);
                  setIsEditing(false);
                  setShowMappingForm(true);
                }}>
                  Ajouter un mapping
                </button>
              </div>
              
              <MappingList 
                mappings={mappings} 
                onDeleteMapping={handleDeleteMapping}
                onEditMapping={handleEditMapping}
              />
              
              {showMappingForm && (
                <MappingForm 
                  mapping={isEditing ? selectedMapping : null}
                  isEditing={isEditing}
                  onSubmit={isEditing 
                    ? (data) => handleUpdateMapping(selectedMapping.id, data)
                    : handleAddMapping
                  } 
                  onCancel={() => {
                    setShowMappingForm(false);
                    setIsEditing(false);
                    setSelectedMapping(null);
                  }} 
                />
              )}
            </>
          ) : (
            <div className="no-server-selected">
              <p>Veuillez sélectionner un serveur ou en créer un nouveau.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;