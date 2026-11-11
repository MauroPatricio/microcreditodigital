// Catálogo Mestre de Funcionalidades por Pacote de Subscrição (Nhiquela / Microcrédito Digital)
export const PACKAGE_FEATURES_CATALOG = [
  {
    code: 'dashboard',
    name: 'Painel Principal & Indicadores',
    category: 'Operacional',
    description: 'Dashboard operacional, métricas de carteira e alertas de vencimento',
  },
  {
    code: 'clients',
    name: 'Gestão de Clientes & KYC',
    category: 'Operacional',
    description: 'Cadastro completo, BI, NUIT, referências, contactos de emergência e histórico',
  },
  {
    code: 'loans',
    name: 'Empréstimos & Simulações',
    category: 'Crédito',
    description: 'Simulação, plano de amortização, fluxo de análise, aprovação e desembolso',
  },
  {
    code: 'payments',
    name: 'Cobranças, Pagamentos & Recibos',
    category: 'Financeiro',
    description: 'Registo de pagamentos parciais/totais, recibos PDF e histórico de cobranças',
  },
  {
    code: 'cashflow',
    name: 'Fluxo de Caixa & Reconciliação',
    category: 'Financeiro',
    description: 'Controlo de capital disponível, entradas/saídas e reconciliação financeira',
  },
  {
    code: 'contracts',
    name: 'Modelos & Geração de Contratos',
    category: 'Jurídico',
    description: 'Templates personalizáveis de contratos de crédito com assinatura e termos legais',
  },
  {
    code: 'documents',
    name: 'Gestão Documental & Pendentes',
    category: 'Jurídico',
    description: 'Validação de documentos do cliente, garantias e anexos obrigatórios',
  },
  {
    code: 'reports',
    name: 'Relatórios (Mensal, Trimestral & BdM)',
    category: 'Gestão & Compliance',
    description: 'Exportação PDF/Excel e relatórios regulatórios do Banco de Moçambique',
  },
  {
    code: 'commissions',
    name: 'Comissões & Performance de Agentes',
    category: 'Gestão & Compliance',
    description: 'Regras de comissionamento, metas de agentes e extrato de ganhos',
  },
  {
    code: 'communication',
    name: 'Central de Comunicação & Agendamentos',
    category: 'Comunicação',
    description: 'Templates de cobrança, agendamentos automáticos e histórico de envios',
  },
  {
    code: 'whatsapp',
    name: 'Integração & Alertas WhatsApp',
    category: 'Comunicação',
    description: 'Conexão QR WhatsApp e disparo automático de lembretes e recibos',
  },
  {
    code: 'sms',
    name: 'Logs & Notificações SMS',
    category: 'Comunicação',
    description: 'Envio e rastreamento de SMS para notificações de vencimento',
  },
  {
    code: 'audit',
    name: 'Auditoria & Rastreabilidade',
    category: 'Segurança & Controlo',
    description: 'Registo completo de operações, alterações de crédito e acessos',
  },
  {
    code: 'rbac',
    name: 'Perfis Personalizados & Permissões (RBAC)',
    category: 'Segurança & Controlo',
    description: 'Criação de perfis customizados, limites de aprovação e matriz granular',
  },
  {
    code: 'mobile_app',
    name: 'Acesso à Aplicação Mobile',
    category: 'Canais Digitais',
    description: 'Permite aos agentes e clientes acederem via aplicação móvel Android/iOS',
  },
  {
    code: 'multi_institution',
    name: 'Gestão Multi-Instituição / Filiais',
    category: 'Expansão',
    description: 'Alternância e visão global consolidada entre múltiplas instituições do proprietário',
  },
];

export const ALL_FEATURE_CODES = PACKAGE_FEATURES_CATALOG.map((f) => f.code);

export const DEFAULT_FEATURES_BY_LEGACY_PLAN = {
  free: ['dashboard', 'clients', 'loans', 'payments'],
  starter: ['dashboard', 'clients', 'loans', 'payments', 'contracts', 'documents'],
  trial: ALL_FEATURE_CODES,
  standard: [
    'dashboard',
    'clients',
    'loans',
    'payments',
    'cashflow',
    'contracts',
    'documents',
    'reports',
    'commissions',
    'communication',
    'audit',
    'rbac',
  ],
  premium: ALL_FEATURE_CODES,
  business: ALL_FEATURE_CODES,
  enterprise: ALL_FEATURE_CODES,
};

