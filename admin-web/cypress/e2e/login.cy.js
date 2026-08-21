describe('Admin Web E2E Tests - Login Flow', () => {
  beforeEach(() => {
    // Interceptar a API de login
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            _id: '123',
            name: 'Admin Teste',
            email: 'admin@microcredito.com',
            role: 'owner',
            institution: { _id: '1', name: 'Microcrédito Digital' }
          },
          token: 'fake-jwt-token',
          refreshToken: 'fake-refresh-token'
        }
      }
    }).as('loginRequest');

    // Interceptar a verificação de token / me
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            _id: '123',
            name: 'Admin Teste',
            email: 'admin@microcredito.com',
            role: 'owner',
            institution: { _id: '1', name: 'Microcrédito Digital' }
          }
        }
      }
    }).as('meRequest');
  });

  it('Mostra o ecrã de login e permite inserir credenciais', () => {
    cy.visit('/');
    cy.contains('MicrocréditoDigital').should('be.visible');
    
    // Inserir email
    cy.get('input[type="email"]').type('admin@microcredito.com');
    cy.get('input[type="email"]').should('have.value', 'admin@microcredito.com');
    
    // Inserir password
    cy.get('input[type="password"]').type('password123');
    cy.get('input[type="password"]').should('have.value', 'password123');
  });

  it('Realiza login e navega para a dashboard', () => {
    cy.visit('/');
    
    cy.get('input[type="email"]').type('admin@microcredito.com');
    cy.get('input[type="password"]').type('password123');
    
    cy.get('button[type="submit"]').click();
    
    cy.wait('@loginRequest');
    
    // Deve redireccionar para dashboard (a URL deve mudar ou apresentar elementos da dashboard)
    cy.url().should('include', '/dashboard');
  });

  it('Mostra erro se o login falhar', () => {
    // Interceptar com erro
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: {
        success: false,
        message: 'Credenciais inválidas'
      }
    }).as('loginRequestFail');

    cy.visit('/');
    
    cy.get('input[type="email"]').type('admin@microcredito.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@loginRequestFail');
    
    // Deve aparecer a mensagem de erro
    cy.contains('Credenciais inválidas').should('be.visible');
    // Não deve sair da página de login
    cy.url().should('not.include', '/dashboard');
  });
});

