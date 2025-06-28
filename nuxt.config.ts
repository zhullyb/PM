// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  runtimeConfig: {
    feishuWebhookUrl: process.env.FEISHU_WEBHOOK_URL,
    cloudflareTurnstileSecretKey: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
    public: {
      cloudflareTurnstileSiteKey: process.env.CLOUDFLARE_TURNSTILE_SITE_KEY,
    }
  }
})
