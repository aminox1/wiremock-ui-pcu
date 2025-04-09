import React, { useState, useEffect } from 'react';

const MappingForm = ({ mapping, isEditing, onSubmit, onCancel }) => {
  const [mappingData, setMappingData] = useState({
    name: '',
    request: {
      method: 'GET',
      url: '',
      headers: {},
      body: ''
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{}'
    }
  });

  const [newHeader, setNewHeader] = useState({ key: '', value: '' });
  const [responseHeaders, setResponseHeaders] = useState([]);
  const [requestHeaders, setRequestHeaders] = useState([]);

  useEffect(() => {
    if (isEditing && mapping) {
      // Convertir les en-têtes d'objet en tableau pour l'interface
      const reqHeaders = mapping.request.headers 
        ? Object.entries(mapping.request.headers).map(([key, value]) => ({ key, value }))
        : [];
      
      const respHeaders = mapping.response.headers 
        ? Object.entries(mapping.response.headers).map(([key, value]) => ({ key, value }))
        : [];

      setRequestHeaders(reqHeaders);
      setResponseHeaders(respHeaders);
      setMappingData(mapping);
    }
  }, [isEditing, mapping]);

  const handleChange = (e, section, field) => {
    const value = e.target.value;
    
    if (section) {
      setMappingData({
        ...mappingData,
        [section]: {
          ...mappingData[section],
          [field]: value
        }
      });
    } else {
      setMappingData({
        ...mappingData,
        [field]: value
      });
    }
  };

  const handleHeaderChange = (e, index, type) => {
    const { name, value } = e.target;
    if (type === 'request') {
      const updatedHeaders = [...requestHeaders];
      updatedHeaders[index] = {
        ...updatedHeaders[index],
        [name]: value
      };
      setRequestHeaders(updatedHeaders);
    } else {
      const updatedHeaders = [...responseHeaders];
      updatedHeaders[index] = {
        ...updatedHeaders[index],
        [name]: value
      };
      setResponseHeaders(updatedHeaders);
    }
  };

  const addHeader = (type) => {
    if (newHeader.key && newHeader.value) {
      if (type === 'request') {
        setRequestHeaders([...requestHeaders, { ...newHeader }]);
      } else {
        setResponseHeaders([...responseHeaders, { ...newHeader }]);
      }
      setNewHeader({ key: '', value: '' });
    }
  };

  const removeHeader = (index, type) => {
    if (type === 'request') {
      setRequestHeaders(requestHeaders.filter((_, i) => i !== index));
    } else {
      setResponseHeaders(responseHeaders.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convertir les tableaux d'en-têtes en objets
    const requestHeadersObj = requestHeaders.reduce((obj, header) => {
      obj[header.key] = header.value;
      return obj;
    }, {});
    
    const responseHeadersObj = responseHeaders.reduce((obj, header) => {
      obj[header.key] = header.value;
      return obj;
    }, {});
    
    const finalMappingData = {
      ...mappingData,
      request: {
        ...mappingData.request,
        headers: requestHeadersObj
      },
      response: {
        ...mappingData.response,
        headers: responseHeadersObj
      }
    };
    
    onSubmit(finalMappingData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal mapping-modal">
        <h2>{isEditing ? 'Modifier le mapping' : 'Ajouter un mapping'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom du mapping (optionnel)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={mappingData.name || ''}
              onChange={(e) => handleChange(e, null, 'name')}
            />
          </div>

          <h3>Requête</h3>
          <div className="form-group">
            <label htmlFor="request-method">Méthode</label>
            <select
              id="request-method"
              value={mappingData.request.method}
              onChange={(e) => handleChange(e, 'request', 'method')}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
              <option value="OPTIONS">OPTIONS</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="request-url">URL</label>
            <input
              type="text"
              id="request-url"
              value={mappingData.request.url || ''}
              onChange={(e) => handleChange(e, 'request', 'url')}
              required
            />
          </div>

          <div className="form-group">
            <label>En-têtes</label>
            {requestHeaders.map((header, index) => (
              <div key={index} className="header-row">
                <input
                  type="text"
                  name="key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(e, index, 'request')}
                  placeholder="Clé"
                />
                <input
                  type="text"
                  name="value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(e, index, 'request')}
                  placeholder="Valeur"
                />
                <button 
                  type="button" 
                  className="btn-remove-header"
                  onClick={() => removeHeader(index, 'request')}
                >
                  ❌
                </button>
              </div>
            ))}
            <div className="header-row">
              <input
                type="text"
                value={newHeader.key}
                onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
                placeholder="Nouvelle clé"
              />
              <input
                type="text"
                value={newHeader.value}
                onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
                placeholder="Nouvelle valeur"
              />
              <button 
                type="button" 
                className="btn-add-header"
                onClick={() => addHeader('request')}
              >
                ➕
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="request-body">Corps (optionnel)</label>
            <textarea
              id="request-body"
              value={mappingData.request.body || ''}
              onChange={(e) => handleChange(e, 'request', 'body')}
              rows="4"
            />
          </div>

          <h3>Réponse</h3>
          <div className="form-group">
            <label htmlFor="response-status">Code de statut</label>
            <input
              type="number"
              id="response-status"
              value={mappingData.response.status}
              onChange={(e) => handleChange(e, 'response', 'status')}
              required
            />
          </div>

          <div className="form-group">
            <label>En-têtes</label>
            {responseHeaders.map((header, index) => (
              <div key={index} className="header-row">
                <input
                  type="text"
                  name="key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(e, index, 'response')}
                  placeholder="Clé"
                />
                <input
                  type="text"
                  name="value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(e, index, 'response')}
                  placeholder="Valeur"
                />
                <button 
                  type="button" 
                  className="btn-remove-header"
                  onClick={() => removeHeader(index, 'response')}
                >
                  ❌
                </button>
              </div>
            ))}
            <div className="header-row">
              <input
                type="text"
                value={newHeader.key}
                onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
                placeholder="Nouvelle clé"
              />
              <input
                type="text"
                value={newHeader.value}
                onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
                placeholder="Nouvelle valeur"
              />
              <button 
                type="button" 
                className="btn-add-header"
                onClick={() => addHeader('response')}
              >
                ➕
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="response-body">Corps</label>
            <textarea
              id="response-body"
              value={mappingData.response.body || ''}
              onChange={(e) => handleChange(e, 'response', 'body')}
              rows="6"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Annuler
            </button>
            <button type="submit" className="btn-submit">
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MappingForm;
