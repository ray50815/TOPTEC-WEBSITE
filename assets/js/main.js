/* TOPTEC GLOBAL — site interactions: i18n, navigation, contact form, scroll reveal */

const translations = {};
const translationVersion = '20260212';
const translationSources = {
  'zh-Hant': `/locales/zh-Hant.json?v=${translationVersion}`
};
const translationRequests = {};

async function loadTranslations(lang) {
  const targetLang = lang === 'zh-Hant' ? 'zh-Hant' : 'en';
  if (targetLang === 'en') {
    return translations[targetLang] || {};
  }
  if (translations[targetLang]) {
    return translations[targetLang];
  }
  if (translationRequests[targetLang]) {
    return translationRequests[targetLang];
  }

  const source = translationSources[targetLang];
  if (!source) {
    return null;
  }

  translationRequests[targetLang] = fetch(source, { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${targetLang}`);
      }
      return response.json();
    })
    .then((data) => {
      translations[targetLang] = data || {};
      return translations[targetLang];
    })
    .catch((error) => {
      console.error('[i18n] Unable to load translations:', error);
      return null;
    })
    .finally(() => {
      translationRequests[targetLang] = null;
    });

  return translationRequests[targetLang];
}

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const nav = document.querySelector('nav.primary-nav');
  const toggle = document.querySelector('.mobile-toggle');
  const langButtons = document.querySelectorAll('.language-switcher button[data-lang]');
  const langToggle = document.querySelector('.language-switcher button[data-lang-toggle]');
  const htmlElement = document.documentElement;
  const currentPage = body.dataset.page;

  let formMessages = {};
  function updateFormMessages(lang) {
    const target = lang || body.dataset.lang || 'en';
    formMessages = {
      required: getTranslation(target, 'general.form.required') || 'Please fill out this field.',
      email: getTranslation(target, 'general.form.email') || 'Please enter a valid email address.',
      businessEmail: getTranslation(target, 'general.form.businessEmail') || 'Please use your business email address.',
      privacy: getTranslation(target, 'general.form.privacy') || 'Please agree to the Privacy Policy before submitting.',
      submitting: getTranslation(target, 'general.form.submitting') || 'Submitting...',
      success: getTranslation(target, 'general.form.success') || 'Your message has been sent. We will respond shortly.',
      error:
        getTranslation(target, 'general.form.error') ||
        'There was an issue submitting the form. Please try again or email us directly.'
    };
  }

  updateFormMessages(body.dataset.lang || 'en');

  const navLinks = nav ? nav.querySelectorAll('a[data-page]') : [];
  navLinks.forEach((link) => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
    }
  });

  /* === Mobile navigation =================================================== */
  if (toggle && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('menu-open');
      htmlElement.classList.remove('menu-open');
    };
    // Guard against stale menu state restored by mobile browser back/forward cache.
    closeMenu();
    body.style.top = '';

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (!expanded) {
        toggle.setAttribute('aria-expanded', 'true');
        nav.classList.add('open');
        body.classList.add('menu-open');
        htmlElement.classList.add('menu-open');
        nav.scrollTop = 0;
      } else {
        closeMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    const desktopQuery = window.matchMedia('(min-width: 1025px)');
    const handleDesktopChange = (event) => {
      if (event.matches) {
        closeMenu();
      }
    };
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', handleDesktopChange);
    } else {
      desktopQuery.addListener(handleDesktopChange);
    }

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    window.addEventListener('pageshow', () => {
      closeMenu();
    });
  }

  /* === Internationalization ================================================ */
  let i18nElements = [];
  let placeholderElements = [];

  const registerI18nElements = (root = document) => {
    const elements = Array.from(root.querySelectorAll('[data-i18n]'));
    if (!elements.length) {
      return;
    }
    elements.forEach((el) => {
      if (!el.dataset.i18nEn) {
        el.dataset.i18nEn = el.innerHTML.trim();
      }
    });
    i18nElements = Array.from(new Set([...i18nElements, ...elements]));
  };

  const registerPlaceholderElements = (root = document) => {
    const elements = Array.from(root.querySelectorAll('[data-i18n-placeholder]'));
    if (!elements.length) {
      return;
    }
    elements.forEach((el) => {
      if (!el.dataset.i18nPlaceholderEn) {
        el.dataset.i18nPlaceholderEn = el.getAttribute('placeholder') || '';
      }
    });
    placeholderElements = Array.from(new Set([...placeholderElements, ...elements]));
  };

  registerI18nElements(document);
  registerPlaceholderElements(document);

  const applyLazyLoading = () => {
    const candidates = document.querySelectorAll('img:not([loading])');
    candidates.forEach((img) => {
      const inHeader = img.closest('.site-header');
      const inHero = img.closest('.hero');
      if (img.getAttribute('fetchpriority') === 'high' || inHeader || inHero) {
        return;
      }
      img.loading = 'lazy';
      if (!img.getAttribute('decoding')) {
        img.decoding = 'async';
      }
    });
  };

  function getTranslation(lang, key) {
    if (!translations[lang]) {
      return undefined;
    }
    const parts = key.split('.');
    let value = translations[lang];
    for (const part of parts) {
      if (!value) {
        return undefined;
      }
      value = value[part];
    }
    return typeof value === 'string' ? value : undefined;
  }

  const updateLangToggle = (activeLang) => {
    if (!langToggle) return;
    const nextLang = activeLang === 'zh-Hant' ? 'en' : 'zh-Hant';
    langToggle.textContent = nextLang === 'zh-Hant' ? '繁中' : 'EN';
    langToggle.setAttribute('aria-label', nextLang === 'zh-Hant' ? '切換為繁體中文' : 'Switch to English');
    langToggle.dataset.targetLang = nextLang;
    langToggle.setAttribute('aria-pressed', activeLang === 'zh-Hant' ? 'true' : 'false');
  };

  async function setLanguage(lang) {
    const targetLang = lang === 'zh-Hant' ? 'zh-Hant' : 'en';
    let appliedLang = targetLang;

    if (targetLang !== 'en' && !translations[targetLang]) {
      try {
        const loaded = await loadTranslations(targetLang);
        if (!loaded) {
          appliedLang = 'en';
        }
      } catch (error) {
        console.error('[i18n] Failed to apply language, falling back to English:', error);
        appliedLang = 'en';
      }
    }

    htmlElement.setAttribute('lang', appliedLang === 'zh-Hant' ? 'zh-Hant' : 'en');
    body.dataset.lang = appliedLang;

    updateFormMessages(appliedLang);
    updateLangToggle(appliedLang);

    langButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === appliedLang);
      btn.setAttribute('aria-pressed', btn.dataset.lang === appliedLang ? 'true' : 'false');
    });

    i18nElements.forEach((el) => {
      const key = el.dataset.i18n;
      if (!key) return;
      if (appliedLang === 'en') {
        el.innerHTML = el.dataset.i18nEn || el.innerHTML;
      } else {
        const translated = getTranslation(appliedLang, key);
        el.innerHTML = translated || el.dataset.i18nEn || el.innerHTML;
      }
    });

    placeholderElements.forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (!key) return;
      if (appliedLang === 'en') {
        el.setAttribute('placeholder', el.dataset.i18nPlaceholderEn || '');
      } else {
        const translated = getTranslation(appliedLang, key);
        el.setAttribute('placeholder', translated || el.dataset.i18nPlaceholderEn || '');
      }
    });

    localStorage.setItem('toptec-lang', appliedLang);
  }

  const savedLang = localStorage.getItem('toptec-lang') || 'en';
  setLanguage(savedLang).catch((error) => console.error('[i18n] Failed to set initial language:', error));
  applyLazyLoading();

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const next = langToggle.dataset.targetLang || (body.dataset.lang === 'zh-Hant' ? 'en' : 'zh-Hant');
      setLanguage(next).catch((error) => console.error('[i18n] Failed to toggle language:', error));
    });
  }

  langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang || 'en';
      setLanguage(lang).catch((error) => console.error('[i18n] Failed to apply selected language:', error));
    });
  });

  /* === Contact form ======================================================== */
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    const formFields = contactForm.querySelectorAll('input[required], textarea[required]');
    const submitButton = contactForm.querySelector("button[type='submit']");
    const emailField = contactForm.querySelector('#email');
    const privacyCheckbox = contactForm.querySelector('#agree-privacy');
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'qq.com', '163.com', '126.com', 'protonmail.com', 'hey.com', 'msn.com', 'live.com', 'me.com', 'gmx.com'];

    const isFreeDomain = (address) => {
      const atIndex = address.indexOf('@');
      if (atIndex === -1) return false;
      const domain = address.slice(atIndex + 1).toLowerCase();
      return freeEmailDomains.some((freeDomain) => domain === freeDomain || domain.endsWith('.' + freeDomain));
    };

    const validateBusinessEmail = () => {
      if (!emailField) return;
      const value = emailField.value.trim().toLowerCase();
      if (value && isFreeDomain(value)) {
        emailField.setCustomValidity(formMessages.businessEmail);
      } else {
        emailField.setCustomValidity('');
      }
    };

    if (emailField) {
      emailField.addEventListener('input', validateBusinessEmail);
      emailField.addEventListener('blur', validateBusinessEmail);
    }

    if (privacyCheckbox) {
      privacyCheckbox.addEventListener('change', () => {
        privacyCheckbox.setCustomValidity('');
      });
    }

    formFields.forEach((field) => {
      field.addEventListener('input', () => {
        field.setCustomValidity('');
      });

      field.addEventListener('invalid', () => {
        if (field.validity.customError) return;
        let message = formMessages.required;
        if (field.type === 'email') {
          message = formMessages.email;
        } else if (privacyCheckbox && field === privacyCheckbox) {
          message = formMessages.privacy;
        }
        field.setCustomValidity(message);
      });
    });

    const statusMessage = contactForm.querySelector('.success-message');
    const showStatusMessage = (message, isError = false) => {
      if (!statusMessage) {
        return;
      }
      statusMessage.textContent = message;
      statusMessage.classList.add('show');
      statusMessage.classList.toggle('is-error', Boolean(isError));
      setTimeout(() => statusMessage.classList.remove('show'), 6000);
    };

    contactForm.addEventListener('submit', async (event) => {
      validateBusinessEmail();
      if (privacyCheckbox) {
        if (!privacyCheckbox.checked) {
          privacyCheckbox.setCustomValidity(formMessages.privacy);
        } else {
          privacyCheckbox.setCustomValidity('');
        }
      }

      if (!contactForm.checkValidity()) {
        event.preventDefault();
        contactForm.reportValidity();
        return;
      }

      event.preventDefault();
      if (submitButton) {
        submitButton.dataset.originalLabel = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = formMessages.submitting;
      }

      const formData = new FormData(contactForm);
      formData.append('form-name', contactForm.getAttribute('name') || 'contact');
      if (!formData.has('bot-field')) {
        formData.append('bot-field', '');
      }

      const encoded = new URLSearchParams();
      formData.forEach((value, key) => {
        if (typeof value === 'string') {
          encoded.append(key, value);
        }
      });

      try {
        const submissionTarget = contactForm.getAttribute('action') || '/';
        await fetch(submissionTarget, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encoded.toString()
        });
        contactForm.reset();
        formFields.forEach((field) => field.setCustomValidity(''));
        showStatusMessage(formMessages.success, false);
      } catch (error) {
        console.error('[contact-form] Submission failed:', error);
        showStatusMessage(formMessages.error, true);
      } finally {
        if (submitButton) {
          const resetText = submitButton.dataset.originalLabel || submitButton.textContent;
          setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = resetText;
          }, 600);
        }
      }
    });
  }

  /* === Scroll-reveal animation ============================================= */
  initScrollAnimations();

  function initScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animationGroups = [
      { selector: '.hero-content > *', stagger: 0.07 },
      { selector: '.hero-media', origin: 'right', startDelay: 0.15 },
      { selector: '.hero-stats .stat', startDelay: 0.2, stagger: 0.06 },
      { selector: '.section-title', startDelay: 0.05 },
      { selector: '.section-subtitle', startDelay: 0.1 },
      { selector: '.card-grid .card', stagger: 0.08 },
      { selector: '.split-grid > *', stagger: 0.1 },
      { selector: '.badge-list .badge', stagger: 0.04 },
      { selector: '.timeline .timeline-item', stagger: 0.08 },
      { selector: '.legal-card', stagger: 0.08 },
      { selector: '.contact-grid > *', stagger: 0.1 }
    ];

    const seen = new Set();
    const orderedElements = [];

    const registerElement = (element, options, index) => {
      if (!element) {
        return;
      }
      if (!seen.has(element)) {
        element.classList.add('animate-on-scroll');
        if (options.origin === 'right') {
          element.classList.add('animate-from-right');
        }
        seen.add(element);
        orderedElements.push(element);
      }

      if (!element.style.getPropertyValue('--animate-delay')) {
        let delay = options.startDelay || 0;
        if (typeof options.stagger === 'number') {
          delay += index * options.stagger;
        }
        if (delay > 0) {
          element.style.setProperty('--animate-delay', `${delay.toFixed(2)}s`);
        }
      }
    };

    animationGroups.forEach(({ selector, ...options }) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        registerElement(element, options, index);
      });
    });

    if (!orderedElements.length) {
      return;
    }

    if (prefersReducedMotion) {
      orderedElements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const isElementInViewport = (element) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= viewportHeight || rect.left >= viewportWidth) {
        return false;
      }

      const triggerOffset = Math.min(rect.height || 0, viewportHeight) * 0.2;
      return rect.top <= viewportHeight - triggerOffset;
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            intersectionObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    // Content already in view is shown immediately (no load flash); only
    // elements below the fold fade in as they are scrolled into view.
    body.classList.add('animations-enabled');
    window.requestAnimationFrame(() => {
      orderedElements.forEach((element) => {
        if (isElementInViewport(element)) {
          element.classList.remove('animate-on-scroll');
        } else {
          intersectionObserver.observe(element);
        }
      });
    });
  }
});
