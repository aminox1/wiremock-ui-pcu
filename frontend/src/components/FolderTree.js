import React, { useState, useEffect } from 'react';
import './FolderTree.css';

const FolderTree = ({ folders, selectedFolder, onSelectFolder }) => {
  const [expandedFolders, setExpandedFolders] = useState({});

  // Initialiser les dossiers racine comme développés
  useEffect(() => {
    if (folders && folders.length > 0) {
      const initialExpanded = {};
      folders.forEach(folder => {
        initialExpanded[folder.path] = true;
      });
      setExpandedFolders(initialExpanded);
    }
  }, [folders]);

  const toggleFolder = (folderPath, event) => {
    event.stopPropagation();
    setExpandedFolders({
      ...expandedFolders,
      [folderPath]: !expandedFolders[folderPath]
    });
  };

  const renderFolder = (folder) => {
    const isExpanded = expandedFolders[folder.path];
    const isSelected = selectedFolder && selectedFolder.path === folder.path;
    
    return (
      <li key={folder.path}>
        <div 
          className={`folder ${isExpanded ? 'expanded' : 'collapsed'} ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelectFolder(folder)}
        >
          <span 
            className="folder-toggle"
            onClick={(e) => toggleFolder(folder.path, e)}
          >
            {folder.children && folder.children.length > 0 ? (isExpanded ? '▼' : '►') : ''}
          </span>
          <span className="folder-icon">📁</span>
          <span className="folder-name">{folder.name}</span>
        </div>
        
        {isExpanded && folder.children && folder.children.length > 0 && (
          <ul className="subfolder-list">
            {folder.children.map(childFolder => renderFolder(childFolder))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="folder-tree">
      <h3>Dossiers</h3>
      {folders && folders.length > 0 ? (
        <ul className="root-folder-list">
          {folders.map(folder => renderFolder(folder))}
        </ul>
      ) : (
        <p>Aucun dossier disponible</p>
      )}
    </div>
  );
};

export default FolderTree;