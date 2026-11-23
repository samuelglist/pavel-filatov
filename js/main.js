/* ==========================================================================
   Павел Филатов — портфолио. Основной сценарий.
   Без библиотек и сборки: навигация, плавная прокрутка, лайтбокс,
   анимации появления и валидация формы.
   ========================================================================== */

(() => {
  "use strict";

  const doc = document;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------------
     Шапка: фон при прокрутке
     ------------------------------------------------------------------------ */

  const header = doc.getElementById("site-header");
  const setHeaderState = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 18);
  };
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  /* ------------------------------------------------------------------------
     Мобильное меню
     ------------------------------------------------------------------------ */

  const nav = doc.getElementById("primary-nav");
  const navToggle = doc.querySelector(".nav-toggle");

  const closeNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Открыть меню");
    doc.body.classList.remove("nav-open");
  };

  const openNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Закрыть меню");
    doc.body.classList.add("nav-open");
  };

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeNav();
      else openNav();
    });
  }

  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  doc.addEventListener("click", (event) => {
    if (!nav || !nav.classList.contains("is-open")) return;
    if (nav.contains(event.target) || navToggle.contains(event.target)) return;
    closeNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) closeNav();
  });

  /* ------------------------------------------------------------------------
     Плавная прокрутка по якорям
     ------------------------------------------------------------------------ */

  const headerOffset = () => {
    const styles = getComputedStyle(doc.documentElement);
    const scrollPadding = parseFloat(styles.scrollPaddingTop) || 0;
    return scrollPadding || 84;
  };

  const scrollToTarget = (target) => {
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset() + 2;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  };

  doc.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#" || hash.length < 2) return;

      const target = doc.getElementById(hash.slice(1));
      if (!target) return;

      event.preventDefault();
      closeNav();
      scrollToTarget(target);

      if (history.pushState) {
        history.pushState(null, "", hash);
      } else {
        window.location.hash = hash;
      }

      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
      window.setTimeout(() => target.focus({ preventScroll: true }), 420);
    });
  });

  /* ------------------------------------------------------------------------
     Активный пункт меню
     ------------------------------------------------------------------------ */

  const navLinks = Array.from(doc.querySelectorAll(".nav-link"));
  const sections = navLinks
    .map((link) => doc.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  let activeFrame = null;

  const updateActiveLink = () => {
    activeFrame = null;
    const probe = headerOffset() + 90;
    let current = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= probe) current = section;
    });

    if (window.innerHeight + window.scrollY >= doc.body.offsetHeight - 4) {
      current = sections[sections.length - 1];
    }

    navLinks.forEach((link) => {
      const isActive = current && link.getAttribute("href") === `#${current.id}`;
      link.classList.toggle("is-active", Boolean(isActive));
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  const requestActiveUpdate = () => {
    if (activeFrame) return;
    activeFrame = requestAnimationFrame(updateActiveLink);
  };

  updateActiveLink();
  window.addEventListener("scroll", requestActiveUpdate, { passive: true });
  window.addEventListener("resize", requestActiveUpdate);

  /* ------------------------------------------------------------------------
     Появление блоков
     ------------------------------------------------------------------------ */

  const revealItems = Array.from(doc.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${(index % 4) * 70}ms`;
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------------
     Лайтбокс для галереи
     ------------------------------------------------------------------------ */

  const lightbox = doc.getElementById("lightbox");

  if (lightbox && typeof lightbox.showModal === "function") {
    const lightboxImage = lightbox.querySelector("img");
    const closeButton = lightbox.querySelector(".lightbox-close");
    let lastFocused = null;

    doc.querySelectorAll(".project-media").forEach((button) => {
      button.addEventListener("click", () => {
        const full = button.getAttribute("data-full");
        const thumb = button.querySelector("img");
        if (!full || !lightboxImage) return;

        lastFocused = doc.activeElement;
        lightboxImage.src = full;
        lightboxImage.alt = thumb ? thumb.alt : "Изображение проекта";
        lightbox.showModal();
        doc.body.classList.add("nav-open");
        if (closeButton) closeButton.focus();
      });
    });

    const closeLightbox = () => {
      if (lightbox.open) lightbox.close();
    };

    if (closeButton) closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    lightbox.addEventListener("close", () => {
      doc.body.classList.remove("nav-open");
      if (lightboxImage) {
        lightboxImage.src = "";
        lightboxImage.alt = "";
      }
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Форма обратной связи
     ------------------------------------------------------------------------ */

  const form = doc.getElementById("contact-form");

  if (form) {
    const status = doc.getElementById("form-status");
    const fields = {
      name: form.elements.namedItem("name"),
      email: form.elements.namedItem("email"),
      message: form.elements.namedItem("message"),
    };

    const rules = {
      name: (value) => {
        if (!value.trim()) return "Укажите имя — так проще начать разговор.";
        if (value.trim().length < 2) return "Имя должно содержать хотя бы 2 символа.";
        return "";
      },
      email: (value) => {
        if (!value.trim()) return "Укажите email для ответа.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "Нужен адрес вида name@example.ru — с символом @ и точкой в домене.";
        }
        return "";
      },
      message: (value) => {
        if (!value.trim()) return "Напишите пару слов о задаче.";
        if (value.trim().length < 10) return "Сообщение слишком короткое — минимум 10 символов.";
        return "";
      },
    };

    const setFieldState = (name, message) => {
      const field = fields[name];
      if (!field) return;
      const error = doc.getElementById(`${name}-error`);
      if (message) {
        field.setAttribute("aria-invalid", "true");
        if (error) error.textContent = message;
      } else {
        field.removeAttribute("aria-invalid");
        if (error) error.textContent = "";
      }
    };

    const validateField = (name) => {
      const field = fields[name];
      if (!field) return true;
      const message = rules[name](field.value);
      setFieldState(name, message);
      return !message;
    };

    Object.keys(fields).forEach((name) => {
      const field = fields[name];
      if (!field) return;
      field.addEventListener("blur", () => validateField(name));
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(name);
      });
    });

    const setStatus = (message, type) => {
      if (!status) return;
      status.textContent = message;
      status.className = `form-status ${type ? `is-${type}` : ""}`;
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const results = Object.keys(fields).map((name) => validateField(name));
      const isValid = results.every(Boolean);

      if (!isValid) {
        setStatus("Проверьте выделенные поля: в них есть неточности.", "error");
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const name = fields.name.value.trim();
      setStatus(
        `Спасибо, ${name}! Проверка пройдена. Это демонстрационная форма: сообщение не отправлено на сервер.`,
        "success"
      );
      form.reset();
      Object.keys(fields).forEach((fieldName) => setFieldState(fieldName, ""));
    });
  }
})();
