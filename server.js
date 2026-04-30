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

// Database
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Erreur: MONGODB_URI non définie');
} else {
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log('Connecté à MongoDB avec succès'))
      .catch((error) => console.error('Erreur de connexion à MongoDB:', error.message));
  }
}

app.get('/', (req, res) => res.send('SuiviLoc API is running'));
app.get('/api', (req, res) => res.send('SuiviLoc API endpoints'));

// Export
export default app;

// Local Server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Serveur local en cours d'exécution sur le port ${PORT}`);
  });
}
