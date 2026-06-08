// src/app/api/campaigns/autofill/route.ts
// AI auto-fills campaign form from natural language description or file content.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { chat } from "@/src/lib/ai";
import { CODELIFE_CONTEXT } from "@/src/lib/codelife-context";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description } = await req.json();
    if (!description) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    const prompt = `${CODELIFE_CONTEXT}

A salesperson has described their outreach campaign goal below.
Extract the campaign details and return them as a JSON object.

Campaign description:
"${description}"

Return a JSON object with these fields:
{
  "name": "A clear campaign name based on the description",
  "audienceMode": "university" or "school",
  "targetCountry": "Country name in English",
  "targetInstitution": "Specific institution name or empty string",
  "targetDepartment": "Department name or empty string",
  "targetLanguage": "Language name or English"
}

Return ONLY the JSON object. No explanation, no markdown.`;

    const response = await chat(
      [{ role: "user", content: prompt }],
      { temperature: 0.2, max_tokens: 500 }
    );

    let fields;
    try {
      fields = JSON.parse(response);
    } catch {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        fields = JSON.parse(match[0]);
      } else {
        return NextResponse.json(
          { error: "AI could not parse the description." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ fields });
  } catch (error) {
    console.error("Autofill error:", error);
    return NextResponse.json(
      { error: "Autofill failed." },
      { status: 500 }
    );
  }
}