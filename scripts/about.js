// Duty: render personal About page with bilingual JSON content.
// Keeps personal narrative separate from CV/PDF output.
import { setMultilineText } from "./text.js";

const contentMap = {
  en: "../content/about/en.json",
  de: "../content/about/de.json",
};

const contentBaseDirMap = {
  en: "../content/about",
  de: "../content/about",
};

const state = {
  lang: localStorage.getItem("lang") || "en",
  content: null,
  activeSectionKey: null,
};

const elements = {
  brandName: document.getElementById("brandName"),
  langEn: document.getElementById("langEn"),
  langDe: document.getElementById("langDe"),
  aboutTab: document.getElementById("aboutTab"),
  profilePhoto: document.getElementById("aboutProfilePhoto"),
  name: document.getElementById("aboutName"),
  headline: document.getElementById("aboutHeadline"),
  location: document.getElementById("aboutLocation"),
  title: document.getElementById("aboutTitle"),
  intro: document.getElementById("aboutIntro"),
  sections: document.getElementById("aboutSections"),
  footer: document.getElementById("aboutFooter"),
  railList: document.getElementById("aboutRailList"),
};

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

function setLanguageButtonState() {
  elements.langEn.classList.toggle("active", state.lang === "en");
  elements.langDe.classList.toggle("active", state.lang === "de");
}

function createSectionBlock(section) {
  const block = document.createElement("article");
  block.className = "timeline-item";
  block.id = section.id;
  block.dataset.sectionKey = section.id;

  const title = document.createElement("h3");
  title.textContent = section.title;
  block.appendChild(title);

  const body = Array.isArray(section.body) ? section.body : [];
  body.forEach((paragraphText) => {
    const paragraph = document.createElement("p");
    setMultilineText(paragraph, paragraphText);
    block.appendChild(paragraph);
  });

  const contentBlocks = Array.isArray(section.content) ? section.content : [];
  contentBlocks.forEach((contentBlock) => {
    if (!contentBlock || typeof contentBlock !== "object") {
      return;
    }

    const type = (contentBlock.type || "").toLowerCase();
    if (type !== "images" && type !== "image") {
      return;
    }

    const items = Array.isArray(contentBlock.items)
      ? contentBlock.items
      : Array.isArray(contentBlock.images)
        ? contentBlock.images
        : [];

    if (!items.length) {
      return;
    }

    const imageWrap = document.createElement("div");
    imageWrap.className = "modal-images";

    items.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }

      const img = document.createElement("img");
      img.src = resolveSectionMediaPath(item.src);
      img.alt = item.alt || section.title || "About image";
      imageWrap.appendChild(img);
    });

    block.appendChild(imageWrap);
  });

  return block;
}

function resolveSectionMediaPath(path) {
  if (typeof path !== "string" || path.length === 0) {
    return path;
  }

  // About page lives in /pages, so project-root style paths need one level up.
  if (path.startsWith("assets/") || path.startsWith("content/")) {
    return `../${path}`;
  }

  if (
    path.startsWith("/") ||
    path.startsWith("../") ||
    path.startsWith("./") ||
    /^[a-z]+:\/\//i.test(path)
  ) {
    return path;
  }

  const baseDir = contentBaseDirMap[state.lang] || "../content/about";
  return `${baseDir}/${path}`;
}

function appendRailButton(key, label, arrowGlyph = null) {
  const item = document.createElement("li");
  const button = document.createElement("button");
  const isEdgeAction = key === "__top__" || key === "__bottom__";

  button.type = "button";
  button.className = "rail-link";
  if (isEdgeAction) {
    button.classList.add("rail-link-edge");
  }
  button.dataset.sectionKey = key;
  button.setAttribute("aria-label", label);

  if (isEdgeAction) {
    const glyph = document.createElement("span");
    glyph.className = "rail-glyph";
    glyph.textContent = arrowGlyph || (key === "__top__" ? "↑" : "↓");
    button.appendChild(glyph);
  } else {
    const dot = document.createElement("span");
    dot.className = "rail-dot";
    button.appendChild(dot);
  }

  const labelTag = document.createElement("span");
  labelTag.className = "rail-label";
  labelTag.textContent = label;
  button.appendChild(labelTag);

  item.appendChild(button);
  elements.railList.appendChild(item);
}

function renderRail(sections, labels) {
  elements.railList.innerHTML = "";

  appendRailButton("__top__", labels.railTop || "Top", "↑");
  sections.forEach((section) => appendRailButton(section.id, section.title));
  appendRailButton("__bottom__", labels.railBottom || "Bottom", "↓");
}

function updateRailActiveState() {
  const railButtons = elements.railList.querySelectorAll(".rail-link");
  railButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sectionKey === state.activeSectionKey);
  });
}

function scrollToSection(sectionKey) {
  if (sectionKey === "__top__") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (sectionKey === "__bottom__") {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    return;
  }

  const panel = elements.sections.querySelector(`[data-section-key="${sectionKey}"]`);
  if (!panel) {
    return;
  }
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupSectionObserver() {
  const sectionPanels = Array.from(elements.sections.querySelectorAll("[data-section-key]"));

  if (typeof IntersectionObserver === "undefined") {
    state.activeSectionKey = sectionPanels[0]?.dataset.sectionKey || null;
    updateRailActiveState();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          state.activeSectionKey = entry.target.dataset.sectionKey || null;
          updateRailActiveState();
        }
      });
    },
    { root: null, rootMargin: "-35% 0px -45% 0px", threshold: 0 }
  );

  sectionPanels.forEach((panel) => observer.observe(panel));
}

function applyContent(data) {
  state.content = data;

  document.documentElement.lang = state.lang;
  document.title = data.pageTitle || "Saeed Amiri | About Me";

  elements.brandName.textContent = data.profile?.name || "Saeed Amiri";
  elements.name.textContent = data.profile?.name || "Saeed Amiri";
  elements.headline.textContent = data.profile?.headline || "";
  elements.location.textContent = data.profile?.location || "";
  elements.profilePhoto.src = resolveSectionMediaPath(data.profile?.photo || "../assets/profile-placeholder.svg");
  elements.profilePhoto.alt = data.profile?.photoAlt || "Profile photo";

  elements.aboutTab.textContent = data.tabLabel || "About Me";
  elements.title.textContent = data.title || "About Me";
  setMultilineText(elements.intro, data.intro || "");

  elements.sections.innerHTML = "";
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const timeline = document.createElement("div");
  timeline.className = "timeline";

  sections.forEach((section) => {
    timeline.appendChild(createSectionBlock(section));
  });

  elements.sections.appendChild(timeline);
  renderRail(sections, data.labels || {});
  setupSectionObserver();
  updateRailActiveState();

  elements.footer.id = "aboutFooter";
  elements.footer.textContent = data.footer || "";
}

async function render(lang) {
  state.lang = lang;
  localStorage.setItem("lang", lang);
  setLanguageButtonState();

  const path = contentMap[lang] || contentMap.en;
  const data = await fetchJson(path);
  applyContent(data);
}

function setupEvents() {
  elements.langEn.addEventListener("click", () => render("en"));
  elements.langDe.addEventListener("click", () => render("de"));

  elements.railList.addEventListener("click", (event) => {
    const button = event.target.closest(".rail-link");
    if (!button) {
      return;
    }
    scrollToSection(button.dataset.sectionKey);
  });
}

setupEvents();
render(state.lang).catch((err) => {
  console.error(err);
  elements.sections.innerHTML = "<p>Failed to load About content.</p>";
});
