import mongoose from 'mongoose';

const deliveryOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    index: true
  },
  origin: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    contactName: { type: String, default: '' },
    contactPhone: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  totalPackages: {
    type: Number,
    default: 0
  },
  driverLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  }
}, {
  timestamps: true
});

deliveryOrderSchema.index({ customer: 1, createdAt: -1 });
deliveryOrderSchema.index({ driver: 1, status: 1 });

const DeliveryOrder = mongoose.model('DeliveryOrder', deliveryOrderSchema);

export default DeliveryOrder;
