/* ============================================================
   TechMirai AI — Main JS
   - Language toggle (EN/JP)
   - Mobile menu
   - Contact form submission
   - Scroll reveal animations
   ============================================================ */

(function () {
  'use strict';

  // ----- LANGUAGE TOGGLE -----
  const STORAGE_KEY = 'techmirai_lang';
  const html = document.documentElement;

  function getInitialLang() {
    // 1. URL param (?lang=ja)
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'ja' || urlLang === 'en') return urlLang;
    // 2. localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ja' || stored === 'en') return stored;
    // 3. Browser language
    const browser = (navigator.language || 'en').toLowerCase();
    if (browser.startsWith('ja')) return 'ja';
    return 'en';
  }

  function applyLang(lang) {
    if (!window.translations || !window.translations[lang]) {
      console.warn('Translations not loaded for', lang);
      return;
    }
    const dict = window.translations[lang];
    html.lang = lang === 'ja' ? 'ja' : 'en';
    html.dataset.lang = lang;

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        // Use innerHTML to allow inline tags (em, strong, br, a)
        el.innerHTML = dict[key];
      }
    });
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) {
        el.placeholder = dict[key];
      }
    });

    // Update toggle UI
    document.querySelectorAll('.lang-toggle__opt').forEach(function (opt) {
      opt.dataset.active = String(opt.dataset.langOpt === lang);
    });

    // Update document title for SEO
    if (lang === 'ja') {
      document.title = 'TechMirai AI — 24時間365日対応のボイス&チャットAIエージェント | 埼玉県和光市';
    } else {
      document.title = 'TechMirai AI — 24/7 Voice & Chat AI Agents for Japanese Businesses | Saitama';
    }

    localStorage.setItem(STORAGE_KEY, lang);
  }

  function initLangToggle() {
    const toggle = document.getElementById('langToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      const current = html.dataset.lang || 'en';
      const next = current === 'ja' ? 'en' : 'ja';
      applyLang(next);
    });
    // Per-option click for clarity
    document.querySelectorAll('.lang-toggle__opt').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        const target = opt.dataset.langOpt;
        if (target) applyLang(target);
      });
    });
  }

  // ----- MOBILE MENU -----
  function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const nav = document.querySelector('.topnav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ----- CONTACT FORM -----
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const lang = html.dataset.lang || 'en';

      // Basic client-side validation
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const consent = form.consent.checked;

      if (!name || !email) {
        showStatus(lang === 'ja' ? 'お名前とメールアドレスをご入力ください。' : 'Please provide your name and email.', 'error');
        return;
      }
      if (!consent) {
        showStatus(lang === 'ja' ? 'プライバシーポリシーへの同意が必要です。' : 'Please agree to the privacy policy.', 'error');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        showStatus(lang === 'ja' ? 'メールアドレスの形式が正しくありません。' : 'Please enter a valid email address.', 'error');
        return;
      }

      const data = {
        name: name,
        company: form.company.value.trim(),
        email: email,
        phone: form.phone.value.trim(),
        industry: form.industry.value,
        message: form.message.value.trim(),
        consent: consent,
        lang: lang,
        // Honeypot would go here in production
        submittedAt: new Date().toISOString()
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      showStatus(lang === 'ja' ? '送信中…' : 'Sending…', '');

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          showStatus(
            lang === 'ja'
              ? '送信完了しました。24営業時間以内にご返信いたします。'
              : 'Sent. We will respond within 24 business hours.',
            'success'
          );
          form.reset();
        } else {
          const err = await response.json().catch(function () { return {}; });
          showStatus(
            lang === 'ja'
              ? '送信に失敗しました: ' + (err.message || 'もう一度お試しください。')
              : 'Failed to send: ' + (err.message || 'Please try again.'),
            'error'
          );
        }
      } catch (err) {
        showStatus(
          lang === 'ja'
            ? 'ネットワークエラーが発生しました。直接 info@techmirai-ai.com までご連絡ください。'
            : 'Network error. Please email info@techmirai-ai.com directly.',
          'error'
        );
      } finally {
        submitBtn.disabled = false;
      }
    });

    function showStatus(text, type) {
      if (!status) return;
      status.textContent = text;
      status.className = 'form__status' + (type ? ' form__status--' + type : '');
    }
  }

  // ----- SCROLL REVEAL -----
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    const els = document.querySelectorAll(
      '.section-title, .section-lede, .killer, .feature, .plan, .qa, .pillar, .math-card, .founder, .form, .contact__info, .spec-table'
    );

    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.7s cubic-bezier(0.2, 0.7, 0.2, 1), transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1)';
    });

    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { obs.observe(el); });
  }

  // ----- INIT -----
  document.addEventListener('DOMContentLoaded', function () {
    applyLang(getInitialLang());
    initLangToggle();
    initMobileMenu();
    initContactForm();

    // Defer scroll reveal until after first paint
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initScrollReveal);
    } else {
      setTimeout(initScrollReveal, 200);
    }
  });

})();
