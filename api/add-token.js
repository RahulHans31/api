// Dependency-free endpoint to append new tokens to tokens.csv

import fs from "fs";

const TOKENS_FILE = "tokens.csv";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Only POST allowed" }));
    }

    let body = "";
    for await (const chunk of req) body += chunk;
    const data = JSON.parse(body || "{}");
    const token = data.token;

    if (!token || !token.startsWith("ExponentPushToken[")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid token" }));
    }

    // Ensure file exists
    if (!fs.existsSync(TOKENS_FILE)) {
      fs.writeFileSync(TOKENS_FILE, "token\n");
    }

    const lines = fs.readFileSync(TOKENS_FILE, "utf8").trim().split("\n");
    const tokens = lines.slice(1).map((l) => l.trim());

    if (tokens.includes(token)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Token already exists" }));
    }

    fs.appendFileSync(TOKENS_FILE, `\n${token}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "✅ Token added", token }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
