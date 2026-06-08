// src/lib/codelife-context.ts
// CodeLife.ai business context — injected into ALL AI prompts.
// Update this file to change how the AI understands CodeLife.ai's positioning.
// This is the single source of truth for AI business context.

export const CODELIFE_CONTEXT = `
## About CodeLife.ai

CodeLife.ai is an AI-powered virtual biology laboratory simulation platform.

### What it does:
- Provides realistic virtual lab simulations for biology, biomedical, and life sciences education
- Students and researchers can run experiments virtually without physical lab equipment
- Covers: cell biology, genetics, microbiology, molecular biology, biochemistry, pharmacology
- AI-guided experiments with real-time feedback and assessment
- Supports undergraduate, postgraduate, and PhD-level content
- Multilingual support for global institutions

### Primary value propositions:
- Reduces cost of physical lab consumables and equipment
- Enables remote and hybrid learning for lab-based courses
- Safe environment for students to make mistakes and learn
- Scalable — one platform serves hundreds of students simultaneously
- Tracks student progress and generates learning analytics for educators

### Target customers:

**University Mode targets:**
- Professors teaching biology, biomedical engineering, life sciences, pharmacy, molecular biology
- Lab directors who manage teaching labs and research labs
- Department heads making curriculum and software procurement decisions
- Innovation offices exploring edtech partnerships
- Postdocs and PhD students who assist in teaching lab courses
- Research assistants involved in lab-based teaching

**School Mode targets:**
- Science teachers and biology department heads
- School principals and vice principals who approve curriculum tools
- STEM coordinators overseeing science programmes
- Schools participating in iGEM or science competitions
- Schools with strong biotech or life sciences focus

### Ideal institution profile:

**Universities:**
- Strong biomedical, biotech, or life sciences faculty
- Active research labs needing teaching support
- Large student enrollment in biology-related courses
- Interest in edtech, digital transformation, or hybrid learning
- Located in growth markets: Southeast Asia, Middle East, Europe, Africa

**Schools:**
- Strong STEM programme with biology as a core subject
- Participation in science competitions (iGEM, Science Olympiad)
- Forward-thinking leadership open to technology adoption
- Located in markets with limited physical lab resources

### Competitive advantages:
- More affordable than building/maintaining physical labs
- More realistic than existing 2D simulation tools
- AI personalisation adapts to each student's learning pace
- No installation required — fully browser-based
`;

export const UNIVERSITY_FIT_CRITERIA = `
A contact is a GREAT fit for CodeLife.ai outreach if they:
- Teach or supervise lab-based biology/biomedical/life sciences courses
- Manage teaching labs or research labs with student involvement
- Make or influence software/edtech procurement decisions
- Are involved in curriculum development or course design
- Lead departments with large student enrollment in lab courses
- Are open to digital transformation in education
- Work at institutions with limited lab resources or large class sizes

A contact is a POOR fit if they:
- Work in purely theoretical or computational fields (no lab component)
- Are in administrative roles with no academic influence
- Work in completely unrelated departments (law, business, arts)
`;

export const SCHOOL_FIT_CRITERIA = `
A contact is a GREAT fit for CodeLife.ai outreach if they:
- Teach biology, chemistry, or life sciences
- Head the science department or STEM programme
- Make decisions about curriculum tools and software
- Lead schools with active science competition participation
- Are principals/vice principals at science-focused schools
- Work at schools with limited physical lab resources

A contact is a POOR fit if they:
- Teach non-science subjects with no lab connection
- Are in purely administrative roles
- Work at schools without any science programme
`;