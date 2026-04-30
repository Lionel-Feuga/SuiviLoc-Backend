import mongoose from 'mongoose';

const apartmentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['En attente', 'Visite prévue', 'Dossier déposé', 'Refusé', 'Accepté'],
    default: 'En attente'
  },
  price: { type: Number },
  rooms: { type: Number },
  surface: { type: Number },
  neighborhood: { type: String },
  address: { type: String },
  contactNumber: { type: String },
  contactName: { type: String },
  url: { type: String },
  description: { type: String }
}, {
  timestamps: true // Adds createdAt and updatedAt, useful even without history
});

const Apartment = mongoose.model('Apartment', apartmentSchema);

export default Apartment;
