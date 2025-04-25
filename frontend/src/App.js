import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import ServerList from './components/ServerList';
import ServerForm from './components/ServerForm';
import MappingList from './components/MappingList';
import MappingForm from './components/MappingForm';
import FolderTree from './components/FolderTree';
import Settings from './components/Settings';
import { fetchServers, createServer, deleteServer } from './services/serverService';
import { 
  fetchMappings, 
  addMapping, 
  deleteMapping, 
  updateMapping, 
  fetchMappingsByFolder,
  restoreMappings 
} from './services/mappingService';
import { fetchFolderStructure, buildFolderStructureFromMappings, buildDefaultFolderStructure } from './services/folderService';

function App() {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [showServerForm, setShowServerForm] = useState(false);
  const [showMappingForm, setShowMappingForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction loadServers avec useCallback pour éviter des recréations inutiles
  const loadServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchServers();
      console.log("Serveurs chargés:", data);
      
      if (!data || data.length === 0) {
        console.log("Aucun serveur trouvé ou données de serveurs vides");
      }
      
      // Force le composant à reconnaître un nouveau tableau
      setServers([...data]);
      
      // Si aucun serveur n'est sélectionné et qu'il y a des serveurs disponibles, sélectionner le premier
      if (!selectedServer && data && data.length > 0) {
        setSelectedServer(data[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des serveurs:', error);
      setError('Impossible de charger les serveurs');
    } finally {
      setIsLoading(false);
    }
  }, [selectedServer]);

  // Fonction loadFolders avec useCallback
  const loadFolders = useCallback(async (serverId) => {
    setIsLoading(true);
    try {
      console.log("Chargement des dossiers pour le serveur:", serverId);
      
      // Essayer de récupérer la structure de dossiers depuis le backend
      let folderStructure = await fetchFolderStructure(serverId);
      
      // Si la structure est vide, essayer de la construire à partir des mappings
      if (!folderStructure || folderStructure.length === 0) {
        console.log("Aucune structure de dossiers trouvée, création à partir des mappings");
        const allMappings = await fetchMappings(serverId);
        folderStructure = buildFolderStructureFromMappings(allMappings);
        
        // Si toujours aucun dossier, utiliser la structure par défaut
        if (!folderStructure || folderStructure.length === 0) {
          console.log("Création d'une structure de dossiers par défaut");
          folderStructure = buildDefaultFolderStructure();
        }
      }
      
      console.log("Structure de dossiers chargée:", folderStructure);
      setFolders(folderStructure);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
      console.log("Utilisation de la structure de dossiers par défaut");
      setFolders(buildDefaultFolderStructure());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction loadMappingsByFolder avec useCallback
  const loadMappingsByFolder = useCallback(async (serverId, folderPath) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`Chargement des mappings pour le dossier ${folderPath} du serveur ${serverId}`);
      const folderMappings = await fetchMappingsByFolder(serverId, folderPath);
      console.log("Mappings chargés:", folderMappings.length);
      setMappings(folderMappings);
    } catch (error) {
      console.error('Erreur lors du chargement des mappings du dossier:', error);
      setMappings([]);
      setError(`Impossible de charger les mappings pour le dossier ${folderPath}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les serveurs au démarrage
  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // Charger la structure de dossiers lorsqu'un serveur est sélectionné
  useEffect(() => {
    if (selectedServer) {
      loadFolders(selectedServer.id);
      // Réinitialiser le dossier et les mappings sélectionnés
      setSelectedFolder(null);
      setMappings([]);
    }
  }, [selectedServer, loadFolders]);

  // Charger les mappings lorsqu'un dossier est sélectionné
  useEffect(() => {
    if (selectedServer && selectedFolder) {
      loadMappingsByFolder(selectedServer.id, selectedFolder.path);
    }
  }, [selectedServer, selectedFolder, loadMappingsByFolder]);

  // Fonction handleAddServer modifiée
  const handleAddServer = async (serverData) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Ajout d'un serveur:", serverData);
      
      const newServer = await createServer(serverData);
      console.log("Serveur ajouté avec succès:", newServer);
      
      // Mettre à jour la liste des serveurs en créant un nouveau tableau
      const updatedServers = [...servers, newServer];
      console.log("Liste des serveurs mise à jour:", updatedServers);
      
      // Mettre à jour l'état
      setServers(updatedServers);
      
      // Sauvegarder dans localStorage comme fallback
      localStorage.setItem('wiremock-servers', JSON.stringify(updatedServers));
      
      setShowServerForm(false);
      setSelectedServer(newServer); // Sélectionner automatiquement le nouveau serveur
      
      // Forcer un rechargement complet des serveurs
      setTimeout(() => {
        loadServers();
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du serveur:', error);
      setError(`Impossible d'ajouter le serveur: ${error.message}`);
      // Ne pas fermer le formulaire en cas d'erreur pour permettre à l'utilisateur de corriger
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction handleDeleteServer modifiée
  const handleDeleteServer = async (serverId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce serveur ?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await deleteServer(serverId);
      
      // Filtrer les serveurs pour retirer celui qui a été supprimé
      const updatedServers = servers.filter(server => server.id !== serverId);
      console.log("Liste des serveurs après suppression:", updatedServers);
      
      // Mettre à jour l'état avec un nouveau tableau
      setServers([...updatedServers]);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('wiremock-servers', JSON.stringify(updatedServers));
      
      // Si le serveur supprimé était sélectionné, réinitialiser la sélection
      if (selectedServer && selectedServer.id === serverId) {
        setSelectedServer(updatedServers.length > 0 ? updatedServers[0] : null);
        setSelectedFolder(null);
        setMappings([]);
      }
      
      // Afficher un message de succès
      alert('Le serveur a été supprimé avec succès.');
      
    } catch (error) {
      console.error('Erreur lors de la suppression du serveur:', error);
      setError('Impossible de supprimer le serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMapping = async (mappingData) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("handleAddMapping appelé avec:", mappingData);
      
      // Vérifier si un dossier est spécifié, sinon utiliser le dossier sélectionné ou "LIZARD" par défaut
      const folderPath = mappingData.folderPath || (selectedFolder ? selectedFolder.path : "LIZARD");
      
      console.log("Ajout d'un mapping dans le dossier:", folderPath);
      
      // Vérifier l'URL
      if (mappingData.request && mappingData.request.url) {
        if (!mappingData.request.url.startsWith('/')) {
          throw new Error("L'URL doit commencer par un / (exemple: /api/example)");
        }
        
        if (mappingData.request.url.includes(' ')) {
          throw new Error("L'URL ne doit pas contenir d'espaces");
        }
      }
      
      // Supprimer folderPath de l'objet mapping s'il existe
      const { folderPath: _, ...mappingOnly } = mappingData;
      
      // Ajouter le mapping avec le chemin du dossier comme paramètre séparé
      const newMapping = await addMapping(
        selectedServer.id, 
        mappingOnly,
        folderPath
      );
      
      console.log("Mapping ajouté avec succès:", newMapping);
      
      // Mettre à jour la liste des mappings si le nouveau mapping est dans le dossier courant
      if (selectedFolder && (newMapping.folderPath === selectedFolder.path)) {
        setMappings([...mappings, newMapping]);
      }
      
      setShowMappingForm(false);
      
      // Afficher un message de succès
      alert('Le mapping a été ajouté avec succès!');
      
    } catch (error) {
      console.error('Erreur complète lors de l\'ajout du mapping:', error);
      
      // Afficher un message d'erreur détaillé
      let errorMessage = 'Impossible d\'ajouter le mapping';
      
      if (error.response && error.response.data) {
        errorMessage += ': ' + (error.response.data.details || error.response.data.error || error.message);
      } else {
        errorMessage += ': ' + error.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMapping = async (mappingId, mappingData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Vérifier l'URL
      if (mappingData.request && mappingData.request.url) {
        if (!mappingData.request.url.startsWith('/')) {
          throw new Error("L'URL doit commencer par un / (exemple: /api/example)");
        }
        
        if (mappingData.request.url.includes(' ')) {
          throw new Error("L'URL ne doit pas contenir d'espaces");
        }
      }
      
      // Vérifier si un dossier est spécifié, sinon utiliser le dossier sélectionné ou garder l'existant
      const folderPath = mappingData.folderPath || (selectedFolder ? selectedFolder.path : null);
      
      console.log("Mise à jour du mapping dans le dossier:", folderPath);
      
      // Supprimer folderPath de l'objet mapping s'il existe
      const { folderPath: _, ...mappingOnly } = mappingData;
      
      // Mettre à jour le mapping
      const updatedMapping = await updateMapping(
        selectedServer.id, 
        mappingId, 
        mappingOnly,
        folderPath
      );
      
      // Mettre à jour la liste des mappings si le mapping mis à jour est toujours dans le dossier courant
      if (selectedFolder && updatedMapping.folderPath === selectedFolder.path) {
        const updatedMappings = mappings.map(mapping => 
          mapping.id === mappingId ? updatedMapping : mapping
        );
        setMappings(updatedMappings);
      } else {
        // Si le mapping a été déplacé vers un autre dossier, le retirer de la liste courante
        setMappings(mappings.filter(mapping => mapping.id !== mappingId));
      }
      
      setShowMappingForm(false);
      setIsEditing(false);
      setSelectedMapping(null);
      
      // Afficher un message de succès
      alert('Le mapping a été mis à jour avec succès!');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mapping:', error);
      let errorMessage = 'Impossible de mettre à jour le mapping';
      
      if (error.response && error.response.data) {
        errorMessage += ': ' + (error.response.data.details || error.response.data.error || error.message);
      } else {
        errorMessage += ': ' + error.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMapping = async (mappingId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce mapping ?')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await deleteMapping(selectedServer.id, mappingId);
      setMappings(mappings.filter(mapping => mapping.id !== mappingId));
      alert('Le mapping a été supprimé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la suppression du mapping:', error);
      let errorMessage = 'Impossible de supprimer le mapping';
      
      if (error.response && error.response.data) {
        errorMessage += ': ' + (error.response.data.details || error.response.data.error || error.message);
      } else {
        errorMessage += ': ' + error.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour restaurer les mappings
  const handleRestoreMappings = async () => {
    try {
      if (!selectedServer) {
        alert('Veuillez sélectionner un serveur');
        return;
      }
      
      if (!window.confirm('Êtes-vous sûr de vouloir restaurer tous les mappings vers le serveur Wiremock ? Cette action peut prendre du temps.')) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Afficher un message de chargement
      const loadingMessage = 'Restauration des mappings en cours, veuillez patienter...';
      alert(loadingMessage);
      
      // Appeler l'API de restauration via notre service
      const result = await restoreMappings(selectedServer.id);
      
      alert(`Restauration terminée. ${result.restored} mappings restaurés avec succès, ${result.failed} échecs.`);
      
      // Recharger les dossiers et mappings
      await loadFolders(selectedServer.id);
      if (selectedFolder) {
        await loadMappingsByFolder(selectedServer.id, selectedFolder.path);
      }
    } catch (error) {
      console.error('Erreur lors de la restauration des mappings:', error);
      let errorMessage = 'Erreur lors de la restauration des mappings';
      
      if (error.response && error.response.data) {
        errorMessage += ': ' + (error.response.data.details || error.response.data.error || error.message);
      } else {
        errorMessage += ': ' + error.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMapping = (mapping) => {
    setSelectedMapping(mapping);
    setIsEditing(true);
    setShowMappingForm(true);
  };

  const handleSelectFolder = (folder) => {
    console.log("Dossier sélectionné:", folder);
    setSelectedFolder(folder);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleThemeChange = (theme) => {
    // Supprimer toutes les classes de thème existantes
    document.body.classList.remove('theme-white', 'theme-black', 'theme-colorized-dark');
    
    // Ajouter la classe du nouveau thème
    if (theme !== 'theme-white') {
      document.body.classList.add(theme);
    }
    
    // Sauvegarder le thème dans le localStorage
    localStorage.setItem('wiremock-ui-theme', theme);
  };

  return (
    <div className="app-container">
      <Header 
        onToggleSettings={toggleSettings}
      />
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Chargement en cours...</div>
        </div>
      )}
      
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {showSettings && (
        <Settings 
          onClose={toggleSettings}
          onThemeChange={handleThemeChange}
        />
      )}
      
      <div className="app-content">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Serveurs</h2>
            <div className="header-buttons">
              <button onClick={() => setShowServerForm(true)}>Ajouter un serveur</button>
              <button 
                onClick={loadServers} 
                title="Rafraîchir la liste des serveurs"
                className="refresh-button"
              >
                ⟳
              </button>
            </div>
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
          
          {selectedServer && (
            <FolderTree 
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={handleSelectFolder}
            />
          )}
        </div>
        
        <div className="main-content">
          {selectedServer ? (
            <>
              <div className="content-header">
                <h2>
                  Mappings - {selectedServer.name}
                  {selectedFolder && (
                    <span className="selected-folder-path">
                      {` › ${selectedFolder.path}`}
                    </span>
                  )}
                </h2>
                
                <div className="header-actions">
                  {selectedFolder && (
                    <button onClick={() => {
                      setSelectedMapping(null);
                      setIsEditing(false);
                      setShowMappingForm(true);
                    }}>
                      Ajouter un mapping
                    </button>
                  )}
                  
                  <button 
                    onClick={handleRestoreMappings}
                    className="btn-restore"
                    disabled={isLoading}
                  >
                    Restaurer vers Wiremock
                  </button>
                </div>
              </div>
              
              {selectedFolder ? (
                <MappingList 
                  mappings={mappings} 
                  onDeleteMapping={handleDeleteMapping}
                  onEditMapping={handleEditMapping}
                />
              ) : (
                <div className="no-folder-selected">
                  <p>Veuillez sélectionner un dossier pour afficher les mappings.</p>
                </div>
              )}
              
              {showMappingForm && (
                <MappingForm 
                  mapping={isEditing ? selectedMapping : null}
                  isEditing={isEditing}
                  selectedFolder={selectedFolder}
                  folders={folders}
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