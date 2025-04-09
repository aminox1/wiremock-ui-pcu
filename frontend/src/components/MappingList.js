import React from 'react';

const MappingList = ({ mappings, onDeleteMapping, onEditMapping }) => {
  return (
    <div className="mapping-list">
      {mappings.length === 0 ? (
        <p className="no-mappings">Aucun mapping configuré pour ce serveur</p>
      ) : (
        <ul>
          {mappings.map(mapping => (
            <li key={mapping.id}>
              <div className="mapping-item" onClick={() => onEditMapping(mapping)}>
                <div className="mapping-header">
                  <span className="mapping-method">{mapping.request.method}</span>
                  <span className="mapping-url">{mapping.request.url || mapping.request.urlPattern}</span>
                </div>
                <div className="mapping-details">
                  <span className="mapping-status">Status: {mapping.response.status}</span>
                  {mapping.name && <span className="mapping-name">{mapping.name}</span>}
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
          ))}
        </ul>
      )}
    </div>
  );
};

export default MappingList;