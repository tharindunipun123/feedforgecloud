export function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.RESEND_FROM_EMAIL || 'Feed Forge <noreply@feedforge.cloud>',
    testMode: process.env.EMAIL_TEST_MODE !== 'false',
    testRecipient: process.env.EMAIL_TEST_RECIPIENT || 'nipuntharindu2005@gmail.com',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://feedforge.cloud',
    brandName: process.env.EMAIL_BRAND_NAME || 'Feed Forge',
    domain: process.env.EMAIL_DOMAIN || 'feedforge.cloud',
  };
}

export function isEmailConfigured() {
  return Boolean(getEmailConfig().apiKey);
}
