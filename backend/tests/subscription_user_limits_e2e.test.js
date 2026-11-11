import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

process.env.JWT_SECRET = 'test_secret_sub_limits_456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_sub_limits_456';

const { default: express } = await import('express');
const { default: request } = await import('supertest');
const { default: jwt } = await import('jsonwebtoken');

const { default: User } = await import('../src/models/User.js');
const { default: Institution } = await import('../src/models/Institution.js');
const { default: SubscriptionPackage } = await import('../src/models/SubscriptionPackage.js');
const { default: PlatformConfig } = await import('../src/models/PlatformConfig.js');
const { default: SubscriptionRequest } = await import('../src/models/SubscriptionRequest.js');
const { default: AuditLog } = await import('../src/models/AuditLog.js');

const { default: authRoutes } = await import('../src/routes/auth.js');
const { default: subscriptionRoutes } = await import('../src/routes/subscriptions.js');
const { default: institutionRoutes } = await import('../src/routes/institutions.js');
const { default: userRoutes } = await import('../src/routes/users.js');
const { requireFeature } = await import('../src/middleware/rbac.js');
const { protect } = await import('../src/middleware/auth.js');

describe('Suite Completa: Pacotes Personalizados, Subscrições (Trial 7 Dias) & Limite de Utilizadores', () => {
  let packagesStore = [];
  let requestsStore = [];
  let institutionsStore = [];
  let usersStore = [];
  let platformConfigDoc = null;
  let uploadedTempFiles = [];

  let superAdminUser = null;
  let ownerUser = null;
  let adminUser = null;
  let agentUser = null;
  let instDoc = null;

  let superAdminToken = '';
  let ownerToken = '';
  let adminToken = '';
  let agentToken = '';

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/institutions', institutionRoutes);
  app.use('/api/users', userRoutes);
  app.get('/api/clients-gated', protect, requireFeature('clients'), (req, res) => {
    res.json({ success: true, module: 'clients' });
  });
  app.get('/api/loans-gated', protect, requireFeature('loans'), (req, res) => {
    res.json({ success: true, module: 'loans' });
  });
  app.get('/api/reports-gated', protect, requireFeature('reports'), (req, res) => {
    res.json({ success: true, module: 'reports' });
  });

  const makeHydratedUser = (doc) => {
    const obj = {
      ...doc,
      isBlocked: doc.isBlocked ?? false,
      toJSON() {
        const clone = { ...this };
        delete clone.password;
        delete clone.save;
        delete clone.populate;
        delete clone.toJSON;
        return clone;
      },
      async save() {
        const idx = usersStore.findIndex((u) => String(u._id) === String(this._id));
        if (idx >= 0) {
          usersStore[idx] = this;
        } else {
          usersStore.push(this);
        }
        return this;
      },
      async populate(field) {
        if ((field === 'institution' || field === 'activeInstitution') && this[field]) {
          const id = this[field]._id || this[field];
          const foundInst = institutionsStore.find((i) => String(i._id) === String(id));
          if (foundInst) this[field] = foundInst;
        }
        return this;
      },
    };
    return obj;
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    uploadedTempFiles = [];

    packagesStore = [
      {
        _id: 'pkg_starter',
        name: 'Starter',
        slug: 'starter',
        price: 1500,
        currency: 'MT',
        durationDays: 30,
        features: ['dashboard', 'clients', 'loans'],
        limits: { maxUsers: 1, maxClients: 100, maxActiveLoans: 100 },
        isActive: true,
        displayOrder: 1,
        async save() { return this; },
      },
      {
        _id: 'pkg_standard',
        name: 'Standard',
        slug: 'standard',
        price: 3200,
        currency: 'MT',
        durationDays: 30,
        features: ['dashboard', 'clients', 'loans', 'payments'],
        limits: { maxUsers: 3, maxClients: 500, maxActiveLoans: 500 },
        isActive: true,
        displayOrder: 2,
        async save() { return this; },
      },
      {
        _id: 'pkg_premium',
        name: 'Premium',
        slug: 'premium',
        price: 5000,
        currency: 'MT',
        durationDays: 30,
        features: ['dashboard', 'clients', 'loans', 'payments', 'reports'],
        limits: { maxUsers: 5, maxClients: 0, maxActiveLoans: 0 },
        isActive: true,
        displayOrder: 3,
        async save() { return this; },
      },
    ];

    requestsStore = [];

    instDoc = {
      _id: 'inst_main',
      name: 'Microcrédito Central Lda',
      nuit: '400555999',
      email: 'contato@central.co.mz',
      isActive: true,
      subscription: {
        plan: 'trial',
        packageName: 'Período Experimental (7 Dias)',
        status: 'active',
        maxUsers: 0,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
      async save() { return this; },
      toObject() { return { ...this }; },
    };
    institutionsStore = [instDoc];

    platformConfigDoc = {
      _id: 'cfg_nhiquela',
      key: 'nhiquela_platform',
      companyName: 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
      paymentAccounts: [
        { label: 'Millennium BIM', type: 'bank', bankName: 'BIM', accountNumber: '123456789', nib: '000100001234567890001', isActive: true },
        { label: 'M-Pesa Nhiquela', type: 'mpesa', phoneNumber: '+258 84 123 4567', isActive: true },
      ],
      async save() { return this; },
    };

    superAdminUser = makeHydratedUser({
      _id: 'u_superadmin',
      name: 'Super Admin Nhiquela',
      email: 'owner@nhiquela.co.mz',
      phone: '+258840000000',
      identityDocument: '110100000001A',
      role: 'super_admin',
    });
    ownerUser = makeHydratedUser({
      _id: 'u_owner',
      name: 'Proprietário Central',
      email: 'owner@central.co.mz',
      phone: '+258840000001',
      identityDocument: '110100000002B',
      role: 'owner',
      institution: instDoc,
      activeInstitution: instDoc,
    });
    adminUser = makeHydratedUser({
      _id: 'u_admin',
      name: 'Administrador Central',
      email: 'admin@central.co.mz',
      phone: '+258840000002',
      identityDocument: '110100000003C',
      role: 'admin',
      institution: instDoc,
      activeInstitution: instDoc,
      isBlocked: true, // inicialmente bloqueado para controlar exactamente o count nos testes de 1 utilizador
    });
    agentUser = makeHydratedUser({
      _id: 'u_agent',
      name: 'Agente Campo',
      email: 'agente@central.co.mz',
      phone: '+258840000003',
      identityDocument: '110100000004D',
      role: 'agent',
      institution: instDoc,
      activeInstitution: instDoc,
      isBlocked: true,
    });

    usersStore = [superAdminUser, ownerUser, adminUser, agentUser];

    superAdminToken = jwt.sign({ id: superAdminUser._id }, process.env.JWT_SECRET);
    ownerToken = jwt.sign({ id: ownerUser._id }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET);
    agentToken = jwt.sign({ id: agentUser._id }, process.env.JWT_SECRET);

    // Mocks User
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
        if (!q.institution) return true;
        const uInstId = u.institution?._id || u.institution;
        return String(uInstId) === String(q.institution);
      });
      const chain = {
        select: () => chain,
        sort: async () => list,
      };
      return chain;
    });
    jest.spyOn(User, 'findOne').mockImplementation(async (q = {}) => {
      if (q.email) return usersStore.find((u) => u.email === q.email) || null;
      if (q.phone) return usersStore.find((u) => u.phone === q.phone) || null;
      if (q.identityDocument) return usersStore.find((u) => u.identityDocument === q.identityDocument) || null;
      if (q.$or) {
        return usersStore.find((u) =>
          q.$or.some((c) => (c.phone && u.phone === c.phone) || (c.identityDocument && u.identityDocument === c.identityDocument))
        ) || null;
      }
      return null;
    });
    jest.spyOn(User, 'countDocuments').mockImplementation(async (q = {}) => {
      return usersStore.filter((u) => {
        if (q.institution && String(u.institution?._id || u.institution) !== String(q.institution)) return false;
        if (q.role?.$nin && q.role.$nin.includes(u.role)) return false;
        if (q.isBlocked?.$ne === true && u.isBlocked === true) return false;
        return true;
      }).length;
    });
    jest.spyOn(User, 'aggregate').mockImplementation(async () => {
      const counts = {};
      usersStore.forEach((u) => {
        if (['client', 'super_admin'].includes(u.role) || u.isBlocked === true) return;
        const iid = String(u.institution?._id || u.institution || '');
        if (iid) counts[iid] = (counts[iid] || 0) + 1;
      });
      return Object.entries(counts).map(([k, count]) => ({ _id: k, count }));
    });
    jest.spyOn(User, 'create').mockImplementation(async (doc) => {
      const created = makeHydratedUser({
        _id: 'u_gen_' + (usersStore.length + 1),
        createdAt: new Date(),
        ...doc,
      });
      usersStore.push(created);
      return created;
    });
    jest.spyOn(User.prototype, 'save').mockImplementation(async function () {
      const saved = makeHydratedUser({
        _id: this._id || 'u_reg_' + (usersStore.length + 1),
        name: this.name,
        email: this.email,
        phone: this.phone,
        identityDocument: this.identityDocument,
        role: this.role,
        institution: this.institution,
        activeInstitution: this.activeInstitution,
        isBlocked: false,
      });
      usersStore.push(saved);
      return saved;
    });
    jest.spyOn(User.prototype, 'populate').mockImplementation(async function (field) {
      if (field === 'institution' && this.institution) {
        const foundInst = institutionsStore.find((i) => String(i._id) === String(this.institution));
        if (foundInst) this.institution = foundInst;
      }
      return this;
    });

    // Mocks Institution
    jest.spyOn(Institution, 'findById').mockImplementation(async (id) => {
      return institutionsStore.find((i) => String(i._id) === String(id)) || null;
    });
    jest.spyOn(Institution, 'find').mockImplementation(() => ({
      sort: async () => [...institutionsStore],
    }));
    jest.spyOn(Institution, 'findOne').mockImplementation(async () => instDoc);
    jest.spyOn(Institution, 'create').mockImplementation(async (doc) => {
      const created = {
        _id: 'inst_new_' + (institutionsStore.length + 1),
        isActive: true,
        ...doc,
        async save() { return this; },
        toObject() { return { ...this }; },
      };
      institutionsStore.push(created);
      return created;
    });
    jest.spyOn(Institution, 'updateMany').mockImplementation(async (q = {}, upd = {}) => {
      let modified = 0;
      institutionsStore.forEach((inst) => {
        const matchPkg = !q['subscription.packageId'] || String(inst.subscription?.packageId) === String(q['subscription.packageId']);
        const matchPlan = !q['subscription.plan'] || inst.subscription?.plan === q['subscription.plan'];
        if (matchPkg || matchPlan) {
          if (upd.$set?.['subscription.enabledFeatures']) {
            inst.subscription.enabledFeatures = upd.$set['subscription.enabledFeatures'];
          }
          if (upd.$set?.['subscription.maxUsers'] !== undefined) {
            inst.subscription.maxUsers = upd.$set['subscription.maxUsers'];
          }
          if (upd.$set?.['subscription.packageName']) {
            inst.subscription.packageName = upd.$set['subscription.packageName'];
          }
          modified += 1;
        }
      });
      return { modifiedCount: modified };
    });

    // Mocks SubscriptionPackage
    jest.spyOn(SubscriptionPackage, 'countDocuments').mockImplementation(async () => packagesStore.length);
    jest.spyOn(SubscriptionPackage, 'find').mockImplementation((q = {}) => {
      let list = [...packagesStore];
      if (q.isActive !== undefined) list = list.filter((p) => p.isActive === q.isActive);
      return {
        sort: async () => list,
        then: (resolve) => resolve(list),
      };
    });
    jest.spyOn(SubscriptionPackage, 'findOne').mockImplementation(async (q = {}) => {
      return packagesStore.find((p) => (q.slug ? p.slug === q.slug : true)) || null;
    });
    jest.spyOn(SubscriptionPackage, 'findById').mockImplementation(async (id) => {
      return packagesStore.find((p) => String(p._id) === String(id)) || null;
    });
    jest.spyOn(SubscriptionPackage, 'create').mockImplementation(async (doc) => {
      const created = {
        _id: 'pkg_custom_' + (packagesStore.length + 1),
        ...doc,
        async save() { return this; },
      };
      packagesStore.push(created);
      return created;
    });
    jest.spyOn(SubscriptionPackage, 'findByIdAndDelete').mockImplementation(async (id) => {
      const idx = packagesStore.findIndex((p) => String(p._id) === String(id));
      if (idx === -1) return null;
      const [removed] = packagesStore.splice(idx, 1);
      return removed;
    });

    // Mocks PlatformConfig & AuditLog
    jest.spyOn(PlatformConfig, 'findOne').mockImplementation(async () => platformConfigDoc);
    jest.spyOn(AuditLog, 'create').mockImplementation(async () => ({}));

    // Mocks SubscriptionRequest
    jest.spyOn(SubscriptionRequest, 'findOne').mockImplementation(async (q = {}) => {
      return requestsStore.find((r) => (!q.status || r.status === q.status) && (!q.institution || String(r.institution) === String(q.institution))) || null;
    });
    jest.spyOn(SubscriptionRequest, 'find').mockImplementation((q = {}) => {
      const list = requestsStore
        .filter((r) => (!q.institution || String(r.institution) === String(q.institution)) && (!q.status || r.status === q.status))
        .map((r) => ({
          ...r,
          packageId: r.packageId ? packagesStore.find((p) => String(p._id) === String(r.packageId)) || r.packageId : null,
        }));
      const chain = {
        populate: () => chain,
        sort: async () => list,
        then: (resolve) => resolve(list),
      };
      return chain;
    });
    jest.spyOn(SubscriptionRequest, 'findById').mockImplementation(async (id) => {
      return requestsStore.find((r) => String(r._id) === String(id)) || null;
    });
    jest.spyOn(SubscriptionRequest, 'create').mockImplementation(async (doc) => {
      if (doc.proofOfPaymentUrl) {
        const diskPath = path.join(process.cwd(), doc.proofOfPaymentUrl.replace(/^\//, ''));
        uploadedTempFiles.push(diskPath);
      }
      const reqObj = {
        _id: 'req_' + (requestsStore.length + 1),
        createdAt: new Date(),
        ...doc,
        async save() { return this; },
        toObject() { return { ...this }; },
      };
      requestsStore.push(reqObj);
      return reqObj;
    });
  });

  afterEach(() => {
    uploadedTempFiles.forEach((fPath) => {
      try {
        if (fs.existsSync(fPath)) fs.unlinkSync(fPath);
      } catch (_) {}
    });
  });

  it('1. Novo registo de Owner cria instituição com período experimental exacto de 7 dias', async () => {
    const beforeMs = Date.now();
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Novo Proprietário Trial',
        email: 'trial.owner@nhiquela.co.mz',
        phone: '+258847778899',
        password: 'Password123!',
        identityDocument: '110100998877Z',
        dateOfBirth: '1991-04-12',
        role: 'owner',
        institutionName: 'Finanças Horizonte Lda',
        institutionNuit: '400987654',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const createdInst = institutionsStore.find((i) => i.name === 'Finanças Horizonte Lda');
    expect(createdInst).toBeDefined();
    expect(createdInst.subscription.plan).toBe('trial');
    expect(createdInst.subscription.status).toBe('active');
    expect(createdInst.subscription.packageName).toBe('Período Experimental (7 Dias)');

    const diffDays = (new Date(createdInst.subscription.expiresAt).getTime() - beforeMs) / 86400000;
    expect(diffDays).toBeGreaterThanOrEqual(6.95);
    expect(diffDays).toBeLessThanOrEqual(7.05);
  });

  it('2. Criação, edição com sincronização e remoção de pacotes personalizados restrita ao Super Admin', async () => {
    // Owner não pode criar pacotes nem configurar contas Nhiquela
    const forbiddenCreate = await request(app)
      .post('/api/subscriptions/admin/packages')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Invasor', price: 100, features: ['clients'] });
    expect(forbiddenCreate.status).toBe(403);

    const forbiddenConfig = await request(app)
      .put('/api/subscriptions/admin/config')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ companyName: 'Outra Empresa' });
    expect(forbiddenConfig.status).toBe(403);

    // Super Admin cria pacote personalizado para equipa de 3 utilizadores
    const createRes = await request(app)
      .post('/api/subscriptions/admin/packages')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Equipa Ágil 3',
        description: 'Pacote personalizado com 3 utilizadores',
        price: 2900,
        durationDays: 30,
        features: ['dashboard', 'clients', 'loans', 'payments'],
        limits: { maxUsers: 3, maxClients: 250, maxActiveLoans: 250 },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.slug).toBe('equipa_agil_3');
    expect(createRes.body.data.limits.maxUsers).toBe(3);

    const createdId = createRes.body.data._id;

    // Instituição a usar este pacote recebe sincronização imediata quando pacote é editado
    instDoc.subscription.plan = 'equipa_agil_3';
    instDoc.subscription.packageId = createdId;
    instDoc.subscription.maxUsers = 3;

    const editRes = await request(app)
      .put(`/api/subscriptions/admin/packages/${createdId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        price: 3400,
        features: ['dashboard', 'clients', 'loans', 'payments', 'reports'],
        limits: { maxUsers: 5, maxClients: 500, maxActiveLoans: 500 },
        syncInstitutions: true,
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.data.price).toBe(3400);
    expect(instDoc.subscription.maxUsers).toBe(5);
    expect(instDoc.subscription.enabledFeatures).toContain('reports');

    // Super Admin consegue remover pacote
    const delRes = await request(app)
      .delete(`/api/subscriptions/admin/packages/${createdId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(delRes.status).toBe(200);
  });

  it('3. Controlo de acesso no fim do trial de 7 dias, permissões de upload, rejeição e aprovação de pagamento', async () => {
    // Enquanto trial activo (7 dias), consulta estado e acede aos módulos
    const currentRes = await request(app)
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(currentRes.status).toBe(200);
    expect(currentRes.body.data.remainingDays).toBe(7);
    expect(currentRes.body.data.packages.map((p) => p.limits.maxUsers)).toEqual([1, 3, 5]);
    expect(currentRes.body.data.usage).toEqual({ currentUsers: 1, maxUsers: 0 });

    const trialOk = await request(app)
      .get('/api/clients-gated')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(trialOk.status).toBe(200);

    // Simular expiração do período experimental de 7 dias
    instDoc.subscription.expiresAt = new Date(Date.now() - 60000);
    instDoc.subscription.status = 'expired';

    const expiredBlocked = await request(app)
      .get('/api/clients-gated')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(expiredBlocked.status).toBe(403);
    expect(expiredBlocked.body.subscriptionBlocked).toBe(true);

    // Apenas owner/admin podem submeter comprovativo (agente não autorizado é rejeitado com 403)
    agentUser.isBlocked = false;
    const dummyPdf = Buffer.from('%PDF-1.4 receipt');
    const agentSubmit = await request(app)
      .post('/api/subscriptions/submit')
      .set('Authorization', `Bearer ${agentToken}`)
      .field('packageId', 'pkg_standard')
      .attach('proof', dummyPdf, { filename: 'agente.pdf', contentType: 'application/pdf' });
    expect(agentSubmit.status).toBe(403);

    // Admin da instituição submete comprovativo para o pacote Standard (3 utilizadores)
    adminUser.isBlocked = false;
    const adminSubmit = await request(app)
      .post('/api/subscriptions/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('packageId', 'pkg_standard')
      .field('amountPaid', 3200)
      .field('paymentMethod', 'M-Pesa')
      .field('referenceCode', 'MP-889911')
      .attach('proof', dummyPdf, { filename: 'comprovativo1.pdf', contentType: 'application/pdf' });
    expect(adminSubmit.status).toBe(201);
    const req1Id = adminSubmit.body.data._id;

    // Enquanto pendente, acesso continua bloqueado e não permite duplicado
    const whilePending = await request(app)
      .get('/api/loans-gated')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(whilePending.status).toBe(403);

    const dupSubmit = await request(app)
      .post('/api/subscriptions/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('packageId', 'pkg_standard')
      .attach('proof', dummyPdf, { filename: 'dup.pdf', contentType: 'application/pdf' });
    expect(dupSubmit.status).toBe(400);

    // Super Admin não pode rejeitar sem justificação
    const emptyReject = await request(app)
      .put(`/api/subscriptions/admin/requests/${req1Id}/reject`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reviewNotes: '   ' });
    expect(emptyReject.status).toBe(400);

    // Super Admin rejeita com motivo -> bloqueio mantém-se, mas permite re-submissão
    const rejectRes = await request(app)
      .put(`/api/subscriptions/admin/requests/${req1Id}/reject`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reviewNotes: 'Comprovativo ilegível' });
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('rejected');

    // Nova submissão pelo Owner para Premium (5 utilizadores + módulo reports)
    const resubmit = await request(app)
      .post('/api/subscriptions/submit')
      .set('Authorization', `Bearer ${ownerToken}`)
      .field('packageId', 'pkg_premium')
      .field('amountPaid', 5000)
      .field('paymentMethod', 'Transferência Bancária')
      .attach('proof', dummyPdf, { filename: 'comprovativo2.pdf', contentType: 'application/pdf' });
    expect(resubmit.status).toBe(201);

    // Super Admin aprova -> desbloqueia módulos do Premium + aplica maxUsers = 5
    const approveRes = await request(app)
      .put(`/api/subscriptions/admin/requests/${resubmit.body.data._id}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(approveRes.status).toBe(200);
    expect(instDoc.subscription.status).toBe('active');
    expect(instDoc.subscription.plan).toBe('premium');
    expect(instDoc.subscription.maxUsers).toBe(5);

    const unlockedReports = await request(app)
      .get('/api/reports-gated')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(unlockedReports.status).toBe(200);
  });

  it('4. Enforça limites personalizados de utilizadores (1, 3, 5 e Ilimitado), bloqueia desbloqueios acima da cota e isenta clientes', async () => {
    // Garantir cenário base: apenas owner activo (1 utilizador activo)
    adminUser.isBlocked = true;
    agentUser.isBlocked = true;

    // 4A. Pacote Starter -> 1 utilizador activo máximo
    const assign1 = await request(app)
      .put(`/api/institutions/${instDoc._id}/subscription`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ plan: 'starter', durationDays: 30, maxUsers: 1 });
    expect(assign1.status).toBe(200);
    expect(instDoc.subscription.maxUsers).toBe(1);

    // GET /users reporta cota 1/1
    const list1 = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(list1.status).toBe(200);
    expect(list1.body.userLimitInfo).toEqual({ currentUsers: 1, maxUsers: 1 });

    // Criar novo agente falha (403 limitReached)
    const createAgentFail = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Novo Agente',
        email: 'novo.agente@central.co.mz',
        phone: '+258841111111',
        password: 'Password123!',
        role: 'agent',
      });
    expect(createAgentFail.status).toBe(403);
    expect(createAgentFail.body.limitReached).toBe(true);
    expect(createAgentFail.body.maxUsers).toBe(1);

    // Desbloquear utilizador bloqueado também é bloqueado pela cota 1/1
    const unblockFail = await request(app)
      .put(`/api/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isBlocked: false });
    expect(unblockFail.status).toBe(403);
    expect(unblockFail.body.limitReached).toBe(true);

    // Mas registar cliente final (`role: 'client'`) NÃO conta no limite de utilizadores internos -> deve passar!
    const createClientOk = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Cliente Maria',
        email: 'maria.cliente@teste.co.mz',
        phone: '+258842222222',
        password: 'Password123!',
        role: 'client',
      });
    expect(createClientOk.status).toBe(201);
    const createdClientId = createClientOk.body.data._id;

    // Tentar promover cliente -> agent com cota cheia também bloqueia (403)
    const promoteFail = await request(app)
      .put(`/api/users/${createdClientId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'agent' });
    expect(promoteFail.status).toBe(403);
    expect(promoteFail.body.limitReached).toBe(true);

    // 4B. Super Admin personaliza para 3 utilizadores
    const assign3 = await request(app)
      .put(`/api/institutions/${instDoc._id}/subscription`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ plan: 'standard', durationDays: 30, maxUsers: 3 });
    expect(assign3.status).toBe(200);

    // Desbloquear admin (2/3) + criar gestor (3/3) funcionam; 4º é bloqueado
    const unblockAdmin = await request(app)
      .put(`/api/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isBlocked: false });
    expect(unblockAdmin.status).toBe(200);

    const createManager3 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Gestor Equipa',
        email: 'gestor@central.co.mz',
        phone: '+258843333333',
        password: 'Password123!',
        role: 'manager',
      });
    expect(createManager3.status).toBe(201);

    const create4thBlocked = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Supervisor Extra',
        email: 'sup4@central.co.mz',
        phone: '+258844444444',
        password: 'Password123!',
        role: 'supervisor',
      });
    expect(create4thBlocked.status).toBe(403);
    expect(create4thBlocked.body.currentUsers).toBe(3);
    expect(create4thBlocked.body.maxUsers).toBe(3);

    // 4C. Super Admin ajusta instituição para 5 utilizadores -> desbloqueia até 5 e bloqueia 6º
    await request(app)
      .put(`/api/institutions/${instDoc._id}/subscription`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ plan: 'premium', durationDays: 30, maxUsers: 5 });

    const create4thOk = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Supervisor 4',
        email: 'sup4@central.co.mz',
        phone: '+258844444444',
        password: 'Password123!',
        role: 'supervisor',
      });
    expect(create4thOk.status).toBe(201);

    const create5thOk = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Agente 5',
        email: 'ag5@central.co.mz',
        phone: '+258845555555',
        password: 'Password123!',
        role: 'agent',
      });
    expect(create5thOk.status).toBe(201);

    const create6thBlocked = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Agente 6',
        email: 'ag6@central.co.mz',
        phone: '+258846666666',
        password: 'Password123!',
        role: 'agent',
      });
    expect(create6thBlocked.status).toBe(403);
    expect(create6thBlocked.body.currentUsers).toBe(5);
    expect(create6thBlocked.body.maxUsers).toBe(5);

    // 4D. Personalização para Ilimitado (maxUsers: 0) -> 6º utilizador é permitido
    await request(app)
      .put(`/api/institutions/${instDoc._id}/subscription`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ plan: 'premium', durationDays: 30, maxUsers: 0 });

    const create6thUnlimited = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Agente 6',
        email: 'ag6@central.co.mz',
        phone: '+258846666666',
        password: 'Password123!',
        role: 'agent',
      });
    expect(create6thUnlimited.status).toBe(201);
  });

  it('5. Super Admin lista, renova, altera pacote e suspende subscrições de todas as instituições', async () => {
    // Owner comum não pode listar subscrições globais
    const forbidden = await request(app)
      .get('/api/subscriptions/admin/institutions')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(forbidden.status).toBe(403);

    // Super Admin obtém resumo global com dias restantes e contagem de utilizadores
    const listRes = await request(app)
      .get('/api/subscriptions/admin/institutions')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].subscriptionSummary.effectiveStatus).toBe('trial');
    expect(listRes.body.data[0].subscriptionSummary.remainingDays).toBe(7);
    expect(listRes.body.data[0].subscriptionSummary.currentUsers).toBe(1);

    // Super Admin suspende/expira subscrição da instituição
    const suspendRes = await request(app)
      .put(`/api/institutions/${instDoc._id}/subscription`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ plan: 'starter', durationDays: 1, maxUsers: 1, status: 'expired' });
    expect(suspendRes.status).toBe(200);

    const afterSuspend = await request(app)
      .get('/api/subscriptions/admin/institutions')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(afterSuspend.body.data[0].subscriptionSummary.effectiveStatus).toBe('expired');
    expect(afterSuspend.body.data[0].subscriptionSummary.isExpired).toBe(true);
  });
});

