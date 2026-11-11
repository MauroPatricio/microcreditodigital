import express from 'express';
import fs from 'fs';
import SubscriptionPackage, { seedDefaultPackages } from '../models/SubscriptionPackage.js';
import PlatformConfig, { getOrInitPlatformConfig } from '../models/PlatformConfig.js';
import SubscriptionRequest from '../models/SubscriptionRequest.js';
import Institution from '../models/Institution.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import emailService, { normalizeEmailList } from '../services/emailService.js';
import { protect, authorize } from '../middleware/auth.js';
import { resolveInstitutionFeatures } from '../middleware/rbac.js';
import uploadPaymentReceipt from '../middleware/uploadPaymentMiddleware.js';
import {
  PACKAGE_FEATURES_CATALOG,
  ALL_FEATURE_CODES,
  DEFAULT_FEATURES_BY_LEGACY_PLAN,
} from '../config/packageFeatures.js';

const router = express.Router();

const canRunNotificationIo = () => {
  const ready = User?.db?.readyState === 1;
  return ready || Boolean(User?.find?.mock) || Boolean(Notification?.create?.mock);
};

const sanitizePublicConfig = (cfg) => {
  if (!cfg) return null;
  const obj = typeof cfg.toObject === 'function' ? cfg.toObject() : { ...cfg };
  if (obj.emailSettings) {
    obj.emailSettings = {
      fromName: obj.emailSettings.fromName || '',
      fromEmail: obj.emailSettings.fromEmail || '',
    };
  }
  return obj;
};

const sanitizeAdminConfig = (cfg) => {
  if (!cfg) return null;
  const obj = typeof cfg.toObject === 'function' ? cfg.toObject() : { ...cfg };
  const es = obj.emailSettings || {};
  obj.emailSettings = {
    smtpHost: es.smtpHost || '',
    smtpPort: es.smtpPort || 587,
    smtpSecure: Boolean(es.smtpSecure),
    smtpUser: es.smtpUser || '',
    smtpPassword: '',
    hasSmtpPassword: Boolean(es.smtpPassword),
    fromName: es.fromName || 'Nhiquela Microcrédito Digital',
    fromEmail: es.fromEmail || '',
    notificationEmails: Array.isArray(es.notificationEmails) ? es.notificationEmails : [],
    notifyOnSubscriptionPayment: es.notifyOnSubscriptionPayment !== false,
    notifyOnNewInstitution: es.notifyOnNewInstitution !== false,
  };
  return obj;
};

const resolveInstId = (req) => {
  return req.institutionId || req.user?.activeInstitution?._id || req.user?.activeInstitution || req.user?.institution?._id || req.user?.institution;
};

/* ==========================================================================
   HELPERS EXPORTADOS (Reutilizados por /api/subscriptions e /api/institutions)
   ========================================================================== */

export const handleSubmitSubscriptionRequest = async (req, res) => {
  try {
    const instId = resolveInstId(req);
    if (!instId) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Nenhuma instituição associada ao utilizador.' });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'O comprovativo de pagamento é obrigatório! Anexe um ficheiro PDF, JPG ou PNG.',
      });
    }

    // Impedir submissões duplicadas enquanto existir um pedido pendente
    const existingPending = await SubscriptionRequest.findOne({
      institution: instId,
      status: 'pending',
    });

    if (existingPending) {
      if (fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(400).json({
        success: false,
        message: 'Já existe um pagamento pendente enviado a aguardar validação da equipa financeira.',
      });
    }

    await seedDefaultPackages();
    const { packageId, planRequested, amountPaid, paymentMethod, referenceCode, notes } = req.body;

    let pkg = null;
    if (packageId) {
      pkg = await SubscriptionPackage.findById(packageId);
    } else if (planRequested) {
      pkg = await SubscriptionPackage.findOne({ slug: String(planRequested).toLowerCase().trim() });
    }

    const planSlug = pkg?.slug || (planRequested ? String(planRequested).toLowerCase().trim() : 'standard');
    const finalAmount = Number(amountPaid) || pkg?.price || 3200;
    const durationDays = pkg?.durationDays || 30;
    const proofOfPaymentUrl = `/uploads/receipts/${req.file.filename}`;

    const requestDoc = await SubscriptionRequest.create({
      institution: instId,
      requestedBy: req.user._id,
      packageId: pkg?._id || null,
      planRequested: planSlug,
      packageName: pkg?.name || planSlug,
      durationDays,
      amountPaid: finalAmount,
      paymentMethod: paymentMethod || 'Transferência Bancária',
      referenceCode: referenceCode || '',
      notes: notes || '',
      proofOfPaymentUrl,
      status: 'pending',
    });

    // Se a subscrição atual já expirou, marcar como pending
    const inst = await Institution.findById(instId);
    if (inst && (!inst.subscription?.expiresAt || new Date(inst.subscription.expiresAt) < new Date())) {
      inst.subscription.status = 'pending';
      await inst.save();
    }

    await AuditLog.create({
      institution: instId,
      user: req.user._id,
      action: 'create',
      entityType: 'SubscriptionRequest',
      entityId: requestDoc._id,
      changes: { after: requestDoc.toObject() },
      severity: 'medium',
      metadata: { path: req.originalUrl, method: req.method },
    }).catch(() => {});

    // Notificar Super Admins (in-app badge + email configurado na Nhiquela)
    if (canRunNotificationIo()) {
      (async () => {
        const [platformConfig, superAdmins] = await Promise.all([
          getOrInitPlatformConfig().catch(() => null),
          User.find({ role: 'super_admin', isBlocked: { $ne: true } }).select('_id email name paymentNotificationEmail receivePaymentEmails'),
        ]);
        if (Array.isArray(superAdmins) && superAdmins.length > 0) {
          await Promise.all(
            superAdmins.map((sa) =>
              Notification.create({
                user: sa._id,
                institution: instId,
                type: 'subscription_submitted',
                title: 'Novo Pagamento de Subscrição Recebido',
                message: `${inst?.name || 'Uma instituição'} enviou comprovativo de ${finalAmount.toLocaleString()} MT para o pacote ${pkg?.name || planSlug}.`,
                metadata: { requestId: requestDoc._id, link: '/superadmin-subscriptions' },
              }).catch(() => {})
            )
          );
        }
        const saEmails = (superAdmins || [])
          .filter((sa) => sa.receivePaymentEmails !== false)
          .map((sa) => sa.paymentNotificationEmail || sa.email)
          .filter(Boolean);
        await emailService.sendSubscriptionPaymentAlert({
          institution: inst,
          requestDoc,
          platformConfig,
          extraRecipients: saEmails,
        });
      })().catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Comprovativo submetido com sucesso! Pedido enviado e a aguardar validação da equipa financeira da Nhiquela.',
      data: requestDoc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleApproveSubscriptionRequest = async (req, res) => {
  try {
    const subReq = await SubscriptionRequest.findById(req.params.id);
    if (!subReq) {
      return res.status(404).json({ success: false, message: 'Pedido de subscrição não encontrado.' });
    }

    if (subReq.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Este pedido já foi aprovado.' });
    }

    await seedDefaultPackages();
    let pkg = null;
    if (subReq.packageId) {
      pkg = await SubscriptionPackage.findById(subReq.packageId);
    }
    if (!pkg && subReq.planRequested) {
      pkg = await SubscriptionPackage.findOne({ slug: subReq.planRequested.toLowerCase() });
    }

    const now = new Date();
    const durationDays = pkg?.durationDays || subReq.durationDays || 30;
    const enabledFeatures = pkg?.features?.length
      ? pkg.features
      : DEFAULT_FEATURES_BY_LEGACY_PLAN[subReq.planRequested] || ALL_FEATURE_CODES;

    subReq.status = 'approved';
    subReq.reviewedBy = req.user._id;
    subReq.reviewedAt = now;
    if (req.body?.reviewNotes) subReq.reviewNotes = req.body.reviewNotes;
    await subReq.save();

    const inst = await Institution.findById(subReq.institution);
    if (inst) {
      const baseTime =
        inst.subscription?.expiresAt && new Date(inst.subscription.expiresAt) > now
          ? new Date(inst.subscription.expiresAt).getTime()
          : now.getTime();
      const newExpiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000);

      inst.subscription = {
        ...inst.subscription?.toObject?.(),
        plan: pkg?.slug || subReq.planRequested,
        packageId: pkg?._id || subReq.packageId || null,
        packageName: pkg?.name || subReq.packageName || subReq.planRequested,
        enabledFeatures,
        maxUsers: pkg?.limits?.maxUsers ?? 0,
        status: 'active',
        expiresAt: newExpiresAt,
        lastPaymentDate: now,
      };
      inst.isActive = true;
      await inst.save();
    }

    await AuditLog.create({
      institution: subReq.institution,
      user: req.user._id,
      action: 'update',
      entityType: 'SubscriptionRequest',
      entityId: subReq._id,
      changes: { after: { status: 'approved', plan: pkg?.slug || subReq.planRequested, durationDays } },
      severity: 'high',
      metadata: { path: req.originalUrl, method: req.method },
    }).catch(() => {});

    if (canRunNotificationIo()) {
      (async () => {
        const recipients = await User.find({
          institution: subReq.institution,
          role: { $in: ['owner', 'admin'] },
          isBlocked: { $ne: true },
        }).select('_id email');
        const targetIds = new Set((recipients || []).map((u) => String(u._id)));
        if (subReq.requestedBy) targetIds.add(String(subReq.requestedBy));
        await Promise.all(
          Array.from(targetIds).map((uid) =>
            Notification.create({
              user: uid,
              institution: subReq.institution,
              type: 'subscription_approved',
              title: 'Subscrição Aprovada!',
              message: `O pagamento para o pacote ${pkg?.name || subReq.packageName || subReq.planRequested} foi aprovado e o acesso está activo.`,
              metadata: { requestId: subReq._id, link: '/my-subscription' },
            }).catch(() => {})
          )
        );
        await emailService.sendSubscriptionDecisionEmail({
          institution: inst,
          requestDoc: subReq,
          approved: true,
        });
      })().catch(() => {});
    }

    res.json({
      success: true,
      message: 'Pagamento aprovado! Pacote activado e funcionalidades libertadas com sucesso.',
      data: { request: subReq, institution: inst },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleRejectSubscriptionRequest = async (req, res) => {
  try {
    const { reviewNotes, reason } = req.body;
    const notes = (reviewNotes || reason || '').trim();
    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'A justificação da rejeição é obrigatória.',
      });
    }

    const subReq = await SubscriptionRequest.findById(req.params.id);
    if (!subReq) {
      return res.status(404).json({ success: false, message: 'Pedido de subscrição não encontrado.' });
    }

    subReq.status = 'rejected';
    subReq.reviewNotes = notes;
    subReq.reviewedBy = req.user._id;
    subReq.reviewedAt = new Date();
    await subReq.save();

    const inst = await Institution.findById(subReq.institution);
    if (inst && (!inst.subscription?.expiresAt || new Date(inst.subscription.expiresAt) < new Date())) {
      inst.subscription.status = 'expired';
      await inst.save();
    }

    await AuditLog.create({
      institution: subReq.institution,
      user: req.user._id,
      action: 'update',
      entityType: 'SubscriptionRequest',
      entityId: subReq._id,
      changes: { after: { status: 'rejected', reviewNotes: notes } },
      severity: 'high',
      metadata: { path: req.originalUrl, method: req.method },
    }).catch(() => {});

    if (canRunNotificationIo()) {
      (async () => {
        const recipients = await User.find({
          institution: subReq.institution,
          role: { $in: ['owner', 'admin'] },
          isBlocked: { $ne: true },
        }).select('_id');
        const targetIds = new Set((recipients || []).map((u) => String(u._id)));
        if (subReq.requestedBy) targetIds.add(String(subReq.requestedBy));
        await Promise.all(
          Array.from(targetIds).map((uid) =>
            Notification.create({
              user: uid,
              institution: subReq.institution,
              type: 'subscription_rejected',
              title: 'Comprovativo de Subscrição Rejeitado',
              message: `O pagamento submetido foi rejeitado. Motivo: ${notes}`,
              metadata: { requestId: subReq._id, link: '/my-subscription' },
            }).catch(() => {})
          )
        );
        await emailService.sendSubscriptionDecisionEmail({
          institution: inst,
          requestDoc: subReq,
          approved: false,
          reason: notes,
        });
      })().catch(() => {});
    }

    res.json({
      success: true,
      message: 'Pedido rejeitado com justificação.',
      data: subReq,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ==========================================================================
   ROTAS PÚBLICAS / CLIENTE (INSTITUIÇÕES)
   ========================================================================== */

// Listar pacotes ativos disponíveis + catálogo de funcionalidades
router.get('/packages', protect, async (req, res) => {
  try {
    await seedDefaultPackages();
    const packages = await SubscriptionPackage.find({ isActive: true }).sort({ displayOrder: 1, price: 1 });
    res.json({
      success: true,
      data: packages,
      featuresCatalog: PACKAGE_FEATURES_CATALOG,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obter contas bancárias e dados de pagamento configurados da Nhiquela
router.get('/payment-config', protect, async (req, res) => {
  try {
    const config = await getOrInitPlatformConfig();
    res.json({ success: true, data: sanitizePublicConfig(config) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obter resumo completo da subscrição atual da instituição
router.get('/current', protect, async (req, res) => {
  try {
    await seedDefaultPackages();
    const config = await getOrInitPlatformConfig();
    const packages = await SubscriptionPackage.find({ isActive: true }).sort({ displayOrder: 1, price: 1 });

    const instId = resolveInstId(req);
    const institution = instId ? await Institution.findById(instId) : null;

    if (!institution) {
      return res.json({
        success: true,
        data: {
          institution: null,
          packages,
          paymentConfig: sanitizePublicConfig(config),
          featuresCatalog: PACKAGE_FEATURES_CATALOG,
          requests: [],
          pendingRequest: null,
          remainingDays: 0,
        },
      });
    }

    const enabledFeatures = await resolveInstitutionFeatures(institution);
    const activePackage = packages.find(
      (p) =>
        (institution.subscription?.packageId && String(p._id) === String(institution.subscription.packageId)) ||
        p.slug === institution.subscription?.plan
    ) || null;
    const maxUsers = institution.subscription?.maxUsers ?? activePackage?.limits?.maxUsers ?? 0;
    const currentUsers = await User.countDocuments({
      institution: institution._id,
      role: { $nin: ['client', 'super_admin'] },
      isBlocked: { $ne: true },
    });

    const requests = await SubscriptionRequest.find({ institution: institution._id })
      .populate('packageId', 'name price durationDays features limits')
      .sort({ createdAt: -1 });
    const pendingRequest = requests.find((r) => r.status === 'pending') || null;

    const now = new Date();
    const expiresAt = institution.subscription?.expiresAt ? new Date(institution.subscription.expiresAt) : null;
    const remainingDays = expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    res.json({
      success: true,
      data: {
        institution,
        subscription: institution.subscription,
        enabledFeatures,
        usage: { currentUsers, maxUsers },
        remainingDays,
        isExpired:
          institution.subscription?.status === 'expired' ||
          institution.subscription?.status === 'rejected' ||
          (expiresAt ? expiresAt < now : false),
        pendingRequest,
        requests,
        packages,
        paymentConfig: sanitizePublicConfig(config),
        featuresCatalog: PACKAGE_FEATURES_CATALOG,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submeter comprovativo para activar/actualizar pacote (apenas owner ou admin da instituição)
router.post(
  '/submit',
  protect,
  authorize('owner', 'admin'),
  uploadPaymentReceipt.single('proof'),
  handleSubmitSubscriptionRequest
);

/* ==========================================================================
   ROTAS EXCLUSIVAS DO SUPER ADMIN (NHIQUELA)
   ========================================================================== */

// Listar todos os pacotes (incluindo inativos) + catálogo
router.get('/admin/packages', protect, authorize('super_admin'), async (req, res) => {
  try {
    await seedDefaultPackages();
    const packages = await SubscriptionPackage.find().sort({ displayOrder: 1, price: 1 });
    res.json({
      success: true,
      data: packages,
      featuresCatalog: PACKAGE_FEATURES_CATALOG,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Criar novo pacote personalizado via tela
router.post('/admin/packages', protect, authorize('super_admin'), async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      currency,
      durationDays,
      features,
      limits,
      badgeColor,
      isFeatured,
      isActive,
      displayOrder,
    } = req.body;

    if (!name || price === undefined || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Nome e preço válido do pacote são obrigatórios.' });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const exists = await SubscriptionPackage.findOne({ slug: generatedSlug });
    if (exists) {
      return res.status(400).json({ success: false, message: `Já existe um pacote com identificador '${generatedSlug}'.` });
    }

    const pkg = await SubscriptionPackage.create({
      name: name.trim(),
      slug: generatedSlug,
      description: description || '',
      price: Number(price),
      currency: currency || 'MT',
      durationDays: Number(durationDays) || 30,
      features: Array.isArray(features) ? features : ['dashboard', 'clients', 'loans', 'payments'],
      limits: {
        maxUsers: Number(limits?.maxUsers) || 0,
        maxClients: Number(limits?.maxClients) || 0,
        maxActiveLoans: Number(limits?.maxActiveLoans) || 0,
      },
      badgeColor: badgeColor || '#0284c7',
      isFeatured: Boolean(isFeatured),
      isActive: isActive !== false,
      displayOrder: Number(displayOrder) || 0,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Pacote '${pkg.name}' criado com sucesso!`,
      data: pkg,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Editar pacote existente (preço, funcionalidades, limites, etc.)
router.put('/admin/packages/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const pkg = await SubscriptionPackage.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Pacote não encontrado.' });
    }

    const {
      name,
      description,
      price,
      currency,
      durationDays,
      features,
      limits,
      badgeColor,
      isFeatured,
      isActive,
      displayOrder,
      syncInstitutions,
    } = req.body;

    if (name !== undefined) pkg.name = name.trim();
    if (description !== undefined) pkg.description = description;
    if (price !== undefined) pkg.price = Number(price);
    if (currency !== undefined) pkg.currency = currency;
    if (durationDays !== undefined) pkg.durationDays = Number(durationDays);
    if (Array.isArray(features)) pkg.features = features;
    if (limits !== undefined) {
      pkg.limits = {
        maxUsers: Number(limits.maxUsers) || 0,
        maxClients: Number(limits.maxClients) || 0,
        maxActiveLoans: Number(limits.maxActiveLoans) || 0,
      };
    }
    if (badgeColor !== undefined) pkg.badgeColor = badgeColor;
    if (isFeatured !== undefined) pkg.isFeatured = Boolean(isFeatured);
    if (isActive !== undefined) pkg.isActive = Boolean(isActive);
    if (displayOrder !== undefined) pkg.displayOrder = Number(displayOrder);

    await pkg.save();

    // Sincronizar permissões de funcionalidades e limite de utilizadores nas instituições que usam este pacote
    if (syncInstitutions !== false) {
      await Institution.updateMany(
        { $or: [{ 'subscription.packageId': pkg._id }, { 'subscription.plan': pkg.slug }] },
        {
          $set: {
            'subscription.packageName': pkg.name,
            'subscription.enabledFeatures': pkg.features,
            'subscription.maxUsers': pkg.limits?.maxUsers ?? 0,
          },
        }
      );
    }

    res.json({
      success: true,
      message: `Pacote '${pkg.name}' atualizado com sucesso!`,
      data: pkg,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Eliminar pacote personalizado
router.delete('/admin/packages/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const pkg = await SubscriptionPackage.findByIdAndDelete(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Pacote não encontrado.' });
    }
    res.json({ success: true, message: `Pacote '${pkg.name}' removido.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obter e actualizar contas/configurações da Nhiquela
router.get('/admin/config', protect, authorize('super_admin'), async (req, res) => {
  try {
    const config = await getOrInitPlatformConfig();
    res.json({ success: true, data: sanitizeAdminConfig(config) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/config', protect, authorize('super_admin'), async (req, res) => {
  try {
    const config = await getOrInitPlatformConfig();
    const { companyName, nuit, supportEmail, supportPhone, instructions, paymentAccounts, emailSettings } = req.body;

    if (companyName !== undefined) config.companyName = companyName;
    if (nuit !== undefined) config.nuit = nuit;
    if (supportEmail !== undefined) config.supportEmail = supportEmail;
    if (supportPhone !== undefined) config.supportPhone = supportPhone;
    if (instructions !== undefined) config.instructions = instructions;
    if (Array.isArray(paymentAccounts)) config.paymentAccounts = paymentAccounts;

    if (emailSettings && typeof emailSettings === 'object') {
      const prevEmail = config.emailSettings?.toObject ? config.emailSettings.toObject() : (config.emailSettings || {});
      const incomingPass = emailSettings.smtpPassword;
      config.emailSettings = {
        smtpHost: emailSettings.smtpHost !== undefined ? emailSettings.smtpHost : (prevEmail.smtpHost || ''),
        smtpPort: emailSettings.smtpPort !== undefined ? (Number(emailSettings.smtpPort) || 587) : (prevEmail.smtpPort || 587),
        smtpSecure: emailSettings.smtpSecure !== undefined ? Boolean(emailSettings.smtpSecure) : Boolean(prevEmail.smtpSecure),
        smtpUser: emailSettings.smtpUser !== undefined ? emailSettings.smtpUser : (prevEmail.smtpUser || ''),
        smtpPassword: (incomingPass && incomingPass.trim() !== '') ? incomingPass : (prevEmail.smtpPassword || ''),
        fromName: emailSettings.fromName !== undefined ? emailSettings.fromName : (prevEmail.fromName || 'Nhiquela Microcrédito Digital'),
        fromEmail: emailSettings.fromEmail !== undefined ? emailSettings.fromEmail : (prevEmail.fromEmail || ''),
        notificationEmails: emailSettings.notificationEmails !== undefined
          ? normalizeEmailList(emailSettings.notificationEmails)
          : (prevEmail.notificationEmails || []),
        notifyOnSubscriptionPayment: emailSettings.notifyOnSubscriptionPayment !== undefined
          ? Boolean(emailSettings.notifyOnSubscriptionPayment)
          : (prevEmail.notifyOnSubscriptionPayment !== false),
        notifyOnNewInstitution: emailSettings.notifyOnNewInstitution !== undefined
          ? Boolean(emailSettings.notifyOnNewInstitution)
          : (prevEmail.notifyOnNewInstitution !== false),
      };
    }

    config.updatedBy = req.user._id;

    await config.save();

    res.json({
      success: true,
      message: 'Contas e configurações de email da Nhiquela actualizadas com sucesso!',
      data: sanitizeAdminConfig(config),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Testar envio e recepção de email (Super Admin)
router.post('/admin/config/test-email', protect, authorize('super_admin'), async (req, res) => {
  try {
    const config = await getOrInitPlatformConfig();
    const { to, emailSettings } = req.body || {};
    const mergedCfg = emailSettings
      ? {
          ...(config.emailSettings?.toObject ? config.emailSettings.toObject() : (config.emailSettings || {})),
          ...emailSettings,
          smtpPassword: (emailSettings.smtpPassword && emailSettings.smtpPassword.trim() !== '')
            ? emailSettings.smtpPassword
            : config.emailSettings?.smtpPassword,
        }
      : config.emailSettings;

    const recipients = normalizeEmailList(
      to || mergedCfg?.notificationEmails || config.supportEmail || req.user.email
    );
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Informe pelo menos um email válido para testar a recepção.',
      });
    }

    const result = await emailService.sendEmail(
      recipients,
      'Teste de Configuração de Email — Nhiquela Microcrédito Digital',
      `<h2>Email Configurado com Sucesso</h2><p>Este email confirma que o envio e recepção de notificações e alertas da Nhiquela está operacional.</p>`,
      { overrideConfig: mergedCfg }
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: `Falha ao enviar email de teste: ${result.error}`,
      });
    }

    res.json({
      success: true,
      message: `Email de teste enviado para: ${recipients.join(', ')}`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Listar pedidos de subscrição (todos ou filtrados por status)
router.get('/admin/requests', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await SubscriptionRequest.find(query)
      .populate('institution', 'name email nuit subscription')
      .populate('requestedBy', 'name email phone role')
      .populate('packageId', 'name price durationDays features limits')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/admin/requests/:id/approve', protect, authorize('super_admin'), handleApproveSubscriptionRequest);
router.put('/admin/requests/:id/reject', protect, authorize('super_admin'), handleRejectSubscriptionRequest);

// Listar e gerir subscrições de todas as instituições (Super Admin)
router.get('/admin/institutions', protect, authorize('super_admin'), async (req, res) => {
  try {
    await seedDefaultPackages();
    const [institutions, packages, pendingRequests, userCounts] = await Promise.all([
      Institution.find().sort({ createdAt: -1 }),
      SubscriptionPackage.find().sort({ displayOrder: 1 }),
      SubscriptionRequest.find({ status: 'pending' }).sort({ createdAt: -1 }),
      User.aggregate([
        {
          $match: {
            role: { $nin: ['client', 'super_admin'] },
            isBlocked: { $ne: true },
          },
        },
        {
          $group: {
            _id: '$institution',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const userCountMap = {};
    userCounts.forEach((row) => {
      if (row._id) userCountMap[String(row._id)] = row.count;
    });

    const pendingMap = {};
    pendingRequests.forEach((r) => {
      if (r.institution && !pendingMap[String(r.institution)]) {
        pendingMap[String(r.institution)] = r;
      }
    });

    const now = new Date();
    const enriched = institutions.map((inst) => {
      const obj = inst.toObject ? inst.toObject() : { ...inst };
      const sub = obj.subscription || {};
      const expiresAt = sub.expiresAt ? new Date(sub.expiresAt) : null;
      const remainingDays = expiresAt
        ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
      const isExpired =
        sub.status === 'expired' ||
        sub.status === 'rejected' ||
        sub.status === 'cancelled' ||
        (expiresAt ? expiresAt < now : false);
      const pkg = packages.find(
        (p) => (sub.packageId && String(p._id) === String(sub.packageId)) || p.slug === sub.plan
      );
      const maxUsers = sub.maxUsers ?? pkg?.limits?.maxUsers ?? 0;
      const currentUsers = userCountMap[String(obj._id)] || 0;
      const effectiveStatus = isExpired
        ? 'expired'
        : sub.status === 'pending'
          ? 'pending'
          : sub.plan === 'trial'
            ? 'trial'
            : 'active';

      return {
        ...obj,
        subscriptionSummary: {
          plan: sub.plan || 'trial',
          packageName: sub.packageName || pkg?.name || sub.plan || 'Trial',
          status: sub.status || 'active',
          effectiveStatus,
          expiresAt,
          remainingDays,
          isExpired,
          currentUsers,
          maxUsers,
          pendingRequest: pendingMap[String(obj._id)] || null,
        },
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

