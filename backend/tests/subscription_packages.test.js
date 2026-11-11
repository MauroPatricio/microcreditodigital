import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_pkg_123';
process.env.JWT_REFRESH_SECRET = 'test_refresh_pkg_123';

const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: jwt } = await import('jsonwebtoken');

const { default: User } = await import('../src/models/User.js');
const { default: Institution } = await import('../src/models/Institution.js');
const { default: SubscriptionPackage } = await import('../src/models/SubscriptionPackage.js');
const { default: PlatformConfig } = await import('../src/models/PlatformConfig.js');
const { default: SubscriptionRequest } = await import('../src/models/SubscriptionRequest.js');
const { default: AuditLog } = await import('../src/models/AuditLog.js');
const { default: subscriptionRoutes } = await import('../src/routes/subscriptions.js');
const { default: userRoutes } = await import('../src/routes/users.js');
const { requireFeature, resolveInstitutionFeatures } = await import('../src/middleware/rbac.js');
const { protect } = await import('../src/middleware/auth.js');

describe('Subscription Packages, Nhiquela Accounts & Feature RBAC Suite', () => {
  let packagesStore = [];
  let requestsStore = [];
  let usersStore = [];
  let platformConfigDoc = null;
  let instDoc = null;
  let superAdminUser = null;
  let ownerUser = null;
  let superAdminToken = '';
  let ownerToken = '';

  const app = express();
  app.use(express.json());
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/users', userRoutes);
  app.get('/api/cashflow-test', protect, requireFeature('cashflow'), (req, res) => {
    res.json({ success: true, message: 'Cashflow liberado' });
  });
  app.get('/api/clients-test', protect, requireFeature('clients'), (req, res) => {
    res.json({ success: true, message: 'Clientes liberado' });
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    packagesStore = [
      {
        _id: 'pkg_standard',
        name: 'Standard',
        slug: 'standard',
        price: 3200,
        currency: 'MT',
        durationDays: 30,
        features: ['dashboard', 'clients', 'loans', 'payments'],
        isActive: true,
        limits: { maxUsers: 10, maxClients: 500, maxActiveLoans: 500 },
        save: async function () { return this; },
      },
    ];
    requestsStore = [];
    platformConfigDoc = {
      _id: 'cfg_1',
      key: 'nhiquela_platform',
      companyName: 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
      paymentAccounts: [
        { label: 'BCI', type: 'bank', bankName: 'BCI', accountNumber: '26266610710001', nib: '000800006266610710113', isActive: true },
      ],
      save: async function () { return this; },
    };
    instDoc = {
      _id: 'inst_1',
      name: 'Microcrédito Teste',
      nuit: '400111222',
      email: 'owner@teste.co.mz',
      isActive: true,
      subscription: {
        plan: 'standard',
        packageId: 'pkg_standard',
        packageName: 'Standard',
        enabledFeatures: ['dashboard', 'clients', 'loans', 'payments'],
        status: 'active',
        expiresAt: new Date(Date.now() + 15 * 86400000),
      },
      save: async function () { return this; },
      toObject: function () { return { ...this }; },
    };

    superAdminUser = {
      _id: 'user_sa',
      name: 'Super Admin Nhiquela',
      email: 'owner@nhiquela.co.mz',
      role: 'super_admin',
      isBlocked: false,
    };
    ownerUser = {
      _id: 'user_owner',
      name: 'Proprietário Teste',
      email: 'owner@teste.co.mz',
      role: 'owner',
      institution: instDoc,
      activeInstitution: instDoc,
      isBlocked: false,
    };

    superAdminToken = jwt.sign({ id: superAdminUser._id }, process.env.JWT_SECRET);
    ownerToken = jwt.sign({ id: ownerUser._id }, process.env.JWT_SECRET);

    usersStore = [ownerUser];

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const found = id === superAdminUser._id
        ? superAdminUser
        : usersStore.find((u) => u._id === id) || null;
      const chain = {
        populate: () => chain,
        select: () => chain,
        then: (resolve) => resolve(found),
      };
      return chain;
    });
    jest.spyOn(User, 'findOne').mockImplementation(async (q = {}) => {
      if (q.email) return usersStore.find((u) => u.email === q.email) || null;
      if (q.$or) {
        return usersStore.find((u) =>
          q.$or.some((cond) => (cond.phone && u.phone === cond.phone) || (cond.identityDocument && u.identityDocument === cond.identityDocument))
        ) || null;
      }
      return null;
    });
    jest.spyOn(User, 'countDocuments').mockImplementation(async (q = {}) => {
      return usersStore.filter((u) => {
        if (q.institution && (u.institution?._id || u.institution) !== q.institution) return false;
        if (q.role?.$nin && q.role.$nin.includes(u.role)) return false;
        if (q.isBlocked?.$ne === true && u.isBlocked === true) return false;
        return true;
      }).length;
    });
    jest.spyOn(User, 'create').mockImplementation(async (doc) => {
      const created = {
        _id: 'user_' + (usersStore.length + 1),
        ...doc,
        toJSON: function () { return { ...this }; },
        save: async function () { return this; },
      };
      usersStore.push(created);
      return created;
    });

    jest.spyOn(Institution, 'findById').mockImplementation(async (id) => (id === instDoc._id ? instDoc : null));
    jest.spyOn(Institution, 'findOne').mockImplementation(async () => instDoc);
    jest.spyOn(Institution, 'updateMany').mockImplementation(async (_q, upd) => {
      if (upd?.$set?.['subscription.enabledFeatures']) {
        instDoc.subscription.enabledFeatures = upd.$set['subscription.enabledFeatures'];
      }
      if (upd?.$set?.['subscription.maxUsers'] !== undefined) {
        instDoc.subscription.maxUsers = upd.$set['subscription.maxUsers'];
      }
      return { modifiedCount: 1 };
    });

    jest.spyOn(SubscriptionPackage, 'countDocuments').mockImplementation(async () => packagesStore.length);
    jest.spyOn(SubscriptionPackage, 'find').mockImplementation((q = {}) => {
      let list = [...packagesStore];
      if (q.isActive !== undefined) list = list.filter((p) => p.isActive === q.isActive);
      return { sort: async () => list };
    });
    jest.spyOn(SubscriptionPackage, 'findOne').mockImplementation(async (q = {}) => {
      return packagesStore.find((p) => (q.slug ? p.slug === q.slug : true)) || null;
    });
    jest.spyOn(SubscriptionPackage, 'findById').mockImplementation(async (id) => {
      return packagesStore.find((p) => p._id === id) || null;
    });
    jest.spyOn(SubscriptionPackage, 'create').mockImplementation(async (doc) => {
      const created = {
        _id: 'pkg_' + (packagesStore.length + 1),
        ...doc,
        save: async function () { return this; },
      };
      packagesStore.push(created);
      return created;
    });

    jest.spyOn(PlatformConfig, 'findOne').mockImplementation(async () => platformConfigDoc);
    jest.spyOn(AuditLog, 'create').mockImplementation(async () => ({}));

    jest.spyOn(SubscriptionRequest, 'findOne').mockImplementation(async (q = {}) => {
      return requestsStore.find((r) => (!q.status || r.status === q.status) && (!q.institution || r.institution === q.institution)) || null;
    });
    jest.spyOn(SubscriptionRequest, 'find').mockImplementation((q = {}) => {
      const list = requestsStore.filter((r) => (!q.institution || r.institution === q.institution) && (!q.status || r.status === q.status));
      const chain = {
        populate: () => chain,
        sort: async () => list,
      };
      return chain;
    });
    jest.spyOn(SubscriptionRequest, 'findById').mockImplementation(async (id) => {
      return requestsStore.find((r) => r._id === id) || null;
    });
    jest.spyOn(SubscriptionRequest, 'create').mockImplementation(async (doc) => {
      const reqObj = {
        _id: 'req_' + (requestsStore.length + 1),
        createdAt: new Date(),
        ...doc,
        save: async function () { return this; },
        toObject: function () { return { ...this }; },
      };
      requestsStore.push(reqObj);
      return reqObj;
    });
  });

  it('1. Super Admin cria pacote personalizado com funcionalidades escolhidas e ajusta contas Nhiquela', async () => {
    const createPkgRes = await request(app)
      .post('/api/subscriptions/admin/packages')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Microcrédito Ouro',
        description: 'Pacote customizado com WhatsApp e Cashflow',
        price: 4200,
        durationDays: 45,
        features: ['dashboard', 'clients', 'loans', 'payments', 'cashflow', 'whatsapp'],
        limits: { maxUsers: 25, maxClients: 2000 },
      });

    expect(createPkgRes.status).toBe(201);
    expect(createPkgRes.body.data.slug).toBe('microcredito_ouro');
    expect(createPkgRes.body.data.price).toBe(4200);
    expect(createPkgRes.body.data.features).toContain('cashflow');

    const cfgRes = await request(app)
      .put('/api/subscriptions/admin/config')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        companyName: 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
        paymentAccounts: [
          { label: 'BCI Principal', type: 'bank', bankName: 'BCI', accountNumber: '26266610710001', nib: '000800006266610710113', isActive: true },
          { label: 'M-Pesa Oficial', type: 'mpesa', phoneNumber: '+258 84 999 0000', isActive: true },
        ],
      });

    expect(cfgRes.status).toBe(200);
    expect(cfgRes.body.data.paymentAccounts.length).toBe(2);
  });

  it('2. Utilizador tem acesso restrito às funcionalidades do pacote pago e desbloqueia após aprovação', async () => {
    // No pacote Standard (sem cashflow), /api/clients-test passa (200) mas /api/cashflow-test bloqueia (403)
    const allowedRes = await request(app)
      .get('/api/clients-test')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(allowedRes.status).toBe(200);

    const blockedRes = await request(app)
      .get('/api/cashflow-test')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.featureBlocked).toBe(true);

    // Super Admin cria novo pacote com cashflow
    const pkgRes = await request(app)
      .post('/api/subscriptions/admin/packages')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Corporativo Plus',
        price: 4800,
        durationDays: 60,
        features: ['dashboard', 'clients', 'loans', 'payments', 'cashflow'],
      });
    const newPkg = pkgRes.body.data;

    // Owner submete comprovativo para o novo pacote
    const dummyPdf = Buffer.from('%PDF-1.4 dummy receipt');
    const subRes = await request(app)
      .post('/api/subscriptions/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('packageId', newPkg._id)
      .field('amountPaid', 4800)
      .field('paymentMethod', 'M-Pesa')
      .attach('proof', dummyPdf, { filename: 'talao.pdf', contentType: 'application/pdf' });

    expect(subRes.status).toBe(201);
    const reqId = subRes.body.data._id;

    // Submissão duplicada enquanto pendente deve ser bloqueada
    const dupRes = await request(app)
      .post('/api/subscriptions/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('packageId', newPkg._id)
      .attach('proof', dummyPdf, { filename: 'talao2.pdf', contentType: 'application/pdf' });
    expect(dupRes.status).toBe(400);

    // Super Admin aprova pagamento -> activa pacote + desbloqueia cashflow!
    const approveRes = await request(app)
      .put(`/api/subscriptions/admin/requests/${reqId}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(approveRes.status).toBe(200);
    expect(instDoc.subscription.plan).toBe('corporativo_plus');
    expect(instDoc.subscription.enabledFeatures).toContain('cashflow');

    const unlockedRes = await request(app)
      .get('/api/cashflow-test')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(unlockedRes.status).toBe(200);
  });

  it('3. Super Admin ao editar pacote sincroniza funcionalidades e preço imediatamente', async () => {
    const editRes = await request(app)
      .put('/api/subscriptions/admin/packages/pkg_standard')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        price: 3500,
        features: ['dashboard', 'clients', 'loans', 'payments', 'cashflow'],
        syncInstitutions: true,
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.data.price).toBe(3500);

    const features = await resolveInstitutionFeatures(instDoc);
    expect(features).toContain('cashflow');
  });

  it('4. Trial expirado bloqueia acesso operacional até pagamento aprovado pelo Super Admin', async () => {
    instDoc.subscription = {
      plan: 'trial',
      packageName: 'Período Experimental (7 Dias)',
      status: 'trial',
      expiresAt: new Date(Date.now() - 3600 * 1000),
      maxUsers: 0,
    };

    const blockedRes = await request(app)
      .get('/api/clients-test')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(blockedRes.status).toBe(403);
    expect(blockedRes.body.subscriptionBlocked).toBe(true);

    const dummyPdf = Buffer.from('%PDF-1.4 receipt');
    const subRes = await request(app)
      .post('/api/subscriptions/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('packageId', 'pkg_standard')
      .field('amountPaid', 3200)
      .attach('proof', dummyPdf, { filename: 'comp.pdf', contentType: 'application/pdf' });
    expect(subRes.status).toBe(201);

    const approveRes = await request(app)
      .put(`/api/subscriptions/admin/requests/${subRes.body.data._id}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(approveRes.status).toBe(200);
    expect(instDoc.subscription.status).toBe('active');
    expect(instDoc.subscription.maxUsers).toBe(10);

    const unblockedRes = await request(app)
      .get('/api/clients-test')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(unblockedRes.status).toBe(200);
  });

  it('5. Enforça limite personalizado de utilizadores por pacote (1, 3, 5) e desbloqueia após upgrade', async () => {
    // Pacote com limite de 1 utilizador (já existe o owner na instituição -> 1/1)
    instDoc.subscription.maxUsers = 1;

    const blockedCreate = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Agente Extra',
        email: 'agente1@teste.co.mz',
        phone: '+258840000111',
        password: 'Password123!',
        role: 'agent',
      });
    expect(blockedCreate.status).toBe(403);
    expect(blockedCreate.body.limitReached).toBe(true);
    expect(blockedCreate.body.maxUsers).toBe(1);

    // Super Admin aumenta o pacote para 3 utilizadores e sincroniza instituições
    await request(app)
      .put('/api/subscriptions/admin/packages/pkg_standard')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        limits: { maxUsers: 3, maxClients: 500, maxActiveLoans: 500 },
        syncInstitutions: true,
      });
    expect(instDoc.subscription.maxUsers).toBe(3);

    // Agora permite criar 2º e 3º utilizador, e bloqueia o 4º
    const u2 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Agente 2',
        email: 'agente2@teste.co.mz',
        phone: '+258840000222',
        password: 'Password123!',
        role: 'agent',
      });
    expect(u2.status).toBe(201);

    const u3 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Gestor 3',
        email: 'gestor3@teste.co.mz',
        phone: '+258840000333',
        password: 'Password123!',
        role: 'manager',
      });
    expect(u3.status).toBe(201);

    const u4Blocked = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Agente 4',
        email: 'agente4@teste.co.mz',
        phone: '+258840000444',
        password: 'Password123!',
        role: 'agent',
      });
    expect(u4Blocked.status).toBe(403);
    expect(u4Blocked.body.limitReached).toBe(true);
    expect(u4Blocked.body.currentUsers).toBe(3);
    expect(u4Blocked.body.maxUsers).toBe(3);
  });
});

