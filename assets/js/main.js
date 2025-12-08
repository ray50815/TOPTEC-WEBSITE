const translations = {};
const translationSources = {
  'zh-Hant': '/locales/zh-Hant.json'
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

  translationRequests[targetLang] = fetch(source, { cache: 'force-cache' })
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

  if (toggle && nav) {
    const closeMenu = () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('menu-open');
    };

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      const nextState = !expanded;
      toggle.setAttribute('aria-expanded', String(nextState));
      nav.classList.toggle('open', nextState);
      body.classList.toggle('menu-open', nextState);
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
  }

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

    initCountUp({ reset: true });
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

  initIndustryFilters();

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    item.setAttribute('role', 'button');
    const answers = Array.from(item.querySelectorAll('p'));
    const indicator = item.querySelector("h4 span[aria-hidden=\"true\"]");

    const applyState = (isOpen) => {
      item.classList.toggle('open', isOpen);
      item.setAttribute('aria-expanded', String(isOpen));
      if (indicator) {
        indicator.textContent = isOpen ? '-' : '+';
      }
      answers.forEach((answer) => {
        answer.style.display = isOpen ? 'block' : 'none';
      });
    };

    applyState(false);

    item.addEventListener('click', () => {
      applyState(!item.classList.contains('open'));
    });

    item.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        applyState(!item.classList.contains('open'));
      }
    });
  });

  function showTestimonial(index) {
    testimonialSlides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === index);
    });
  }

  if (testimonialSlides.length > 0) {
    showTestimonial(testimonialIndex);

    prevBtn?.addEventListener('click', () => {
      testimonialIndex = (testimonialIndex - 1 + testimonialSlides.length) % testimonialSlides.length;
      showTestimonial(testimonialIndex);
    });

    nextBtn?.addEventListener('click', () => {
      testimonialIndex = (testimonialIndex + 1) % testimonialSlides.length;
      showTestimonial(testimonialIndex);
    });

    setInterval(() => {
      testimonialIndex = (testimonialIndex + 1) % testimonialSlides.length;
      showTestimonial(testimonialIndex);
    }, 8000);
  }

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
  initScrollAnimations();
  initCountUp();
  initHeroInteractions();
  initHeroSlider();

  function initHeroInteractions() {
    const hero = document.querySelector('.hero');
    if (!hero) {
      return;
    }

    const heroContainer = hero.querySelector('.container');
    if (!heroContainer) {
      return;
    }

    const heroMedia = hero.querySelector('.hero-media');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;

    const resetHeroState = () => {
      heroContainer.style.setProperty('--hero-tilt-x', '0deg');
      heroContainer.style.setProperty('--hero-tilt-y', '0deg');
      hero.style.setProperty('--hero-highlight-opacity', '0');
      hero.style.setProperty('--hero-highlight-x', '50%');
      hero.style.setProperty('--hero-highlight-y', '50%');
      if (heroMedia) {
        heroMedia.style.setProperty('--hero-parallax-x', '0px');
        heroMedia.style.setProperty('--hero-parallax-y', '0px');
      }
    };

    resetHeroState();

    hero.addEventListener('focusin', () => {
      hero.style.setProperty('--hero-highlight-opacity', '0.65');
    });

    hero.addEventListener('focusout', () => {
      resetHeroState();
    });

    let rafId;

    const applyHeroInteraction = (clientX, clientY) => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const rect = heroContainer.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }

        const relativeX = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
        const relativeY = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
        const tiltX = ((relativeY - 0.5) * -10).toFixed(2);
        const tiltY = ((relativeX - 0.5) * 10).toFixed(2);
        heroContainer.style.setProperty('--hero-tilt-x', `${tiltX}deg`);
        heroContainer.style.setProperty('--hero-tilt-y', `${tiltY}deg`);

        hero.style.setProperty('--hero-highlight-opacity', '0.9');
        hero.style.setProperty('--hero-highlight-x', `${(relativeX * 100).toFixed(2)}%`);
        hero.style.setProperty('--hero-highlight-y', `${(relativeY * 100).toFixed(2)}%`);

        if (heroMedia) {
          const parallaxX = ((relativeX - 0.5) * 26).toFixed(2);
          const parallaxY = ((relativeY - 0.5) * 26).toFixed(2);
          heroMedia.style.setProperty('--hero-parallax-x', `${parallaxX}px`);
          heroMedia.style.setProperty('--hero-parallax-y', `${parallaxY}px`);
        }
      });
    };

    const onPointerEnter = (event) => {
      applyHeroInteraction(event.clientX, event.clientY);
    };

    const onPointerMove = (event) => {
      applyHeroInteraction(event.clientX, event.clientY);
    };

    const onPointerLeave = () => {
      cancelAnimationFrame(rafId);
      resetHeroState();
    };

    const enablePointerEffects = () => {
      hero.addEventListener('pointerenter', onPointerEnter);
      hero.addEventListener('pointermove', onPointerMove);
      hero.addEventListener('pointerleave', onPointerLeave);
    };

    const disablePointerEffects = () => {
      hero.removeEventListener('pointerenter', onPointerEnter);
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
    };

    if (!prefersReducedMotion) {
      enablePointerEffects();
    }

    const handleMotionPreference = (event) => {
      prefersReducedMotion = event?.matches ?? motionQuery.matches;
      disablePointerEffects();
      resetHeroState();
      if (!prefersReducedMotion) {
        enablePointerEffects();
      }
    };

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleMotionPreference);
    } else {
      motionQuery.addListener(handleMotionPreference);
    }
  }

  function initHeroSlider() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('.hero-slide'));
    if (slides.length <= 1) return;

    let index = 0;
    const apply = (idx) => {
      slides.forEach((slide, i) => {
        const isActive = i === idx;
        slide.classList.toggle('active', isActive);
        slide.hidden = !isActive;
      });
    };

    apply(index);
    setInterval(() => {
      index = (index + 1) % slides.length;
      apply(index);
    }, 6000);
  }
  function initIndustryFilters() {
    const filterGroup = document.querySelector('[data-industry-filter-group]');
    const cards = Array.from(document.querySelectorAll('[data-industry-grid] .industry-card'));
    if (!filterGroup || !cards.length) {
      return;
    }
    const buttons = Array.from(filterGroup.querySelectorAll('[data-industry-filter]'));
    if (!buttons.length) {
      return;
    }
    const emptyState = document.querySelector('[data-industry-empty]');
    const grid = document.querySelector('[data-industry-grid]');

    const applyFilter = (filter) => {
      const normalized = (filter && filter.trim()) || 'all';
      buttons.forEach((btn) => {
        const isActive = (btn.dataset.industryFilter || 'all') === normalized;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });

      let visibleCount = 0;
      cards.forEach((card) => {
        const categories = (card.dataset.industry || '')
          .split(/\s+/)
          .map((item) => item.trim())
          .filter(Boolean);
        const shouldShow = normalized === 'all' || categories.includes(normalized);
        card.hidden = !shouldShow;
        if (shouldShow) {
          visibleCount += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visibleCount > 0;
      }
      if (grid) {
        grid.dataset.activeFilter = normalized;
      }
    };

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        applyFilter(button.dataset.industryFilter || 'all');
      });
    });

    filterGroup.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return;
      }
      event.preventDefault();
      const currentIndex = buttons.indexOf(document.activeElement);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = buttons.length - 1;
      }
      buttons[Math.max(0, nextIndex)]?.focus();
    });

    const defaultFilter =
      filterGroup.querySelector('.filter-chip.is-active')?.dataset.industryFilter || 'all';
    applyFilter(defaultFilter);
  }

  function initScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animationGroups = [
      { selector: '.hero-content > *', stagger: 0.08 },
      { selector: '.hero-media', origin: 'right', startDelay: 0.3 },
      { selector: '.hero-stats .stat', startDelay: 0.25, stagger: 0.08 },
      { selector: '.section-title', startDelay: 0.1 },
      { selector: '.section-subtitle', startDelay: 0.15 },
      { selector: '.card-grid .card', stagger: 0.12 },
      { selector: '.split-grid > *', stagger: 0.12 },
      { selector: '.badge-list .badge', stagger: 0.05 },
      { selector: '.timeline .timeline-item', stagger: 0.1 },
      { selector: '.industry-filter .filter-chip', stagger: 0.06 },
      { selector: '.industry-grid .industry-card', stagger: 0.12 },
      { selector: '.case-carousel .case-card', stagger: 0.12 },
      { selector: '.highlight-box', startDelay: 0.2 },
      { selector: '.process-steps .step', stagger: 0.08 },
      { selector: '.contact-grid > *', stagger: 0.12 },
      { selector: '.contact-details li', stagger: 0.06 },
      { selector: '.list-check li', stagger: 0.05 },
      { selector: '.faq-item', origin: 'scale', stagger: 0.1 },
      { selector: '.legal-card', origin: 'scale', stagger: 0.12 },
      { selector: '.testimonial-slide', stagger: 0.12 },
      { selector: '.hero-cta .btn', stagger: 0.08 }
    ];

    const seen = new Set();
    const orderedElements = [];

    const registerElement = (element, options, index) => {
      if (!element) {
        return;
      }
      if (!seen.has(element)) {
        element.classList.add('animate-on-scroll');
        if (options.origin === 'left') {
          element.classList.add('animate-from-left');
        } else if (options.origin === 'right') {
          element.classList.add('animate-from-right');
        } else if (options.origin === 'scale') {
          element.classList.add('animate-scale');
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
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    const isElementInViewport = (element) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= viewportHeight || rect.left >= viewportWidth) {
        return false;
      }

      const triggerOffset = Math.min(rect.height || 0, viewportHeight) * 0.25;
      return rect.top <= viewportHeight - triggerOffset;
    };

    window.requestAnimationFrame(() => {
      body.classList.add('animations-enabled');
      orderedElements.forEach((element) => {
        if (isElementInViewport(element)) {
          element.classList.add('is-visible');
        } else {
          intersectionObserver.observe(element);
        }
      });
    });
  }
  function initCountUp(options = {}) {
    const { reset = false } = options;
    const counters = document.querySelectorAll('[data-count-up]');
    if (!counters.length) {
      return;
    }

    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const counter = entry.target;
          if (counter.dataset.countAnimated === 'true' && !reset) {
            observer.unobserve(counter);
            return;
          }
          animateCounter(counter);
          observer.unobserve(counter);
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((counter) => {
      if (!counter.dataset.countOriginal) {
        counter.dataset.countOriginal = counter.textContent.trim();
      }
      if (reset) {
        counter.textContent = counter.dataset.countOriginal;
        counter.dataset.countAnimated = '';
      }
      observer.observe(counter);
    });

    function animateCounter(counter) {
      if (counter.dataset.countAnimated === 'true') {
        return;
      }
      const { value, prefix, suffix, decimals, duration } = resolveCounterConfig(counter);
      if (value === null || Number.isNaN(value)) {
        counter.dataset.countAnimated = 'true';
        return;
      }
      const totalDuration = duration > 0 ? duration : 1400;
      const startTime = performance.now();

      const render = (now) => {
        const progress = Math.min((now - startTime) / totalDuration, 1);
        const eased = easeOutQuad(progress);
        const currentValue = value * eased;
        counter.textContent = `${prefix}${formatNumber(currentValue, decimals)}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(render);
        } else {
          counter.textContent = `${prefix}${formatNumber(value, decimals)}${suffix}`;
          counter.dataset.countAnimated = 'true';
        }
      };

      requestAnimationFrame(render);
    }

    function resolveCounterConfig(counter) {
      let prefix = counter.dataset.countPrefix ?? '';
      let suffix = counter.dataset.countSuffix ?? '';
      const decimals = Number(counter.dataset.countDecimals ?? '0');
      const duration = Number(counter.dataset.countDuration ?? '1400');
      let value = counter.dataset.countValue ?? counter.dataset.countFinal;
      value = value !== undefined ? Number(value) : null;

      if (value === null || Number.isNaN(value)) {
        const original = counter.dataset.countOriginal || counter.textContent;
        const match = original.trim().match(/^([^\d-]*)([-\d.,]+)(.*)$/);
        if (match) {
          if (!prefix) {
            prefix = match[1];
          }
          if (!suffix) {
            suffix = match[3];
          }
          value = Number(match[2].replace(/,/g, ''));
          counter.dataset.countPrefix = prefix;
          counter.dataset.countSuffix = suffix;
          counter.dataset.countValue = String(value);
        }
      }

      if (Number.isNaN(value)) {
        value = null;
      }

      return { value, prefix, suffix, decimals, duration };
    }

    function formatNumber(number, decimals) {
      if (decimals > 0) {
        return number.toFixed(decimals);
      }
      return Math.round(number).toLocaleString();
    }
  }
});











