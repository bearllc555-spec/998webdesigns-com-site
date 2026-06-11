/**
 * 998WebDesigns — AgentMail Auto-Responder
 * Cloudflare Worker
 *
 * Triggered instantly by AgentMail webhooks on message.received.
 * Applies a smart filter to skip automated/system emails, then
 * sends a branded acknowledgement reply from hello@998webdesigns.com.
 */

// Org inbox on helmet (998webdesigns@agentmail.to username is globally taken on agentmail.to).
const INBOX_ID = "bearllc@agentmail.to";
const REPLY_FROM_DISPLAY = "hello@998webdesigns.com";

// Senders/subjects to skip — system emails, notifications, etc.
const SKIP_SENDERS = [
  "noreply",
  "no-reply",
  "mailer-daemon",
  "forwarding-noreply",
  "donotreply",
  "do-not-reply",
  "notifications@",
  "bounce",
  "support@",
  "alerts@",
  "postmaster@",
];

const SKIP_SUBJECTS = [
  "forwarding confirmation",
  "delivery status notification",
  "out of office",
  "automatic reply",
  "auto-reply",
  "auto reply",
  "unsubscribe",
  "mail delivery failed",
  "returned mail",
];

function isHumanInquiry(message) {
  const sender = (message.from || "").toLowerCase();
  const subject = (message.subject || "").toLowerCase();

  // Skip our own outbound messages
  if (sender.includes("@agentmail.to") && sender.includes("bearllc")) return false;
  if (sender.includes("998webdesigns.com") && sender.includes("noreply")) return false;

  // Skip known automated senders
  if (SKIP_SENDERS.some((s) => sender.includes(s))) return false;

  // Skip automated subjects
  if (SKIP_SUBJECTS.some((s) => subject.includes(s))) return false;

  return true;
}

function buildReplyText(originalMessage) {
  const senderName = extractFirstName(originalMessage.from);
  const greeting = senderName ? `Hi ${senderName},` : "Hi there,";

  return `${greeting}

Thank you for reaching out to 998WebDesigns!

I'm Anthony's AI agent — I'm writing to let you know that your message has been received loud and clear. Anthony will personally review it and get back to you shortly.

In the meantime, feel free to visit our website or reply to this email if you have anything to add.

Talk soon,

998WebDesigns AI Agent
On behalf of Anthony DeMeo | 998WebDesigns
https://998webdesigns.com`;
}

function buildReplyHtml(originalMessage) {
  const senderName = extractFirstName(originalMessage.from);
  const greeting = senderName ? `Hi ${senderName},` : "Hi there,";

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; font-size: 15px; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>Thank you for reaching out to <strong>998WebDesigns</strong>!</p>
  <p>
    I'm Anthony's AI agent — I'm writing to let you know that your message has been received
    loud and clear. Anthony will personally review it and get back to you shortly.
  </p>
  <p>
    In the meantime, feel free to visit our website or reply to this email if you have anything to add.
  </p>
  <p>Talk soon,</p>
  <br>
  <p style="color: #555; font-size: 13px;">
    <strong>998WebDesigns AI Agent</strong><br>
    On behalf of Anthony DeMeo | 998WebDesigns<br>
    <a href="https://998webdesigns.com" style="color: #0066cc;">998webdesigns.com</a>
  </p>
</body>
</html>`;
}

function extractFirstName(fromField) {
  // e.g. "John Smith <john@example.com>" → "John"
  const match = fromField.match(/^([^<@]+)/);
  if (!match) return null;
  const name = match[1].trim().split(" ")[0];
  // Sanity check — must look like a real name, not an email or code
  if (!name || name.length < 2 || name.includes("@") || /\d/.test(name)) return null;
  return name;
}

async function sendAutoReply(message, apiKey) {
  const replyTo = message.reply_to?.[0] || message.from;
  const subject = message.subject?.startsWith("Re:")
    ? message.subject
    : `Re: ${message.subject || "(no subject)"}`;

  const payload = {
    to: [replyTo],
    subject,
    reply_to: [REPLY_FROM_DISPLAY],
    text: buildReplyText(message),
    html: buildReplyHtml(message),
  };

  const response = await fetch(`https://api.agentmail.to/v0/inboxes/${INBOX_ID}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AgentMail send failed: ${response.status} — ${err}`);
  }

  return await response.json();
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const incomingSecret = request.headers.get("x-webhook-secret") || "";
    if (env.WEBHOOK_SECRET && incomingSecret !== env.WEBHOOK_SECRET) {
      console.warn("Rejected webhook: invalid secret");
      return new Response("Unauthorized", { status: 401 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (payload.event_type !== "message.received") {
      return new Response("Ignored: not a message.received event", { status: 200 });
    }

    const message = payload.message;
    if (!message) {
      return new Response("No message in payload", { status: 400 });
    }

    if (!isHumanInquiry(message)) {
      console.log(`Skipped auto-reply for: ${message.from} | ${message.subject}`);
      return new Response("Skipped: automated sender", { status: 200 });
    }

    try {
      const result = await sendAutoReply(message, env.AGENTMAIL_API_KEY);
      console.log(`Auto-reply sent to ${message.from} | message_id: ${result.message_id}`);
      return new Response(JSON.stringify({ ok: true, message_id: result.message_id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Auto-reply failed:", err.message);
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  },
};
