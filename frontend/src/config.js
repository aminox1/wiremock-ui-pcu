// src/config.js
const API_BASE_URL = 'http://localhost:3001/api';

const DEFAULT_SERVER = {
  name: 'Wiremock Local',
  host: 'localhost',
  port: 9090,
  description: 'Serveur Wiremock local par défaut'
};

export {
  API_BASE_URL,
  DEFAULT_SERVER
};