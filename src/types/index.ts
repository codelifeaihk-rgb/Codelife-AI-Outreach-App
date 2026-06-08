// Shared application TypeScript types (domain unions and lightweight shapes used across UI and server code).
// Database enums also exist on Prisma models; keep string unions here in sync with `AudienceMode` in `schema.prisma`.

/** Values for `campaigns.audience_mode` (University Mode vs School Mode). */
export type CampaignAudienceMode = "university" | "school";

export type DashboardSection = "overview" | "campaigns";
