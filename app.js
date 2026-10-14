(() => {
  "use strict";

  const body = document.body;
  const themeButton = document.getElementById("theme-toggle");
  const menuButton = document.getElementById("menu-toggle");
  const navigation = document.getElementById("main-nav");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projectCards = Array.from(document.querySelectorAll("[data-category]"));
  const copyButton = document.getElementById("copy-email");
  const copyFeedback = document.getElementById("copy-feedback");
  const year = document.getElementById("year");

  if (year) year.textContent = new Date().getFullYear().toString();

  function applyTheme(theme) {
    if (theme === "light") {
      body.dataset.theme = "light";
      themeButton?.setAttribute("aria-label", "Switch to dark theme");
      themeButton?.setAttribute("title", "Switch to dark theme");
    } else {
      delete body.dataset.theme;
      themeButton?.setAttribute("aria-label", "Switch to light theme");
      themeButton?.setAttribute("title", "Switch to light theme");
    }
  }

  try {
    applyTheme(localStorage.getItem("alex-portfolio-theme") === "light" ? "light" : "dark");
  } catch {
    applyTheme("dark");
  }

  themeButton?.addEventListener("click", () => {
    const newTheme = body.dataset.theme === "light" ? "dark" : "light";
    applyTheme(newTheme);
    try {
      localStorage.setItem("alex-portfolio-theme", newTheme);
    } catch {
      // Keep the theme usable when storage is blocked.
    }
  });

  function closeMenu() {
    if (!menuButton || !navigation) return;
    navigation.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  }

  menuButton?.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  navigation?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", event => {
    if (!navigation?.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) closeMenu();
  });

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const selection = button.dataset.filter;
      filterButtons.forEach(other => {
        const active = other === button;
        other.classList.toggle("is-active", active);
        other.setAttribute("aria-pressed", String(active));
      });
      projectCards.forEach(card => {
        card.hidden = selection !== "all" && card.dataset.category !== selection;
      });
    });
  });

  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("alexvenmil@gmail.com");
      copyFeedback.textContent = "Email copied!";
    } catch {
      copyFeedback.textContent = "Copy the email address shown above.";
    }
  });
})();
