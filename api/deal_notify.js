// /api/deal_notify.js
import https from "https";

const SUPABASE_URL = "https://dchtxvwtylqnviniwxto.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjaHR4dnd0eWxxbnZpbml3eHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTQzNzEsImV4cCI6MjA3NjAzMDM3MX0.QDQaPfssiuZAdWuzcmFE1HCWz6wzDphzo2TVaVHpJlk";
const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 50;

export default async function handler(req, res) {
  try {
    // Get all tokens from Supabase
    const tokensResponse = await fetch(`${SUPABASE_URL}/rest/v1/device_tokens?select=token`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    const tokensData = await tokensResponse.json();
    const tokens = tokensData.map((t) => t.token);

    if (!tokens || tokens.length === 0) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "⚠️ No tokens found" }));
    }

    // Split into batches
    const batches = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE)
      batches.push(tokens.slice(i, i + BATCH_SIZE));

    const results = [];

    // Send each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const messages = batch.map((token) => ({
        to: token,
        title: "🔥 New Deal Alert!",
        body: "A new deal has been added. Check it out now!",
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

      results.push({ batch: i + 1, count: batch.length, response: response.body });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "✅ Deal notifications sent", batches: results.length, results }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}
