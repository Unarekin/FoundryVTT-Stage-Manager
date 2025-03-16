import { promises as fs } from "fs";
import path from "path";
import { glob } from "glob";
import { json2csv } from "json-2-csv";

const files = (await glob("./dist/languages/*.json")).sort();

const output = [];

for (const file of files) {
  const lang = path.basename(file, path.extname(file));
  const json = JSON.parse(await fs.readFile(file, "utf-8"));
  output.push({
    "": lang,
    ...json[Object.keys(json)[0]],
  });
}

await fs.writeFile("translation.csv", json2csv(output));
