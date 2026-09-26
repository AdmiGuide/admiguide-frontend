# AdmiGuide Frontend

Interface web de **AdmiGuide**, une application intelligente d’orientation administrative destinée à accompagner les usagers dans l’identification et le suivi de démarches administratives sénégalaises.

Ce projet constitue la partie frontend de l’application. Il permet à l’usager de décrire sa situation, répondre aux éventuelles questions complémentaires, consulter son orientation et suivre les étapes de sa démarche. Il fournit également un espace personnel et une interface d’administration.

## Fonctionnalités principales

### Espace usager

- Consultation de la page d’accueil
- Création d’un compte
- Connexion et déconnexion
- Gestion du profil utilisateur
- Description libre d’une situation administrative
- Saisie du pays de résidence
- Réponse aux questions complémentaires
- Affichage du résultat de l’orientation
- Affichage des étapes, pièces, service compétent, coûts et délais disponibles
- Consultation des sources officielles
- Gestion du cas où les sources sont insuffisantes
- Signalement d’un problème lié à une orientation
- Consultation de l’historique des orientations
- Suivi de la progression d’une démarche
- Possibilité de cocher ou décocher les étapes réalisées

### Espace administrateur

- Tableau de bord d’administration
- Consultation des utilisateurs
- Recherche et filtrage des utilisateurs
- Suspension et réactivation d’un compte
- Consultation des sources administratives
- Recherche et filtrage des sources
- Examen et mise à jour du statut d’une source
- Consultation des signalements
- Recherche et filtrage des signalements
- Mise à jour du traitement d’un signalement

## Technologies utilisées

- Angular 22
- TypeScript
- RxJS
- Angular Router
- Angular HttpClient
- Tailwind CSS 4
- Lucide Angular
- Inter
- Vitest
- Nginx
- Docker

## Architecture

Le frontend Angular communique avec le backend Django par API REST.

```text
Utilisateur
     |
     v
Angular 22
     |
     | API REST / JSON
     v
Django REST Framework
     |
     +------> MySQL
     |
     v
AdmiGuide AI
FastAPI + RAG + LLM
```

Angular n’appelle pas directement le microservice d’intelligence artificielle.

Toutes les demandes liées à l’orientation passent d’abord par le backend Django, qui communique ensuite avec `admiguide-ai`.

## Parcours d’orientation

Le parcours principal fonctionne de la manière suivante :

```text
Description de la situation
          |
          v
Analyse de la situation
          |
          +----------------------------+
          |                            |
          v                            v
Précisions requises              Sources insuffisantes
          |
          v
Réponses complémentaires
          |
          v
Orientation obtenue
          |
          v
Résultat de la démarche
          |
          v
Suivi des étapes
```

Le résultat peut notamment contenir :

- le nom de la démarche ;
- un résumé de la situation ;
- les étapes à suivre ;
- les pièces nécessaires ;
- le service compétent ;
- les coûts et délais lorsqu’ils sont disponibles ;
- les sources officielles correspondantes.

## Authentification

L’authentification repose sur des tokens JWT fournis par le backend Django.

Après connexion, Angular conserve :

```text
Access token
Refresh token
```

Un interceptor HTTP ajoute automatiquement l’access token aux requêtes qui nécessitent une authentification.

Lorsque l’access token expire, l’application peut utiliser le refresh token pour obtenir un nouveau token puis rejouer la requête initiale.

Deux guards protègent les espaces privés :

```text
authGuard
```

Il protège l’espace personnel des utilisateurs.

```text
adminGuard
```

Il réserve l’espace d’administration aux comptes administrateurs.

## Structure principale

```text
admiguide-frontend/
|
|-- public/                    # Ressources statiques
|
|-- src/
|   |
|   |-- app/
|   |   |
|   |   |-- components/       # Composants réutilisables
|   |   |-- data/             # Données statiques de l'application
|   |   |-- guards/           # Protection des routes
|   |   |-- interceptors/     # Gestion automatique des requêtes JWT
|   |   |-- layouts/          # Layout utilisateur et administrateur
|   |   |-- models/           # Interfaces et modèles TypeScript
|   |   |-- pages/            # Pages de l'application
|   |   |-- services/         # Communication avec l'API Django
|   |   |
|   |   |-- app.config.ts
|   |   `-- app.routes.ts
|   |
|   |-- environments/
|   |-- styles.css
|   `-- main.ts
|
|-- Dockerfile
|-- nginx.conf
|-- angular.json
|-- package.json
|-- package-lock.json
`-- README.md
```

## Pages principales

L’application contient notamment les pages suivantes :

```text
Accueil
Connexion
Inscription
Orientation
Précisions complémentaires
Sources insuffisantes
Résultat de l'orientation
Suivi de la démarche
Historique
Profil

Administration
├── Vue d'ensemble
├── Utilisateurs
├── Sources
└── Signalements
```

## Services Angular

La communication avec Django est organisée autour de plusieurs services.

### AuthService

Gère notamment :

- l’inscription ;
- la connexion ;
- les tokens JWT ;
- le rafraîchissement du token ;
- la restauration de session ;
- le profil ;
- la déconnexion.

### OrientationService

Gère :

- la création d’une situation ;
- les questions complémentaires ;
- l’envoi des réponses ;
- le résultat de l’orientation ;
- l’historique ;
- le suivi et la progression des étapes.

### AdminService

Gère :

- les utilisateurs ;
- les sources administratives ;
- les signalements ;
- la recherche, les filtres et la pagination associés.

### SignalementService

Permet à un usager de créer un signalement associé à une orientation.

## Design

L’interface utilise **Tailwind CSS** ainsi que le design system AdmiGuide.

La police principale est :

```text
Inter
```

Les couleurs principales sont :

```text
Terracotta  #995349
Sauge       #9EA287
Lin         #D2CDBA
Crème       #F5F5F0
Anthracite  #262B27
```

Les icônes sont fournies par :

```text
Lucide Angular
```

L’interface est conçue pour s’adapter aux écrans desktop et mobiles.

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/AdmiGuide/admiguide-frontend.git
cd admiguide-frontend
```

### 2. Installer les dépendances

```bash
npm install
```

## Configuration

En développement, l’application utilise :

```text
http://127.0.0.1:8000/api
```

comme URL de l’API Django.

Cette configuration se trouve dans :

```text
src/environments/environment.development.ts
```

La configuration de production utilise :

```text
/api
```

Les requêtes sont alors transmises au backend Django par Nginx.

## Lancement en développement

Démarrer le backend Django avant le frontend.

Puis lancer Angular :

```bash
npm start
```

ou :

```bash
ng serve
```

L’application est disponible sur :

```text
http://localhost:4200/
```

Les modifications du code sont automatiquement prises en compte pendant le développement.

## Build de production

Pour générer une version de production :

```bash
npm run build
```

Les fichiers compilés sont générés dans le dossier :

```text
dist/
```

## Tests

Pour lancer les tests Angular :

```bash
npm test
```

Le projet utilise Vitest pour les tests unitaires.

## Docker

Le frontend dispose d’un `Dockerfile` multi-stage.

La première étape utilise Node.js pour construire l’application Angular :

```text
node:24-alpine
```

La deuxième étape utilise Nginx pour servir les fichiers générés :

```text
nginx:alpine
```

En environnement Docker, Nginx transmet les appels :

```text
/api/
```

vers le service Django :

```text
backend:8000
```

Cette configuration permet au frontend et au backend de fonctionner ensemble dans l’environnement conteneurisé d’AdmiGuide.

## Scénarios couverts par le MVP

L’interface permet actuellement de traiter les quatre situations administratives du MVP :

- remplacement d’un passeport sénégalais perdu ;
- retour définitif au Sénégal avec des effets personnels ;
- transcription d’une naissance survenue à l’étranger ;
- réversion de pension et capital-décès d’un fonctionnaire décédé en activité.

## Projets associés

Le frontend fonctionne avec deux autres services AdmiGuide :

```text
admiguide-backend
```

API métier développée avec Django REST Framework.

```text
admiguide-ai
```

Microservice FastAPI chargé de l’analyse intelligente des situations avec une architecture RAG.

## Développeuse

**Dado Watt**