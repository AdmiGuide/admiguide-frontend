# AdmiGuide Frontend

Interface web d’**AdmiGuide**, une application d’orientation administrative destinée à aider les usagers à identifier les démarches adaptées à leur situation et à en suivre les étapes. Le projet s’intéresse aux démarches administratives sénégalaises couvertes par son référentiel.

Ce dépôt contient le **frontend Angular**. Il gère l’expérience utilisateur, les formulaires, l’affichage des orientations et les espaces usager et administrateur. L’analyse des situations et la gestion des données sont assurées par les services Django et FastAPI associés : le frontend ne réalise pas les démarches administratives à la place de l’usager.

## Fonctionnalités

### Orientation administrative

- Description libre d’une situation administrative, sans obligation de créer un compte pour lancer une orientation.
- **Saisie vocale** de la situation depuis le navigateur : autorisation du microphone, enregistrement, minuteur, arrêt manuel ou automatique après **2 minutes**, puis insertion du texte transcrit dans le formulaire. Le texte reste modifiable avant l’envoi.
- Vérification de la longueur de la description (**20 à 1 500 caractères**).
- Envoi de la situation à Django et affichage des questions complémentaires lorsque des informations manquent.
- Prise en charge des questions ouvertes ou à choix unique, avec transmission des réponses pour poursuivre l’analyse.
- Affichage du résultat : démarche proposée, résumé, avertissement éventuel, étapes, pièces à préparer, service compétent, coûts et délais lorsqu’ils sont disponibles, et liens vers les sources officielles.
- Affichage d’une explication lorsqu’aucune démarche fiable ne peut être proposée parmi les parcours pris en charge, ainsi que d’un écran distinct en cas d’erreur technique.
- Signalement d’un problème concernant une orientation par un utilisateur connecté.

### Espace personnel

- Création de compte, connexion, déconnexion et consultation ou modification du profil.
- Demande de réinitialisation du mot de passe, puis choix d’un nouveau mot de passe à partir du lien reçu.
- Historique des situations enregistrées pour le compte connecté, avec recherche.
- Consultation du suivi d’une démarche et mise à jour des étapes réalisées, avec recalcul de la progression.

### Espace d’administration

- Vue d’ensemble présentant notamment des indicateurs sur les utilisateurs, les sources et les signalements.
- Consultation, recherche, filtrage et pagination des utilisateurs, avec suspension et réactivation des comptes.
- Consultation, recherche, filtrage et pagination des sources administratives ; examen et mise à jour de leur statut.
- Consultation, recherche, filtrage et pagination des signalements ; mise à jour de leur statut de traitement.

## Technologies

| Domaine | Technologies |
| --- | --- |
| Interface | Angular 22, TypeScript 6, Angular Router |
| Communication et réactivité | Angular HttpClient, RxJS 7, Signals Angular |
| Styles et composants visuels | Tailwind CSS 4, Lucide Angular, police Inter |
| Formulaires | Angular Forms (dont formulaires réactifs pour l’authentification) |
| Tests unitaires | Vitest, infrastructure de test Angular |
| Construction et hébergement | Node.js 24, Docker, Nginx |

Les versions exactes installées sont définies dans `package.json` et `package-lock.json`.

## Architecture et responsabilités

```text
Navigateur / utilisateur
        |
        v
Frontend Angular (ce dépôt)
        |
        | Requêtes HTTP / API REST
        v
Backend Django REST Framework (admiguide-backend)
        |                    |
        |                    +--> Base de données MySQL
        v
Microservice FastAPI (admiguide-ai)
        |
        +--> Recherche documentaire RAG et modèle de langage
        +--> Transcription audio
```

**Angular communique avec Django, et non directement avec FastAPI.** Django transmet au microservice IA les demandes d’analyse ou de transcription, puis renvoie les réponses au frontend. Les détails du traitement RAG et des règles d’orientation sont documentés dans `admiguide-ai`.

### Parcours d’orientation

```text
Description écrite ou dictée
           |
           v
Analyse de la situation
           |
           +--> Précisions requises --> Réponses --> Nouvelle analyse
           |
           +--> Orientation disponible --> Résultat --> Suivi des étapes
           |
           +--> Aucune orientation fiable --> Explication du motif
```

Les trois statuts d’analyse utilisés par le frontend sont `ORIENTATION`, `PRECISIONS_REQUISES` et `SOURCES_INSUFFISANTES`.

L’enregistrement vocal repose sur l’API navigateur `MediaRecorder`. Le frontend transmet le fichier audio à l’endpoint Django de transcription, puis remplit le champ de description avec la réponse textuelle. La permission d’accès au microphone et la disponibilité des fonctionnalités audio dépendent du navigateur et de son contexte de sécurité.

## Démarches représentées dans le référentiel actuel

Le frontend ne contient pas lui-même les règles de sélection des démarches : il affiche celles reconnues par les services backend et IA. Le périmètre actuellement développé comprend notamment :

- **Passeport sénégalais** : première demande, renouvellement, perte ou vol.
- **Pensions après décès** : démarches concernant un fonctionnaire décédé en activité ou après son départ à la retraite.
- **Foncier** : régularisation par voie de bail, acquisition et mutation d’un bien déjà sous titre foncier, transformation d’un bail en titre foncier, et parcours relatif à une autorisation d’occupation.

Une orientation est indicative : les administrations compétentes restent chargées de vérifier les conditions officielles et de traiter les dossiers. Les procédures disponibles peuvent évoluer avec le référentiel Django et les sources indexées par le microservice IA.

## Pages et organisation des routes

Les principales routes définies dans `src/app/app.routes.ts` sont :

| Route | Page |
| --- | --- |
| `/` | Accueil |
| `/orientation` | Description et dictée d’une situation |
| `/orientation/precisions/:publicId` | Questions complémentaires |
| `/orientation/resultat/:publicId` | Résultat de l’orientation |
| `/orientation/sources-insuffisantes/:publicId` | Absence d’orientation fiable |
| `/orientation/suivi/:publicId` | Étapes et progression |
| `/connexion`, `/inscription` | Authentification |
| `/mot-de-passe-oublie` | Demande de réinitialisation |
| `/reinitialiser-mot-de-passe/:uid/:token` | Nouveau mot de passe |
| `/espace/historique`, `/espace/profil` | Espace personnel protégé |
| `/admin`, `/admin/utilisateurs`, `/admin/sources`, `/admin/signalements` | Espace administrateur protégé |

Les routes utilisent deux dispositions principales : `UserLayout` pour la partie usager et `AdminLayout` pour l’administration.

## Services et composants principaux

- **`AuthService`** : inscription, connexion, profil, restauration de session, déconnexion, rafraîchissement JWT et réinitialisation de mot de passe.
- **`OrientationService`** : création de situations, questions et réponses complémentaires, résultats, historique, progression et transcription vocale.
- **`SignalementService`** : création d’un signalement lié à une situation.
- **`AdminService`** : API de gestion des utilisateurs, sources et signalements, avec recherche, filtres et pagination.
- **`authInterceptor`** : ajout du token d’accès aux requêtes concernées ; en cas d’erreur HTTP `401`, tentative de rafraîchissement puis nouvelle exécution de la requête.
- **`authGuard` et `adminGuard`** : contrôle d’accès aux pages personnelles et administratives selon la session et le rôle.

Les tokens d’accès et de rafraîchissement sont actuellement conservés dans le **`localStorage`** du navigateur, comme l’implémente `AuthService`. Le frontend ne remplace pas les vérifications d’authentification et de permissions effectuées côté Django.

## Structure du projet

```text
admiguide-frontend/
├── public/                     # Images et autres ressources publiques
├── src/
│   ├── app/
│   │   ├── components/         # En-tête, pied de page, barres latérales, états UI
│   │   ├── data/               # Données statiques
│   │   ├── guards/             # Contrôle d’accès aux routes
│   │   ├── interceptors/       # Intercepteur HTTP JWT
│   │   ├── layouts/            # Espaces usager et administrateur
│   │   ├── models/             # Interfaces TypeScript des données API
│   │   ├── pages/              # Pages d’orientation, auth, suivi et admin
│   │   ├── services/           # Communication avec le backend Django
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/           # URLs API par environnement
│   ├── styles.css              # Tailwind et design system
│   └── main.ts
├── Dockerfile
├── nginx.conf
├── angular.json
├── package.json
├── package-lock.json
└── README.md
```

## Installation en local

### Prérequis

- Node.js compatible avec Angular 22 (le `Dockerfile` utilise **Node.js 24**).
- npm (la version déclarée dans `package.json` est **11.17.0**).
- Backend `admiguide-backend` accessible pour les requêtes API ; le microservice `admiguide-ai` est nécessaire pour les parcours d’analyse et la transcription.

### Récupérer le code et installer les dépendances

```bash
git clone https://github.com/AdmiGuide/admiguide-frontend.git
cd admiguide-frontend
npm ci
```

Pour développer à partir d’une branche autre que `main`, sélectionnez-la avec `git switch <nom-de-branche>` avant l’installation si nécessaire.

### Configuration API

Deux fichiers définissent l’URL de l’API Django :

- `src/environments/environment.development.ts` : `http://127.0.0.1:8000/api`.
- `src/environments/environment.ts` : `/api` en production.

L’application n’envoie pas directement ses requêtes à FastAPI. L’URL Django de développement doit correspondre au port sur lequel vous avez lancé le backend.

### Démarrer l’application

Après avoir démarré les services backend nécessaires :

```bash
npm start
```

Équivalent :

```bash
npx ng serve
```

Le frontend est ensuite accessible à l’adresse `http://localhost:4200/`. Le serveur de développement recompile les changements Angular pendant le travail.

## Tests et compilation

```bash
# Lance les tests unitaires Angular/Vitest.
npm test

# Génère une version optimisée pour la production.
npm run build
```

Le dépôt contient une première base de tests unitaires (`src/app/app.spec.ts`) ; cette commande ne constitue pas, à elle seule, une validation complète de tous les parcours fonctionnels. Les parcours d’orientation nécessitent également des tests avec Django, FastAPI et leurs données de référence.

La sortie de production est générée sous `dist/admiguide-frontend/browser/` selon la configuration actuelle du projet.

## Déploiement avec Docker et Nginx

Le `Dockerfile` utilise deux étapes :

1. **Construction** avec `node:24-alpine` et `npm ci`, puis `npm run build`.
2. **Service des fichiers statiques** avec `nginx:alpine` sur le port interne `80`.

Le fichier `nginx.conf` assure le repli vers `index.html` pour les routes Angular et relaie les requêtes `/api/` vers `http://backend:8000/api/`. Le nom d’hôte `backend` doit donc être résolu par le réseau Docker utilisé au déploiement.

Le dépôt contient le `Dockerfile` du frontend. L’orchestration des différents services dépend de la configuration Docker Compose du projet de déploiement AdmiGuide.

## Design system

Le thème de l’application est défini dans `src/styles.css`, avec **Tailwind CSS 4** et la police **Inter**.

| Couleur | Code |
| --- | --- |
| Terracotta | `#995349` |
| Sauge | `#9EA287` |
| Lin | `#D2CDBA` |
| Crème | `#F5F5F0` |
| Anthracite | `#262B27` |

Les icônes sont fournies par Lucide Angular. Les pages sont conçues avec des mises en page adaptatives pour ordinateur et mobile.

## Limites du frontend

AdmiGuide est un outil **d’orientation**, et non un service qui dépose des dossiers, prend des rendez-vous ou réalise des formalités pour l’utilisateur. Les réponses dépendent des démarches et des sources officiellement intégrées aux services métier et IA.

Le **chatbot contextuel d’aide administrative** est une évolution envisagée ; il ne fait pas partie des fonctionnalités présentes dans cette version du frontend.

## Dépôts associés

- [admiguide-backend](https://github.com/AdmiGuide/admiguide-backend) : API Django REST Framework, authentification et logique métier.
- [admiguide-ai](https://github.com/AdmiGuide/admiguide-ai) : microservice FastAPI, recherche documentaire RAG et fonctions d’intelligence artificielle.

## Développeuse

Dado Watt
