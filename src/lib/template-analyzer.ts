// src/lib/template-analyzer.ts
// Analyzes uploaded HTML email templates.
// Extracts: header/banner, footer image, colors, placeholders, structure.
// This analysis is passed to the AI so it can adopt the template intelligently.

export interface TemplateAnalysis {
    hasCustomHeader: boolean;
    hasCustomFooter: boolean;
    headerContent: string;       // SVG, img tag, or empty
    footerImageUrl: string;      // closing image URL if found
    backgroundColor: string;     // outer background color
    cardBackgroundColor: string; // inner card color
    accentColor: string;         // CTA/link color
    placeholders: string[];      // detected placeholders like [Name]
    hasUnsubscribe: boolean;
    footerText: string;          // company info in footer
    rawHtml: string;             // full template for AI
  }
  
  // Extract value from inline style
  function extractStyleValue(
    style: string,
    property: string
  ): string {
    const match = style.match(
      new RegExp(`${property}\\s*:\\s*([^;]+)`, "i")
    );
    return match ? match[1].trim() : "";
  }
  
  // Find all image URLs in the template
  function extractImageUrls(html: string): string[] {
    const matches = [...html.matchAll(/src=["']([^"']+)["']/g)];
    return matches.map((m) => m[1]).filter((url) => url.startsWith("http"));
  }
  
  // Find all placeholder patterns like [Name], {{Name}}, {Name}
  function extractPlaceholders(html: string): string[] {
    const brackets = [...html.matchAll(/\[([^\]]+)\]/g)].map((m) => m[0]);
    const doubleBraces = [...html.matchAll(/\{\{([^}]+)\}\}/g)].map(
      (m) => m[0]
    );
    const singleBraces = [...html.matchAll(/\{([^}]+)\}/g)].map((m) => m[0]);
    return [...new Set([...brackets, ...doubleBraces, ...singleBraces])];
  }
  
  // Extract the header section (first <tr> or header comment block)
  function extractHeaderContent(html: string): string {
    // Look for SVG logo
    const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) return svgMatch[0].slice(0, 200) + "... [SVG logo detected]";
  
    // Look for header image
    const headerImgMatch = html.match(
      /header[\s\S]{0,200}<img[^>]+src=["']([^"']+)["']/i
    );
    if (headerImgMatch) return `[Header image: ${headerImgMatch[1]}]`;
  
    return "";
  }
  
  // Extract footer/closing image (last img before footer)
  function extractFooterImage(html: string): string {
    const allImages = extractImageUrls(html);
    // Return last image URL — typically the closing showcase image
    return allImages.length > 0 ? allImages[allImages.length - 1] : "";
  }
  
  // Extract background color from body or wrapper table
  function extractBackgroundColor(html: string): string {
    const bodyMatch = html.match(
      /body[^{]*\{[^}]*background-color:\s*([^;]+)/i
    );
    if (bodyMatch) return bodyMatch[1].trim();
  
    const inlineMatch = html.match(
      /background-color:\s*(#[a-fA-F0-9]{3,6})/
    );
    return inlineMatch ? inlineMatch[1] : "#f6f8fa";
  }
  
  // Extract CTA/accent color from buttons or links
  function extractAccentColor(html: string): string {
    // Look for button background
    const btnMatch = html.match(
      /background-color:\s*(#[a-fA-F0-9]{6})(?=[^}]*button|[^}]*cta)/i
    );
    if (btnMatch) return btnMatch[1];
  
    // Look for link colors
    const linkMatch = html.match(/color:\s*(#0ea5e9|#3b82f6|#2563eb)/i);
    return linkMatch ? linkMatch[1] : "#0ea5e9";
  }
  
  // Main analysis function
  export function analyzeTemplate(html: string): TemplateAnalysis {
    const hasUnsubscribe =
      /unsubscribe/i.test(html) || /opt.out/i.test(html);
  
    const footerMatch = html.match(
      /<td[^>]*footer[\s\S]*?>([\s\S]*?)<\/td>/i
    );
    const footerText = footerMatch
      ? footerMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
      : "";
  
    // Detect dark card sections
    const hasDarkCards = /#1e293b|#0f172a|#111827/i.test(html);
    const cardBg = hasDarkCards ? "#1e293b" : "#ffffff";
  
    return {
      hasCustomHeader: /<svg|header.*img/i.test(html),
      hasCustomFooter: /footer|unsubscribe/i.test(html),
      headerContent: extractHeaderContent(html),
      footerImageUrl: extractFooterImage(html),
      backgroundColor: extractBackgroundColor(html),
      cardBackgroundColor: cardBg,
      accentColor: extractAccentColor(html),
      placeholders: extractPlaceholders(html),
      hasUnsubscribe,
      footerText,
      rawHtml: html,
    };
  }
  
  // Build a concise template summary for the AI prompt
  // Keeps token count low while giving AI everything it needs
  export function buildTemplateSummary(analysis: TemplateAnalysis): string {
    return `
  TEMPLATE ANALYSIS:
  - Header: ${analysis.hasCustomHeader ? analysis.headerContent : "No custom header — use default"}
  - Footer image: ${analysis.footerImageUrl || "None detected"}
  - Background color: ${analysis.backgroundColor}
  - Card/section color: ${analysis.cardBackgroundColor}
  - Accent/CTA color: ${analysis.accentColor}
  - Placeholders found: ${analysis.placeholders.join(", ") || "None"}
  - Has unsubscribe: ${analysis.hasUnsubscribe ? "Yes — preserve it" : "No — add one"}
  - Footer company text: ${analysis.footerText.slice(0, 100)}
  
  INSTRUCTIONS FOR TEMPLATE USE:
  1. Preserve the header SVG/logo exactly as-is
  2. Preserve the footer image URL: ${analysis.footerImageUrl}
  3. Use background-color: ${analysis.backgroundColor} for outer wrapper
  4. Keep the dark feature cards style (${analysis.cardBackgroundColor})
  5. Use ${analysis.accentColor} for CTA buttons and links
  6. Replace all [placeholder] patterns with real contact data
  7. Keep the unsubscribe link in the footer
  `.trim();
  }