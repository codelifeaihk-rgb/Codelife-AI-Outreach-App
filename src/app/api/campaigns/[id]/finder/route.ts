// src/app/api/campaigns/[id]/finder/route.ts
// Two-stage institution finder:
// Stage 1 — Extract real institution names from search results
// Stage 2 — Enrich each institution with scores and recommendation notes
// This approach is more reliable than single-prompt extraction with GLM/Qwen.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchWeb } from "@/src/lib/search";
import { chat, extractJSON } from "@/src/lib/ai";
import {
  CODELIFE_CONTEXT,
  UNIVERSITY_FIT_CRITERIA,
  SCHOOL_FIT_CRITERIA,
} from "@/src/lib/codelife-context";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: campaignId } = await params;
    const { country, department, focus, rankingTier, audienceMode } =
      await req.json();

    if (!country || !audienceMode) {
      return NextResponse.json(
        { error: "Country and audience mode are required" },
        { status: 400 }
      );
    }

    const isUniversity = audienceMode === "university";
    console.log(`[Finder] ${audienceMode} | ${country} | ${department ?? "no dept"}`);

    // ─── STEP 1: Multi-query Tavily search ──────────────────────────────────

    const searchQueries = isUniversity
      ? [
          `${country} university official website ${department ?? "biomedical biotechnology life sciences"}`,
          `list of universities in ${country} ${rankingTier ?? ""} research`,
          `${country} higher education institution ${department ?? "biology science"} faculty`,
        ]
      : [
          `${country} secondary school official website ${department ?? "STEM science biology"}`,
          `list of schools in ${country} ${focus ?? "biotechnology science"}`,
          `${country} high school science programme ${focus ?? "STEM innovation"}`,
        ];

    console.log("[Finder] Running", searchQueries.length, "searches");

    const searchResultArrays = await Promise.allSettled(
      searchQueries.map((q) =>
        searchWeb(q, { maxResults: 5, searchDepth: "basic" })
      )
    );

    // Collect successful results and deduplicate by URL
    const allResults = searchResultArrays
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .filter(
        (r, i, arr) => arr.findIndex((x) => x.url === r.url) === i
      );

    console.log(`[Finder] Total unique results: ${allResults.length}`);

    if (allResults.length === 0) {
      return NextResponse.json({
        institutions: [],
        campaignId,
        error: "No search results found. Check your Tavily API key in Settings.",
      });
    }

    // ─── STEP 2: Build compact search context ───────────────────────────────
    // Include title, URL, and short snippet for each result
    // Keep total under 2000 chars so GLM/Qwen handles it cleanly

    const searchContext = allResults
      .slice(0, 8)
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title} | ${r.url} | ${(r.content ?? "").slice(0, 120)}`
      )
      .join("\n");

    console.log("[Finder] Search context length:", searchContext.length);

    // ─── STEP 3: Stage 1 — Extract institution names only ───────────────────
    // Very short prompt — only asks for names and URLs
    // This dramatically improves GLM reliability

    const nameExtractionPrompt = isUniversity
      ? `From the search results below, extract real university names in ${country}.

RULES:
- Only extract REAL university or college names
- Never use article titles like "Top 10 universities..." as names
- Never use question headlines as names
- Look for university names mentioned within the snippets
- If a URL is from a university domain (.edu, .ac.uk, .edu.my), use that institution

Search results:
${searchContext}

Return ONLY a JSON array of objects. Start with [ immediately. No text before or after.
Format: [{"name":"University Name","url":"https://official-website.edu"}]
Array:`
      : `From the search results below, extract real secondary school names in ${country}.

RULES:
- Only extract REAL school names
- Never use article titles as names
- Look for school names mentioned within the snippets

Search results:
${searchContext}

Return ONLY a JSON array of objects. Start with [ immediately.
Format: [{"name":"School Name","url":"https://official-website.edu"}]
Array:`;

    let extractedInstitutions: Array<{ name: string; url: string }> = [];

    try {
      const extractResponse = await chat(
        [{ role: "user", content: nameExtractionPrompt }],
        { temperature: 0.0, max_tokens: 600 }
      );

      console.log(
        "[Finder Stage 1] Response:",
        extractResponse.slice(0, 200)
      );

      const cleanJSON = extractJSON(extractResponse);
      const parsed = JSON.parse(cleanJSON);
      const raw = Array.isArray(parsed) ? parsed : [];

      // Filter out bad names — article titles, questions, etc.
      const badPatterns = [
        /^(top|best|list|what|which|how|the |ranking|\d+)/i,
        /universities (for|in|of)/i,
        /schools (for|in|of)/i,
        /\?$/,
      ];

      extractedInstitutions = raw
        .filter(
          (item) =>
            item &&
            typeof item.name === "string" &&
            item.name.length > 3 &&
            !badPatterns.some((p) => p.test(item.name.trim()))
        )
        .slice(0, 8);

      console.log(
        `[Finder Stage 1] Extracted ${extractedInstitutions.length} valid names:`,
        extractedInstitutions.map((i) => i.name)
      );
    } catch (e) {
      console.error("[Finder Stage 1] Failed:", e);
    }

    // ─── STEP 4: Fallback — if Stage 1 failed, use AI knowledge ────────────
    // Ask AI directly for known institutions without search context

    if (extractedInstitutions.length === 0) {
      console.log("[Finder] Stage 1 failed, using knowledge fallback");

      const knowledgePrompt = isUniversity
        ? `List 6 real universities in ${country} with strong ${department ?? "biomedical or biotechnology"} departments.

Return ONLY a JSON array. Start with [.
[{"name":"University Name","url":"https://website.edu"}]
Array:`
        : `List 6 real secondary schools in ${country} with strong ${department ?? "STEM or science"} programmes.

Return ONLY a JSON array. Start with [.
[{"name":"School Name","url":"https://website.edu"}]
Array:`;

      try {
        const knowledgeResponse = await chat(
          [{ role: "user", content: knowledgePrompt }],
          { temperature: 0.2, max_tokens: 400 }
        );

        console.log(
          "[Finder Fallback] Response:",
          knowledgeResponse.slice(0, 200)
        );

        const cleanJSON = extractJSON(knowledgeResponse);
        const parsed = JSON.parse(cleanJSON);
        extractedInstitutions = Array.isArray(parsed)
          ? parsed.filter(
              (i) => i && typeof i.name === "string" && i.name.length > 3
            )
          : [];

        console.log(
          `[Finder Fallback] Got ${extractedInstitutions.length} institutions`
        );
      } catch (e) {
        console.error("[Finder Fallback] Also failed:", e);
      }
    }

    // ─── STEP 5: Stage 2 — Enrich each institution ──────────────────────────
    // Now that we have real names, ask AI to score and explain each one
    // This is a separate small prompt with only the names — much more reliable

    let enriched: Institution[] = [];

    if (extractedInstitutions.length > 0) {
      const institutionList = extractedInstitutions
        .slice(0, 6)
        .map((inst, i) => `${i + 1}. ${inst.name} (${inst.url ?? ""})`)
        .join("\n");

      const enrichPrompt = isUniversity
        ? `You are a researcher for CodeLife.ai, a virtual biology lab simulation platform.

${CODELIFE_CONTEXT.slice(0, 400)}

${UNIVERSITY_FIT_CRITERIA.slice(0, 300)}

Score and explain why each university below is relevant for CodeLife.ai outreach.
CodeLife.ai helps universities run virtual biology experiments — target biomedical, biotech, life sciences departments.

Universities in ${country}:
${institutionList}

Return a JSON array. Start with [.

[
  {
    "name": "exact university name from list above",
    "country": "${country}",
    "websiteUrl": "official website URL",
    "sourceUrl": "official website URL",
    "institutionKind": "university",
    "recommendationNote": "2 sentences: specific reason this university suits CodeLife.ai virtual labs",
    "biomedicalStrength": 8,
    "biotechActivity": 7,
    "aiHealthtechFocus": 6,
    "ranking": 150
  }
]

Array:`
        : `You are a researcher for CodeLife.ai, a virtual biology lab simulation platform.

${CODELIFE_CONTEXT.slice(0, 400)}

${SCHOOL_FIT_CRITERIA.slice(0, 300)}

Score and explain why each school below is relevant for CodeLife.ai outreach.
CodeLife.ai helps schools run virtual biology experiments — target STEM, science, biology programmes.

Schools in ${country}:
${institutionList}

Return a JSON array. Start with [.

[
  {
    "name": "exact school name from list above",
    "country": "${country}",
    "websiteUrl": "official website URL",
    "sourceUrl": "official website URL",
    "institutionKind": "school",
    "recommendationNote": "2 sentences: specific reason this school suits CodeLife.ai virtual labs",
    "stemStrength": 8,
    "biotechActivity": 7,
    "innovationFocus": 6,
    "competitionReady": 5
  }
]

Array:`;

      try {
        const enrichResponse = await chat(
          [{ role: "user", content: enrichPrompt }],
          { temperature: 0.2, max_tokens: 1200 }
        );

        console.log(
          "[Finder Stage 2] Response length:",
          enrichResponse.length
        );

        const cleanJSON = extractJSON(enrichResponse);
        const parsed = JSON.parse(cleanJSON);
        enriched = Array.isArray(parsed)
          ? parsed
          : parsed.universities ??
            parsed.schools ??
            parsed.institutions ??
            [];

        console.log(
          `[Finder Stage 2] Enriched ${enriched.length} institutions`
        );
      } catch (e) {
        console.error("[Finder Stage 2] Enrichment failed:", e);

        // If enrichment fails, build basic results from extracted names
        enriched = extractedInstitutions.slice(0, 6).map((inst) => ({
          name: inst.name,
          country,
          websiteUrl: inst.url ?? "",
          sourceUrl: inst.url ?? "",
          institutionKind: isUniversity ? "university" : "school",
          recommendationNote: `${inst.name} is a ${isUniversity ? "university" : "school"} in ${country} relevant for CodeLife.ai virtual biology lab outreach.`,
          biomedicalStrength: isUniversity ? 6 : undefined,
          biotechActivity: 6,
          aiHealthtechFocus: isUniversity ? 5 : undefined,
          stemStrength: !isUniversity ? 6 : undefined,
          innovationFocus: !isUniversity ? 5 : undefined,
        }));
      }
    }

    // ─── STEP 6: Validate and clean final output ─────────────────────────────

    const validated = enriched
      .filter(
        (inst) =>
          inst &&
          typeof inst.name === "string" &&
          inst.name.trim().length > 3
      )
      .slice(0, 6)
      .map((inst) => ({
        name: String(inst.name ?? "").trim().slice(0, 100),
        country: String(inst.country ?? country),
        websiteUrl: String(
          inst.websiteUrl ?? inst.sourceUrl ?? ""
        ),
        sourceUrl: String(
          inst.sourceUrl ?? inst.websiteUrl ?? ""
        ),
        institutionKind: isUniversity ? "university" : "school",
        recommendationNote: String(
          inst.recommendationNote ??
            `Relevant ${isUniversity ? "university" : "school"} for CodeLife.ai outreach.`
        ).slice(0, 500),
        biomedicalStrength: toScore(inst.biomedicalStrength),
        biotechActivity: toScore(inst.biotechActivity),
        aiHealthtechFocus: toScore(inst.aiHealthtechFocus),
        stemStrength: toScore(inst.stemStrength),
        innovationFocus: toScore(inst.innovationFocus),
        competitionReady: toScore(inst.competitionReady),
        ranking: inst.ranking ? Number(inst.ranking) : null,
      }));

    console.log(`[Finder] Final result count: ${validated.length}`);

    return NextResponse.json({
      institutions: validated,
      campaignId,
      partialNote:
        validated.length === 0
          ? "No institutions found. Try a different country or remove filters."
          : validated.length < 3
          ? "Limited results found. Try removing department or focus filters."
          : null,
    });
  } catch (error) {
    console.error("[Finder] Unexpected error:", error);
    return NextResponse.json(
      {
        institutions: [],
        error: "Search failed. Please try again.",
        partialNote:
          "If this persists check your API keys in Settings.",
      },
      { status: 200 }
    );
  }
}

// Safely convert any value to a score between 1-10
function toScore(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  const n = Number(val);
  if (isNaN(n)) return undefined;
  return Math.min(10, Math.max(1, Math.round(n)));
}

interface Institution {
  name?: unknown;
  country?: unknown;
  websiteUrl?: unknown;
  sourceUrl?: unknown;
  institutionKind?: unknown;
  recommendationNote?: unknown;
  biomedicalStrength?: unknown;
  biotechActivity?: unknown;
  aiHealthtechFocus?: unknown;
  stemStrength?: unknown;
  innovationFocus?: unknown;
  competitionReady?: unknown;
  ranking?: unknown;
}