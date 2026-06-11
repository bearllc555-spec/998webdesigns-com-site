# 998WebDesigns AgentMail auto-responder

Cloudflare Worker: instant `message.received` webhook from AgentMail → branded auto-reply.

## Live

| Item | Value |
|------|-------|
| Worker URL | https://998webdesigns-autoresponder.bearllc555.workers.dev |
| AgentMail inbox | `998webdesigns@agentmail.to` |
| Reply-to | `hello@998webdesigns.com` |
| Webhook ID | see AgentMail console |

Secrets (Wrangler): `AGENTMAIL_API_KEY`, `AGENTMAIL_WEBHOOK_SIGNING_SECRET` (Svix `whsec_…` from AgentMail)  
Local key: `slatepress/.local/998-agentmail-api-key-998webdesigns.txt`  
Signing secret: `slatepress/.local/998-agentmail-webhook-signing-secret.txt` (auto-written by register script)

## Ops

```bash
cd worker
npm install
npx wrangler deploy          # ship code changes
npx wrangler tail            # live logs
```

Re-register webhook (idempotent):

```bash
node scripts/register-agentmail-autoresponder-webhook.mjs
```

Edit copy in `src/index.js` → `buildReplyText()` / `buildReplyHtml()`.
