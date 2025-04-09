import React from 'react';

const ServerList = ({ servers, selectedServer, onSelectServer, onDeleteServer }) => {
  return (
    <div className="server-list">
      {servers.length === 0 ? (
        <p className="no-servers">Aucun serveur configuré</p>
      ) : (
        <ul>
          {servers.map(server => (
            <li 
              key={server.id}
              className={selectedServer && selectedServer.id === server.id ? 'selected' : ''}
            >
              <div className="server-item" onClick={() => onSelectServer(server)}>
                <span className="server-name">{server.name}</span>
                <span className="server-url">{server.url}</span>
              </div>
              <button 
                className="btn-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer le serveur ${server.name} ?`)) {
                    onDeleteServer(server.id);
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

export default ServerList;