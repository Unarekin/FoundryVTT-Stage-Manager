/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

declare global {
  namespace Cypress {
    interface Chainable {
      adminLogin(password: string),
      selectWorld(name: string),
      selectUser(name: string, password?: string),
      clickMacroButton(nth: number),
    }
  }
}

Cypress.Commands.add('adminLogin', (password: string) => {
  cy.get("input#key")
    .type(password)
    .get("div#setup-authentication button[type='submit']").click()
    ;
});

Cypress.Commands.add("selectWorld", (name: string) => {
  cy
    .get("aside.tour-center-step.tour a.step-button[data-action='exit']").click()
    .get(`li[data-package-id=${name}]`)
    .trigger("mouseenter")
    // .get("a.control-play[data-action='exit']").click()
    .get(`li[data-package-id="${name}"] a[data-action='worldLaunch']`).first().click({ force: true })
    ;
});

Cypress.Commands.add("selectUser", (name: string, password?: string) => {
  cy.get("select[name='userid']").select(name)
    // cy.get("select[name='userid'] option").contains(name).click({ force: true })
    .then(() => {
      if (password) return cy.get("input[type='password']").type(password);
    })
    .get("button[type='submit'][name='join']").click()
});

Cypress.Commands.add("clickMacroButton", (nth: number) => {
  cy.get(`ol#macro-list li.macro[data-slot='${nth}']`).click();
})