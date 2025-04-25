// cleanup.js - Créez ce fichier dans le répertoire racine du backend
const fs = require('fs');
const path = require('path');

// Chemins des fichiers de données
const DATA_DIR = path.join(__dirname, 'data');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');

// Serveur par défaut pour la réinitialisation
const defaultServer = {
  id: 'default',
  name: 'Wiremock Local',
  host: 'localhost',
  port: 9090,
  description: 'Serveur Wiremock local par défaut'
};

console.log('Début du nettoyage des données...');

// S'assurer que le dossier data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('Dossier data créé');
}

// Fonction de validation des serveurs
const isValidHost = (host) => {
  const validHostPattern = /^(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+)$/;
  return validHostPattern.test(host);
};

// Nettoyage du fichier servers.json
if (fs.existsSync(SERVERS_FILE)) {
  try {
    const serversData = JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf8'));
    console.log(`Nombre de serveurs avant nettoyage: ${serversData.length}`);
    
    // Filtrer les serveurs valides
    const validServers = serversData.filter(server => {
      const isValid = server && server.host && isValidHost(server.host);
      if (!isValid) {
        console.log(`Serveur invalide détecté: ${JSON.stringify(server)}`);
      }
      return isValid;
    });
    
    console.log(`Nombre de serveurs après nettoyage: ${validServers.length}`);
    
    // S'assurer qu'il y a au moins un serveur par défaut
    let hasDefaultServer = validServers.some(server => 
      server.host === 'localhost' && server.port === 9090
    );
    
    if (!hasDefaultServer) {
      console.log('Ajout du serveur par défaut');
      validServers.unshift(defaultServer);
    }
    
    // Écrire les serveurs valides
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(validServers, null, 2));
    console.log('Fichier servers.json nettoyé et sauvegardé');
    
  } catch (error) {
    console.error('Erreur lors du nettoyage du fichier servers.json:', error);
    console.log('Création d\'un nouveau fichier servers.json avec un serveur par défaut');
    fs.writeFileSync(SERVERS_FILE, JSON.stringify([defaultServer], null, 2));
  }
} else {
  console.log('Fichier servers.json non trouvé, création avec un serveur par défaut');
  fs.writeFileSync(SERVERS_FILE, JSON.stringify([defaultServer], null, 2));
}

console.log('Nettoyage des données terminé');