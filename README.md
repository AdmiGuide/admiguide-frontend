# AdmiGuide — Frontend

Interface web d’**AdmiGuide**, une application d’orientation administrative au Sénégal. Elle permet de décrire une situation, de recevoir une démarche adaptée aux informations disponibles et de suivre les étapes à réaliser.

Ce dépôt contient l’interface **Angular**. Les données, les règles métier et les traitements d’intelligence artificielle sont gérés par les services [Django](https://github.com/AdmiGuide/admiguide-backend) et [FastAPI](https://github.com/AdmiGuide/admiguide-ai). AdmiGuide informe et oriente : il ne dépose pas de dossiers à la place de l’usager.

## Fonctionnalités

- **Orientation administrative** : description libre d’une situation, questions complémentaires si nécessaire, puis affichage de la démarche, des pièces, des étapes, des services et des sources disponibles.
- **Saisie vocale** : dictée de la situation avec transcription et possibilité de corriger le texte avant l’envoi (enregistrement limité à deux minutes).
- **Chatbot contextuel** : aide à comprendre les termes, les pièces et les étapes, et à rechercher certaines informations pratiques vérifiables. Il est accessible sur les pages *Quelques précisions*, *Votre orientation* et *Suivi de ma démarche*, sans modifier l’orientation.
- **Espace usager** : inscription, connexion, profil, historique et suivi de la progression des démarches.
- **Espace administrateur** : tableau de bord, gestion des utilisateurs, contrôle des sources et traitement des signalements.

**Périmètre du MVP :** passeports sénégalais, pensions après décès d’un fonctionnaire et démarches foncières prévues par le référentiel. L’application distingue trois résultats d’analyse : `ORIENTATION`, `PRECISIONS_REQUISES` et `SOURCES_INSUFFISANTES`.

## Stack technique

| Domaine | Technologies |
| --- | --- |
| Application | Angular 22, TypeScript, Angular Router |
| Interface | Tailwind CSS 4, Lucide Angular, police Inter |
| Données et état | HttpClient, RxJS, Angular Signals |
| Authentification | JWT via l’API Django, guards et intercepteur HTTP |
| Tests | Angular Test Runner / Vitest |
| Déploiement | Docker, Nginx |

Les versions exactes sont indiquées dans `package.json` et `package-lock.json`.

## Architecture

```text
Navigateur
    |
    v
Frontend Angular (ce dépôt)
    |
    | API REST
    v
Backend Django REST Framework
    |                   |
    v                   v
MySQL              FastAPI / IA
                   - Orientation RAG et LLM
                   - Chatbot contextuel
                   - Transcription vocale
```

Le frontend communique **uniquement avec Django**. Django gère les accès et les données, puis sollicite FastAPI lorsque l’analyse, le chatbot ou la transcription le nécessitent.

## Installation en local

### Prérequis

- **Node.js 24** et **npm** (le projet déclare npm `11.17.0`).
- Les services [admiguide-backend](https://github.com/AdmiGuide/admiguide-backend) et [admiguide-ai](https://github.com/AdmiGuide/admiguide-ai) configurés et démarrés pour les fonctionnalités connectées.
- La base MySQL et le référentiel Django initialisés selon le README du backend.

### 1. Cloner le projet

```bash
git clone https://github.com/AdmiGuide/admiguide-frontend.git
cd admiguide-frontend
npm ci
```

### 2. Configurer l’URL de l’API

Le fichier `src/environments/environment.development.ts` contient l’adresse du backend Django :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api',
};
```

Si Django fonctionne sur une autre adresse ou un autre port, modifiez `apiUrl` en conséquence.

En production, `src/environments/environment.ts` utilise `/api`, transmis à Django par le proxy Nginx. **Aucune clé API Groq ne doit être placée dans le frontend.**

### 3. Lancer Angular

Une fois Django et FastAPI démarrés :

```bash
npm start
```

Ouvrir **http://localhost:4200/** dans le navigateur.

## Tests et compilation

```bash
npm test         # Tests unitaires
npm run build    # Compilation de production
```

Les tests du frontend ne remplacent pas les vérifications de bout en bout avec Django, FastAPI et les sources administratives.

## Organisation du code

```text
src/
├── app/
│   ├── components/       # Composants partagés, dont contextual-chatbot/
│   ├── pages/            # Accueil, orientation, suivi, auth et administration
│   ├── services/         # Appels aux API Django
│   ├── models/           # Interfaces TypeScript
│   ├── guards/           # Protection des routes
│   ├── interceptors/     # Gestion des tokens HTTP
│   ├── layouts/          # Interfaces usager et administrateur
│   └── app.routes.ts     # Routes de l’application
├── environments/         # Configuration des URL d’API
└── styles.css            # Styles et thème de l’application
```

Le composant `components/contextual-chatbot/` utilise `services/chat.service.ts` et `models/chat.model.ts`. Le chatbot appelle `POST /api/orientations/situations/:publicId/chat/` sur Django.

## Docker

Le `Dockerfile` compile Angular avec Node.js 24, puis sert les fichiers statiques avec Nginx.

```bash
docker build -t admiguide-frontend .
```

Dans le déploiement multi-services, Nginx transmet `/api/` au conteneur Django nommé `backend` sur le port `8000`. Le réseau et les autres services doivent donc être configurés par l’orchestration Docker du projet.

## Limites et dépôts associés

AdmiGuide propose une **orientation indicative**, limitée aux démarches et aux sources disponibles. Le chatbot explique la démarche existante : il ne crée pas de nouvelles procédures et ne garantit pas une adresse, un coût ou un délai en l’absence de source fiable.

- **Backend Django :** https://github.com/AdmiGuide/admiguide-backend
- **Microservice IA FastAPI :** https://github.com/AdmiGuide/admiguide-ai

**Développeuse :** Dado Watt.
