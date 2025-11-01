import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { title, body, tokens } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: "Tokens array is required" });
    }

    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(tokens.length / BATCH_SIZE);
    const results = [];

    for (let i = 0; i < totalBatches; i++) {
      const batch = tokens.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

      const messages = batch.map((token) => ({
        to: token,
        title,
        body,
        channelId: "default",
        sound: "default",
        data: { sentBy: "rknldeals" },
      }));

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      results.push({
        batch: i + 1,
        start: i * BATCH_SIZE + 1,
        end: Math.min((i + 1) * BATCH_SIZE, tokens.length),
        response: result,
      });

      console.log(
        `✅ Sent batch ${i + 1}/${totalBatches} (${batch.length} tokens)`
      );
    }

    return res.status(200).json({
      message: "Notifications sent successfully!",
      batches: results.length,
      details: results,
    });
  } catch (error) {
    console.error("❌ Error sending notifications:", error);
    return res.status(500).json({ error: error.message });
  }
}
