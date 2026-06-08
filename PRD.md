# PRD: CodeLife.ai Outreach

## 1. Product Goal

CodeLife.ai Outreach is a compliant AI-assisted outreach app for CodeLife.ai’s sales team.

The app helps a single operator to:

- Log in with email.
- Build a campaign in either University Mode or School Mode.
- Find public contacts at universities or schools.
- Find the best universities, schools, departments, and contact targets for outreach.
- Generate personalized outreach drafts.
- Review and approve emails.
- Send emails directly from the connected email account after approval.
- Track sent outreach and basic outcomes.
- View outreach status in a dashboard.
- Export outreach data to CRM or spreadsheets.

The MVP should be small, reliable, and fast to ship. It should prioritize functional outreach over advanced automation.

## 2. Target Users

Primary users are non-technical salespeople, founders, and business development staff at CodeLife.ai.

They need to:

- Reach professors, lab heads, department leaders, and innovation offices in University Mode.
- Reach school leaders, science coordinators, and curriculum decision-makers in School Mode.

They have limited time and need a workflow that reduces manual research and drafting.

## 3. MVP Scope

## MVP Scope

### In Scope

- Email-based login and logout.
- Connect sender email account through Google Workspace or Gmail.
- Create a campaign with Audience Mode: University or School.
- Target institution, country, optional department, and optional target language.
- University Finder with filters such as country, ranking, biomedical strength, biotech activity, and AI or healthtech focus.
- School Finder with filters such as country, school type, STEM strength, biotech activity, innovation focus, and iGEM competition or similar biotechnology competition readiness.
- Department Recommender for relevant university departments such as Biomedical Engineering, Life Sciences, Biotechnology, Bioinformatics, Medicine, Pharmacy, Molecular Biology, Computer Science, AI, and Innovation Centre.
- AI public contact discovery with source URLs.
- Public professor and staff page enrichment with names, roles, research interests, lab pages, and emails.
- Public school contact discovery with names, roles, department or program context, and public emails when available.
- AI lead scoring with a clear “Why this fit?” explanation.
- AI personalized draft generation.
- Multilingual draft generation for selected target languages.
- Visual and text email editor.
- Human review and approval workflow.
- Direct email sending on behalf of the user after explicit approval.
- Basic tracking of sent emails and outcomes.
- Outreach dashboard with status overview.
- Do Not Contact list.
- Compliance Mode for unsubscribe handling, sender identity, opt-out tracking, and no scraping of private data.
- Email Quality Score for subject line, spam risk, length, tone, and CTA clarity.
- Find Decision Makers for department heads, program directors, lab PIs, innovation offices, and entrepreneurship offices.
- Follow-up suggestions after 5 to 7 days.
- Campaign history and export to CSV, HTML, Google Sheets, and basic CRM-ready formats.

### Out of Scope

- Automated follow-up sequences.
- Team collaboration or workspaces.
- Advanced analytics.
- Private data scraping.
- Full CRM sync in MVP.
- Approach Strategy tab.
- Collaboration Type picker.

## 4. Primary User Flow

1. User logs in with email.
2. User connects their sender email account.
3. User creates a new campaign.
4. User selects Audience Mode.
5. User defines target country, institution, optional department, and optional target language.
6. AI suggests universities or schools and departments based on the target criteria.
7. AI discovers public contacts and provides scoring plus “Why this fit?”.
8. User reviews contacts with source URLs.
9. User provides or selects a base email template.
10. AI generates personalized drafts for selected contacts.
11. User reviews and edits drafts.
12. User approves the send.
13. The app sends emails directly from the connected email account after human approval.
14. The app automatically records relevant information for each sent email and can export the information into CRM or Google Sheets.
15. User views status updates in the dashboard.
16. User can log out and switch to another email account for outreach.

## 5. Key Features

### Login and Access

- Email-based login and logout.
- Basic authenticated user session.
- Each user only sees their own campaigns and contacts.

### Campaign Builder

- Simple campaign creation form.
- Audience mode selection.
- Target institution and country fields.
- Optional department or school type fields.
- Optional target language selection.

### University Finder

- Search universities by country, ranking, biomedical strength, biotech activity, and AI or healthtech focus.
- Suggest institutions that are likely to be a good fit for CodeLife.ai.
- Save university selection into the campaign.

### School Finder

- Search secondary schools by country, school type, STEM strength, biotech activity, innovation focus, and competition readiness.
- Suggest schools that are likely to be a good fit for CodeLife.ai’s school positioning.
- Save school selection into the campaign.

### Department Recommender

- Suggest departments likely to match the outreach goal.
- Support department types such as Biomedical Engineering, Life Sciences, Biotechnology, Bioinformatics, Medicine, Pharmacy, Molecular Biology, Computer Science, AI, and Innovation Centre.
- Explain why a department was recommended.

### Lead Discovery

- Public contact discovery only.
- Source URL shown for each lead recommended.
- Contact role, department, and institution context displayed.
- Decision-maker recommendation.
- Public professor and staff enrichment from official pages.
- Public school staff and leadership enrichment from official pages.
- Decision-maker targeting for department heads, program directors, lab PIs, innovation offices, and entrepreneurship offices.

### Draft Generation

- Base email template input.
- AI-generated personalized drafts.
- Different output style for University Mode versus School Mode.
- Multilingual draft support.
- Draft explanation showing why the message was written that way.

### Approval and Sending

- Human approval required.
- Approve, reject, or regenerate email draft.
- Direct sending from the connected email account after human approval.
- No email may be sent without explicit approval.
- Unsubscribe text included in all emails.
- Compliance Mode enforced for opt-out tracking and sender identity.

### Tracking and Dashboard

- Store sent date, contact, subject, and version used.
- Basic lead status labels.
- Notes and follow-up reminders.
- Do Not Contact suppression list.
- Dashboard showing outreach status and delivery outcomes.
- Track sent, delivered, bounced, replied, interested, and follow-up needed.
- Track email quality score for drafts and sent emails.

### Export and CRM

- Export to CSV and HTML.
- Export to Google Sheets.
- Export to CRM-friendly formats.
- Support basic export paths for HubSpot, Airtable, and Notion later.

## 6. Functional Requirements

### Authentication and Email Accounts

- Users can log in and log out of the app using email.
- Users can connect, switch, and log out of their sender email account.
- Once connected, the app gains permission to send emails on behalf of the user.
- The app must always request human approval before sending any email.

### Sending Logic

- The app cannot send any email without explicit user approval.
- After approval, the app uses the connected email account to send emails directly to chosen contacts.
- All sent emails must be logged with a full audit trail.

### Compliance and Safety

- Only public data is used for lead discovery.
- Every contact must include a source URL.
- A mandatory human approval gate must exist before any email is sent.
- An unsubscribe link must be included in all emails.
- A do-not-contact list must be supported.
- Compliance Mode must enforce sender identity, opt-out tracking, and no scraping of private data.

### Campaign Management

- Users can create, view, edit, and archive campaigns.
- Each campaign must store audience mode, target institution, country, optional department, and optional target language.
- Each campaign must support one base email draft.

### Contact Discovery

- The system uses only public contact information.
- Every contact must include a source URL.
- Each contact must include institution and role metadata when available.
- The system must rank contacts by fit and likely decision-maker relevance.
- The system must show clear “Why this fit?” explanations in plain English for each recommended contact.
- The system must recommend relevant universities, secondary schools, and departments based on campaign criteria and CodeLife.ai’s business positioning.
- The system can enrich contact information by crawling official public department, university, or school pages.
- The system must surface decision makers such as department heads, program directors, lab PIs, innovation offices, and entrepreneurship offices.

### Draft Generation

- The system must generate one or more personalized drafts per contact.
- The system must adapt tone and framing for University Mode versus School Mode.
- University Mode communication tone should be more technical and consultative.
- School Mode communication tone should be simpler and more outcome-focused.
- The system must support multilingual draft generation based on target language.
- The system must show reasoning in plain English for each email draft generated.
- For University Mode, the reasoning should reference research interests, publications, lab focus, ongoing projects, or academic work.
- For School Mode, the reasoning should reference curriculum support, workshops, lab setup, student engagement, competition readiness, or institutional needs.
- The system must produce an email quality score for each draft based on subject line clarity, spam risk, length, tone, and CTA clarity.

### Dashboard and Tracking

- The system must show a dashboard of sent outreach status.
- The dashboard must show counts for drafted, approved, sent, delivered, bounced, replied, interested, follow-up needed, and do-not-contact.
- The dashboard must show the latest activity for each campaign or contact.
- The user must be able to filter by campaign, institution, audience mode, and status.
- The system must suggest a polite follow-up after 5 to 7 days.

### Export

- The system must export campaign and contact data to CSV and Google Sheets.
- The system must support CRM-ready export formats.
- The system must preserve contact status, campaign context, and sent history in exports.

## 7. Target Technical Shape

- Frontend: Next.js 16 App Router with TypeScript, Tailwind, and shadcn/ui for the dashboard, editor, and campaign UI.
- Backend: Next.js Server Actions for internal mutations and Next.js API routes or route handlers for reusable endpoints, external integrations, webhooks, and authenticated automation.
- Database: PostgreSQL with Prisma as the ORM and schema layer.
- AI: OpenAI API for lead scoring, university or school recommendations, department suggestions, personalization, and explanation generation.
- Search/Crawling: Brave Search API, SerpAPI, Tavily, or a custom Playwright crawler for public universities, schools, departments, and staff pages.
- Email Sending: Google Workspace or Gmail API for user-owned sending, with SendGrid, Mailgun, or Amazon SES as fallback or future delivery options.
- Queue: BullMQ with Redis for crawling, enrichment, email sending, follow-up suggestions, and other background jobs.
- Tracking: open pixel, tracked links, and provider analytics when available.
- Storage: PostgreSQL tables and object storage for HTML templates, lead records, campaign logs, crawl sources, and email history.
- Security: strict Row Level Security, audit logging, and per-user access control.

### Data Layer

Core tables, which serve as the official database schema template for the AI agent:

- users
- email_accounts
- campaigns
- universities
- departments
- contacts
- contact_sources
- email_templates
- email_drafts
- sent_emails
- email_events
- do_not_contact

When an email is sent through the app, the AI agent must use this schema to decide what information to log. It should create records in `sent_emails` and `email_events` with complete details such as campaign, contact, subject, status, timestamp, version, and notes to maintain auditability and compliance.

## 8. MVP Success Criteria

A single sales user should be able to:

- Log in and connect their email account.
- Create a campaign.
- Discover contacts.
- Recommend universities, schools, and departments.
- Generate and approve personalized emails.
- Send emails directly from the app.
- Track sent outcomes in the dashboard.
- Export campaign data to CSV or Google Sheets.
- Log out of the email account and switch to another email account.

## 9. Future Iterations

- Automated follow-ups.
- Team workspaces.
- Advanced analytics.
- CRM integrations.
- Smarter multilingual handling.
- Full HubSpot, Airtable, and Notion sync.
- Approach Strategy tab.
- Collaboration Type picker.

