import React from 'react';
import './ServerList.css';

const ServerList = ({ servers, selectedServer, onSelectServer, onDeleteServer }) => {
  // Ajouter un log pour déboguer
  console.log("Serveurs dans ServerList:", servers);
  
  return (
    <div className="server-list">
      {servers && servers.length > 0 ? (
        <div>
          {servers.map(server => (
            <div 
              key={server.id} 
              className={`server-item ${selectedServer && selectedServer.id === server.id ? 'selected' : ''}`}
              onClick={() => onSelectServer(server)}
            >
              <div className="server-info">
                <div className="server-name">{server.name}</div>
                <div className="server-url">http://{server.host}:{server.port}</div>
              </div>
              <button 
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteServer(server.id);
                }}
              >
                &#128465;
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-servers">
          <p>Aucun serveur configuré</p>
        </div>
      )}
    </div>
  );
};

export default ServerList;