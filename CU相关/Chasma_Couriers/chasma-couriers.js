(() => {
  const chapters = [
    { id: "chapter-15-olive-branch", file: "Chasma_Couriers_Chapter_15_Olive_branch.html", title: "Chapter 15: Olive branch" },
    { id: "chapter-16-coming-apart", file: "Chasma_Couriers_Chapter_16_Coming_apart.html", title: "Chapter 16: Coming apart" },
    { id: "chapter-17-borrowed-fur", file: "Chasma_Couriers_Chapter_17_Borrowed_fur.html", title: "Chapter 17: Borrowed fur" },
    { id: "chapter-18-bone-trees", file: "Chasma_Couriers_Chapter_18_Bone_trees.html", title: "Chapter 18: Bone trees" },
    { id: "chapter-19-far-from-home", file: "Chasma_Couriers_Chapter_19_Far_from_home.html", title: "Chapter 19: Far from home" }
  ];

  const root = document.documentElement;
  const body = document.body;
  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (_) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (_) {
        // Private browsing and file URLs may deny storage; the page still works.
      }
    }
  };

  const setTheme = (theme, persist = true) => {
    root.dataset.theme = theme;
    if (persist) storage.set("chasma-theme", theme);
  };

  const storedTheme = storage.get("chasma-theme");
  const preferredTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  setTheme(storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme, false);

  const storedFontSize = Number.parseFloat(storage.get("chasma-font-size") || "");
  const initialFontSize = Number.isFinite(storedFontSize)
    ? Math.min(1.4, Math.max(1, storedFontSize))
    : 1.14;
  root.style.setProperty("--reader-font-size", `${initialFontSize}rem`);

  const marker = document.getElementById("markdown-mermaid");
  const contentNodes = [...body.children].filter((node) => node !== marker && node.tagName !== "SCRIPT");
  const main = document.createElement("main");
  main.className = "reader-main";
  main.id = "reader-main";
  contentNodes.forEach((node) => main.append(node));
  marker?.remove();

  const heading = main.querySelector('h3[id^="chapter-"]');
  const currentIndex = chapters.findIndex((chapter) => chapter.id === heading?.id);
  const currentChapter = currentIndex >= 0 ? chapters[currentIndex] : null;
  const indexHref = currentIndex >= 0 ? "./" : "./Chasma_Couriers_Chapter_15_Olive_branch.html";

  const toolbar = document.createElement("header");
  toolbar.className = "reader-toolbar";
  toolbar.dataset.readerShell = "true";
  toolbar.innerHTML = `
    <div class="reader-toolbar__inner">
      <a class="reader-brand" href="${indexHref}" aria-label="Chasma Couriers chapter index">
        <span class="reader-brand__mark" aria-hidden="true">CC</span>
        <span>Chasma Couriers</span>
      </a>
      <div class="reader-toolbar__meta" aria-live="polite">
        <span>Original fiction by Mahlzeit</span>
        <span class="reader-toolbar__chapter">${currentChapter ? currentChapter.title : "Reading edition"}</span>
      </div>
      <div class="reader-toolbar__actions" aria-label="Reading controls">
        <button class="reader-button reader-button--font" type="button" data-action="font-down" aria-label="Decrease text size">A−</button>
        <button class="reader-button reader-button--font" type="button" data-action="font-up" aria-label="Increase text size">A+</button>
        <button class="reader-button reader-button--theme" type="button" data-action="theme" aria-pressed="false"></button>
      </div>
    </div>
    <div class="reader-progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="reader-progress__bar"></div>
    </div>
  `;

  const footer = document.createElement("footer");
  footer.className = "reader-footer";
  footer.innerHTML = `
    <p class="reader-footer__credit">Mahlzeit · AO3 reading edition · 转载仅为方便中国读者阅读</p>
    <nav class="chapter-nav" aria-label="Chapter navigation"></nav>
  `;

  const chapterNav = footer.querySelector(".chapter-nav");
  if (currentIndex >= 0) {
    const previous = chapters[currentIndex - 1];
    const next = chapters[currentIndex + 1];
    chapterNav.append(previous ? createChapterLink(previous, "Previous") : createDisabledLink("Previous"));
    chapterNav.append(next ? createChapterLink(next, "Next") : createDisabledLink("Next"));
  }
  if (currentIndex >= 0) main.append(footer);
  body.prepend(toolbar);
  body.append(main);

  const themeButton = toolbar.querySelector('[data-action="theme"]');
  const progress = toolbar.querySelector(".reader-progress");
  const progressBar = toolbar.querySelector(".reader-progress__bar");

  const updateThemeButton = () => {
    const isDark = root.dataset.theme === "dark";
    themeButton.textContent = isDark ? "Day" : "Night";
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.setAttribute("aria-label", isDark ? "Switch to day mode" : "Switch to night mode");
  };

  const updateProgress = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollableHeight > 0
      ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100))
      : 0;
    progressBar.style.width = `${percentage}%`;
    progress.setAttribute("aria-valuenow", String(Math.round(percentage)));
  };

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    if (button.dataset.action === "theme") {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark");
      updateThemeButton();
      return;
    }

    if (button.dataset.action === "font-down" || button.dataset.action === "font-up") {
      const currentSize = Number.parseFloat(getComputedStyle(root).getPropertyValue("--reader-font-size")) || initialFontSize;
      const delta = button.dataset.action === "font-up" ? 0.05 : -0.05;
      const nextSize = Math.min(1.4, Math.max(1, Number((currentSize + delta).toFixed(2))));
      root.style.setProperty("--reader-font-size", `${nextSize}rem`);
      storage.set("chasma-font-size", String(nextSize));
    }
  });

  updateThemeButton();
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });

  function createChapterLink(chapter, direction) {
    const link = document.createElement("a");
    link.href = chapter.file;
    link.innerHTML = `<span class="chapter-nav__direction">${direction}</span><span class="chapter-nav__title">${chapter.title}</span>`;
    return link;
  }

  function createDisabledLink(direction) {
    const label = document.createElement("span");
    label.className = "is-disabled";
    label.innerHTML = `<span class="chapter-nav__direction">${direction}</span><span class="chapter-nav__title">Start of the reading set</span>`;
    return label;
  }
})();
