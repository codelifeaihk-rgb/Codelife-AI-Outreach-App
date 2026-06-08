// src/app/api/campaigns/[id]/contacts/route.ts
// Discovers public contacts at a given institution using Tavily + GLM.
// University Mode: professors, lab heads, postdocs, research assistants, PhD students.
// School Mode: principals, science coordinators, curriculum decision-makers.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { searchWeb } from "@/src/lib/search";
import { chat } from "@/src/lib/ai";
import { requireDbUser } from "@/src/lib/clerk-user";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const { institutionId, audienceMode } = await req.json();

    const dbUser = await requireDbUser();

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: dbUser.id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const institution = await prisma.university.findFirst({
      where: { id: institutionId, campaignId },
    });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution not found" },
        { status: 404 }
      );
    }

    const isUniversity = audienceMode === "university";
    const institutionName = institution.name;
    const country = institution.country;

    // Build search queries based on mode
    const searchQueries = isUniversity
      ? [
          `${institutionName} professor biomedical engineering life sciences staff page`,
          `${institutionName} department head biotechnology research lab director`,
          `${institutionName} innovation office entrepreneurship contact email`,
          `${institutionName} research assistant postdoc fellow biotechnology lab`,
          `${institutionName} postgraduate student PhD researcher life sciences contact`,
          `${institutionName} research staff associate scientist biomedical`,
        ]
      : [
          `${institutionName} principal vice principal contact staff`,
          `${institutionName} science coordinator biology teacher curriculum`,
          `${institutionName} STEM program director innovation coordinator`,
        ];

    // Run searches in parallel
    const searchResultsArray = await Promise.all(
      searchQueries.map((q) =>
        searchWeb(q, { maxResults: 4, searchDepth: "advanced" })
      )
    );

    // Flatten and deduplicate
    const allResults = searchResultsArray
      .flat()
      .filter(
        (r, i, arr) => arr.findIndex((x) => x.url === r.url) === i
      );

    if (!allResults.length) {
      return NextResponse.json(
        { error: "No contacts found. Try a different institution." },
        { status: 404 }
      );
    }

    // Format for AI
    const searchContext = allResults
      .slice(0, 10)
      .map((r, i) => `${i + 1}. ${r.title}\nURL: ${r.url}\n${r.content}`)
      .join("\n\n");

    const prompt = isUniversity
      ? `You are an expert at finding university contacts for biotech outreach.

Extract real people from these search results for ${institutionName} in ${country}.
CodeLife.ai sells AI-powered biology lab simulation tools to universities.
The tool helps students and researchers run virtual biology lab experiments.

Search results:
${searchContext}

Find up to 12 contacts. Prioritize in this order:
1. Department heads and program directors (highest decision-making power)
2. Lab PIs and professors in biomedical, biotech, life sciences, AI in health
3. Innovation office and entrepreneurship office contacts
4. Research assistants and associate researchers in relevant labs
5. Postdoctoral fellows and postdoc researchers in life sciences or biotech
6. PhD students and postgraduate researchers who run lab experiments
7. Research staff and associate scientists in relevant departments

For each person set isDecisionMaker:
- true: department heads, program directors, lab PIs, professors, innovation office
- false: research assistants, postdocs, PhD students, research staff

Return a JSON array. Each contact must have:
{
  "fullName": "Full name",
  "email": "email if found publicly, or null",
  "role": "their exact title/role",
  "department": "their department or lab name",
  "institutionName": "${institutionName}",
  "isDecisionMaker": true or false,
  "fitScore": 0-100,
  "fitExplanation": "2-3 sentences explaining why this person is a good outreach target for CodeLife.ai",
  "sourceUrl": "exact URL where this person was found",
  "sourceType": "Staff Page / Lab Page / Department Page / Research Profile / PhD Directory"
}

Scoring guide:
- Department head or PI in biomedical/biotech: 85-100
- Professor in life sciences: 75-90
- Postdoc in relevant field: 65-80
- Research assistant or PhD student in relevant lab: 55-70
- Innovation office contact: 70-85

Return ONLY the JSON array. No explanation, no markdown.`
      : `You are an expert at finding school contacts for STEM education outreach.

Extract real people from these search results for ${institutionName} in ${country}.
CodeLife.ai sells AI-powered biology lab simulation tools to secondary schools.

Search results:
${searchContext}

Find up to 8 contacts. Prioritize:
1. Principals and vice principals
2. Science department heads and biology teachers
3. STEM coordinators and curriculum leaders
4. Innovation or technology program directors

Return a JSON array. Each contact must have:
{
  "fullName": "Full name",
  "email": "email if found publicly, or null",
  "role": "their exact title/role",
  "department": "their department or subject area",
  "institutionName": "${institutionName}",
  "isDecisionMaker": true or false,
  "fitScore": 0-100,
  "fitExplanation": "2-3 sentences explaining why this person is a good outreach target for CodeLife.ai",
  "sourceUrl": "exact URL where this person was found",
  "sourceType": "School Website / Staff Page / Department Page"
}

Return ONLY the JSON array. No explanation, no markdown.`;

    const aiResponse = await chat(
      [{ role: "user", content: prompt }],
      {
        temperature: 0.2,
        max_tokens: 3000,
      }
    );

    // Parse AI response
    let contacts: Contact[] = [];
    try {
      const parsed = JSON.parse(aiResponse);
      contacts = Array.isArray(parsed)
        ? parsed
        : parsed.contacts ?? parsed.people ?? [];
    } catch {
      const match = aiResponse.match(/\[[\s\S]*\]/);
      if (match) {
        contacts = JSON.parse(match[0]);
      } else {
        return NextResponse.json(
          { error: "AI response could not be parsed. Please try again." },
          { status: 500 }
        );
      }
    }

    // Sort by fit score descending
    contacts.sort(
      (a: Contact, b: Contact) => (b.fitScore ?? 0) - (a.fitScore ?? 0)
    );

    return NextResponse.json({ contacts, institutionName });

  } catch (error) {
    console.error("Contact discovery error:", error);
    return NextResponse.json(
      { error: "Discovery failed. Please try again." },
      { status: 500 }
    );
  }
}

interface Contact {
  fitScore?: number;
}