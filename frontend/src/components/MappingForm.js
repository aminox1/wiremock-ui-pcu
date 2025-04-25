import React, { useState, useEffect } from 'react';
import './MappingForm.css';

// Fonction récursive pour afficher dossiers et sous-dossiers
const renderOpt = (arr, lvl = 0) =>
  arr.flatMap(({ path, children }) => {
    const indent = '\u00A0\u00A0'.repeat(lvl);
    return [
      <option key={path} value={path}>
        {indent + path.split('/').pop()}
      </option>,
      ...(children && children.length ? renderOpt(children, lvl + 1) : [])
    ];
  });

const MappingForm = ({ mapping, isEditing, selectedFolder, folders, offlineMode, onSubmit, onCancel }) => {
  console.log("MappingForm - folders:", folders);
  console.log("MappingForm - selectedFolder:", selectedFolder);
  
  const [name, setName] = useState('');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(200);
  const [responseBody, setResponseBody] = useState('');
  const [responseContentType, setResponseContentType] = useState('application/json');
  const [folderPath, setFolderPath] = useState('');
  const [error, setError] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser les états à partir du mapping existant ou du dossier sélectionné
  useEffect(() => {
    if (mapping) {
      setName(mapping.name || '');
      setMethod(mapping.request?.method || 'GET');
      setUrl(mapping.request?.url || '');
      setStatus(mapping.response?.status || 200);
      // Si response.body est un objet, le convertir en string JSON
      const initialBody = mapping.response?.body;
      if (initialBody != null && typeof initialBody === 'object') {
        setResponseBody(JSON.stringify(initialBody, null, 2));
      } else {
        setResponseBody(initialBody || '');
      }
      setResponseContentType(mapping.response?.headers?.['Content-Type'] || 'application/json');
      setFolderPath(mapping.folderPath || '');
    } else if (selectedFolder) {
      setFolderPath(selectedFolder.path);
    }
  }, [mapping, selectedFolder]);

  // Validation du JSON si le type de contenu est application/json
  useEffect(() => {
    if (responseContentType === 'application/json' && typeof responseBody === 'string' && responseBody.trim()) {
      try {
        JSON.parse(responseBody);
        setIsJsonValid(true);
      } catch (error) {
        setIsJsonValid(false);
      }
    } else {
      setIsJsonValid(true);
    }
  }, [responseBody, responseContentType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (!url.trim()) throw new Error("L'URL est requise");
      if (!url.startsWith('/')) throw new Error("L'URL doit commencer par un / (ex: /api/example)");
      if (responseContentType === 'application/json' && typeof responseBody === 'string' && responseBody.trim()) {
        JSON.parse(responseBody);
      }

      const mappingData = {
        id: mapping?.id,
        name: name || `Mapping for ${method} ${url}`,
        request: { method, url },
        response: {
          status: parseInt(status, 10),
          headers: { 'Content-Type': responseContentType }
        },
        folderPath
      };
      if (typeof responseBody === 'string' && responseBody.trim()) {
        mappingData.response.body =
          responseContentType === 'application/json'
            ? JSON.parse(responseBody)
            : responseBody;
      }

      await onSubmit(mappingData);
      console.log("Soumission réussie");
    } catch (err) {
      console.error('Erreur lors de la soumission du mapping :', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodOptions = ['GET','POST','PUT','DELETE','PATCH','OPTIONS','HEAD'];
  const contentTypeOptions = [
    'application/json', 'text/plain', 'text/html', 'application/xml', 'text/xml', 'application/x-www-form-urlencoded'
  ];

  return (
    <div className="modal-overlay">
      <div className="modal mapping-modal">
        <h2>{isEditing ? 'Modifier le mapping' : 'Ajouter un mapping'}</h2>
        {offlineMode && (
          <div className="warning-message">
            Mode hors ligne activé : Le mapping sera enregistré localement mais ne sera pas synchronisé avec Wiremock.
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Informations générales</h3>
            <div className="form-group">
              <label htmlFor="name">Nom (optionnel)</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Nom descriptif du mapping" disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label htmlFor="folderPath">Dossier</label>
              <select id="folderPath" value={folderPath} onChange={e => setFolderPath(e.target.value)} required disabled={isSubmitting}>
                <option value="">-- Sélectionner un dossier --</option>
                {renderOpt(folders)}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Requête</h3>
            <div className="form-row">
              <div className="form-group method-group">
                <label htmlFor="method">Méthode</label>
                <select id="method" value={method} onChange={e => setMethod(e.target.value)} required disabled={isSubmitting}>
                  {methodOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group url-group">
                <label htmlFor="url">URL</label>
                <input type="text" id="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="/api/example" required disabled={isSubmitting} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Réponse</h3>
            <div className="form-row">
              <div className="form-group status-group">
                <label htmlFor="status">Code de statut</label>
                <input type="number" id="status" value={status} onChange={e => setStatus(e.target.value)} min="100" max="599" required disabled={isSubmitting} />
              </div>
              <div className="form-group content-type-group">
                <label htmlFor="responseContentType">Type de contenu</label>
                <select id="responseContentType" value={responseContentType} onChange={e => setResponseContentType(e.target.value)} disabled={isSubmitting}>
                  {contentTypeOptions.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="responseBody">
                Corps de la réponse
                {responseContentType === 'application/json' && !isJsonValid && typeof responseBody === 'string' && responseBody.trim() && (
                  <span className="validation-error"> – JSON invalide</span>
                )}
              </label>
              <textarea
                id="responseBody"
                value={responseBody}
                onChange={e => setResponseBody(e.target.value)}
                rows="10"
                className={responseContentType === 'application/json' && !isJsonValid ? 'invalid-json' : ''}
                placeholder={responseContentType === 'application/json' ? '{"example": "value"}' : 'Corps de la réponse'}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel} disabled={isSubmitting}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting || (responseContentType === 'application/json' && !isJsonValid && typeof responseBody === 'string' && responseBody.trim())}>
              {isSubmitting ? 'En cours...' : isEditing ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MappingForm;
