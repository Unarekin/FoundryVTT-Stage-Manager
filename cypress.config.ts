import { promises as fs } from "fs";
import path from "path";
import Handlebars from "handlebars"
import { defineConfig } from "cypress";

export default defineConfig({
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {

  },
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      const webpackPreprocessor = require("@cypress/webpack-preprocessor");
      const options = {
        webpackOptions: {
          resolve: {
            alias: {
              "@src": path.resolve(__dirname, "./src")
            }
          }
        },
        watchOptions: {}
      }
      on("file:preprocessor", webpackPreprocessor(options));
      return config;
    },
  },

  component: {
    devServer: {
      framework: "cypress-ct-html" as any,
      bundler: "webpack",
    },
    specPattern: "**/*.cy.ts",
    setupNodeEvents(on, config) {
      on("task", {
        readFileMaybe(filename) { return fs.readFile(filename, "utf-8") }
      });
      return config;
    }
  }
});
