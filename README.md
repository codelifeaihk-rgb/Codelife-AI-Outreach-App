# CodeLife Outreach

**CodeLife Outreach** is an AI-assisted outreach management tool built for the sales team of [CodeLife.ai](https://www.codelife.ai). It helps sales professionals efficiently discover university and school contacts, generate personalized email drafts, and send outreach emails through connected Gmail or Microsoft accounts — all while maintaining compliance through human approval workflows.

## Features

- **University & School Finder** — Search and filter institutions by country, department, and focus area (Biomedical, Biotech, AI in Biology, etc.).
- **Contact Discovery** — Automatically find professors, lab heads, and decision-makers from public sources with fit scoring and explanations.
- **AI-Powered Email Drafting** — Generate personalized outreach emails using uploaded templates or default CodeLife branding.
- **Email Sending** — Send approved emails directly through connected Gmail or Microsoft Outlook accounts.
- **Human Approval Workflow** — Drafts must be reviewed and approved before sending (compliance-first design).
- **Image Support** — Upload custom banner and closing images for email templates.
- **Multi-Provider Support** — Connect and switch between Gmail and Microsoft accounts.
- **Dashboard & Tracking** — View campaigns, drafts, and sent emails in one place.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL) + Prisma ORM
- **Authentication**: Clerk
- **Email Sending**: Gmail API + Microsoft Graph API
- **AI**: GLM / Qwen (via custom AI client)
- **Deployment**: Vercel

## Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/codelife-ai-outreach.git
cd codelife-ai-outreach

### 2. Install dependencies
Bashnpm install

### 3. Set up environment variables
Copy the example environment file:
Bashcp .env.example .env.local
Then fill in the required values (see Environment Variables section below).
### 4. Run database migrations & generate Prisma client
Bashnpx prisma generate
npx prisma migrate dev
### 5. Start the development server
Bashnpm run dev
The app will be available at http://localhost:3000.
Environment Variables
Create a .env.local file with the following variables:
VariableDescriptionRequiredDATABASE_URLSupabase connection stringYesDIRECT_URLSupabase direct connection stringYesNEXT_PUBLIC_SUPABASE_URLSupabase project URLYesSUPABASE_SERVICE_ROLE_KEYSupabase service role keyYesNEXT_PUBLIC_CLERK_PUBLISHABLE_KEYClerk Publishable KeyYesCLERK_SECRET_KEYClerk Secret KeyYesGOOGLE_CLIENT_IDGoogle OAuth Client IDYesGOOGLE_CLIENT_SECRETGoogle OAuth Client SecretYesMICROSOFT_CLIENT_IDMicrosoft Azure App Client IDYesMICROSOFT_CLIENT_SECRETMicrosoft Azure App Client SecretYesNEXT_PUBLIC_APP_URLYour app URL (e.g. http://localhost:3000)Yes

### How It Works (High-Level Flow)

User logs in using Clerk.
Connects email account (Gmail or Microsoft).
Creates a campaign and selects target country + focus area.
Discovers institutions and saves them.
Discovers contacts (professors/staff) with AI fit scoring.
Generates email drafts using AI + template.
Reviews and approves drafts (human approval required).
Sends emails through the connected email account.
Tracks sent emails and updates contact status.

### Deployment
This project is optimized for deployment on Vercel.
Recommended Deployment Steps

Push your code to GitHub.
Import the repository into Vercel.
Add all required environment variables in Vercel.
Update OAuth redirect URIs in Google Cloud Console and Azure Portal with your production domain.
Deploy.

Note: Make sure to use Production Clerk keys (pk_live_...) when deploying to production.
Project Structure
textsrc/
├── app/                    # Next.js App Router
├── components/             # Reusable UI components
├── lib/                    # Utility functions, email providers, AI client
├── prisma/                 # Prisma schema and migrations
└── generated/              # Generated Prisma client (auto-generated)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
