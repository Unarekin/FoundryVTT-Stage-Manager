describe("AddImageDialog template", () => {
  it("Compiles", () => {
    cy.mount("./src/templates/dialogs/add-image.hbs.hbs", { context: {}, isDialog: true })
  })
});