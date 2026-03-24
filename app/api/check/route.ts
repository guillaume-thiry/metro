import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export type CheckRequest = {
  userInput: string;
  correctAnswer: string;
};

export type CheckResponse = {
  isClose: boolean;       // true if close enough to accept
  feedback: string;       // short message shown to the user e.g. "Almost! Mind the accent."
};

export async function POST(req: NextRequest) {
  const body: CheckRequest = await req.json();
  const { userInput, correctAnswer } = body;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: `You are checking answers in a Paris Métro quiz.
The correct station name is: "${correctAnswer}"
The user typed: "${userInput}"

Is the user's answer close enough to accept? Consider:
- Minor accent mistakes (e.g. "Chatelet" for "Châtelet") → accept
- Minor spacing or punctuation differences → accept
- Abbreviations of long names → accept if unambiguous
- Wrong station name entirely → reject

Respond with JSON only, no explanation:
{"isClose": true/false, "feedback": "<one short sentence for the user>"}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const result = JSON.parse(text) as CheckResponse;
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ isClose: false, feedback: "Could not evaluate answer." });
  }
}
