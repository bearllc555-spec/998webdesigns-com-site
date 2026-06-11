# 998WebDesigns AgentMail auto-responder

Cloudflare Worker: instant `message.received` webhook from AgentMail → branded auto-reply.

## Live

| Item | Value |
|------|-------|
| Worker URL | https://998webdesigns-autoresponder.bearllc555.workers.dev |
| AgentMail inbox | `bearllc@agentmail.to` (org inbox; `998webdesigns` username is taken globally) |
| Reply-to | `hello@998webdesigns.com` |
| Webhook ID | `ep_3F0G2FEEyhzLzt4ml2ZflEbbjnC` |

Secrets (Wrangler): `AGENTMAIL_API_KEY`, `WEBHOOK_SECRET`  
Local copies: `slatepress/.local/998-agentmail-api-key.txt`, `998-agentmail-webhook-secret.txt`

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
