# TechMirai AI — Production Website

Bilingual (EN/JP) marketing site for TechMirai AI. Static HTML/CSS/JS frontend with a small Vercel serverless function for the contact form. No build step. Deployable to Vercel in under 10 minutes.

---

## File structure

```
techmirai/
├── index.html              # Main landing page (single long-scroll)
├── robots.txt              # AI-crawler-friendly per GEO guide
├── sitemap.xml             # With hreflang for EN/JA
├── llms.txt                # Plain-language summary for LLM crawlers
├── package.json            # Backend deps (nodemailer)
├── vercel.json             # Headers, caching, function runtime
├── .env.example            # Env var template — copy to .env.local
├── README.md               # This file
│
├── assets/
│   ├── styles.css          # Full design system, ~900 lines
│   ├── translations.js     # window.translations EN + JP dictionaries
│   ├── main.js             # Lang toggle, mobile menu, form, scroll reveal
│   └── favicon.svg
│
├── api/
│   └── contact.js          # Serverless contact form handler (SMTP)
│
└── legal/
    ├── tokutei.html        # 特定商取引法に基づく表記 (REQUIRED in Japan)
    ├── privacy.html        # Privacy policy (APPI compliant), bilingual
    └── terms.html          # Terms of service, bilingual
```

---

## Quick start — local development

The site is plain static HTML, so any local web server works:

```bash
# Option A: simple static serve (no contact form)
npx serve .

# Option B: with working contact form (requires SMTP env vars)
npm install
cp .env.example .env.local
# Fill in SMTP_* values in .env.local
npx vercel dev
```

Open `http://localhost:3000`. Append `?lang=ja` to test Japanese: `http://localhost:3000/?lang=ja`.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → New Project → Import the repo.
3. Framework preset: **Other** (no preset). Leave build command and output directory empty.
4. Add environment variables in **Project Settings → Environment Variables** — copy values from `.env.example`. At minimum you need:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
   - `FROM_EMAIL` (must be on a verified domain)
   - `NOTIFICATION_EMAIL` (where leads are sent — usually `info@techmirai-ai.com`)
   - `ALLOWED_ORIGIN` (your production URL, e.g. `https://techmirai-ai.com`)
5. Deploy. Vercel will give you a `*.vercel.app` URL.
6. Add your custom domain in **Project Settings → Domains**.

### SMTP provider recommendation

For lowest friction, use **[Resend](https://resend.com)**:
- Verify the `techmirai-ai.com` domain (DNS records take 5 minutes).
- Generate an API key.
- Set `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER=resend`, `SMTP_PASS=<your_api_key>`.

Free tier covers 3,000 emails/month — plenty for an inquiry form.

---

## How to update content

### Pricing, features, copy
- English copy lives directly in `index.html` (the default text inside elements with `data-i18n` attributes).
- Japanese copy lives in `assets/translations.js` under the `ja` key.
- After editing either, no build is needed — just refresh.

### Adding a new translatable string
1. Add the element in `index.html` with a `data-i18n="section.key"` attribute and English fallback content.
2. Add the same `section.key` to both `en` and `ja` blocks in `assets/translations.js`.

### Updating prices
Search `assets/translations.js` for `"4,900"` and `"19,800"` and update both EN and JP versions, plus the values in `index.html` if they appear hard-coded in the Schema.org JSON-LD blocks.

### Updating the Schema.org markup
The JSON-LD blocks in `index.html` (Organization, LocalBusiness, Service, FAQPage) are critical for GEO ranking. If you change founder bio, FAQ answers, or pricing, update the corresponding JSON-LD block inside `<script type="application/ld+json">` tags in the `<head>`.

---

## GEO / SEO checklist (verify before launch)

- [x] Schema.org `Organization`, `LocalBusiness`, `Service`, `FAQPage` JSON-LD in `index.html`
- [x] `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and friends
- [x] `llms.txt` exists with plain-language summary
- [x] `sitemap.xml` includes hreflang for EN and JA
- [x] FAQ answers are 2-3 sentences, direct, AI-extractable
- [x] Author bio (Jamal Shah) on the page with LinkedIn link (E-E-A-T signal)
- [x] Canonical URLs and OpenGraph tags on every page
- [x] Mobile-responsive
- [ ] **Page load < 1.0s** — verify with PageSpeed Insights after deploy
- [ ] **Google Business Profile** — set up at the Wako-shi address
- [ ] **LinkedIn presence** — post about TechMirai work weekly (per GEO guide step 4)
- [ ] **Real testimonials with photos** — get 1-2 before launch (Japanese trust signal)
- [ ] **Verify the LinkedIn URL** in the founder section (`#about`) once Jamal confirms the handle

---

## Pending decisions / things to fill in before launch

These are flagged because they need a human decision, real data, or follow-up that I couldn't make automatically:

1. **Founder title.** The source copy you provided says "Lead AI Engineer at Honda Research Institute Japan." I changed this throughout to "AI Engineer at Honda Research Institute Japan" because: (a) Japanese clients verify LinkedIn before hiring, and a mismatch destroys trust instantly; (b) under 景品表示法 (Act against Unjustifiable Premiums and Misleading Representations) overstating credentials on commercial copy is a real legal risk. **If your actual title at HRI-JP is different from "AI Engineer," update it in `index.html` (search "AI Engineer at Honda") and `assets/translations.js`.**

2. **Tokutei page address.** `legal/tokutei.html` currently lists "〒351-0114 埼玉県和光市" with a note that the full street address is disclosed on request. Japanese law technically allows this for sole proprietors operating from home, but if you have a registered business address you should put the full address here.

3. **Phone number.** The tokutei page also defers phone disclosure. If you get a business number (recommended — Japanese SMEs still call), put it in:
   - `legal/tokutei.html` (replace the "Disclosed upon request" line)
   - `index.html` contact section (`#contact` → `<address>` block)
   - The `Organization` JSON-LD block in `<head>` (add a `telephone` field)

4. **LinkedIn URL.** Currently `https://www.linkedin.com/in/jamalshah/` — confirm this is yours, or update.

5. **The izakaya scenario.** Labeled "Scenario:" in the copy (not "case study") so it's clearly illustrative. Once you have a real client, swap this for a real anonymized case study with a measured result.

6. **Pricing claims.** "+20-30% bookings recovered" and "+15% conversion lift" are labeled as illustrative ranges in the industries note. When you have real data, replace with measured numbers and source attribution.

7. **Bengali (BN) language.** Removed per your instruction. The copy now says JP/EN throughout. If you decide to add BN later, the translations system supports it — add a `bn` block to `translations.js`, add a third option to the language toggle in `index.html`, and uncomment any `bn` references.

---

## Adding a blog later

The current site is single-page. When you're ready for a blog:
1. Create `/blog/index.html` (post listing) and `/blog/post-slug.html` files.
2. Add `Article` JSON-LD with `author` = Jamal Shah on each post.
3. Add the new URLs to `sitemap.xml`.
4. Update the footer to include a Blog link (already in translations as `footer.c4` — just uncomment the link).

The GEO guide is explicit that posting on LinkedIn and getting external mentions matters more than blog volume — focus there first.

---

## Performance notes

- All CSS is in one file, no @import. Minimal critical CSS could be inlined later.
- No JS framework; ~7KB of vanilla JS total.
- Fonts are loaded from Google Fonts with `display=swap` and preconnect hints.
- Images: there are currently no raster images. If you add a founder photo or client logos, optimize them as WebP and use `loading="lazy"` (everything below the fold).

---

## Maintenance

- Review and update `llms.txt` whenever you change pricing or services.
- Review `tokutei.html` annually.
- Bump the `lastmod` date in `sitemap.xml` whenever you update the homepage substantively.

---

Built with care in Saitama. 🇯🇵
