const disabledLinks = document.querySelectorAll("[data-disabled-link]");

disabledLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
  });
});

const copyButton = document.querySelector("[data-copy-target]");

if (copyButton) {
  copyButton.addEventListener("click", async () => {
    const targetId = copyButton.getAttribute("data-copy-target");
    const target = document.getElementById(targetId);
    const label = copyButton.querySelector("[data-copy-label]");
    const text = target?.innerText.trim();

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      if (label) label.textContent = "Copied";
      setTimeout(() => {
        if (label) label.textContent = "Copy";
      }, 1600);
    } catch {
      if (label) label.textContent = "Select";
      target?.focus();
    }
  });
}
