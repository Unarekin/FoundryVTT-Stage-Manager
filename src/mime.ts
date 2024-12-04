import json from "./mime.json";

const db = json as Record<string, string>;

export default function (path: string) {
  const ext = path.split(".").pop();
  if (!ext) return "application/octet-stream";
  else if (db[ext]) return db[ext];
  else return "application/octet-stream";
}