import "cypress-mochawesome-reporter/register"
import "./commands";
import path from "path-browserify";
import Handlebars from "handlebars";

declare global {
  namespace Cypress {
    interface Chainable {
      mount(template: string, options: HandlebarsMountOptions): Cypress.Chainable<JQuery<HTMLElement>>
    }
  }

  interface HandlebarsMountOptions {
    context: object;
  }
}


Cypress.Commands.add("mount", (template: string, options: HandlebarsMountOptions): Cypress.Chainable<JQuery<HTMLElement>> => {
  return cy.window({ log: false }).then(window => {
    if (isPathlike(template)) return cy.readFile(template, { log: false });
    else return cy.wrap(template, { log: false });
  })
    .then(template => {
      const renderFunc = Handlebars.compile(template);
      const compiled = renderFunc(options.context);

      const dom = new DOMParser().parseFromString(compiled, "text/html");
      const child = dom.firstElementChild;
      const root = window.document.querySelector("[data-cy-root]");
      if (!root) throw new Error("Unable to locate document root.");
      root.innerHTML = "";
      root.appendChild(child as HTMLElement);
      // window.document.body.appendChild(child as HTMLElement);
      return cy.wrap(child as HTMLElement, { log: false });
    })
});

function isPathlike(str: string): boolean {
  if (!str || typeof str !== "string") return false;

  const root = path.parse(str).root;
  if (root) str = str.slice(root.length);

  return !/[<>:"|?*]/.test(str);
}