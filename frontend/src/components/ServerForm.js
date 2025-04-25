import React, { useState } from 'react';
import './ServerForm.css'; // Assurez-vous que ce fichier existe

const ServerForm = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('9090');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Validation côté client
      if (!name.trim()) {
        throw new Error('Le nom du serveur est requis');
      }
      
      if (!host.trim()) {
        throw new Error('L\'hôte est requis');
      }
      
      // Validation supplémentaire de l'hôte
      const validHostPattern = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)$/;
      if (!validHostPattern.test(host)) {
        throw new Error('L\'hôte est invalide. Utilisez un nom d\'hôte ou une adresse IP valide comme "localhost" ou "127.0.0.1"');
      }
      
      if (!port || isNaN(parseInt(port, 10))) {
        throw new Error('Le port doit être un nombre valide');
      }
      
      // Vérifier que le port est un entier positif
      const portNum = parseInt(port, 10);
      if (portNum <= 0 || portNum > 65535) {
        throw new Error('Le port doit être un nombre entre 1 et 65535');
      }
      
      const serverData = {
        name,
        host,
        port: portNum,
        description
      };
      
      console.log("Soumission du formulaire avec les données:", serverData);
      
      await onSubmit(serverData);
      
      // Réinitialiser le formulaire si tout va bien
      setName('');
      setHost('localhost');
      setPort('9090');
      setDescription('');
      
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Ajouter un serveur</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom du serveur</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="host">Hôte</label>
            <input
              type="text"
              id="host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="port">Port</label>
            <input
              type="number"
              id="port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              min="1"
              max="65535"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description (optionnelle)</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onCancel} 
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'En cours...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServerForm;