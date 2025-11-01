// /api/send-notification.js
import https from "https";
import { tokens } from "../../tokens.js";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 50;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Only POST allowed" }));
    }

    let body = "";
    for await (const chunk of req) body += chunk;
    const data = JSON.parse(body || "{}");
    const title = data.title || "New Notification 🚀";
    const bodyText = data.body || "Check out the latest update!";

    if (!tokens || tokens.length === 0) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "No tokens found" }));
    }

    const batches = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE)
      batches.push(tokens.slice(i, i + BATCH_SIZE));

    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const messages = batch.map((token) => ({
        to: token,
        title,
        body: bodyText,
        data: { link: "https://play.google.com/store/apps/details?id=com.rknldeals.dealstream" },
        channelId: "default",
      }));

      const payload = JSON.stringify(messages);
      const options = new URL(EXPO_ENDPOINT);
      const reqOpts = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      };

      const response = await new Promise((resolve, reject) => {
        const request = https.request(options, reqOpts, (r) => {
          let resp = "";
          r.on("data", (d) => (resp += d));
          r.on("end", () => resolve({ status: r.statusCode, body: resp }));
        });
        request.on("error", reject);
        request.write(payload);
        request.end();
      });

      results.push({
        batch: i + 1,
        count: batch.length,
        response: response.body,
      });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "✅ Notifications sent successfully!",
        total_batches: batches.length,
        results,
      })
    );
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
