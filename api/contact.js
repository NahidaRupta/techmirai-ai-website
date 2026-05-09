// api/contact.js
// Vercel-style serverless function (Node 18+ runtime).
// Handles POST submissions from the contact form. Sends two emails:
//   1) Notification to the business inbox (NOTIFICATION_EMAIL)
//   2) Auto-reply to the prospect (bilingual EN/JP)
//
// Setup:
//   1. npm install nodemailer
//   2. Set env vars in Vercel project settings (see .env.example):
//        SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
//        FROM_EMAIL, NOTIFICATION_EMAIL, ALLOWED_ORIGIN
//
// Spam protection:
//   - Honeypot field "company_url" (must be empty)
//   - Basic in-memory IP rate limit (5 submissions / 10 min per IP)
//   - Email format + length checks
//   - Reject obvious link-spam in message body

const nodemailer = require('nodemailer');

// ---- in-memory rate limit (per cold start) -----------------------------
// Vercel cold-starts often, so this is intentionally lightweight.
// For production hardening, swap for Upstash Redis or Vercel KV.
const rateBucket = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQ = 5;

function rateLimited(ip) {
  const now = Date.now();
  const hits = (rateBucket.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (hits.length >= MAX_REQ) return true;
  hits.push(now);
  rateBucket.set(ip, hits);
  return false;
}

// ---- helpers -----------------------------------------------------------
const escape = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (s) =>
  typeof s === 'string' &&
  s.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const tooManyLinks = (s = '') => (String(s).match(/https?:\/\//gi) || []).length > 2;

// ---- handler -----------------------------------------------------------
module.exports = async (req, res) => {
  // CORS — restrict to your own domain in production
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  // IP for rate limiting
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'rate_limited' });
  }

  // Parse body (Vercel auto-parses JSON; fall back manually if needed)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const {
    name = '',
    company = '',
    email = '',
    phone = '',
    industry = '',
    message = '',
    consent = false,
    company_url = '',   // honeypot
    lang = 'en',
  } = body;

  // Honeypot: real users never fill this hidden field
  if (company_url) {
    // Pretend success so bots don't probe
    return res.status(200).json({ ok: true });
  }

  // Validation
  if (!name || String(name).trim().length < 2 || String(name).length > 120) {
    return res.status(400).json({ ok: false, error: 'invalid_name' });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }
  if (!message || String(message).trim().length < 10 || String(message).length > 5000) {
    return res.status(400).json({ ok: false, error: 'invalid_message' });
  }
  if (!consent) {
    return res.status(400).json({ ok: false, error: 'consent_required' });
  }
  if (tooManyLinks(message)) {
    return res.status(400).json({ ok: false, error: 'too_many_links' });
  }

  // Build email
  const notifyTo  = process.env.NOTIFICATION_EMAIL || 'info@techmirai-ai.com';
  const fromEmail = process.env.FROM_EMAIL || notifyTo;

  const submittedAt = new Date().toISOString();

  const adminSubject = `[TechMirai Lead] ${String(name).slice(0, 60)}${company ? ' / ' + String(company).slice(0, 60) : ''}`;

  const adminHtml = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1a1a1f;max-width:640px;">
      <h2 style="margin:0 0 16px;border-bottom:1px solid #e5e3dc;padding-bottom:8px;">New Strategy Audit Request</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:6px 0;color:#666;width:140px;">Name</td><td><strong>${escape(name)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666;">Company</td><td>${escape(company) || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Email</td><td><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#666;">Phone</td><td>${escape(phone) || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Industry</td><td>${escape(industry) || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Language</td><td>${escape(lang)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">IP</td><td>${escape(ip)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Submitted</td><td>${escape(submittedAt)}</td></tr>
      </table>
      <h3 style="margin:24px 0 8px;font-size:14px;color:#666;">Message</h3>
      <div style="background:#f7f4ee;padding:16px;border-left:3px solid #c8102e;white-space:pre-wrap;font-size:14px;line-height:1.6;">${escape(message)}</div>
      <p style="margin-top:24px;font-size:12px;color:#999;">Reply directly to this email to contact the prospect — the From address has been set to their address.</p>
    </div>
  `;

  const adminText = [
    'New Strategy Audit Request',
    '',
    `Name:     ${name}`,
    `Company:  ${company || '—'}`,
    `Email:    ${email}`,
    `Phone:    ${phone || '—'}`,
    `Industry: ${industry || '—'}`,
    `Language: ${lang}`,
    `IP:       ${ip}`,
    `At:       ${submittedAt}`,
    '',
    'Message:',
    message,
  ].join('\n');

  // Bilingual auto-reply to the prospect
  const isJa = lang === 'ja';
  const replySubject = isJa
    ? '【TechMirai AI】お問い合わせありがとうございます'
    : 'TechMirai AI — We received your message';

  const replyHtml = isJa ? `
    <div style="font-family:'Hiragino Kaku Gothic ProN',sans-serif;color:#1a1a1f;max-width:560px;line-height:1.8;">
      <p>${escape(name)} 様</p>
      <p>この度は TechMirai AI へお問い合わせいただき、誠にありがとうございます。</p>
      <p>担当者が内容を確認のうえ、<strong>24時間以内</strong>にご返信いたします。お急ぎの場合は <a href="mailto:info@techmirai-ai.com">info@techmirai-ai.com</a> まで直接ご連絡ください。</p>
      <p style="margin-top:32px;">――<br>Jamal Shah<br>TechMirai AI<br>埼玉県和光市</p>
    </div>
  ` : `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;color:#1a1a1f;max-width:560px;line-height:1.7;">
      <p>Hi ${escape(name)},</p>
      <p>Thanks for reaching out to TechMirai AI. We've received your message and will reply within <strong>24 hours</strong> with a concrete next step.</p>
      <p>In the meantime, if anything is urgent, just reply to this email directly.</p>
      <p style="margin-top:32px;">—<br>Jamal Shah<br>TechMirai AI<br>Wako-shi, Saitama, Japan</p>
    </div>
  `;

  // Send via SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 1) Notify business
    await transporter.sendMail({
      from: `"TechMirai Website" <${fromEmail}>`,
      to: notifyTo,
      replyTo: `"${String(name).replace(/"/g, '')}" <${email}>`,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });

    // 2) Auto-reply to prospect (best-effort; don't fail the request if this fails)
    try {
      await transporter.sendMail({
        from: `"TechMirai AI" <${fromEmail}>`,
        to: email,
        subject: replySubject,
        html: replyHtml,
      });
    } catch (e) {
      console.error('auto-reply failed:', e?.message);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact mail error:', err);
    return res.status(500).json({ ok: false, error: 'send_failed' });
  }
};
