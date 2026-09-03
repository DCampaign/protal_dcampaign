export const siteConfig = {
  name: 'DCampaign Portal',
  contactEmail: 'contact@dcampaign.com',
} as const;

export const portalAccessHref = `mailto:${siteConfig.contactEmail}?subject=DCampaign%20Portal%20Access`;
