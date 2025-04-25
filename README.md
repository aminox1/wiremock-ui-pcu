Voici votre README mis à jour en conservant vos captures d'écran et en intégrant les nouvelles informations :

```markdown
# WiremockUI - PCU

Une interface utilisateur pour gérer des serveurs Wiremock avec persistance des configurations, développée dans le cadre d'un stage sur la Prise de Commande Unifiée (PCU).

## Fonctionnalités

* Gestion des serveurs Wiremock (ajout, modification, suppression)
* Création et modification de mappings API
* Organisation hiérarchique des mappings avec structure de dossiers (LIZARD, OCM, TCRM, TMFAPI)
* Persistance des configurations après redémarrage de Wiremock
* Interface utilisateur moderne avec thèmes personnalisables
* Mode hors ligne pour travailler sans connexion à Wiremock
* Synchronisation des mappings avec le serveur Wiremock

## Captures d'écran

### Page d'accueil
![Page d'accueil](screenshots/La%20page%20d'accueil.jpg)

### Liste des serveurs
![Liste des serveurs](screenshots/La%20liste%20des%20serveurs.jpg)

### Liste des mappings
![Liste des mappings](screenshots/La%20liste%20des%20mappings.png)

### Ajout d'un serveur
![Ajout d'un serveur](screenshots/L'ajout%20d'un%20serveur.jpg)

### Ajout d'un mapping
![Ajout d'un mapping](screenshots/L'ajout%20d'un%20mapping.jpg)

### Modification d'un mapping
![Modification d'un mapping](screenshots/modification%20d'un%20mapping.jpg)

### Différents thèmes
![Différents thèmes](screenshots/Les%20différents%20thème.jpg)

## Installation

### Prérequis

* Node.js (v14+)
* Java Runtime Environment (pour exécuter Wiremock)
* Wiremock Standalone JAR (version 2.x ou 3.x)

### Installation et démarrage

1. Clonez ce dépôt :
   ```
   git clone https://github.com/aminox1/wiremock-ui-pcu.git
   cd wiremock-ui-pcu
   ```

2. Installez les dépendances :
   ```
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Démarrez le backend :
   ```
   cd backend
   npm start
   ```

4. Démarrez le frontend dans un autre terminal :
   ```
   cd frontend
   npm start
   ```

5. Démarrez Wiremock avec persistance pour que les mappings soient conservés après redémarrage :
   ```
   java -jar wiremock-standalone-X.X.X.jar --port 9090 --root-dir [chemin_vers_projet]/backend/data/mappings --verbose
   ```

   Remplacez `X.X.X` par votre version de Wiremock et `[chemin_vers_projet]` par le chemin absolu vers votre projet.

## Utilisation

1. Accédez à l'interface via http://localhost:3000
2. Ajoutez un serveur Wiremock en cliquant sur "Ajouter un serveur"
3. Sélectionnez un serveur dans la liste pour le gérer
4. Naviguez dans la structure de dossiers pour voir et gérer vos mappings
5. Créez un nouveau mapping en sélectionnant un dossier puis en cliquant sur "Ajouter un mapping"
6. Configurez votre mapping avec méthode HTTP, URL, code de statut et corps de réponse
7. Utilisez le bouton "Restaurer vers Wiremock" pour synchroniser tous les mappings avec le serveur Wiremock

## Structure du projet

### Frontend (React.js)
```
frontend/
  src/
    components/
      FolderTree.js      # Affichage hiérarchique des dossiers
      Header.js          # Entête de l'application
      MappingForm.js     # Formulaire de création/édition de mapping
      MappingList.js     # Liste des mappings
      ServerForm.js      # Formulaire d'ajout de serveur
      ServerList.js      # Liste des serveurs
      Settings.js        # Paramètres de l'application
    services/
      folderService.js   # Gestion des dossiers
      mappingService.js  # Gestion des mappings
      serverService.js   # Gestion des serveurs
    App.js               # Composant principal
    config.js            # Configuration de l'application
```

### Backend (Node.js)
```
backend/
  controllers/
    folderController.js  # Contrôleur des dossiers
    mappingController.js # Contrôleur des mappings
    serverController.js  # Contrôleur des serveurs
  data/
    mappings/            # Stockage des fichiers de mappings
    servers.json         # Configuration des serveurs
  server.js              # Serveur Express
  routes.js              # Définition des routes API
```

## Résolution des problèmes courants

### Erreur 422 lors de l'ajout de mappings
Si vous rencontrez une erreur 422 lors de l'ajout de mappings à Wiremock, assurez-vous que le format du corps de réponse est correct. Pour les réponses JSON, utilisez `jsonBody` au lieu de `body` dans les mappings.

### Mappings non persistants après redémarrage
Assurez-vous de démarrer Wiremock avec l'option `--root-dir` pointant vers le dossier `backend/data/mappings` de votre projet.

### Problèmes de connexion à Wiremock
Vérifiez que Wiremock est bien démarré sur le port spécifié dans la configuration du serveur (par défaut 9090).

## Technologies utilisées

* **Frontend**: React.js, Axios, CSS
* **Backend**: Node.js, Express, File System API
* **Wiremock**: Serveur mock HTTP pour simuler des API

## Contribution

Les contributions sont les bienvenues. N'hésitez pas à ouvrir une issue ou une pull request.
```
