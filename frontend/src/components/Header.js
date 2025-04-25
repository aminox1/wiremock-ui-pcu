import React, { useState, useEffect } from 'react';
import Settings from './Settings';

const Header = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Récupérer le thème sauvegardé dans localStorage, ou utiliser 'white' par défaut
    return localStorage.getItem('wiremock-ui-theme') || 'white';
  });

  const handleThemeChange = (themeId) => {
    // Supprimer les classes de thème précédentes
    document.body.classList.remove('theme-black', 'theme-colorized-dark', 'theme-white');
    
    // Ajouter la nouvelle classe de thème
    document.body.classList.add(`theme-${themeId}`);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('wiremock-ui-theme', themeId);
    
    // Mettre à jour l'état
    setCurrentTheme(themeId);
  };

  // Appliquer le thème au chargement du composant
  useEffect(() => {
    handleThemeChange(currentTheme);
  }, [currentTheme]);

  return (
    <header className="app-header">
      <div className="logo">
        <span className="icon">📱</span>
        <h1>WiremockUI - PCU</h1>
      </div>
      <div className="header-actions">
        <button 
          className="btn-settings"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ Paramètres
        </button>
        <a 
          href="https://github.com/aminox1/wiremock-ui-pcu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-github"
        >
          GitHub
        </a>
      </div>
      
      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)}
          onThemeChange={handleThemeChange}
          currentTheme={currentTheme}
        />
      )}
    </header>
  );
};

export default Header;