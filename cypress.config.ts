import { defineConfig } from "cypress";

import moduleSpec from "./module.json";

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  reporter: "cypress-mochawesome-reporter",
  video: true,
  videosFolder: "./cypress/reports/video",
  reporterOptions: {
    reportPageTitle: `${moduleSpec.title} Test Report`,
    reportTitle: `${moduleSpec.title} Tests`,
    charts: true,
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