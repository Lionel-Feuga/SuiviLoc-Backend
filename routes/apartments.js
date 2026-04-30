import express from 'express';
import Apartment from '../models/Apartment.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const apartments = await Apartment.find().sort({ createdAt: -1 });
    res.json(apartments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  const apartment = new Apartment(req.body);
  try {
    const newApartment = await apartment.save();
    res.status(201).json(newApartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedApartment = await Apartment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedApartment) {
      return res.status(404).json({ message: 'Appartement non trouvé' });
    }
    res.json(updatedApartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedApartment = await Apartment.findByIdAndDelete(req.params.id);
    if (!deletedApartment) {
      return res.status(404).json({ message: 'Appartement non trouvé' });
    }
    res.json({ message: 'Appartement supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
