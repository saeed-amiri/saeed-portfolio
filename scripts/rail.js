// Duty: right-side rail navigation behavior.
// Handles rail rendering, active states, and section scrolling.
import { featureFlags } from "./config.js";
import { elements } from "./elements.js";
import { state } from "./state.js";

function appendRailButton(key, label) {
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
    glyph.textContent = key === "__top__" ? "↑" : "↓";
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
  elements.sectionRailList.appendChild(item);
}

export function buildSectionRail(labelMap, edgeLabels = {}) {
  if (!featureFlags.sectionRail) {
    elements.sectionRail.classList.add("hidden");
    return;
  }

  elements.sectionRail.classList.remove("hidden");
  elements.sectionRailList.innerHTML = "";

  const topLabel = edgeLabels.top || (state.lang === "de" ? "Oben" : "Top");
  const bottomLabel = edgeLabels.bottom || (state.lang === "de" ? "Unten" : "Bottom");

  appendRailButton("__top__", topLabel);

  elements.sectionPanels.forEach((panel) => {
    const key = panel.dataset.sectionKey;
    const label = labelMap[key] || key;
    appendRailButton(key, label);
  });

  appendRailButton("__bottom__", bottomLabel);
}

export function updateRailActiveState() {
  if (!featureFlags.sectionRail) {
    return;
  }

  const railButtons = elements.sectionRailList.querySelectorAll(".rail-link");
  railButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sectionKey === state.activeSectionKey);
  });
}

export function scrollToSection(sectionKey) {
  if (sectionKey === "__top__") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (sectionKey === "__bottom__") {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    return;
  }

  const panel = elements.sectionPanels.find((item) => item.dataset.sectionKey === sectionKey);
  if (!panel) {
    return;
  }
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function setupSectionObserver() {
  if (typeof IntersectionObserver === "undefined") {
    state.activeSectionKey = elements.sectionPanels[0]?.dataset.sectionKey || null;
    updateRailActiveState();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          state.activeSectionKey = entry.target.dataset.sectionKey || null;
          entry.target.dataset.sectionActive = "true";
          updateRailActiveState();
        } else {
          entry.target.dataset.sectionActive = "false";
        }
      });
    },
    { root: null, rootMargin: "-35% 0px -45% 0px", threshold: 0 }
  );

  elements.sectionPanels.forEach((panel) => observer.observe(panel));
}
