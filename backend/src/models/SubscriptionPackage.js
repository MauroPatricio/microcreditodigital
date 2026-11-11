import mongoose from 'mongoose';
import { ALL_FEATURE_CODES, DEFAULT_FEATURES_BY_LEGACY_PLAN } from '../config/packageFeatures.js';

const subscriptionPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome do pacote é obrigatório'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Preço do pacote é obrigatório'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'MT',
      trim: true,
    },
    durationDays: {
      type: Number,
      required: true,
      default: 30,
      min: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    limits: {
      maxUsers: { type: Number, default: 0 }, // 0 = ilimitado
      maxClients: { type: Number, default: 0 },
      maxActiveLoans: { type: Number, default: 0 },
    },
    badgeColor: {
      type: String,
      default: '#0284c7',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

subscriptionPackageSchema.index({ slug: 1 });
subscriptionPackageSchema.index({ isActive: 1, displayOrder: 1 });

const SubscriptionPackage = mongoose.model('SubscriptionPackage', subscriptionPackageSchema);

export const seedDefaultPackages = async () => {
  const count = await SubscriptionPackage.countDocuments();
  if (count > 0) return;

  const defaults = [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Ideal para operação individual com 1 utilizador e gestão essencial.',
      price: 1500,
      currency: 'MT',
      durationDays: 30,
      features: DEFAULT_FEATURES_BY_LEGACY_PLAN.starter,
      limits: { maxUsers: 1, maxClients: 100, maxActiveLoans: 100 },
      badgeColor: '#64748b',
      isFeatured: false,
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Standard',
      slug: 'standard',
      description: 'Gestão completa web até 3 utilizadores com caixa, contratos, relatórios e RBAC.',
      price: 3200,
      currency: 'MT',
      durationDays: 30,
      features: DEFAULT_FEATURES_BY_LEGACY_PLAN.standard,
      limits: { maxUsers: 3, maxClients: 1000, maxActiveLoans: 1000 },
      badgeColor: '#0284c7',
      isFeatured: false,
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Premium',
      slug: 'premium',
      description: 'Suite completa até 5 utilizadores com App Mobile, WhatsApp automático e Multi-Instituição.',
      price: 5000,
      currency: 'MT',
      durationDays: 30,
      features: ALL_FEATURE_CODES,
      limits: { maxUsers: 5, maxClients: 0, maxActiveLoans: 0 },
      badgeColor: '#059669',
      isFeatured: true,
      isActive: true,
      displayOrder: 3,
    },
  ];

  await SubscriptionPackage.insertMany(defaults);
};

export default SubscriptionPackage;

