import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', padding: '2rem 1rem' }}>
      <div className="card glass" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="text-accent" style={{ fontSize: '2rem', margin: 0 }}>Termos e Privacidade</h1>
          <button className="btn-secondary" onClick={() => navigate(-1)}>Voltar</button>
        </div>

        <div style={{ color: 'var(--text-main)', lineHeight: '1.8' }}>
          <p className="badge-green" style={{ display: 'inline-block', marginBottom: '1rem' }}>Última atualização: Agosto de 2026</p>
          
          <p>Bem-vindo ao <strong>TaquiMola</strong>. O presente documento estabelece os Termos e Condições de Uso e a Política de Privacidade aplicáveis à utilização da nossa aplicação móvel e aos serviços prestados.</p>

          <h2 style={{ color: 'var(--text-heading)', marginTop: '2rem', marginBottom: '1rem' }}>1. INFORMAÇÕES FINANCEIRAS</h2>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            <li><strong style={{ color: 'var(--text-main)' }}>Prazo de Reembolso:</strong> O período mínimo para reembolso completo do empréstimo é de 60 dias e o período máximo é de 365 dias a contar da data de desembolso.</li>
            <li><strong style={{ color: 'var(--text-main)' }}>Taxa Anual Efetiva Global (TAEG):</strong> A Taxa Anual Efetiva máxima aplicável não excede 36%.</li>
          </ul>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Exemplo Representativo do Custo Total</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-muted)' }}>
              <li><strong>Valor do Empréstimo (Principal):</strong> 10.000 MT</li>
              <li><strong>Prazo do Empréstimo:</strong> 3 meses (90 dias)</li>
              <li><strong>Taxa de Juro Mensal:</strong> 2%</li>
              <li><strong>Taxa Administrativa:</strong> 500 MT</li>
              <li><strong>Total de Juros a Pagar:</strong> 600 MT</li>
              <li><strong>Custo Total do Crédito:</strong> 10.600 MT</li>
              <li><strong>Prestações Mensais (3x):</strong> 3.533,33 MT por mês.</li>
            </ul>
          </div>

          <h2 style={{ color: 'var(--text-heading)', marginTop: '2rem', marginBottom: '1rem' }}>2. RECOLHA DE DADOS E POLÍTICA DE PRIVACIDADE</h2>
          <p>O TaquiMola compromete-se a proteger a sua privacidade. A recolha e processamento de dados são estritamente utilizados para a avaliação de risco de crédito e prevenção de fraude (KYC).</p>
          
          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>2.1 Que dados recolhemos?</h3>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            <li>Dados Pessoais (Nome, NUIT, Documento de Identidade).</li>
            <li>Ficheiros e Imagens (Câmara e Galeria estritamente para verificação KYC de documentos).</li>
            <li>Tokens de Notificações Push para alertas do sistema.</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>2.2 Partilha de Dados</h3>
          <p>Não vendemos os seus dados a terceiros. As suas informações só podem ser partilhadas com Agências de Risco e gateways de pagamento autorizados.</p>

          <h2 style={{ color: 'var(--text-heading)', marginTop: '2rem', marginBottom: '1rem' }}>3. CONTACTOS</h2>
          <p>Em caso de dúvidas, poderá contactar-nos através do Email: <strong>suporte@credismart.co.mz</strong></p>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
