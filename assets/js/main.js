/* TOPTEC GLOBAL — navigation, contact form, map consent, and legal-page reveal */

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const nav = document.querySelector('nav.primary-nav');
  const toggle = document.querySelector('.mobile-toggle');
  const htmlElement = document.documentElement;
  const currentPage = body.dataset.page;
  const isChinesePage = htmlElement.lang.toLowerCase().startsWith('zh');
  const pwaDisabled = document.querySelector('meta[name="toptec-pwa-enabled"]')?.content === 'false';

  // Production kill-switch builds set the meta value to false on every page.
  // Any fresh network navigation then removes prior Toptec registrations and
  // caches without touching storage owned by unrelated applications.
  if (pwaDisabled) {
    window.addEventListener('load', async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations
          .filter((registration) => registration.scope.startsWith(window.location.origin))
          .map((registration) => registration.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names
          .filter((name) => name.startsWith('toptec-'))
          .map((name) => caches.delete(name)));
      }
    }, { once: true });
  }

  const formMessages = isChinesePage
    ? {
        required: '請填寫此欄位。',
        select: '請選擇詢問類型。',
        email: '請輸入有效的電子郵件地址。',
        privacy: '請同意隱私權政策後再送出。',
        submitting: '送出中…',
        success: '您的訊息已送出，我們會儘快回覆。',
        offline: '目前沒有網路連線。請連線後再試、致電 +65 8965 6938，或來信 contact@toptec.com.sg；您填寫的資料已保留。',
        timeout: '連線逾時。請再試一次、致電 +65 8965 6938，或來信 contact@toptec.com.sg；您填寫的資料已保留。',
        httpError: '服務目前無法接收表單。請稍後再試、致電 +65 8965 6938，或來信 contact@toptec.com.sg；您填寫的資料已保留。',
        error: '表單未送出。請再試一次、致電 +65 8965 6938，或來信 contact@toptec.com.sg；您填寫的資料已保留。'
      }
    : {
        required: 'Please fill out this field.',
        select: 'Please select an enquiry type.',
        email: 'Please enter a valid email address.',
        privacy: 'Please agree to the Privacy Policy before submitting.',
        submitting: 'Submitting…',
        success: 'Your message has been sent. We will respond shortly.',
        offline: 'You are offline. Reconnect and try again, call +65 8965 6938, or email contact@toptec.com.sg; your entries have been kept.',
        timeout: 'The request timed out. Please try again, call +65 8965 6938, or email contact@toptec.com.sg; your entries have been kept.',
        httpError: 'The service could not accept the form right now. Please try again later, call +65 8965 6938, or email contact@toptec.com.sg; your entries have been kept.',
        error: 'The form was not sent. Please try again, call +65 8965 6938, or email contact@toptec.com.sg; your entries have been kept.'
      };

  const navLinks = nav ? nav.querySelectorAll('a[data-page]') : [];
  navLinks.forEach((link) => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* === Mobile navigation =================================================== */
  if (toggle && nav) {
    const desktopQuery = window.matchMedia('(min-width: 1025px)');
    const compactHeaderQuery = window.matchMedia('(max-width: 420px)');
    const languageSwitcher = document.querySelector('.site-header .language-switcher');
    const languageHome = languageSwitcher
      ? {
          parent: languageSwitcher.parentNode,
          nextSibling: languageSwitcher.nextSibling
        }
      : null;
    const backgroundRegions = Array.from(
      document.querySelectorAll('.skip-link, main, footer, .site-header .site-logo, .site-header .nav-actions')
    );
    const previousInertStates = new Map();
    let focusBeforeMenu = null;

    toggle.setAttribute('type', 'button');
    toggle.querySelectorAll('span').forEach((span) => span.setAttribute('aria-hidden', 'true'));

    const placeLanguageSwitcher = (useCompactLayout) => {
      if (!languageSwitcher || !languageHome) return;

      if (useCompactLayout) {
        if (languageSwitcher.parentNode !== nav) {
          nav.append(languageSwitcher);
        }
        languageSwitcher.classList.add('language-switcher--in-menu');
        return;
      }

      if (languageSwitcher.parentNode !== languageHome.parent) {
        languageHome.parent.insertBefore(languageSwitcher, languageHome.nextSibling);
      }
      languageSwitcher.classList.remove('language-switcher--in-menu');
    };

    placeLanguageSwitcher(compactHeaderQuery.matches);

    const isMenuOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const updateMenuLabel = () => {
      const label = isMenuOpen()
        ? (isChinesePage ? '關閉主選單' : 'Close main menu')
        : (isChinesePage ? '開啟主選單' : 'Open main menu');
      toggle.setAttribute('aria-label', label);
    };

    const setBackgroundInert = (shouldBeInert) => {
      backgroundRegions.forEach((region) => {
        if (shouldBeInert) {
          if (!previousInertStates.has(region)) {
            previousInertStates.set(region, Boolean(region.inert));
          }
          region.inert = true;
        } else if (previousInertStates.has(region)) {
          region.inert = previousInertStates.get(region);
          previousInertStates.delete(region);
        }
      });
    };

    const syncClosedMenuState = () => {
      nav.inert = !desktopQuery.matches;
      updateMenuLabel();
    };

    const closeMenu = ({ restoreFocus = false } = {}) => {
      const wasOpen = isMenuOpen();
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('menu-open');
      htmlElement.classList.remove('menu-open');
      setBackgroundInert(false);
      syncClosedMenuState();

      if (restoreFocus && wasOpen) {
        const focusTarget = focusBeforeMenu && focusBeforeMenu.isConnected ? focusBeforeMenu : toggle;
        focusTarget.focus({ preventScroll: true });
      }
      focusBeforeMenu = null;
    };

    const openMenu = () => {
      focusBeforeMenu = document.activeElement;
      nav.inert = false;
      nav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('menu-open');
      htmlElement.classList.add('menu-open');
      setBackgroundInert(true);
      nav.scrollTop = 0;
      updateMenuLabel();

      window.requestAnimationFrame(() => {
        const firstLink = nav.querySelector('a[href]:not([tabindex="-1"])');
        (firstLink || toggle).focus({ preventScroll: true });
      });
    };

    // Guard against stale menu state restored by mobile browser back/forward cache.
    closeMenu();

    toggle.addEventListener('click', () => {
      if (isMenuOpen()) {
        closeMenu({ restoreFocus: true });
      } else {
        openMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu({ restoreFocus: false });
      });
    });

    const handleDesktopChange = (event) => {
      if (event.matches) {
        closeMenu({ restoreFocus: false });
        nav.inert = false;
      } else if (!isMenuOpen()) {
        nav.inert = true;
      }
    };
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', handleDesktopChange);
    } else {
      desktopQuery.addListener(handleDesktopChange);
    }

    const handleCompactHeaderChange = (event) => {
      const menuWasOpen = isMenuOpen();
      placeLanguageSwitcher(event.matches);
      if (menuWasOpen) {
        closeMenu({ restoreFocus: true });
      }
    };
    if (compactHeaderQuery.addEventListener) {
      compactHeaderQuery.addEventListener('change', handleCompactHeaderChange);
    } else {
      compactHeaderQuery.addListener(handleCompactHeaderChange);
    }

    document.addEventListener('keydown', (event) => {
      if (!isMenuOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
        return;
      }

      if (event.key === 'Tab') {
        const focusable = [toggle, ...nav.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
          .filter((element) => !element.hidden && !element.inert && !element.closest('[inert]'));
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener('pageshow', () => {
      closeMenu({ restoreFocus: false });
    });
  }

  /* === Contact form ======================================================== */
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    const requiredFields = contactForm.querySelectorAll('input[required], textarea[required], select[required]');
    const submitButton = contactForm.querySelector("button[type='submit']");
    const privacyCheckbox = contactForm.querySelector('#agree-privacy');
    const successStatus = contactForm.querySelector('[data-form-status="success"]');
    const errorStatus = contactForm.querySelector('[data-form-status="error"]');
    const submitLabel = submitButton ? submitButton.textContent.trim() : '';
    let isSubmitting = false;

    // Page CTAs link to /contact?inquiry=<value>#contact-form. Only a value that
    // matches an existing option is applied; anything else is ignored, and the
    // form works unchanged without JavaScript.
    const inquirySelect = contactForm.querySelector('select[name="inquiry_type"]');
    const requestedInquiry = new URLSearchParams(window.location.search).get('inquiry');
    if (inquirySelect && requestedInquiry) {
      const match = Array.from(inquirySelect.options)
        .find((option) => option.value && option.value === requestedInquiry);
      if (match) inquirySelect.value = match.value;
    }

    if (privacyCheckbox) {
      privacyCheckbox.addEventListener('change', () => {
        privacyCheckbox.setCustomValidity('');
      });
    }

    requiredFields.forEach((field) => {
      field.addEventListener('input', () => {
        field.setCustomValidity('');
      });
      field.addEventListener('change', () => {
        field.setCustomValidity('');
      });

      field.addEventListener('invalid', () => {
        if (field.validity.customError) return;
        let message = formMessages.required;
        if (field.tagName === 'SELECT') {
          message = formMessages.select;
        } else if (!field.validity.valueMissing && field.type === 'email') {
          message = formMessages.email;
        } else if (privacyCheckbox && field === privacyCheckbox) {
          message = formMessages.privacy;
        }
        field.setCustomValidity(message);
      });
    });

    const clearStatuses = () => {
      [successStatus, errorStatus].forEach((status) => {
        if (!status) return;
        status.hidden = true;
        status.textContent = '';
      });
    };

    const showStatus = (status, message) => {
      clearStatuses();
      if (!status) return;
      status.textContent = message;
      status.hidden = false;
    };

    // Older browsers retain the form's native POST action as a no-JavaScript
    // fallback instead of attempting an incomplete Ajax enhancement.
    if ('fetch' in window && 'AbortController' in window) {
      contactForm.addEventListener('submit', async (event) => {
        if (isSubmitting) {
          event.preventDefault();
          return;
        }

        if (privacyCheckbox) {
          privacyCheckbox.setCustomValidity(privacyCheckbox.checked ? '' : formMessages.privacy);
        }

        if (!contactForm.checkValidity()) {
          event.preventDefault();
          contactForm.reportValidity();
          return;
        }

        event.preventDefault();
        clearStatuses();

        if (navigator.onLine === false) {
          showStatus(errorStatus, formMessages.offline);
          return;
        }

        isSubmitting = true;
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.setAttribute('aria-disabled', 'true');
          submitButton.textContent = formMessages.submitting;
        }

        const formData = new FormData(contactForm);
        formData.set('form-name', contactForm.getAttribute('name') || 'contact');
        if (!formData.has('bot-field')) {
          formData.set('bot-field', '');
        }

        const encoded = new URLSearchParams();
        formData.forEach((value, key) => {
          if (typeof value === 'string') {
            encoded.append(key, value);
          }
        });

        const controller = new AbortController();
        let timedOut = false;
        const timeoutId = window.setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, 12000);

        try {
          const submissionTarget = contactForm.getAttribute('action') || '/';
          const response = await fetch(submissionTarget, {
            method: 'POST',
            credentials: 'same-origin',
            redirect: 'follow',
            headers: {
              Accept: 'text/html,application/xhtml+xml',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: encoded.toString(),
            signal: controller.signal
          });

          if (!response.ok) {
            const httpError = new Error(`Form submission returned HTTP ${response.status}`);
            httpError.name = 'FormHttpError';
            throw httpError;
          }

          contactForm.reset();
          requiredFields.forEach((field) => field.setCustomValidity(''));
          showStatus(successStatus, formMessages.success);
          // Move focus to the confirmation so keyboard and screen-reader users
          // are not left on a reset form.
          successStatus?.focus({ preventScroll: false });
        } catch (error) {
          let message = formMessages.error;
          if (navigator.onLine === false) {
            message = formMessages.offline;
          } else if (timedOut || error.name === 'AbortError') {
            message = formMessages.timeout;
          } else if (error.name === 'FormHttpError') {
            message = formMessages.httpError;
          }
          showStatus(errorStatus, message);
          console.warn('[contact-form] Submission was not completed.', error.name);
        } finally {
          window.clearTimeout(timeoutId);
          isSubmitting = false;
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute('aria-disabled');
            submitButton.textContent = submitLabel;
          }
        }
      });
    }
  }

  /* === Privacy-preserving map loader ====================================== */
  document.querySelectorAll('[data-map-consent]').forEach((mapConsent) => {
    const loadButton = mapConsent.querySelector('[data-map-load]');
    const embedUrl = mapConsent.dataset.mapEmbedUrl;
    if (!loadButton || !embedUrl) return;

    loadButton.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.title = isChinesePage ? 'TOPTEC Global 新加坡登記地址位置' : 'TOPTEC Global Singapore registered office location';
      iframe.src = embedUrl;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer';
      iframe.allowFullscreen = true;
      mapConsent.replaceWith(iframe);
    }, { once: true });
  });

  /* === Scroll-reveal animation ============================================= */
  initScrollAnimations();

  function initScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Only the legal cards use the reveal. Energy pages are intentionally
    // static so the hero LCP and layout stay stable.
    const animationGroups = [
      { selector: '.legal-card', stagger: 0.08 }
    ];

    const seen = new Set();
    const orderedElements = [];

    const registerElement = (element, options, index) => {
      if (!element) {
        return;
      }
      if (!seen.has(element)) {
        element.classList.add('animate-on-scroll');
        seen.add(element);
        orderedElements.push(element);
      }

      const hasDelayClass = Array.from(element.classList).some((className) => className.startsWith('animate-delay-'));
      if (!hasDelayClass) {
        let delay = options.startDelay || 0;
        if (typeof options.stagger === 'number') {
          delay += index * options.stagger;
        }
        if (delay > 0) {
          const delayStep = Math.min(8, Math.max(1, Math.round(delay / 0.08)));
          element.classList.add(`animate-delay-${delayStep}`);
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
