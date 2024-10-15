describe("AddImageDialog template", () => {
  it("has proper structure", () => {
    cy.fixture("addimagetemplate-context")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      .then((context: any) => cy.mount("./src/templates/dialogs/add-image.hbs.hbs", { context, isDialog: true }))

      .get(`[data-cy-element="header"]`).contains("STAGEMANAGER.DIALOGS.ADDIMAGE.HEADER")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get(`[data-cy-element="filepicker"]`).then((elem: any) => cy.wrap(elem, { log: false })
        .get("label").contains("STAGEMANAGER.DIALOGS.ADDIMAGE.FILEPICKER.LABEL")
        .get("file-picker").should("exist")
        .then(picker => cy.wrap(picker, { log: false })
          .invoke("attr", "id").should("equal", "filePicker")
          .then(() => cy.wrap(picker, { log: false }))
          .invoke("attr", "name").should("equal", "filePicker")
          .then(() => cy.wrap(picker, { log: false }))
        )
        .wrap(elem, { log: false })
        .get("p.notes").contains("STAGEMANAGER.DIALOGS.ADDIMAGE.FILEPICKER.HINT")

        .wrap(elem, { log: false })
      )
      .get(`[data-cy-element="name"]`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((elem: any) => {
        return cy.wrap(elem, { log: false })
          .get("label").contains("STAGEMANAGER.DIALOGS.ADDIMAGE.NAME.LABEL")
          .get(`input[type="text"]`).should("have.value", "NAME")
          .wrap(elem, { log: false })
          .get("p.notes").contains("STAGEMANAGER.DIALOGS.ADDIMAGE.NAME.HINT")

          .wrap(elem, { log: false });

      }, { log: false })
  })
});