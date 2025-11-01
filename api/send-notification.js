import fs from "fs";
import csv from "csv-parser";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const TOKENS_FILE = "tokens.csv";
const BATCH_SIZE = 50;

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, body: messageBody } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "Missing title or body" },
        { status: 400 }
      );
    }

    // Read tokens from CSV
    const tokens = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(TOKENS_FILE)
        .pipe(csv())
        .on("data", (row) => {
          if (row.token && row.token.startsWith("ExponentPushToken")) {
            results.push(row.token);
          }
        })
        .on("end", () => resolve(results))
        .on("error", reject);
    });

    if (tokens.length === 0) {
      return NextResponse.json({ message: "No tokens found." }, { status: 200 });
    }

    const batches = [];
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE);
      batches.push(batch);
    }

    const details = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const messages = batch.map((token) => ({
        to: token,
        title,
        body: messageBody,
        data: { link: "https://play.google.com/store/apps/details?id=com.rknldeals.dealstream" },
      }));

      const response = await fetch(EXPO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const data = await response.json();
      details.push({
        batch: i + 1,
        start: i * BATCH_SIZE + 1,
        end: i * BATCH_SIZE + batch.length,
        response: data,
      });
    }

    return NextResponse.json({
      message: "Notifications sent successfully!",
      batches: batches.length,
      details,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
