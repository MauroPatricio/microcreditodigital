import mongoose from 'mongoose';

const paymentAccountSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['bank', 'mpesa', 'emola', 'mkesh', 'other'],
      default: 'bank',
    },
    bankName: { type: String, trim: true, default: '' },
    accountHolder: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    nib: { type: String, trim: true, default: '' },
    iban: { type: String, trim: true, default: '' },
    phoneNumber: { type: String, trim: true, default: '' },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const platformConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'nhiquela_platform',
      unique: true,
    },
    companyName: {
      type: String,
      default: 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
      trim: true,
    },
    nuit: {
      type: String,
      default: '',
      trim: true,
    },
    supportEmail: {
      type: String,
      default: 'nhiquelaservicos@gmail.com',
      trim: true,
    },
    supportPhone: {
      type: String,
      default: '+258 84 000 0000',
      trim: true,
    },
    instructions: {
      type: String,
      default:
        'Efectue a transferência bancária ou envio móvel para uma das contas da Nhiquela abaixo, faça o upload do comprovativo (PDF, JPG ou PNG) e aguarde a confirmação da equipa financeira.',
      trim: true,
    },
    paymentAccounts: {
      type: [paymentAccountSchema],
      default: [],
    },
    emailSettings: {
      smtpHost: { type: String, trim: true, default: '' },
      smtpPort: { type: Number, default: 587 },
      smtpSecure: { type: Boolean, default: false },
      smtpUser: { type: String, trim: true, default: '' },
      smtpPassword: { type: String, default: '' },
      fromName: { type: String, trim: true, default: 'Nhiquela Microcrédito Digital' },
      fromEmail: { type: String, trim: true, default: '' },
      notificationEmails: { type: [String], default: [] },
      notifyOnSubscriptionPayment: { type: Boolean, default: true },
      notifyOnNewInstitution: { type: Boolean, default: true },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

const PlatformConfig = mongoose.model('PlatformConfig', platformConfigSchema);

export const getOrInitPlatformConfig = async () => {
  let config = await PlatformConfig.findOne({ key: 'nhiquela_platform' });
  if (!config) {
    config = await PlatformConfig.create({
      key: 'nhiquela_platform',
      companyName: 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
      paymentAccounts: [
        {
          label: 'Conta Principal BCI',
          type: 'bank',
          bankName: 'BCI',
          accountHolder: 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
          accountNumber: '26266610710001',
          nib: '0008 0000 6266 6107 1011 3',
          isPrimary: true,
          isActive: true,
        },
        {
          label: 'M-Pesa Nhiquela',
          type: 'mpesa',
          bankName: 'Vodacom M-Pesa',
          accountHolder: 'NHIQUELA SERVICOS & CONSULTORIA',
          phoneNumber: '+258 84 000 0000',
          isPrimary: false,
          isActive: true,
        },
      ],
    });
  }
  return config;
};

export default PlatformConfig;

