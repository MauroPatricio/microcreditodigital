import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

process.env.JWT_SECRET = 'test_secret_notify_789';
process.env.JWT_REFRESH_SECRET = 'test_refresh_notify_789';

const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: jwt } = await import('jsonwebtoken');

const { default: User } = await import('../src/models/User.js');
const { default: Institution } = await import('../src/models/Institution.js');
const { default: Credit } = await import('../src/models/Credit.js');
const { default: Payment } = await import('../src/models/Payment.js');
const { default: Notification } = await import('../src/models/Notification.js');
const { default: PlatformConfig } = await import('../src/models/PlatformConfig.js');
const { default: SubscriptionPackage } = await import('../src/models/SubscriptionPackage.js');
const { default: SubscriptionRequest } = await import('../src/models/SubscriptionRequest.js');
const { default: AuditLog } = await import('../src/models/AuditLog.js');
const { default: emailService } = await import('../src/services/emailService.js');

const { default: notificationRoutes } = await import('../src/routes/notifications.js');
const { default: paymentRoutes } = await import('../src/routes/payments.js');
const { default: subscriptionRoutes } = await import('../src/routes/subscriptions.js');
const { default: institutionRoutes } = await import('../src/routes/institutions.js');

describe('Badges de Pagamento, Notificações & Configuração de Emails (Envio/Recepção)', () => {
  let notificationsStore = [];
  let paymentsStore = [];
  let requestsStore = [];
  let packagesStore = [];
  let usersStore = [];
  let tempFiles = [];
  let sentEmails = [];

  let instDoc = null;
  let platformConfigDoc = null;
  let superAdminUser = null;
  let ownerUser = null;
  let adminUser = null;
  let clientUser = null;
  let creditDoc = null;

  let superAdminToken = '';
  let ownerToken = '';
  let clientToken = '';

  const app = express();
  app.use(express.json());
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/institutions', institutionRoutes);

  beforeEach(() => {
    jest.restoreAllMocks();
    notificationsStore = [];
    paymentsStore = [];
    requestsStore = [];
    tempFiles = [];
    sentEmails = [];

    instDoc = {
      _id: 'inst_notif_1',
      name: 'Microcrédito Horizonte',
      email: 'geral@horizonte.co.mz',
      isActive: true,
      subscription: {
        plan: 'premium',
        packageName: 'Premium',
        enabledFeatures: ['dashboard', 'clients', 'loans', 'payments'],
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 86400000),
      },
      settings: {
        notificationSettings: {
          channels: { email: true, push: true, sms: false },
          emailConfig: {
            senderName: 'Horizonte Cobranças',
            senderEmail: 'cobrancas@horizonte.co.mz',
            smtpHost: 'smtp.horizonte.co.mz',
            smtpPort: 587,
            smtpUser: 'cobrancas@horizonte.co.mz',
            smtpPassword: 'secret_inst_pass',
            alertRecipients: ['financas@horizonte.co.mz', 'auditoria@horizonte.co.mz'],
            notifyOnPaymentReceived: true,
            notifyOnPaymentConfirmed: true,
          },
        },
      },
      async save() { return this; },
      toObject() { return JSON.parse(JSON.stringify(this)); },
    };

    platformConfigDoc = {
      _id: 'cfg_global',
      key: 'nhiquela_platform',
      companyName: 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
      supportEmail: 'suporte@nhiquela.co.mz',
      paymentAccounts: [],
      emailSettings: {
        smtpHost: 'smtp.nhiquela.co.mz',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: 'mailer@nhiquela.co.mz',
        smtpPassword: 'secret_platform_pass',
        fromName: 'Nhiquela Central',
        fromEmail: 'alertas@nhiquela.co.mz',
        notificationEmails: ['tesouraria@nhiquela.co.mz'],
        notifyOnSubscriptionPayment: true,
        notifyOnNewInstitution: true,
      },
      async save() { return this; },
      toObject() { return JSON.parse(JSON.stringify(this)); },
    };

    packagesStore = [
      {
        _id: 'pkg_std',
        name: 'Standard',
        slug: 'standard',
        price: 3200,
        durationDays: 30,
        features: ['dashboard', 'clients', 'loans', 'payments'],
        limits: { maxUsers: 3, maxClients: 500, maxActiveLoans: 500 },
        isActive: true,
        async save() { return this; },
      },
    ];

    superAdminUser = {
      _id: 'u_sa',
      name: 'Super Admin',
      email: 'mauro.patricio1@gmail.com',
      role: 'super_admin',
      isBlocked: false,
    };
    ownerUser = {
      _id: 'u_own',
      name: 'Owner Horizonte',
      email: 'owner@horizonte.co.mz',
      role: 'owner',
      institution: instDoc,
      activeInstitution: instDoc,
      isBlocked: false,
    };
    adminUser = {
      _id: 'u_adm',
      name: 'Admin Horizonte',
      email: 'admin@horizonte.co.mz',
      role: 'admin',
      institution: instDoc,
      activeInstitution: instDoc,
      isBlocked: false,
    };
    clientUser = {
      _id: 'u_cli',
      name: 'Carlos Cliente',
      email: 'carlos.cliente@teste.co.mz',
      role: 'client',
      institution: instDoc,
      activeInstitution: instDoc,
      isBlocked: false,
    };
    usersStore = [superAdminUser, ownerUser, adminUser, clientUser];

    creditDoc = {
      _id: 'cred_1',
      loanNumber: 'EMP-001',
      institution: instDoc._id,
      client: clientUser._id,
      agent: null,
      totalPayable: 5000,
      totalPaid: 0,
      status: 'active',
      async save() { return this; },
    };

    superAdminToken = jwt.sign({ id: superAdminUser._id }, process.env.JWT_SECRET);
    ownerToken = jwt.sign({ id: ownerUser._id }, process.env.JWT_SECRET);
    clientToken = jwt.sign({ id: clientUser._id }, process.env.JWT_SECRET);

    jest.spyOn(emailService, 'sendEmail').mockImplementation(async (to, subject, html, opts = {}) => {
      const entry = { to, subject, html, opts };
      sentEmails.push(entry);
      return { success: true, messageId: 'mock-' + sentEmails.length, to };
    });

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const found = usersStore.find((u) => String(u._id) === String(id)) || null;
      const chain = {
        populate: () => chain,
        select: () => chain,
        then: (resolve) => resolve(found),
      };
      return chain;
    });
    jest.spyOn(User, 'find').mockImplementation((q = {}) => {
      const list = usersStore.filter((u) => {
        if (q.institution && String(u.institution?._id || u.institution) !== String(q.institution)) return false;
        if (q.role) {
          if (typeof q.role === 'string' && u.role !== q.role) return false;
          if (q.role.$in && !q.role.$in.includes(u.role)) return false;
        }
        if (q.isBlocked?.$ne === true && u.isBlocked === true) return false;
        return true;
      });
      const chain = {
        select: () => chain,
        then: (resolve) => resolve(list),
      };
      return chain;
    });
    jest.spyOn(User, 'countDocuments').mockResolvedValue(2);

    jest.spyOn(Institution, 'findById').mockImplementation(async (id) =>
      String(id) === String(instDoc._id) ? instDoc : null
    );
    jest.spyOn(Institution, 'findOne').mockImplementation(async () => instDoc);
    jest.spyOn(Institution, 'findByIdAndUpdate').mockImplementation(async (id, update) => {
      if (String(id) !== String(instDoc._id)) return null;
      if (update.settings) {
        instDoc.settings = update.settings;
      }
      return instDoc;
    });

    jest.spyOn(Credit, 'findById').mockImplementation(async (id) =>
      String(id) === String(creditDoc._id) ? creditDoc : null
    );

    jest.spyOn(Payment, 'create').mockImplementation(async (doc) => {
      const created = { _id: 'pay_' + (paymentsStore.length + 1), createdAt: new Date(), ...doc, async save() { return this; } };
      paymentsStore.push(created);
      return created;
    });
    jest.spyOn(Payment, 'countDocuments').mockImplementation(async (q = {}) =>
      paymentsStore.filter((p) =>
        (!q.institution || String(p.institution) === String(q.institution)) &&
        (!q.status || p.status === q.status)
      ).length
    );

    jest.spyOn(Notification, 'create').mockImplementation(async (doc) => {
      const n = { _id: 'notif_' + (notificationsStore.length + 1), isRead: false, createdAt: new Date(), ...doc };
      notificationsStore.push(n);
      return n;
    });
    jest.spyOn(Notification, 'countDocuments').mockImplementation(async (q = {}) =>
      notificationsStore.filter((n) =>
        (!q.user || String(n.user) === String(q.user)) &&
        (q.isRead === undefined || n.isRead === q.isRead)
      ).length
    );

    jest.spyOn(PlatformConfig, 'findOne').mockImplementation(async () => platformConfigDoc);
    jest.spyOn(SubscriptionPackage, 'countDocuments').mockResolvedValue(packagesStore.length);
    jest.spyOn(SubscriptionPackage, 'find').mockImplementation(() => ({
      sort: async () => packagesStore,
      then: (resolve) => resolve(packagesStore),
    }));
    jest.spyOn(SubscriptionPackage, 'findById').mockImplementation(async (id) =>
      packagesStore.find((p) => String(p._id) === String(id)) || null
    );

    jest.spyOn(SubscriptionRequest, 'findOne').mockImplementation(async (q = {}) =>
      requestsStore.find((r) => (!q.status || r.status === q.status) && (!q.institution || String(r.institution) === String(q.institution))) || null
    );
    jest.spyOn(SubscriptionRequest, 'create').mockImplementation(async (doc) => {
      if (doc.proofOfPaymentUrl) {
        tempFiles.push(path.join(process.cwd(), doc.proofOfPaymentUrl.replace(/^\//, '')));
      }
      const r = { _id: 'sreq_' + (requestsStore.length + 1), createdAt: new Date(), ...doc, toObject() { return { ...this }; } };
      requestsStore.push(r);
      return r;
    });
    jest.spyOn(SubscriptionRequest, 'countDocuments').mockImplementation(async (q = {}) =>
      requestsStore.filter((r) => (!q.status || r.status === q.status)).length
    );

    jest.spyOn(AuditLog, 'create').mockResolvedValue({});
  });

  afterEach(() => {
    tempFiles.forEach((f) => {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
    });
  });

  it('1. Pagamento submetido cria notificações in-app, incrementa badge pendingPayments e envia alerta por email configurado', async () => {
    const payRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        creditId: creditDoc._id,
        amount: 1250,
        paymentMethod: 'mpesa',
        transactionId: 'MP-551100',
      });

    expect(payRes.status).toBe(201);

    // Owner e Admin da instituição foram notificados in-app
    expect(notificationsStore.some((n) => n.user === ownerUser._id && n.type === 'payment_submitted')).toBe(true);
    expect(notificationsStore.some((n) => n.user === adminUser._id && n.type === 'payment_submitted')).toBe(true);

    // Email enviado incluindo os destinatários configurados na instituição
    expect(sentEmails.length).toBeGreaterThanOrEqual(1);
    expect(sentEmails[0].to).toEqual(expect.arrayContaining(['financas@horizonte.co.mz', 'auditoria@horizonte.co.mz']));

    // Endpoint /api/notifications/badges retorna contagem exacta do badge de cobranças e notificações
    const badgeRes = await request(app)
      .get('/api/notifications/badges')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(badgeRes.status).toBe(200);
    expect(badgeRes.body.data.pendingPayments).toBe(1);
    expect(badgeRes.body.data.unreadNotifications).toBeGreaterThanOrEqual(1);
  });

  it('2. Configuração de emails (envio & recepção) na Nhiquela e na Instituição preserva senha, mascara resposta e dispara teste', async () => {
    // Super Admin actualiza config preservando senha SMTP e definindo emails de recepção
    const savePlatformRes = await request(app)
      .put('/api/subscriptions/admin/config')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        emailSettings: {
          fromName: 'Nhiquela Financeiro',
          fromEmail: 'alertas@nhiquela.co.mz',
          smtpHost: 'smtp.nhiquela.co.mz',
          smtpPort: 587,
          smtpUser: 'mailer@nhiquela.co.mz',
          smtpPassword: '', // vazio preserva a senha guardada
          notificationEmails: ['equipa1@nhiquela.co.mz', 'equipa2@nhiquela.co.mz'],
          notifyOnSubscriptionPayment: true,
        },
      });
    expect(savePlatformRes.status).toBe(200);
    expect(savePlatformRes.body.data.emailSettings.smtpPassword).toBe('');
    expect(savePlatformRes.body.data.emailSettings.hasSmtpPassword).toBe(true);
    expect(platformConfigDoc.emailSettings.smtpPassword).toBe('secret_platform_pass');
    expect(savePlatformRes.body.data.emailSettings.notificationEmails).toEqual(['equipa1@nhiquela.co.mz', 'equipa2@nhiquela.co.mz']);

    // Teste de envio Super Admin
    const testSaRes = await request(app)
      .post('/api/subscriptions/admin/config/test-email')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({});
    expect(testSaRes.status).toBe(200);
    expect(sentEmails.some((e) => e.to.includes('equipa1@nhiquela.co.mz'))).toBe(true);

    // Submissão de subscrição notifica Super Admin in-app, incrementa badge e dispara alerta por email
    const dummyPdf = Buffer.from('%PDF-1.4 sub');
    const subRes = await request(app)
      .post('/api/subscriptions/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('packageId', 'pkg_std')
      .field('amountPaid', 3200)
      .attach('proof', dummyPdf, { filename: 'talao.pdf', contentType: 'application/pdf' });
    expect(subRes.status).toBe(201);

    await new Promise((r) => setTimeout(r, 30));

    expect(notificationsStore.some((n) => n.user === superAdminUser._id && n.type === 'subscription_submitted')).toBe(true);
    expect(sentEmails.some((e) => e.to.includes('equipa1@nhiquela.co.mz'))).toBe(true);

    const saBadges = await request(app)
      .get('/api/notifications/badges')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(saBadges.status).toBe(200);
    expect(saBadges.body.data.pendingSubscriptions).toBe(1);

    // Instituição testa o seu próprio email de recepção/envio
    const testInstRes = await request(app)
      .post('/api/institutions/my/test-email')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({});
    expect(testInstRes.status).toBe(200);
    expect(sentEmails.some((e) => e.to.includes('financas@horizonte.co.mz'))).toBe(true);
  });
});
