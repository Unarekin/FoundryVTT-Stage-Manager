describe('Add From Image', () => {
  it('Adds from scene button', () => {
    cy.visit("/")
      .selectWorld("Stage Manager")
      .login("Gamemaster")
  })
})