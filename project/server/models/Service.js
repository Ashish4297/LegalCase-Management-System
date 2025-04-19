import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isFinite,
      message: '{VALUE} is not a valid amount'
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['Consultation', 'Litigation', 'Documentation', 'Other']
  }
});

const Service = mongoose.model('Service', serviceSchema);

export default Service; // ✅ Ensure default export
