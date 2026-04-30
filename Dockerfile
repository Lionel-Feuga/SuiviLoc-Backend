# Utilisation de l'image officielle Node.js légère
FROM node:20-alpine

# Création du répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copie des fichiers package.json et yarn.lock (si existant)
COPY package*.json ./
COPY yarn.lock ./

# Installation des dépendances
RUN yarn install --production

# Copie du reste du code source
COPY . .

# Exposition du port
EXPOSE 5000

# Commande pour démarrer l'application
CMD ["node", "server.js"]
