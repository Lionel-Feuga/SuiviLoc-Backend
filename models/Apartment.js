import mongoose from 'mongoose';

const apartmentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['En attente', 'À contacter', 'Visite prévue', 'Dossier déposé', 'Refusé', 'Accepté'],
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
  imageUrl: { type: String },
  imageUrls: { type: [String], default: [] },
  description: { type: String }
}, {
  timestamps: true
});

const Apartment = mongoose.model('Apartment', apartmentSchema);

export default Apartment;
