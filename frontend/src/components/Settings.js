// src/components/Settings.js
import React from 'react';

const Settings = ({ onClose, onThemeChange, currentTheme }) => {
  const themes = [
    { id: 'black', name: 'Black' },
    { id: 'colorized-dark', name: 'Colorized Dark' },
    { id: 'white', name: 'White' }
  ];

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Settings</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="settings-section">
        <h4>THEME</h4>
        <ul className="theme-list">
          {themes.map(theme => (
            <li 
              key={theme.id}
              className={currentTheme === theme.id ? 'selected' : ''}
              onClick={() => onThemeChange(theme.id)}
            >
              {theme.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Settings;