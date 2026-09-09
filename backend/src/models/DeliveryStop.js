import mongoose from 'mongoose';

const deliveryStopSchema = new mongoose.Schema({
  deliveryOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryOrder',
    required: true,
    index: true
  },
  sequence: {
    type: Number,
    required: true,
    min: 1
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  placeName: {
    type: String,
    default: ''
  },
  recipientName: {
    type: String,
    required: true
  },
  recipientPhone: {
    type: String,
    required: true
  },
  packageQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  description: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'ARRIVED', 'DELIVERED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  proof: {
    otp: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    signatureUrl: { type: String, default: '' }
  },
  failureReason: {
    type: String,
    default: ''
  },
  estimatedArrival: Date,
  actualArrival: Date,
  deliveredAt: Date
}, {
  timestamps: true
});

deliveryStopSchema.index({ deliveryOrder: 1, sequence: 1 }, { unique: true });

const DeliveryStop = mongoose.model('DeliveryStop', deliveryStopSchema);

export default DeliveryStop;
