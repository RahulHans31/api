// /api/add-token.js
import { tokens } from "../../tokens.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Only POST allowed" }));
  }

  try {
    let body = "";
    for await (const chunk of req) body += chunk;
    const data = JSON.parse(body || "{}");
    const token = data.token;

    if (!token || !token.startsWith("ExponentPushToken[")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Invalid token" }));
    }

    if (tokens.includes(token)) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Token already exists" }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message:
          "Since Vercel cannot modify files at runtime, please add this token manually to tokens.js and redeploy.",
        token,
      })
    );
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
