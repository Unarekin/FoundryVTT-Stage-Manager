#!/usr/bin/env node
import { promises as fs} from 'fs';
import path from "path";
import { fork } from "child_process";

import packageConfig from "./package.json" with { type: "json" };

const appData = path.join(
  process.env.APPDATA || (process.platform == "darwin" ? path.join(process.env.HOME, "Library/Preferences") : path.join(process.env.HOME, ".local/share")),
  "FoundryVTT"
);
const adminTxt = path.join(appData, "Config/admin.txt");

const password = await fs.readFile(adminTxt, "utf8")
await fs.writeFile(adminTxt, "");

fork(path.join(packageConfig.testing.foundryLocation, "resources/app/main.js"));



async function exitCleanup() {
  await fs.writeFile(adminTxt, password);
}

process
  .on("exit", exitCleanup)
  .on("SIGINT", exitCleanup)
  .on("SIGUSR1", exitCleanup)
  .on("SIGUSR2", exitCleanup)
  .on("uncaughtException", exitCleanup)
  ;