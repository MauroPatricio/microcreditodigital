import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiSmartphone,
  FiCreditCard,
  FiPieChart,
  FiZap,
  FiUsers,
  FiLock,
  FiChevronDown,
  FiMail,
  FiPhone,
  FiMapPin,
  FiDownload,
  FiActivity,
  FiTrendingUp,
  FiCheck,
  FiHelpCircle,
  FiStar,
  FiSun,
  FiMoon,
  FiX,
  FiClock,
  FiSend,
  FiSliders,
  FiBriefcase,
  FiFileText,
  FiBell,
  FiAward,
  FiCpu,
  FiMenu
} from 'react-icons/fi';
import './LandingPage.css';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Mobile Menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Credit Simulator State
  const [simAmount, setSimAmount] = useState(25000); // 25.000 MT default
  const [simMonths, setSimMonths] = useState(6); // 6 meses default
  const [simRate, setSimRate] = useState(4.5); // 4.5% taxa mensal por defeito

  // Calculate Loan Details
  const totalInterest = (simAmount * (simRate / 100) * simMonths);
  const totalRepayment = simAmount + totalInterest;
  const monthlyInstallment = totalRepayment / simMonths;

  // Active Feature Tab
  const [activeTab, setActiveTab] = useState('app'); // 'app', 'admin', 'risk', 'payments'

  // Pricing Toggle (Monthly vs Annual)
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'annual'

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Modals
  const [showAppModal, setShowAppModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Lead Form state
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    if (leadEmail) {
      setLeadSubmitted(true);
      setTimeout(() => {
        setLeadSubmitted(false);
        setLeadEmail('');
      }, 4000);
    }
  };

  // Format currency in Meticais (MT)
  const formatMT = (val) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', maximumFractionDigits: 0 })
      .format(val)
      .replace('MZN', 'MT');
  };

  return (
    <div className="landing-container">
      {/* Background Ambient Glowing Orbs */}
      <div className="landing-ambient-bg">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
      </div>

      {/* NAVBAR */}
      <nav className="landing-navbar">
        <div className="navbar-inner">
          <Link to="/" className="landing-brand">
            <div className="brand-icon-wrapper">
              <FiZap />
            </div>
            <span className="brand-text">
              CrediSmart<span style={{ color: '#3b82f6' }}>+</span>
            </span>
            <span className="brand-badge">MOÇAMBIQUE</span>
          </Link>

          <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
            <li><a href="#simulador" className="nav-link">Simulador</a></li>
            <li><a href="#recursos" className="nav-link">Recursos</a></li>
            <li><a href="#instituicoes" className="nav-link">Para Instituições</a></li>
            <li><a href="#planos" className="nav-link">Planos</a></li>
            <li><a href="#faq" className="nav-link">FAQ</a></li>
          </ul>

          <div className="nav-actions">
            <button className="btn-theme-toggle" onClick={toggleTheme} title="Alternar Tema">
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>

            <Link to="/login" className="btn-secondary-outline">
              <FiLock /> Painel Login
            </Link>

            <button className="btn-primary-gradient" onClick={() => setShowDemoModal(true)}>
              Criar Conta <FiArrowRight />
            </button>

            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero-section">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-tag">
              <span className="hero-tag-pulse"></span>
              A Nova Era do Microcrédito Digital em Moçambique
            </div>

            <h1 className="hero-title">
              Conceda, Gerencie e Cobre Créditos <span className="gradient-text">100% Digitalmente</span>
            </h1>

            <p className="hero-subtitle">
              A plataforma inteligente para instituições financeiras, cooperativas, ONGs e Fintechs.
              Automatize todo o ciclo do crédito — do cadastro inteligente à recuperação via M-Pesa & e-Mola.
            </p>

            <div className="hero-cta-group">
              <a href="#simulador" className="btn-primary-gradient" style={{ padding: '0.85rem 1.8rem', fontSize: '1rem' }}>
                <FiSliders /> Simular Crédito Agora
              </a>

              <button className="btn-secondary-outline" style={{ padding: '0.85rem 1.6rem', fontSize: '1rem' }} onClick={() => setShowAppModal(true)}>
                <FiSmartphone /> Baixar App Cliente
              </button>
            </div>

            <div className="hero-trust-row">
              <div className="trust-item">
                <FiCheckCircle className="trust-icon" /> +45% Retorno na Cobrança
              </div>
              <div className="trust-item">
                <FiShield className="trust-icon" /> Encriptação de Nível Bancário
              </div>
              <div className="trust-item">
                <FiZap className="trust-icon" /> Aprovações em Mínimos Minutos
              </div>
            </div>
          </div>

          {/* HERO DYNAMIC INTERACTIVE CARD */}
          <div className="hero-preview-wrapper">
            <div className="hero-preview-card">
              <div className="preview-header">
                <div className="preview-user-info">
                  <div className="avatar-badge">MP</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.95rem' }}>
                      Solicitação #CR-8942
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Cliente: Mateus Patricio (Maputo)
                    </div>
                  </div>
                </div>
                <span className="preview-status-pill">✓ Aprovado via Score IA</span>
              </div>

              <div className="preview-stats-grid">
                <div className="preview-stat-box">
                  <div className="preview-stat-label">Valor Aprovado</div>
                  <div className="preview-stat-value">50.000 MT</div>
                </div>
                <div className="preview-stat-box">
                  <div className="preview-stat-label">Prazo Escolhido</div>
                  <div className="preview-stat-value">12 Meses</div>
                </div>
              </div>

              <div className="preview-chart-mockup">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Evolução da Carteira & Recups</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>+98.4% Pontual</span>
                </div>
                <div className="chart-bar-row">
                  <div className="chart-bar" style={{ height: '40%' }}></div>
                  <div className="chart-bar" style={{ height: '60%' }}></div>
                  <div className="chart-bar" style={{ height: '75%' }}></div>
                  <div className="chart-bar" style={{ height: '55%' }}></div>
                  <div className="chart-bar active" style={{ height: '95%' }}></div>
                  <div className="chart-bar" style={{ height: '80%' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 1rem', borderRadius: '10px' }}>
                <span><FiCreditCard style={{ marginRight: '6px', color: '#38bdf8' }} /> Canal Desembolso:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>M-Pesa Automático</span>
              </div>
            </div>

            {/* Floating Notification */}
            <div className="floating-notif-card">
              <div className="floating-notif-icon">
                <FiBell />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-heading)' }}>
                  Pagamento Recebido!
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  4.850 MT via e-Mola · Contrato #9812
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* STATS BANNER SECTION */}
      <section className="stats-banner-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-item-number">99.8%</div>
            <div className="stat-item-label">Disponibilidade do Sistema</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-number">150M+ MT</div>
            <div className="stat-item-label">Créditos Processados</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-number">-42%</div>
            <div className="stat-item-label">Redução no Incumprimento</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-number">&lt; 3 min</div>
            <div className="stat-item-label">Tempo Médio de Análise</div>
          </div>
        </div>
      </section>

      {/* CREDIT SIMULATOR SECTION */}
      <section id="simulador" className="section-wrapper">
        <div className="section-header">
          <span className="section-badge">Calculadora Inteligente</span>
          <h2 className="section-title">Simule o Seu Microcrédito</h2>
          <p className="section-subtitle">
            Transparência total. Veja exatamente o valor da parcela, juros acumulados e prazo de reembolso em tempo real.
          </p>
        </div>

        <div className="simulator-card">
          <div className="simulator-controls">
            {/* Slider 1: Amount */}
            <div className="sim-group">
              <div className="sim-label-row">
                <span className="sim-label">Montante Solicitado</span>
                <span className="sim-value-badge">{formatMT(simAmount)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="250000"
                step="1000"
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="sim-slider"
              />
              <div className="sim-pills-row">
                {[5000, 15000, 50000, 100000, 200000].map((preset) => (
                  <button
                    key={preset}
                    className={`sim-pill ${simAmount === preset ? 'active' : ''}`}
                    onClick={() => setSimAmount(preset)}
                  >
                    {formatMT(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Term in Months */}
            <div className="sim-group">
              <div className="sim-label-row">
                <span className="sim-label">Prazo de Reembolso</span>
                <span className="sim-value-badge">{simMonths} {simMonths === 1 ? 'Mês' : 'Meses'}</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="1"
                value={simMonths}
                onChange={(e) => setSimMonths(Number(e.target.value))}
                className="sim-slider"
              />
              <div className="sim-pills-row">
                {[1, 3, 6, 12, 18, 24].map((m) => (
                  <button
                    key={m}
                    className={`sim-pill ${simMonths === m ? 'active' : ''}`}
                    onClick={() => setSimMonths(m)}
                  >
                    {m} {m === 1 ? 'mês' : 'meses'}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Interest Tier */}
            <div className="sim-group">
              <span className="sim-label">Plano de Taxa de Juros</span>
              <div className="sim-pills-row" style={{ marginTop: '0.5rem' }}>
                <button
                  className={`sim-pill ${simRate === 3.5 ? 'active' : ''}`}
                  onClick={() => setSimRate(3.5)}
                >
                  3.5% (Preferencial)
                </button>
                <button
                  className={`sim-pill ${simRate === 4.5 ? 'active' : ''}`}
                  onClick={() => setSimRate(4.5)}
                >
                  4.5% (Padrão)
                </button>
                <button
                  className={`sim-pill ${simRate === 6.0 ? 'active' : ''}`}
                  onClick={() => setSimRate(6.0)}
                >
                  6.0% (Flexível)
                </button>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="simulator-summary">
            <h3 className="summary-title">Resumo da Simulação</h3>

            <div className="summary-item">
              <span className="summary-item-label">Capital Inicial:</span>
              <span className="summary-item-val">{formatMT(simAmount)}</span>
            </div>

            <div className="summary-item">
              <span className="summary-item-label">Taxa Mensal:</span>
              <span className="summary-item-val">{simRate}% / mês</span>
            </div>

            <div className="summary-item">
              <span className="summary-item-label">Juros Totais do Período:</span>
              <span className="summary-item-val" style={{ color: '#f59e0b' }}>
                +{formatMT(totalInterest)}
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-item-label">Total a Reembolsar:</span>
              <span className="summary-item-val">{formatMT(totalRepayment)}</span>
            </div>

            <div className="summary-highlight">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                PARCELA MENSAL ESTIMADA
              </div>
              <div className="summary-highlight-val">
                {formatMT(monthlyInstallment)} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/mês</span>
              </div>
            </div>

            <button
              className="btn-primary-gradient"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}
              onClick={() => setShowDemoModal(true)}
            >
              Pedir Crédito com Este Plano <FiArrowRight />
            </button>
          </div>
        </div>
      </section>

      {/* CORE PLATFORM FEATURES TABS */}
      <section id="recursos" className="section-wrapper">
        <div className="section-header">
          <span className="section-badge">Ecossistema Completo</span>
          <h2 className="section-title">Tudo o que Precisa num Só Lugar</h2>
          <p className="section-subtitle">
            Tecnologia de ponta pensada para otimizar operações financeiras e encantar clientes.
          </p>
        </div>

        <div className="features-tabs-header">
          <button
            className={`tab-btn ${activeTab === 'app' ? 'active' : ''}`}
            onClick={() => setActiveTab('app')}
          >
            <FiSmartphone /> App Mobile Cliente
          </button>
          <button
            className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <FiPieChart /> Painel de Gestão Web
          </button>
          <button
            className={`tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            <FiCpu /> Motor de Risco & IA
          </button>
          <button
            className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <FiCreditCard /> M-Pesa & e-Mola
          </button>
        </div>

        <div className="feature-tab-content">
          {activeTab === 'app' && (
            <>
              <div className="feature-list">
                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiCheckCircle /></div>
                  <div>
                    <h4 className="feature-item-title">Onboarding e Validação BI</h4>
                    <p className="feature-item-desc">
                      Submissão de documentos, foto de perfil e assinatura digital diretamente pelo smartphone em 2 minutos.
                    </p>
                  </div>
                </div>

                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiZap /></div>
                  <div>
                    <h4 className="feature-item-title">Solicitação & Desembolso Instantâneo</h4>
                    <p className="feature-item-desc">
                      Simulação personalizada com visualização clara de datas de pagamento e recebimento via Mobile Money.
                    </p>
                  </div>
                </div>

                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiBell /></div>
                  <div>
                    <h4 className="feature-item-title">Alertas Inteligentes & Score</h4>
                    <p className="feature-item-desc">
                      Notificações push antes do vencimento e acompanhamento do Score de Crédito do próprio cliente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="feature-visual-box">
                <div style={{ padding: '1rem', background: 'var(--bg-card-solid)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <FiSmartphone style={{ color: '#3b82f6', fontSize: '1.4rem' }} />
                    <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Experiência Mobile Intuitiva</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    Interface nativa desenvolvida com React Native, garantindo alta performance mesmo em ligações 3G lentas.
                  </div>
                  <div style={{ marginTop: '1.2rem', padding: '0.8rem', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiCheck /> Compatível com iOS e Android
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'admin' && (
            <>
              <div className="feature-list">
                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiPieChart /></div>
                  <div>
                    <h4 className="feature-item-title">Dashboard Financeiro Global</h4>
                    <p className="feature-item-desc">
                      Acompanhamento em tempo real da carteira ativa, taxa de inadimplência, juros a receber e liquidez.
                    </p>
                  </div>
                </div>

                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiUsers /></div>
                  <div>
                    <h4 className="feature-item-title">Gestão Multiusuário e Permissões</h4>
                    <p className="feature-item-desc">
                      Níveis de acesso para Supervisores, Agentes de Crédito, Gerentes de Cobrança e Administradores.
                    </p>
                  </div>
                </div>

                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiFileText /></div>
                  <div>
                    <h4 className="feature-item-title">Relatórios Automatizados em PDF e Excel</h4>
                    <p className="feature-item-desc">
                      Geração imediata de relatórios mensais, trimestrais e mapa de provisão bancária.
                    </p>
                  </div>
                </div>
              </div>

              <div className="feature-visual-box">
                <div style={{ padding: '1rem', background: 'var(--bg-card-solid)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                    Painel Administrativo Web
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Controle operacional completo com ferramentas avançadas de decisão e modelos de contrato customizados.
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'risk' && (
            <>
              <div className="feature-list">
                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiCpu /></div>
                  <div>
                    <h4 className="feature-item-title">Análise Comportamental & Score Interno</h4>
                    <p className="feature-item-desc">
                      Algoritmos inteligentes calculam o risco de inadimplência baseados no histórico e capacidade de pagamento.
                    </p>
                  </div>
                </div>

                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiShield /></div>
                  <div>
                    <h4 className="feature-item-title">Proteção Antifraude</h4>
                    <p className="feature-item-desc">
                      Detecção de duplicidade de documentos, cruzamento de dados e bloqueio automático de contas suspeitas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="feature-visual-box">
                <div style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontWeight: 700, marginBottom: '0.5rem' }}>
                    <FiAward /> Score Inteligente CrediSmart+
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                    845 <span style={{ fontSize: '1rem', color: '#10b981', fontWeight: 600 }}>/ 1000 (Risco Baixo)</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Recomendação: Aprovação Automática de até 100.000 MT com taxa preferencial.
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <>
              <div className="feature-list">
                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiCreditCard /></div>
                  <div>
                    <h4 className="feature-item-title">Integração Directa M-Pesa & e-Mola</h4>
                    <p className="feature-item-desc">
                      Processamento automático de despesas e recebimento de reembolsos com reconciliação imediata na conta.
                    </p>
                  </div>
                </div>

                <div className="feature-item-row">
                  <div className="feature-item-icon"><FiClock /></div>
                  <div>
                    <h4 className="feature-item-title">Lembretes & Cobrança por SMS/WhatsApp</h4>
                    <p className="feature-item-desc">
                      Disparo automático de mensagens pré-vencimento com links directos de pagamento Mobile Money.
                    </p>
                  </div>
                </div>
              </div>

              <div className="feature-visual-box">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#f87171', fontWeight: 600, fontSize: '0.9rem' }}>
                    🔴 Integrado com Vodacom M-Pesa API
                  </div>
                  <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem' }}>
                    🟡 Integrado com Movitel e-Mola API
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* TARGET AUDIENCE / PARA QUEM É */}
      <section id="instituicoes" className="section-wrapper">
        <div className="section-header">
          <span className="section-badge">Para Instituições Financeiras</span>
          <h2 className="section-title">Soluções Adaptadas ao Seu Negócio</h2>
          <p className="section-subtitle">
            Seja uma pequena cooperativa ou uma instituição financeira consolidada, o CrediSmart+ adapta-se à sua escala.
          </p>
        </div>

        <div className="audience-grid">
          <div className="audience-card">
            <div className="audience-icon"><FiBriefcase /></div>
            <h3 className="audience-title">Microfinanças & Bancos</h3>
            <p className="audience-desc">
              Digitalize o seu portfólio tradicional, reduza custos operacionais e alcance novos clientes em todo o país.
            </p>
          </div>

          <div className="audience-card">
            <div className="audience-icon"><FiUsers /></div>
            <h3 className="audience-title">Cooperativas & PCR</h3>
            <p className="audience-desc">
              Gestão simplificada de associados, cálculo automático de cotas, juros comunitários e relatórios claros.
            </p>
          </div>

          <div className="audience-card">
            <div className="audience-icon"><FiZap /></div>
            <h3 className="audience-title">Fintechs Lenders</h3>
            <p className="audience-desc">
              Arquitetura robusta via API RESTful para escalar rapidamente solicitações e liquidações automáticas.
            </p>
          </div>

          <div className="audience-card">
            <div className="audience-icon"><FiAward /></div>
            <h3 className="audience-title">ONGs & Programas</h3>
            <p className="audience-desc">
              Fomento ao empreendedorismo social com acompanhamento de impacto e métricas de inclusão financeira.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS TIMELINE */}
      <section className="section-wrapper">
        <div className="section-header">
          <span className="section-badge">Passo a Passo</span>
          <h2 className="section-title">Como Funciona a Plataforma</h2>
          <p className="section-subtitle">
            Um processo rápido, transparente e sem burocracia para instituições e clientes.
          </p>
        </div>

        <div className="timeline-grid">
          <div className="timeline-step-card">
            <div className="step-number">01</div>
            <h3 className="step-title">Registo & Onboarding</h3>
            <p className="step-desc">
              O cliente descarrega a app ou regista-se presencialmente. Os documentos BI são submetidos e validados.
            </p>
          </div>

          <div className="timeline-step-card">
            <div className="step-number">02</div>
            <h3 className="step-title">Simulação & Análise IA</h3>
            <p className="step-desc">
              Escolha de valor e prazo. O motor de risco avalia o perfil e gera uma recomendação instantânea.
            </p>
          </div>

          <div className="timeline-step-card">
            <div className="step-number">03</div>
            <h3 className="step-title">Aprovação & Desembolso</h3>
            <p className="step-desc">
              O contrato é assinado digitalmente e o montante é transferido de imediato via M-Pesa ou banco.
            </p>
          </div>

          <div className="timeline-step-card">
            <div className="step-number">04</div>
            <h3 className="step-title">Gestão & Cobrança</h3>
            <p className="step-desc">
              Lembretes automáticos por SMS/WhatsApp. O cliente efetua reembolsos sem filas.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING & PLANS */}
      <section id="planos" className="section-wrapper">
        <div className="section-header">
          <span className="section-badge">Planos de Subscrição</span>
          <h2 className="section-title">Investimento Transparente</h2>
          <p className="section-subtitle">
            Escolha o plano ideal para a sua escala operacional. Sem custos ocultos.
          </p>
        </div>

        <div className="pricing-toggle-wrapper">
          <button
            className={`pricing-toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('monthly')}
          >
            Facturação Mensal
          </button>
          <button
            className={`pricing-toggle-btn ${billingPeriod === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('annual')}
          >
            Facturação Anual
          </button>
          <span className="pricing-save-badge">Economize 20% no Anual</span>
        </div>

        <div className="pricing-grid">
          {/* Starter Plan */}
          <div className="pricing-card">
            <div className="plan-name">Starter Micro</div>
            <div className="plan-desc">Ideal para pequenas cooperativas e iniciantes no microcrédito.</div>
            <div className="plan-price-row">
              <span className="plan-price">
                {billingPeriod === 'annual' ? '12.000' : '15.000'}
              </span>
              <span className="plan-period">MT / mês</span>
            </div>
            <ul className="plan-features">
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Até 250 Clientes Ativos</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Painel Gestão Web</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Notificações SMS de Vencimento</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Suporte via Email & WhatsApp</li>
            </ul>
            <button className="btn-secondary-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowDemoModal(true)}>
              Começar com Starter
            </button>
          </div>

          {/* Pro / Featured Plan */}
          <div className="pricing-card featured">
            <span className="pricing-badge">Mais Popular</span>
            <div className="plan-name">Pro Institucional</div>
            <div className="plan-desc">Para instituições financeiras em expansão que exigem automação total.</div>
            <div className="plan-price-row">
              <span className="plan-price">
                {billingPeriod === 'annual' ? '32.000' : '39.000'}
              </span>
              <span className="plan-period">MT / mês</span>
            </div>
            <ul className="plan-features">
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Clientes Ativos Ilimitados</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> App Mobile Personalizável</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Integração Direta M-Pesa & e-Mola</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Motor de Score IA & Risco</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Relatórios Exportáveis em PDF/Excel</li>
            </ul>
            <button className="btn-primary-gradient" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowDemoModal(true)}>
              Subscrever Plano Pro <FiArrowRight />
            </button>
          </div>

          {/* Enterprise / White-Label Plan */}
          <div className="pricing-card">
            <div className="plan-name">Enterprise White-Label</div>
            <div className="plan-desc">Solução 100% dedicada com a sua marca, servidor exclusivo e API completa.</div>
            <div className="plan-price-row">
              <span className="plan-price">Personalizado</span>
            </div>
            <ul className="plan-features">
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Domínio & Marca Própria (White-Label)</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Instalação em Servidor Dedicado</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Integração com Bancos Nacionais</li>
              <li className="plan-feature-item"><FiCheck className="check-icon" /> Gestor de Conta Dedicado 24/7</li>
            </ul>
            <button className="btn-secondary-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowDemoModal(true)}>
              Falar com Consultor
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-wrapper">
        <div className="section-header">
          <span className="section-badge">Casos de Sucesso</span>
          <h2 className="section-title">O que Dizem os Nossos Parceiros</h2>
          <p className="section-subtitle">
            Instituições e clientes que transformaram a sua gestão financeira com o CrediSmart+.
          </p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">
                <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
              </div>
              <p className="testimonial-text">
                "A automação das cobranças via M-Pesa reduziu o nosso incumprimento de 28% para menos de 6% em apenas 4 meses. O sistema é extremamente prático."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">AM</div>
              <div>
                <div className="author-name">Alberto Macamo</div>
                <div className="author-role">Director Operacional, Microcred Maputo</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">
                <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
              </div>
              <p className="testimonial-text">
                "O aplicativo mobile permitiu que os nossos associados solicitem e paguem empréstimos sem precisar viajar horas até à vila central. Inclusão real!"
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">SL</div>
              <div>
                <div className="author-name">Sofia Langa</div>
                <div className="author-role">Presidente da Cooperativa Sol Nascente</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div>
              <div className="testimonial-stars">
                <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
              </div>
              <p className="testimonial-text">
                "Conseguimos aprovar créditos com segurança graças ao score interno. Os relatórios financeiros simplificam imenso as nossas auditorias."
              </p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">TC</div>
              <div>
                <div className="author-name">Tomás Cossa</div>
                <div className="author-role">Gerente de Risco, Fintech CrediXpress</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="section-wrapper">
        <div className="section-header">
          <span className="section-badge">Dúvidas Frequentes</span>
          <h2 className="section-title">Perguntas & Respostas</h2>
          <p className="section-subtitle">
            Esclareça as suas dúvidas principais sobre a implementação e segurança da plataforma.
          </p>
        </div>

        <div className="faq-list">
          {[
            {
              q: "Quanto tempo demora a ativação do CrediSmart+ para a minha instituição?",
              a: "A ativação do painel web pode ser feita no próprio dia. Para soluções personalizadas ou White-Label, o processo de homologação e configuração de marca demora entre 3 a 7 dias úteis."
            },
            {
              q: "Como funciona a integração com M-Pesa e e-Mola?",
              a: "A plataforma liga-se via API oficial aos gateways de Mobile Money em Moçambique, permitindo desembolsos diretos para a carteira móvel do cliente e liquidação automática das parcelas com envio de comprovativo instantâneo."
            },
            {
              q: "Os dados e contratos dos clientes estão seguros?",
              a: "Sim. Toda a comunicação é encriptada via SSL 256-bit com backups diários automatizados. Cumprimos com as directivas de protecção de dados pessoais e regulamentos financeiros."
            },
            {
              q: "É possível personalizar a taxa de juros e termos de contrato?",
              a: "Com certeza. No painel administrativo pode configurar múltiplas modalidades de crédito, prazos flexíveis, taxas de juros nominais, penalizações por atraso e modelos de contrato customizados."
            }
          ].map((faq, idx) => (
            <div key={idx} className="faq-item">
              <button className="faq-question" onClick={() => toggleFaq(idx)}>
                <span>{faq.q}</span>
                <FiChevronDown className={`faq-chevron ${openFaq === idx ? 'open' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="faq-answer">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION DEMO BANNER */}
      <section className="section-wrapper">
        <div className="cta-banner-card">
          <h2 className="cta-banner-title">Pronto para Modernizar o Seu Microcrédito?</h2>
          <p className="cta-banner-subtitle">
            Junte-se a dezenas de instituições em Moçambique que já estão a automatizar a concessão e cobrança de créditos com eficiência e segurança.
          </p>

          <form onSubmit={handleLeadSubmit} className="cta-input-group">
            <input
              type="email"
              placeholder="Introduza o seu email institucional..."
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              required
              className="cta-input"
            />
            <button type="submit" className="cta-submit-btn">
              {leadSubmitted ? '✓ Solicitado com Sucesso!' : 'Pedir Demonstração'}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div>
            <Link to="/" className="landing-brand" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
              <div className="brand-icon-wrapper">
                <FiZap />
              </div>
              <span className="brand-text">
                CrediSmart<span style={{ color: '#3b82f6' }}>+</span>
              </span>
            </Link>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '320px' }}>
              Plataforma premium de gestão, concessão e acompanhamento de microcréditos em Moçambique. Inclusão financeira digital simples, rápida e segura.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">Plataforma</h4>
            <ul className="footer-links">
              <li><a href="#simulador" className="footer-link">Simulador de Crédito</a></li>
              <li><a href="#recursos" className="footer-link">Recursos & App Mobile</a></li>
              <li><a href="#instituicoes" className="footer-link">Para Instituições</a></li>
              <li><a href="#planos" className="footer-link">Planos de Subscrição</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Acesso Rápido</h4>
            <ul className="footer-links">
              <li><Link to="/login" className="footer-link">Entrar no Painel</Link></li>
              <li><Link to="/register-owner" className="footer-link">Registar Instituição</Link></li>
              <li><Link to="/privacy" className="footer-link">Política de Privacidade</Link></li>
              <li><a href="#faq" className="footer-link">Perguntas Frequentes</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Contactos & Suporte</h4>
            <ul className="footer-links">
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiMail style={{ color: '#3b82f6' }} /> suporte@credismart.co.mz
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiPhone style={{ color: '#10b981' }} /> +258 84 000 0000 / +258 85 000 0000
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiMapPin style={{ color: '#f59e0b' }} /> Av. Julius Nyerere, Maputo - Moçambique
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} CrediSmart+ / Microcrédito Digital. Todos os direitos reservados.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/privacy" className="footer-link">Privacidade</Link>
            <a href="#" className="footer-link">Termos de Serviço</a>
            <a href="#" className="footer-link">Segurança</a>
          </div>
        </div>
      </footer>

      {/* MODAL: APP DOWNLOAD */}
      {showAppModal && (
        <div className="modal-overlay" onClick={() => setShowAppModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAppModal(false)}>
              <FiX />
            </button>
            <h3 className="modal-title">Descarregar App Cliente</h3>
            <p className="modal-subtitle">
              Disponível para iOS e Android. Aceda ao seu microcrédito e pagamentos no telemóvel.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: '16px', textCenter: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '0.5rem' }}>📱</div>
              <div style={{ fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                CrediSmart+ Mobile APK
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Versão 2.4.0 · M-Pesa & e-Mola Integrados
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn-primary-gradient"
                style={{ justifyContent: 'center' }}
                onClick={() => {
                  alert('O download do APK de demonstração foi iniciado!');
                  setShowAppModal(false);
                }}
              >
                <FiDownload /> Descarregar Directamente (.APK)
              </button>

              <button
                className="btn-secondary-outline"
                style={{ justifyContent: 'center' }}
                onClick={() => setShowAppModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DEMO / REGISTAR INSTITUIÇÃO */}
      {showDemoModal && (
        <div className="modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowDemoModal(false)}>
              <FiX />
            </button>
            <h3 className="modal-title">Comece Já a Usar</h3>
            <p className="modal-subtitle">
              Escolha como deseja prosseguir com a sua instituição ou como cliente.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  padding: '1.25rem',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid var(--primary)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setShowDemoModal(false);
                  navigate('/register-owner');
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                  🏢 Registar Nova Instituição
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Crie a conta da sua empresa/cooperativa e aceda ao painel administrativo.
                </div>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setShowDemoModal(false);
                  navigate('/login');
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                  🔐 Já Tenho Conta (Fazer Login)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Entrar no painel com as suas credenciais de utilizador.
                </div>
              </div>
            </div>

            <button
              className="btn-secondary-outline"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowDemoModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
