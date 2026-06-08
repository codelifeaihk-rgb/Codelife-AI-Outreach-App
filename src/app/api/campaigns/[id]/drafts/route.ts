// src/app/api/campaigns/[id]/drafts/route.ts
// POST — generate AI draft using analyzed template + strong personalization.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { chat, extractJSON } from "@/src/lib/ai";
import { requireDbUser } from "@/src/lib/clerk-user";
import { analyzeTemplate, buildTemplateSummary } from "@/src/lib/template-analyzer";
import {
  CODELIFE_CONTEXT,
  UNIVERSITY_FIT_CRITERIA,
  SCHOOL_FIT_CRITERIA,
} from "@/src/lib/codelife-context";

// Your actual uploaded template as the default
const DEFAULT_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<style type="text/css">
body{margin:0;padding:0;width:100%!important;background-color:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
table{border-collapse:collapse!important;}
img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
</style>
</head>
<body style="margin:0;padding:0;background-color:{{BACKGROUND_COLOR}};">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:{{BACKGROUND_COLOR}};">
<tr><td align="center" style="padding:24px 8px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">

<!-- HEADER: CodeLifeAI SVG Logo -->
<tr>
<td align="center" style="padding:36px 40px 24px 40px;border-bottom:1px solid #f1f5f9;background-color:#ffffff;border-radius:8px 8px 0 0;">
<svg width="120" height="120" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="topArchGrad" x1="20" y1="50" x2="220" y2="50" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#db679f"/><stop offset="30%" stop-color="#b671b7"/><stop offset="70%" stop-color="#7ea7d8"/><stop offset="100%" stop-color="#67abe0"/></linearGradient>
<linearGradient id="bottomArchGrad" x1="20" y1="190" x2="220" y2="190" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#0d5ba6"/><stop offset="100%" stop-color="#693c83"/></linearGradient>
<linearGradient id="logoTextGrad" x1="15" y1="120" x2="225" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#4e99d3"/><stop offset="100%" stop-color="#ce6087"/></linearGradient>
</defs>
<path d="M 23 93 A 98 98 0 0 1 217 93" stroke="url(#topArchGrad)" stroke-width="2.5" fill="none"/>
<path d="M 23 93 L 42 63 L 73 38 L 120 28 L 167 38 L 198 63 L 217 93" stroke="url(#topArchGrad)" stroke-width="1.5" fill="none" opacity="0.8"/>
<circle cx="23" cy="93" r="6" fill="#db679f"/><circle cx="120" cy="28" r="6" fill="#9094cc"/><circle cx="217" cy="93" r="6" fill="#5fafe4"/>
<text x="120" y="132" font-family="Arial,sans-serif" font-size="28" font-weight="900" fill="url(#logoTextGrad)" text-anchor="middle" letter-spacing="2">CodeLife</text>
<text x="120" y="155" font-family="Arial,sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle" letter-spacing="4">AI PLATFORM</text>
<path d="M 23 147 L 42 177 L 73 202 L 120 212 L 167 202 L 198 177 L 217 147" stroke="url(#bottomArchGrad)" stroke-width="1.5" fill="none" opacity="0.8"/>
<path d="M 23 147 A 98 98 0 0 0 217 147" stroke="url(#bottomArchGrad)" stroke-width="2.5" fill="none"/>
<circle cx="23" cy="147" r="6" fill="#0d5ba6"/><circle cx="120" cy="212" r="6" fill="#4a3d82"/><circle cx="217" cy="147" r="6" fill="#693c83"/>
</svg>
</td>
</tr>

<!-- MAIN CONTENT -->
<tr>
<td style="padding:32px 40px;background-color:#0f172a;">

<p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#e2e8f0;">
Dear <strong style="color:#38bdf8;">{{CONTACT_NAME}}</strong>,
</p>

<p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#e2e8f0;">
{{OPENING_PARAGRAPH}}
</p>

<!-- Personalization highlight box -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
<tr>
<td style="background-color:#1e293b;border-left:4px solid #38bdf8;border-radius:0 6px 6px 0;padding:16px 20px;">
<p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;font-style:italic;">
{{PERSONALIZATION_HOOK}}
</p>
</td>
</tr>
</table>

<p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#e2e8f0;">
{{MAIN_VALUE_PARAGRAPH}}
</p>

<!-- Feature cards -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
<tr>
<td width="50%" valign="top" style="padding-right:6px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e293b;border-radius:6px;margin-bottom:10px;">
<tr><td style="padding:12px 14px;"><p style="margin:0 0 4px 0;font-size:13px;font-weight:bold;color:#38bdf8;">DNA Studio</p><p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">AI-native genetic design and sequence engineering.</p></td></tr>
</table>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e293b;border-radius:6px;margin-bottom:10px;">
<tr><td style="padding:12px 14px;"><p style="margin:0 0 4px 0;font-size:13px;font-weight:bold;color:#38bdf8;">Cell Studio</p><p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">Metabolic pathway optimization and network design.</p></td></tr>
</table>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e293b;border-radius:6px;">
<tr><td style="padding:12px 14px;"><p style="margin:0 0 4px 0;font-size:13px;font-weight:bold;color:#38bdf8;">Scientific Assistant</p><p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">Real-time literature synthesis and research copilot.</p></td></tr>
</table>
</td>
<td width="50%" valign="top" style="padding-left:6px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e293b;border-radius:6px;margin-bottom:10px;">
<tr><td style="padding:12px 14px;"><p style="margin:0 0 4px 0;font-size:13px;font-weight:bold;color:#38bdf8;">Protein Studio</p><p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">AI-driven protein design and molecular engineering.</p></td></tr>
</table>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e293b;border-radius:6px;margin-bottom:10px;">
<tr><td style="padding:12px 14px;"><p style="margin:0 0 4px 0;font-size:13px;font-weight:bold;color:#38bdf8;">Virtual Lab</p><p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">In-silico wet-lab simulation and assay validation.</p></td></tr>
</table>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#1e293b;border-radius:6px;">
<tr><td style="padding:12px 14px;"><p style="margin:0 0 4px 0;font-size:13px;font-weight:bold;color:#38bdf8;">BioParts Database</p><p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">Curated registry of validated biological sequences.</p></td></tr>
</table>
</td>
</tr>
</table>

<!-- Bottom platform image -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
<tr><td>
<img src="https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=600&h=200&q=80" alt="CodeLifeAI Platform" width="520" style="width:100%;max-width:100%;height:auto;display:block;border-radius:6px;border:1px solid #334155;"/>
</td></tr>
</table>

<!-- CTA -->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px auto;">
<tr>
<td align="center" style="border-radius:6px;background-color:#0ea5e9;">
<a href="https://www.codelife.ai/contact" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
{{CTA_TEXT}}
</a>
</td>
</tr>
</table>

<!-- Closing -->
<p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#e2e8f0;">
{{CLOSING_PARAGRAPH}}
</p>
<p style="margin:16px 0 0 0;font-size:15px;line-height:1.5;color:#94a3b8;">
Best regards,<br/><br/>
<strong style="color:#e2e8f0;">{{SENDER_NAME}}</strong><br/>
<span style="color:#64748b;">{{SENDER_TITLE}}</span><br/>
CodeLifeAI Team — Solar Trinity Science Limited<br/>
<a href="https://codelife.ai" style="color:#0ea5e9;text-decoration:none;">codelife.ai</a>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="background-color:#f8fafc;padding:28px 40px;border-top:1px solid #f1f5f9;border-radius:0 0 8px 8px;">
<p style="margin:0 0 8px 0;font-size:12px;color:#64748b;font-weight:600;">Solar Trinity Science Limited</p>
<p style="margin:0 0 12px 0;font-size:12px;color:#94a3b8;">Developers of the CodeLifeAI Platform</p>
<p style="margin:0 0 12px 0;font-size:12px;">
<a href="https://codelife.ai" style="color:#0ea5e9;text-decoration:none;margin:0 8px;">Visit Website</a> |
<a href="https://codelife.ai/privacy" style="color:#0ea5e9;text-decoration:none;margin:0 8px;">Privacy Policy</a> |
<a href="https://codelife.ai/support" style="color:#0ea5e9;text-decoration:none;margin:0 8px;">Support</a>
</p>
<p style="margin:0;font-size:11px;color:#cbd5e1;">
This email was sent to you as a researcher or educator in the life sciences field.<br/>
<a href="{{UNSUBSCRIBE_LINK}}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: campaignId } = await params;
    const dbUser = await requireDbUser();

    const drafts = await prisma.emailDraft.findMany({
      where: { campaignId, campaign: { userId: dbUser.id } },
      include: {
        contact: {
          select: {
            fullName: true,
            email: true,
            role: true,
            institutionName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("[Drafts GET]", error);
    return NextResponse.json({ error: "Failed to fetch drafts." }, { status: 500 });
  }
}

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
    const {
      contactId,
      templateHtml,
      language,
      audienceMode,
      backgroundColor,
      senderName,
      senderTitle,
    } = await req.json();

    const dbUser = await requireDbUser();

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: dbUser.id },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, campaignId },
      include: { sources: true },
    });
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // DoNotContact check
    if (contact.email) {
      const blocked = await prisma.doNotContact.findFirst({
        where: { userId: dbUser.id, email: contact.email },
      });
      if (blocked) {
        return NextResponse.json(
          { error: `${contact.email} is on the Do Not Contact list.` },
          { status: 403 }
        );
      }
    }

    const isUniversity = audienceMode === "university";
    const baseTemplate = templateHtml || DEFAULT_TEMPLATE;
    const bgColor = backgroundColor || "#f6f8fa";

    // Analyze the template
    const analysis = analyzeTemplate(baseTemplate);
    const templateSummary = buildTemplateSummary(analysis);

    const langLabel: Record<string, string> = {
      en: "English", ms: "Malay", zh: "Mandarin Chinese",
      ar: "Arabic", fr: "French", de: "German",
      es: "Spanish", ja: "Japanese", ko: "Korean",
    };
    const outputLanguage = langLabel[language ?? "en"] ?? "English";

    console.log(`[Drafts] Generating for ${contact.fullName} | ${outputLanguage}`);

    const prompt = `You are an expert email copywriter for CodeLife.ai (Solar Trinity Science Limited).

${CODELIFE_CONTEXT.slice(0, 400)}
${isUniversity ? UNIVERSITY_FIT_CRITERIA.slice(0, 200) : SCHOOL_FIT_CRITERIA.slice(0, 200)}

${templateSummary}

CONTACT DETAILS (personalize precisely using these):
- Full Name: ${contact.fullName}
- Role/Title: ${contact.role ?? "Researcher"}
- Department: ${contact.department ?? "Life Sciences"}
- Institution: ${contact.institutionName ?? "their institution"}
- Decision Maker: ${contact.isDecisionMaker ? "Yes — use authoritative tone" : "No — use collegial peer tone"}
- Fit Explanation: ${contact.fitExplanation ?? "Strong match for CodeLife.ai platform"}
- Email Mode: ${isUniversity ? "University — technical and consultative tone" : "School — simple, outcome-focused tone"}

SENDER DETAILS:
- Sender Name: ${senderName ?? "[Your Name]"}
- Sender Title: ${senderTitle ?? "Business Development, CodeLife.ai"}

OUTPUT LANGUAGE: ${outputLanguage}
BACKGROUND COLOR: ${bgColor}

TASK:
Using the HTML template structure provided in the template summary above, generate a complete personalized email.

CRITICAL RULES:
1. Preserve the SVG logo header exactly — do not change it
2. Preserve the bottom platform image URL exactly
3. Keep the dark card sections (#1e293b) with the 6 product features
4. Replace {{CONTACT_NAME}} with: ${contact.fullName}
5. Replace {{OPENING_PARAGRAPH}} with a personalized opening referencing their specific research or role
6. Replace {{PERSONALIZATION_HOOK}} with a compelling reason referencing their lab, department or published work
7. Replace {{MAIN_VALUE_PARAGRAPH}} with how CodeLife.ai specifically benefits their work
8. Replace {{CTA_TEXT}} with an action-oriented CTA
9. Replace {{CLOSING_PARAGRAPH}} with a warm, professional close
10. Replace {{SENDER_NAME}} with: ${senderName ?? "[Your Name]"}
11. Replace {{SENDER_TITLE}} with: ${senderTitle ?? "Business Development, CodeLife.ai"}
12. Replace {{UNSUBSCRIBE_LINK}} with: #unsubscribe
13. Apply background-color: ${bgColor} to the outer wrapper
14. Write all text content in ${outputLanguage}
15. Keep the unsubscribe link in the footer

Return ONLY a JSON object starting with {

{
  "subject": "Personalized subject line mentioning ${contact.fullName} and ${contact.institutionName ?? "their institution"}",
  "bodyHtml": "complete personalized HTML — full document starting with <!DOCTYPE",
  "bodyText": "plain text version",
  "personalizationReason": "2-3 sentences explaining the personalization choices made for this specific contact",
  "qualityScore": {
    "overall": 8,
    "subjectClarity": 8,
    "spamRisk": 2,
    "length": 7,
    "tone": 9,
    "ctaClarity": 8
  },
  "extractedFields": {
    "contactName": "${contact.fullName}",
    "institution": "${contact.institutionName ?? ""}",
    "department": "${contact.department ?? ""}",
    "role": "${contact.role ?? ""}",
    "personalizationHook": "the specific hook written for this contact",
    "ctaText": "the CTA button text used",
    "senderName": "${senderName ?? ""}",
    "senderTitle": "${senderTitle ?? ""}"
  }
}

JSON:`;

    let aiResponse = "";
    try {
      aiResponse = await chat(
        [{ role: "user", content: prompt }],
        { temperature: 0.4, max_tokens: 4000 }
      );
    } catch (e) {
      console.error("[Drafts] AI failed:", e);
      return NextResponse.json(
        { error: "AI draft generation failed. Please try again." },
        { status: 500 }
      );
    }

    // Parse response
    let draftData = {
      subject: `CodeLifeAI — AI-Powered Biology Platform for ${contact.institutionName ?? "your institution"}`,
      bodyHtml: baseTemplate
        .replace(/{{BACKGROUND_COLOR}}/g, bgColor)
        .replace(/{{CONTACT_NAME}}/g, contact.fullName)
        .replace(/{{INSTITUTION_NAME}}/g, contact.institutionName ?? "your institution")
        .replace(/{{DEPARTMENT_NAME}}/g, contact.department ?? "your department")
        .replace(/{{PERSONALIZATION_HOOK}}/g, contact.fitExplanation ?? "We believe CodeLife.ai would be a great fit.")
        .replace(/{{OPENING_PARAGRAPH}}/g, `I hope this message finds you well. I'm reaching out from CodeLife.ai regarding your work at ${contact.institutionName ?? "your institution"}.`)
        .replace(/{{MAIN_VALUE_PARAGRAPH}}/g, "CodeLife.ai provides AI-powered virtual biology lab tools that can significantly enhance your research and teaching capabilities.")
        .replace(/{{CLOSING_PARAGRAPH}}/g, "I would love to schedule a brief 20-minute demo at your convenience.")
        .replace(/{{CTA_TEXT}}/g, "Book a Free Demo")
        .replace(/{{SENDER_NAME}}/g, senderName ?? "[Your Name]")
        .replace(/{{SENDER_TITLE}}/g, senderTitle ?? "Business Development, CodeLife.ai")
        .replace(/{{UNSUBSCRIBE_LINK}}/g, "#unsubscribe"),
      bodyText: "",
      personalizationReason: "Generated using contact and institution data.",
      qualityScore: { overall: 7, subjectClarity: 7, spamRisk: 2, length: 7, tone: 7, ctaClarity: 7 },
      extractedFields: {
        contactName: contact.fullName,
        institution: contact.institutionName ?? "",
        department: contact.department ?? "",
        role: contact.role ?? "",
        personalizationHook: contact.fitExplanation ?? "",
        ctaText: "Book a Free Demo",
        senderName: senderName ?? "",
        senderTitle: senderTitle ?? "",
      },
    };

    try {
      const cleanJSON = extractJSON(aiResponse);
      const parsed = JSON.parse(cleanJSON);
      if (parsed.subject && parsed.bodyHtml) {
        draftData = { ...draftData, ...parsed };
      }
    } catch {
      console.error("[Drafts] JSON parse failed — using fallback");
    }

    // Ensure unsubscribe is present
    if (!draftData.bodyHtml.toLowerCase().includes("unsubscribe")) {
      draftData.bodyHtml += `<p style="font-size:11px;color:#94a3b8;text-align:center;padding:16px;">
        <a href="#unsubscribe" style="color:#94a3b8;">Unsubscribe</a>
      </p>`;
    }

    // Save draft with all metadata
    const draft = await prisma.emailDraft.create({
      data: {
        campaignId,
        contactId,
        subject: draftData.subject,
        bodyHtml: draftData.bodyHtml,
        bodyText: draftData.bodyText || null,
        status: "draft",
        personalizationReason: draftData.personalizationReason,
        qualityScore: {
          ...draftData.qualityScore,
          backgroundColor: bgColor,
          extractedFields: draftData.extractedFields,
        },
        targetLanguage: language,
        version: 1,
      },
      include: {
        contact: {
          select: { fullName: true, email: true, role: true, institutionName: true },
        },
      },
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("[Drafts POST]", error);
    return NextResponse.json({ error: "Draft generation failed." }, { status: 500 });
  }
}