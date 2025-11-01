import fs from "fs";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const TOKENS_FILE = "tokens.csv"; // or "/tmp/tokens.csv" if you plan to modify it
const BATCH_SIZE = 50;

// Helper to read tokens without csv-parser
function readTokens() {
  try {
    if (!fs.existsSync(TOKENS_FILE)) {
      console.warn("⚠️ tokens.csv not found");
      return [];
    }

    const lines = fs.readFileSync(TOKENS_FILE, "utf8").trim().split("\n");

    // skip header line, ensure proper formatting
    const tokens = lines
      .slice(1)
      .map((line) => line.trim())
      .filter((line) => line && line.startsWith("ExponentPushToken"));

    console.log(`✅ Loaded ${tokens.length} tokens`);
    return tokens;
  } catch (err) {
    console.error("Error reading tokens.csv:", err);
    return [];
  }
}

export async function POST(req) {
  try {
    const { title, body } = await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Missing title or body in request" },
        { status: 400 }
      );
    }

    const tokens = readTokens();
    if (tokens.length === 0) {
      return NextResponse.json(
        { message: "No tokens found in tokens.csv" },
        { status: 200 }
      );
    }

    const batches = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      batches.push(tokens.slice(i, i + BATCH_SIZE));
    }

    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      // Prepare payload — must be an array of messages
      const messages = batch.map((token) => ({
        to: token,
        title,
        body,
        data: {
          link: "https://play.google.com/store/apps/details?id=com.rknldeals.dealstream",
        },
        channelId: "default",
      }));

      const response = await fetch(EXPO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const data = await response.json();
      console.log(`📦 Sent batch ${i + 1}/${batches.length}`, data);

      results.push({
        batch: i + 1,
        count: batch.length,
        response: data,
      });
    }

    return NextResponse.json({
      message: "✅ Notifications sent successfully!",
      total_batches: batches.length,
      results,
    });
  } catch (err) {
    console.error("Error in send-notification:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
