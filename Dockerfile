# Étape 1 : construit l'application Angular.
FROM node:24-alpine AS build

WORKDIR /app

# Installe les dépendances du frontend.
COPY package.json package-lock.json ./
RUN npm ci

# Copie le projet et génère la version production.
COPY . .
RUN npm run build


# Étape 2 : sert l'application avec Nginx.
FROM nginx:alpine

# Configuration Nginx d'AdmiGuide.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie l'application Angular construite.
COPY --from=build /app/dist/admiguide-frontend/browser /usr/share/nginx/html

EXPOSE 80