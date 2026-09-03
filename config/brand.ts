export const brand = {
  name: 'DCampaign Digital',
  portalName: 'DCampaign Workspace',
  mainWebsite: process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? 'https://dcampaign.com',
  portalWebsite: process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.dcampaign.com',
  supportEmail: 'contact@dcampaign.com',
  logo: '/dcampaign-logo-white.webp',
} as const;
