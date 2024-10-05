describe('template spec', () => {
  it('passes', () => {
    cy.visit('/')

      .selectWorld("blank-test-world")
      .selectUser("Gamemaster")
      .wait(5000)
      .clickMacroButton(1)
      .wait(10000)

  })
})