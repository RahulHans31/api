import fs from "fs";
import csv from "csv-parser";
import { NextResponse } from "next/server";

const TOKENS_FILE = "tokens.csv";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token || !token.startsWith("ExponentPushToken[")) {
      return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
    }

    // Read existing tokens
    const existingTokens = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(TOKENS_FILE)
        .pipe(csv())
        .on("data", (row) => {
          if (row.token) results.push(row.token);
        })
        .on("end", () => resolve(results))
        .on("error", reject);
    });

    if (existingTokens.includes(token)) {
      return NextResponse.json({ message: "Token already exists" });
    }

    // Append new token
    fs.appendFileSync(TOKENS_FILE, `\n${token}`);

    return NextResponse.json({ message: "Token added successfully", token });
  } catch (err) {
    console.error("Error adding token:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
