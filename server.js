import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import apartmentsRouter from './routes/apartments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/apartments', apartmentsRouter);

// Database connection for Serverless
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Erreur: MONGODB_URI non définie');
} else {
  // Vérifie si la connexion existe déjà pour éviter d'en ouvrir trop en Serverless
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log('Connecté à MongoDB avec succès'))
      .catch((error) => console.error('Erreur de connexion à MongoDB:', error.message));
  }
}

// Routes de base pour tester que l'API répond
app.get('/', (req, res) => res.send('SuiviLoc API is running'));
app.get('/api', (req, res) => res.send('SuiviLoc API endpoints'));

// Export indispensable pour les fonctions Serverless de Vercel
export default app;

// Démarrage du serveur si on est en développement local
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Serveur local en cours d'exécution sur le port ${PORT}`);
  });
}
