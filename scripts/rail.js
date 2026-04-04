// Duty: right-side rail navigation behavior.
// Handles rail rendering, active states, and section scrolling.
import { featureFlags } from "./config.js";
import { elements } from "./elements.js";
import { state } from "./state.js";

export function buildSectionRail(labelMap) {
  if (!featureFlags.sectionRail) {
    elements.sectionRail.classList.add("hidden");
    return;
  }

  elements.sectionRail.classList.remove("hidden");
  elements.sectionRailList.innerHTML = "";

  elements.sectionPanels.forEach((panel) => {
    const key = panel.dataset.sectionKey;
    const label = labelMap[key] || key;
    const item = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.className = "rail-link";
    button.dataset.sectionKey = key;
    button.setAttribute("aria-label", label);

    const dot = document.createElement("span");
    dot.className = "rail-dot";
    button.appendChild(dot);

    const labelTag = document.createElement("span");
    labelTag.className = "rail-label";
    labelTag.textContent = label;
    button.appendChild(labelTag);

    item.appendChild(button);
    elements.sectionRailList.appendChild(item);
  });
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
