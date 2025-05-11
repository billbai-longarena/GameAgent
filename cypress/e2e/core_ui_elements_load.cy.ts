/// <reference types="cypress" />
<![CDATA[
  describe('Core UI Elements Load Test', () => {
    beforeEach(() => {
    // 访问应用的根路径，Cypress 会自动使用 cypress.config.js 中定义的 baseUrl
    cy.visit('/');
  });

  it('should load Header component', () => {
    // 假设 Header 组件有一个可识别的 data-testid 或 class
    // 根据实际 Header 组件的 DOM 结构调整选择器
    cy.get('header').should('be.visible');
    // 或者更具体，如果 Header 有一个特定的 class 或 id
    // cy.get('.main-header').should('be.visible');
    // cy.get('#app-header').should('be.visible');
  });

  it('should load NaturalLanguageInput component', () => {
    // 假设 NaturalLanguageInput 组件有一个可识别的 data-testid 或 class
    // 根据实际 NaturalLanguageInput 组件的 DOM 结构调整选择器
    // 例如，如果它包含一个 textarea
    cy.get('textarea[placeholder="请输入您的需求..."]').should('be.visible');
    // 或者一个特定的 data-testid
    // cy.get('[data-testid="natural-language-input"]').should('be.visible');
  });

  it('should load AgentWorkspacePanel component', () => {
    // 假设 AgentWorkspacePanel 组件有一个可识别的 data-testid 或 class
    // 根据实际 AgentWorkspacePanel 组件的 DOM 结构调整选择器
    cy.get('[data-testid="agent-workspace-panel"]').should('be.visible');
  });

  it('should load ProjectExplorerPanel component', () => {
    // 假设 ProjectExplorerPanel 组件有一个可识别的 data-testid 或 class
    // 根据实际 ProjectExplorerPanel 组件的 DOM 结构调整选择器
    cy.get('[data-testid="project-explorer-panel"]').should('be.visible');
  });

  it('should load StatusControlBar component', () => {
    // 假设 StatusControlBar 组件有一个可识别的 data-testid 或 class
    // 根据实际 StatusControlBar 组件的 DOM 结构调整选择器
    cy.get('[data-testid="status-control-bar"]').should('be.visible');
  });

  it('should load Footer component', () => {
    // 假设 Footer 组件有一个可识别的 data-testid 或 class
    // 根据实际 Footer 组件的 DOM 结构调整选择器
    cy.get('footer').should('be.visible');
    // 或者更具体，如果 Footer 有一个特定的 class 或 id
    // cy.get('.main-footer').should('be.visible');
    // cy.get('#app-footer').should('be.visible');
  });
});
]]>