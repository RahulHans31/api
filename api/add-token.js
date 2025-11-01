import fs from "fs";
import path from "path";
import { tokens } from "./tokens.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Only GET allowed" }));
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing token query param" }));
    }

    if (tokens.includes(token)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Token already exists" }));
    }

    tokens.push(token);
    const filePath = path.join(process.cwd(), "api", "tokens.js");
    const newContent = `export const tokens = ${JSON.stringify(tokens, null, 2)};\n`;
    fs.writeFileSync(filePath, newContent);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "✅ Token added successfully" }));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
