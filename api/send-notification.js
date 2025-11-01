// /api/send-notification.js
import https from "https";
import { tokens } from "./tokens.js";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 50;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Only POST allowed" }));
    }

    // --- Read body safely ---
    let rawBody = "";
    for await (const chunk of req) rawBody += chunk;

    let data = {};
    try {
      data = JSON.parse(rawBody || "{}");
    } catch (e) {
      console.error("❌ Invalid JSON:", rawBody);
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({ error: "Invalid JSON body", raw: rawBody })
      );
    }

    const title = data.title || "🔥 New Update!";
    const bodyText = data.body || "Check out the latest deal!";
    const playStoreLink =
      "https://play.google.com/store/apps/details?id=com.rknldeals.dealstream";

    if (!tokens || tokens.length === 0) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "No tokens found" }));
    }

    // --- Batch tokens ---
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
        data: { link: playStoreLink },
        channelId: "default",
      }));

      const payload = JSON.stringify(messages);

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      };

      // --- Make HTTPS request ---
      const response = await new Promise((resolve, reject) => {
        const reqExpo = https.request(EXPO_ENDPOINT, options, (r) => {
          let resp = "";
          r.on("data", (chunk) => (resp += chunk));
          r.on("end", () =>
            resolve({
              status: r.statusCode,
              body: resp,
            })
          );
        });
        reqExpo.on("error", (err) => reject(err));
        reqExpo.write(payload);
        reqExpo.end();
      });

      results.push({
        batch: i + 1,
        count: batch.length,
        response: response.body,
      });

      console.log(`📤 Sent batch ${i + 1}/${batches.length}`);
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
    console.error("💥 Error in send-notification.js:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: err.message || "Internal server error",
      })
    );
  }
}
