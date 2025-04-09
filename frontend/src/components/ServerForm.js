import React, { useState } from 'react';

const ServerForm = ({ onSubmit, onCancel }) => {
  const [serverData, setServerData] = useState({
    name: '',
    url: 'http://localhost:8080'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServerData({
      ...serverData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(serverData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Ajouter un serveur</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom du serveur</label>
            <input
              type="text"
              id="name"
              name="name"
              value={serverData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="url">URL du serveur</label>
            <input
              type="text"
              id="url"
              name="url"
              value={serverData.url}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Annuler
            </button>
            <button type="submit" className="btn-submit">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServerForm;