/* FeVOS project page — interactions
   - disabled links (kept from template)
   - copy BibTeX (kept, enhanced)
   - sticky nav glass state + scrollspy
   - reveal-on-scroll
   - hero stat count-up
   - back-to-top
*/
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- strip third-party injected widgets (e.g. the alphaXiv browser
         extension, which inserts a "View on alphaXiv" button next to any
         arXiv link). These nodes are NOT part of this page — they are added
         by the visitor's browser extension at runtime. We keep the hero
         button row to our own .btn-x links only, and remove any element that
         references alphaxiv anywhere on the page. ---- */
  (function stripInjectedWidgets() {
    const clean = () => {
      // hero button row must contain only our own .btn-x anchors
      const row = document.querySelector(".hero-x__links");
      if (row) {
        Array.prototype.slice.call(row.children).forEach((el) => {
          if (!(el.classList && el.classList.contains("btn-x"))) el.remove();
        });
      }
      // any link/badge that points at or names alphaXiv (e.g. a floating pill)
      document.querySelectorAll('a[href*="alphaxiv" i]').forEach((a) => {
        const box = a.closest("aside,div,span,section") || a;
        if (box !== document.body) box.remove();
      });
      document.querySelectorAll("body a, body button, body span, body div").forEach((el) => {
        if (el.children.length === 0 && /alpha\s*xiv/i.test(el.textContent || "")) {
          const box = el.closest("a,button,aside,div,span") || el;
          if (box !== document.body) box.remove();
        }
      });
    };

    clean();
    if ("MutationObserver" in window && document.body) {
      const mo = new MutationObserver(() => {
        mo.disconnect();
        clean();
        mo.observe(document.body, { childList: true, subtree: true });
      });
      mo.observe(document.body, { childList: true, subtree: true });
      // the extension injects shortly after load; stop watching after 20s
      setTimeout(() => mo.disconnect(), 20000);
    }
  })();

  /* ---- disabled links ---- */
  document.querySelectorAll("[data-disabled-link]").forEach((link) => {
    link.addEventListener("click", (e) => e.preventDefault());
  });

  /* ---- interactive case gallery ---- */
  (function caseGallery() {
    const player = document.getElementById("case-player");
    if (!player) return;
    const gif  = document.getElementById("case-gif");
    const qEl  = document.getElementById("case-q");
    const aEl  = document.getElementById("case-a");
    const tagEl= document.getElementById("case-tag");
    const tabs = Array.from(player.querySelectorAll(".case-tab"));

    const select = (tab) => {
      if (tab.classList.contains("is-active")) {
        // replay even if same tab
        const src = tab.getAttribute("data-gif");
        gif.src = ""; gif.src = src;
        return;
      }
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      // swap media (cache-bust to restart the GIF from frame 0)
      const src = tab.getAttribute("data-gif");
      gif.src = src + "?r=" + (gif.dataset.n = (parseInt(gif.dataset.n || "0", 10) + 1));
      // restart fade/slide animations
      gif.style.animation = "none"; void gif.offsetWidth; gif.style.animation = "";
      // update text
      qEl.textContent = tab.getAttribute("data-q");
      aEl.innerHTML = '<span class="case-a__chip">' + tab.getAttribute("data-a") + "</span>";
      tagEl.textContent = tab.getAttribute("data-type");
      qEl.style.animation = "none"; aEl.style.animation = "none";
      void qEl.offsetWidth;
      qEl.style.animation = ""; aEl.style.animation = "";
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const i = tabs.indexOf(tab);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); tabs[(i + 1) % tabs.length].click(); }
        if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); tabs[(i - 1 + tabs.length) % tabs.length].focus(); tabs[(i - 1 + tabs.length) % tabs.length].click(); }
      });
    });
  })();

  /* ---- copy BibTeX ---- */
  const copyButton = document.querySelector("[data-copy-target]");
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const target = document.getElementById(copyButton.getAttribute("data-copy-target"));
      const label = copyButton.querySelector("[data-copy-label]");
      const icon = copyButton.querySelector("i");
      const text = target && target.innerText.trim();
      if (!text) return;

      const flash = (msg, ok) => {
        if (label) label.textContent = msg;
        if (ok && icon) { icon.classList.remove("fa-copy"); icon.classList.add("fa-check"); }
        copyButton.classList.toggle("is-copied", !!ok);
        setTimeout(() => {
          if (label) label.textContent = "Copy";
          if (icon) { icon.classList.remove("fa-check"); icon.classList.add("fa-copy"); }
          copyButton.classList.remove("is-copied");
        }, 1600);
      };

      try {
        await navigator.clipboard.writeText(text);
        flash("Copied", true);
      } catch (_) {
        try {
          const r = document.createRange();
          r.selectNodeContents(target);
          const sel = window.getSelection();
          sel.removeAllRanges(); sel.addRange(r);
          document.execCommand("copy");
          sel.removeAllRanges();
          flash("Copied", true);
        } catch (_e) {
          flash("Select", false);
          target && target.focus();
        }
      }
    });
  }

  /* ---- sticky nav glass on scroll + back-to-top ---- */
  const nav = document.getElementById("site-nav");
  const toTop = document.getElementById("to-top");
  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("is-scrolled", y > 40);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  /* ---- scrollspy: highlight active nav link ---- */
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- reveal on scroll ---- */
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const revObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    reveals.forEach((el) => revObserver.observe(el));
  }

  /* ---- hero stat count-up ---- */
  const counters = Array.from(document.querySelectorAll("[data-count]"));
  const formatNum = (n, decimals) =>
    decimals
      ? n.toFixed(decimals)
      : Math.round(n).toLocaleString("en-US");

  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute("data-count"));
    const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    if (prefersReduced || isNaN(target)) {
      el.textContent = formatNum(target, decimals);
      return;
    }
    const duration = 1300;
    let start = null;
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      el.textContent = formatNum(target * ease(p), decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatNum(target, decimals);
    };
    requestAnimationFrame(step);
  };

  if (counters.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      const countObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => countObserver.observe(el));
    }
  }
})();
