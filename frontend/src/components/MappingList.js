import React from 'react';

const MappingList = ({ mappings, onDeleteMapping, onEditMapping }) => {
  return (
    <div className="mapping-list">
      {mappings.length === 0 ? (
        <p className="no-mappings">Aucun mapping configuré pour ce dossier</p>
      ) : (
        <ul>
          {mappings.map(mapping => {
            // Déserialiser requestJson et responseJson si ce sont des chaînes
            let request = mapping.request;
            let response = mapping.response;
            
            try {
              if (mapping.requestJson && typeof mapping.requestJson === 'string') {
                request = JSON.parse(mapping.requestJson);
              }
              if (mapping.responseJson && typeof mapping.responseJson === 'string') {
                response = JSON.parse(mapping.responseJson);
              }
            } catch (e) {
              console.error('Erreur lors de la désérialisation du JSON:', e);
            }
            
            return (
              <li key={mapping.id}>
                <div className="mapping-item" onClick={() => onEditMapping(mapping)}>
                  <div className="mapping-header">
                    <span className="mapping-method">
                      {request?.method || 'ANY'}
                    </span>
                    <span className="mapping-url">
                      {request?.url || request?.urlPattern || '/'}
                    </span>
                  </div>
                  <div className="mapping-details">
                    <span className="mapping-status">Status: {response?.status || 200}</span>
                    {mapping.name && <span className="mapping-name">{mapping.name}</span>}
                    {mapping.path && <span className="mapping-path">Path: {mapping.path}</span>}
                  </div>
                </div>
                <button 
                  className="btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce mapping ?`)) {
                      onDeleteMapping(mapping.id);
                    }
                  }}
                >
                  🗑️
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MappingList;