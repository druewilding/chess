// The light or dark theme. Auto follows the system setting; Light and Dark choose
// one. klods-css does the work: data-theme="light" or "dark" on <html> forces a
// theme, and with none it follows the system.
//
// This is a plain script in <head>, not a module, so the saved theme is set
// before the page is drawn and never flashes the wrong colours. It also wires
// up the footer's theme radio buttons (name="theme") once the page has loaded.

(() => {
  const STORAGE_KEY = "chess-theme";
  const CHOICES = ["auto", "light", "dark"];

  function savedChoice() {
    try {
      const choice = localStorage.getItem(STORAGE_KEY);
      return CHOICES.includes(choice) ? choice : "auto";
    } catch {
      return "auto"; // No storage: follow the system
    }
  }

  function apply(choice) {
    if (choice === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = choice;
    for (const radio of document.querySelectorAll("input[name=theme]")) {
      radio.checked = radio.value === choice;
    }
  }

  apply(savedChoice());

  document.addEventListener("DOMContentLoaded", () => {
    apply(savedChoice());
    for (const radio of document.querySelectorAll("input[name=theme]")) {
      radio.addEventListener("change", () => {
        const choice = radio.value;
        try {
          if (choice === "auto") localStorage.removeItem(STORAGE_KEY);
          else localStorage.setItem(STORAGE_KEY, choice);
        } catch {
          // Storage is full or blocked: the theme still changes for this page
        }
        apply(choice);
      });
    }
  });
})();
