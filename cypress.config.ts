import { defineConfig } from "cypress";

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  reporter: "cypress-mochawesome-reporter",
  video: true,
  videosFolder: "./cypress/reports/video",
  screenshotsFolder: "./cypress/reports/screenshots",
  screenshotOnRunFailure: true,
  reporterOptions: {

  },
  e2e: {
    baseUrl: "http://localhost:30000",
    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);

      on("before:browser:launch", (browser, launchOptions) => {
        launchOptions.preferences.default['default.disable_3d_apis'] = false;
        launchOptions.args.push('--enable-features=VaapiVideoDecoder');
        launchOptions.args.push('--use-gl=egl');
      });
    },
    experimentalInteractiveRunEvents: true
  },

  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
  },
});