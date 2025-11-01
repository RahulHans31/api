import https from "https";
import { tokens } from "./tokens.js";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 50;

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Only GET allowed" }));
    }

    if (!tokens || tokens.length === 0) {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "No tokens found" }));
    }

    const title = "📈 New Rate List Added!";
    const bodyText = "A new rate list is now available. Check it out!";
    const link =
      "https://play.google.com/store/apps/details?id=com.rknldeals.dealstream";

    const batches = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE)
      batches.push(tokens.slice(i, i + BATCH_SIZE));

    for (let i = 0; i < batches.length; i++) {
      const messages = batches[i].map((token) => ({
        to: token,
        title,
        body: bodyText,
        data: { link },
        channelId: "default",
      }));

      const payload = JSON.stringify(messages);
      await sendExpoRequest(payload);
      console.log(`📤 Rate batch ${i + 1}/${batches.length} sent`);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "✅ Rate List notifications sent!" }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

function sendExpoRequest(payload) {
  return new Promise((resolve, reject) => {
    const reqExpo = https.request(
      EXPO_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (r) => {
        r.on("data", () => {});
        r.on("end", resolve);
      }
    );
    reqExpo.on("error", reject);
    reqExpo.write(payload);
    reqExpo.end();
  });
}
