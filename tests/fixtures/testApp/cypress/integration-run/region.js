describe('eyes-cypress', () => {

  const url = `http://localhost:${Cypress.config('testPort')}/test.html`;

  // This also tests the setting of `testName` in `beforeEach`

  beforeEach(() => {
    cy.setCookie('auth', 'secret');
    cy.eyesOpen({
      appName: 'some app',
      browser: {width: 1024, height: 768},
      // showLogs: true,
    });
  });

  afterEach(() => {
    cy.eyesClose();
  })

  it('region absolute', () => {
    cy.visit(url);
    cy.get('.absolutely').then($el => {
      const {left, top, width, height} = $el[0].getBoundingClientRect();
      cy.eyesCheckWindow({
        tag: 'region',
        sizeMode: 'region',
        region: {left, top, width, height},
      });
    });
  });
  
  it('region selector', () => {
    cy.visit(url);
    cy.get('.absolutely').then($el => {
      const {left, top, width, height} = $el[0].getBoundingClientRect();
      cy.eyesCheckWindow({
        tag: 'region',
        sizeMode: 'region',
        region: {left, top, width, height},
      });
    });
  });
});
