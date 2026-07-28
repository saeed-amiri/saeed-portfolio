// Duty: detail modal rendering and close behavior.
// Supports both section-level details and skill evidence popups.
import { elements } from "./elements.js";
import { state } from "./state.js";
import { setMultilineText } from "./text.js";

const publicationAbstractById = {
  "paper-abstract-temp-surfactants": {
    title: "Abstract",
    content: [
      {
        type: "body",
        html: "<h3>Hypothesis</h3><p>Surfactants stabilize liquid-liquid interfaces, and their temperature-dependent behavior is highly relevant for applications involving emulsions. While temperature-induced phase transitions of interfacial films are well known, their detection depends strongly on the applied experimental technique. We hypothesize that combining interfacial shear rheology with a temperature-dependent thermodynamic description based on the Gibbs adsorption framework enables a more sensitive and quantitative identification of such transitions. Furthermore, we expect that molecular architecture, specifically head-group chemistry and alkyl chain length, governs the mechanical stability and temperature-induced phase behavior of surfactant films.</p>"
      },
      {
        type: "body",
        html: "<h3>Experiments</h3><p>Temperature-dependent interfacial shear rheology and pendant-drop tensiometry were performed for a series of alkyl-chain surfactants with systematic variation of head group (amine, alcohol, acid) and chain length (C14, C16, C18) over a range of 15-80 C. Interfacial tension data obtained from pendant-drop measurements were analyzed using a newly derived temperature-dependent adsorption equation to extract adsorption free energies and identify phase-transition temperatures.</p>"
      },
      {
        type: "body",
        html: "<h3>Findings</h3><p>Interfacial shear rheology reveals pronounced temperature-induced transitions in surfactant films, reflected by a loss of elasticity and changes in interfacial structure. The transition temperature depends strongly on molecular architecture, with systematic variations in head group and chain length. In contrast, pendant-drop tensiometry captures these changes only partially, indicating that interfacial tension alone does not fully reflect structural rearrangements. The combined thermodynamic and rheological analysis highlights the importance of interfacial mechanics for understanding temperature-dependent phase behavior at liquid-liquid interfaces.</p>"
      },
      {
        type: "images",
        items: [
          {
            src: "assets/Temperature_Dependent.jpg",
            alt: "Temperature-dependent interfacial behavior figure"
          }
        ]
      }
    ]
  },
  "paper-abstract-friction-pre": {
    title: "Abstract",
    content: [
      {
        type: "body",
        html: "<p>We present molecular dynamics simulations of one- and two-dimensional bead-spring models sliding on incommensurate substrates after an initial kick, in the case where the coupling to the underlying substrate is weak, i.e., energy can dissipate only into the internal degrees of freedom of the sliding object, but not into the substrate below. We investigate how sliding friction is affected by structural defects and interaction anharmonicity. In their absence, we confirm earlier findings, namely, that at special resonance sliding velocities, friction is maximal. When sliding off-resonance, partially thermalized states are possible, whereby only a small number of vibrational modes becomes excited, but whose kinetic energies are already Maxwell-Boltzmann distributed. Anharmonicity and defects typically destroy partial thermalization and instead lead to full thermalization, implying much higher friction. For sliders with periodic boundaries, thermalization begins with vibrational modes whose spatial modulation is compatible with the incommensurate lattice. For a disk-shaped slider, modes corresponding to modulations compatible with the slider radius are initially the most dominant. By tuning the mechanical properties of the slider's edge, this effect can be controlled, resulting in significant changes in the sliding distance covered.</p>"
      }
    ]
  }
};

let currentModalPayload = null;
const modalPayloadHistory = [];

const LIGHTBOX_ZOOM_MIN = 1;
const LIGHTBOX_ZOOM_MAX = 4;
const LIGHTBOX_ZOOM_STEP = 0.25;

let lightboxZoom = LIGHTBOX_ZOOM_MIN;
let lightboxZoomLabel = null;
let lightboxZoomInButton = null;
let lightboxZoomOutButton = null;
let lightboxZoomResetButton = null;

function clampLightboxZoom(value) {
  return Math.min(LIGHTBOX_ZOOM_MAX, Math.max(LIGHTBOX_ZOOM_MIN, value));
}

function updateLightboxZoomUi() {
  if (!lightboxZoomLabel || !lightboxZoomInButton || !lightboxZoomOutButton || !lightboxZoomResetButton) {
    return;
  }

  lightboxZoomLabel.textContent = `${Math.round(lightboxZoom * 100)}%`;
  lightboxZoomOutButton.disabled = lightboxZoom <= LIGHTBOX_ZOOM_MIN;
  lightboxZoomInButton.disabled = lightboxZoom >= LIGHTBOX_ZOOM_MAX;
  lightboxZoomResetButton.disabled = lightboxZoom === LIGHTBOX_ZOOM_MIN;
}

function applyLightboxZoom() {
  const image = elements.imageLightboxImg;
  if (!image) {
    return;
  }

  if (lightboxZoom <= LIGHTBOX_ZOOM_MIN) {
    image.style.maxWidth = "100%";
    image.style.maxHeight = "90vh";
    image.style.width = "auto";
  } else {
    const naturalWidth = image.naturalWidth || image.width;
    image.style.maxWidth = "none";
    image.style.maxHeight = "none";
    image.style.width = `${Math.round(naturalWidth * lightboxZoom)}px`;
  }

  updateLightboxZoomUi();
}

function setLightboxZoom(nextZoom) {
  const clamped = clampLightboxZoom(nextZoom);
  if (clamped === lightboxZoom) {
    return;
  }

  lightboxZoom = clamped;
  applyLightboxZoom();
}

function resetLightboxZoom() {
  lightboxZoom = LIGHTBOX_ZOOM_MIN;
  applyLightboxZoom();
}

function ensureLightboxControls() {
  if (!elements.imageLightbox) {
    return;
  }

  const existingToolbar = elements.imageLightbox.querySelector(".image-lightbox-toolbar");
  if (existingToolbar) {
    lightboxZoomOutButton = existingToolbar.querySelector('[data-action="lightbox-zoom-out"]');
    lightboxZoomInButton = existingToolbar.querySelector('[data-action="lightbox-zoom-in"]');
    lightboxZoomResetButton = existingToolbar.querySelector('[data-action="lightbox-zoom-reset"]');
    lightboxZoomLabel = existingToolbar.querySelector(".image-lightbox-zoom-label");
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "image-lightbox-toolbar";

  lightboxZoomOutButton = document.createElement("button");
  lightboxZoomOutButton.type = "button";
  lightboxZoomOutButton.className = "image-lightbox-zoom-button";
  lightboxZoomOutButton.dataset.action = "lightbox-zoom-out";
  lightboxZoomOutButton.setAttribute("aria-label", "Zoom out");
  lightboxZoomOutButton.textContent = "-";

  lightboxZoomInButton = document.createElement("button");
  lightboxZoomInButton.type = "button";
  lightboxZoomInButton.className = "image-lightbox-zoom-button";
  lightboxZoomInButton.dataset.action = "lightbox-zoom-in";
  lightboxZoomInButton.setAttribute("aria-label", "Zoom in");
  lightboxZoomInButton.textContent = "+";

  lightboxZoomResetButton = document.createElement("button");
  lightboxZoomResetButton.type = "button";
  lightboxZoomResetButton.className = "image-lightbox-zoom-button";
  lightboxZoomResetButton.dataset.action = "lightbox-zoom-reset";
  lightboxZoomResetButton.setAttribute("aria-label", "Reset zoom");
  lightboxZoomResetButton.textContent = "Reset";

  lightboxZoomLabel = document.createElement("span");
  lightboxZoomLabel.className = "image-lightbox-zoom-label";
  lightboxZoomLabel.setAttribute("aria-live", "polite");

  lightboxZoomOutButton.addEventListener("click", () => {
    setLightboxZoom(lightboxZoom - LIGHTBOX_ZOOM_STEP);
  });

  lightboxZoomInButton.addEventListener("click", () => {
    setLightboxZoom(lightboxZoom + LIGHTBOX_ZOOM_STEP);
  });

  lightboxZoomResetButton.addEventListener("click", resetLightboxZoom);

  toolbar.append(lightboxZoomOutButton, lightboxZoomInButton, lightboxZoomResetButton, lightboxZoomLabel);
  elements.imageLightbox.appendChild(toolbar);
}

export function openImageLightbox(src, alt) {
  if (!src) {
    return;
  }

  ensureLightboxControls();

  const caption = typeof alt === "string" ? alt.trim() : "";

  elements.imageLightboxImg.onload = () => {
    resetLightboxZoom();
  };
  elements.imageLightboxImg.src = src;
  elements.imageLightboxImg.alt = alt || "Expanded detail image";
  resetLightboxZoom();
  elements.imageLightboxCaption.textContent = caption;
  elements.imageLightboxCaption.classList.toggle("hidden", !caption);
  elements.imageLightboxBackdrop.classList.remove("hidden");
  elements.imageLightboxBackdrop.setAttribute("aria-hidden", "false");
}

function closeImageLightbox() {
  elements.imageLightboxBackdrop.classList.add("hidden");
  elements.imageLightboxBackdrop.setAttribute("aria-hidden", "true");
  elements.imageLightboxImg.src = "";
  elements.imageLightboxImg.style.maxWidth = "100%";
  elements.imageLightboxImg.style.maxHeight = "90vh";
  elements.imageLightboxImg.style.width = "auto";
  elements.imageLightboxCaption.textContent = "";
  elements.imageLightboxCaption.classList.add("hidden");
  resetLightboxZoom();
}

function createModalTargetId(seed = "") {
  const safe = String(seed)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const entropy = Math.random().toString(36).slice(2, 8);
  return `${safe || "tab"}-${entropy}`;
}

function appendBodyBlock(content, container = elements.detailModalContent) {
  if (!content) {
    return;
  }

  const body = document.createElement("div");
  body.className = "modal-body";

  if (Array.isArray(content)) {
    content.forEach((chunk) => {
      const paragraph = document.createElement("p");
      setMultilineText(paragraph, chunk);
      body.appendChild(paragraph);
    });
  } else {
    setMultilineText(body, content);
  }

  container.appendChild(body);
}

function appendBulletsBlock(items, container = elements.detailModalContent) {
  if (!Array.isArray(items) || !items.length) {
    return;
  }

  const list = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    setMultilineText(li, item);
    list.appendChild(li);
  });
  container.appendChild(list);
}

function appendImagesBlock(images, fallbackTitle, container = elements.detailModalContent) {
  if (!Array.isArray(images) || !images.length) {
    return;
  }

  const imageWrap = document.createElement("div");
  imageWrap.className = "modal-images";

  images.forEach((image) => {
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || fallbackTitle || "Detail image";
    img.style.cursor = "pointer";
    img.addEventListener("click", () => {
      openImageLightbox(image.src, image.alt || fallbackTitle || "Detail image");
    });
    imageWrap.appendChild(img);
  });

  container.appendChild(imageWrap);
}

function appendLinksBlock(links, container = elements.detailModalContent) {
  if (!Array.isArray(links) || !links.length) {
    return;
  }

  const linksWrap = document.createElement("div");
  linksWrap.className = "modal-links";

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    setMultilineText(anchor, link.label);
    linksWrap.appendChild(anchor);
  });

  container.appendChild(linksWrap);
}

function appendLegacyPayload(payload, fallbackTitle, container = elements.detailModalContent) {
  if (payload.summary) {
    const summary = document.createElement("p");
    setMultilineText(summary, payload.summary);
    container.appendChild(summary);
  }

  appendBodyBlock(payload.body ?? payload.content, container);
  appendBulletsBlock(payload.bullets, container);
  appendImagesBlock(payload.images, fallbackTitle, container);
  appendLinksBlock(payload.links, container);
}

function appendTabsBlock(block, fallbackTitle, container = elements.detailModalContent) {
  const tabs = Array.isArray(block.tabs) ? block.tabs.filter((tab) => tab && typeof tab === "object") : [];
  if (!tabs.length) {
    return;
  }

  const tabsWrap = document.createElement("section");
  tabsWrap.className = "modal-tabs";

  const tabList = document.createElement("div");
  tabList.className = "modal-tab-list";
  tabList.setAttribute("role", "tablist");

  const panels = document.createElement("div");
  panels.className = "modal-tab-panels";

  const tabNodes = [];
  const panelNodes = [];

  tabs.forEach((tab, index) => {
    const label = tab.label || tab.title || `Tab ${index + 1}`;
    const key = createModalTargetId(tab.id || label);
    const tabId = `modal-tab-${key}`;
    const panelId = `modal-panel-${key}`;

    const tabButton = document.createElement("button");
    tabButton.type = "button";
    tabButton.className = "modal-tab-button";
    tabButton.id = tabId;
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-controls", panelId);
    tabButton.setAttribute("aria-selected", "false");
    tabButton.tabIndex = -1;
    tabButton.textContent = label;

    const panel = document.createElement("section");
    panel.className = "modal-tab-panel hidden";
    panel.id = panelId;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabId);

    if (Array.isArray(tab.content)) {
      appendOrderedContentBlocks(tab.content, tab.title || fallbackTitle, panel);
    } else {
      appendLegacyPayload(tab, tab.title || fallbackTitle, panel);
    }

    tabList.appendChild(tabButton);
    panels.appendChild(panel);
    tabNodes.push(tabButton);
    panelNodes.push(panel);
  });

  function activateTab(nextIndex) {
    tabNodes.forEach((tabNode, index) => {
      const active = index === nextIndex;
      tabNode.setAttribute("aria-selected", String(active));
      tabNode.tabIndex = active ? 0 : -1;
      panelNodes[index].classList.toggle("hidden", !active);
    });
  }

  tabList.addEventListener("click", (event) => {
    const tabNode = event.target.closest(".modal-tab-button");
    if (!tabNode) {
      return;
    }
    const index = tabNodes.indexOf(tabNode);
    if (index >= 0) {
      activateTab(index);
    }
  });

  tabList.addEventListener("keydown", (event) => {
    const currentIndex = tabNodes.findIndex((tabNode) => tabNode.getAttribute("aria-selected") === "true");
    if (currentIndex === -1) {
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabNodes.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabNodes.length) % tabNodes.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabNodes.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    activateTab(nextIndex);
    tabNodes[nextIndex].focus();
  });

  activateTab(0);
  tabsWrap.append(tabList, panels);
  container.appendChild(tabsWrap);
}

function appendOrderedContentBlocks(blocks, fallbackTitle, container = elements.detailModalContent) {
  blocks.forEach((block) => {
    if (typeof block === "string") {
      appendBodyBlock(block, container);
      return;
    }

    if (!block || typeof block !== "object") {
      return;
    }

    const type = (block.type || "").toLowerCase();

    if (type === "summary") {
      const summary = document.createElement("p");
      setMultilineText(summary, block.text ?? block.value ?? "");
      container.appendChild(summary);
      return;
    }

    if (type === "body" || type === "text" || type === "html") {
      appendBodyBlock(block.text ?? block.body ?? block.html ?? block.value, container);
      return;
    }

    if (type === "bullets" || type === "list") {
      appendBulletsBlock(block.items ?? block.bullets, container);
      return;
    }

    if (type === "images" || type === "image") {
      const images = block.items ?? block.images;
      appendImagesBlock(images, fallbackTitle, container);
      return;
    }

    if (type === "links") {
      appendLinksBlock(block.items ?? block.links, container);
      return;
    }

    if (type === "tabs") {
      appendTabsBlock(block, fallbackTitle, container);
    }
  });
}

function renderModalPayload(payload) {
  elements.detailModalTitle.textContent = payload.title || "Details";
  elements.detailModalContent.innerHTML = "";

  if (Array.isArray(payload.content)) {
    appendOrderedContentBlocks(payload.content, payload.title, elements.detailModalContent);

    elements.detailModalBackdrop.classList.remove("hidden");
    elements.detailModalBackdrop.setAttribute("aria-hidden", "false");
    return;
  }

  appendLegacyPayload(payload, payload.title, elements.detailModalContent);

  elements.detailModalBackdrop.classList.remove("hidden");
  elements.detailModalBackdrop.setAttribute("aria-hidden", "false");
}

export function openModal(payload, options = {}) {
  const { pushCurrent = false } = options;

  if (pushCurrent && currentModalPayload) {
    modalPayloadHistory.push(currentModalPayload);
  } else {
    modalPayloadHistory.length = 0;
  }

  currentModalPayload = payload;
  renderModalPayload(payload);
}

function openPublicationAbstractById(abstractId) {
  const payload = publicationAbstractById[abstractId];
  if (!payload) {
    return;
  }

  openModal(payload, { pushCurrent: true });
}

export function closeModal() {
  closeImageLightbox();

  if (modalPayloadHistory.length) {
    currentModalPayload = modalPayloadHistory.pop();
    renderModalPayload(currentModalPayload);
    return;
  }

  currentModalPayload = null;
  modalPayloadHistory.length = 0;
  elements.detailModalBackdrop.classList.add("hidden");
  elements.detailModalBackdrop.setAttribute("aria-hidden", "true");
}

export function openSectionDetail(sectionKey) {
  const detail = state.content?.sectionDetails?.[sectionKey];
  if (!detail) {
    return;
  }
  openModal(detail);
}

export function openTrainingDetail(trainingId) {
  const detail = state.content?.trainingDetails?.[trainingId];
  if (!detail) {
    return;
  }
  openModal(detail);
}

export function openEducationDetail(educationId) {
  const detail = state.content?.educationDetails?.[educationId];
  if (!detail) {
    return;
  }
  openModal(detail);
}

export function openExperienceDetail(experienceId) {
  const detail = state.content?.experienceDetails?.[experienceId];
  if (!detail) {
    return;
  }
  openModal(detail);
}

export function openSkillEvidence(skillId) {
  const evidence = state.content?.skillEvidence?.[skillId];
  if (!evidence) {
    return;
  }
  openModal(evidence);
}

export function setupModalDismissHandlers() {
  ensureLightboxControls();

  elements.detailModalClose.addEventListener("click", closeModal);

  elements.detailModalContent.addEventListener("click", (event) => {
    const abstractLink = event.target.closest('a[href^="#paper-abstract-"]');
    if (abstractLink) {
      event.preventDefault();
      const abstractId = abstractLink.getAttribute("href").slice(1);
      openPublicationAbstractById(abstractId);
      return;
    }

    const image = event.target.closest(".modal-images img");
    if (!image) {
      return;
    }

    openImageLightbox(image.currentSrc || image.src, image.alt);
  });

  elements.detailModalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.detailModalBackdrop) {
      closeModal();
    }
  });

  elements.imageLightboxClose.addEventListener("click", closeImageLightbox);

  elements.imageLightboxBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.imageLightboxBackdrop) {
      closeImageLightbox();
    }
  });

  elements.imageLightbox.addEventListener("wheel", (event) => {
    if (elements.imageLightboxBackdrop.classList.contains("hidden")) {
      return;
    }

    event.preventDefault();
    if (event.deltaY < 0) {
      setLightboxZoom(lightboxZoom + LIGHTBOX_ZOOM_STEP);
      return;
    }

    setLightboxZoom(lightboxZoom - LIGHTBOX_ZOOM_STEP);
  });

  document.addEventListener("keydown", (event) => {
    if (!elements.imageLightboxBackdrop.classList.contains("hidden")) {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setLightboxZoom(lightboxZoom + LIGHTBOX_ZOOM_STEP);
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setLightboxZoom(lightboxZoom - LIGHTBOX_ZOOM_STEP);
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        resetLightboxZoom();
        return;
      }
    }

    if (event.key !== "Escape") {
      return;
    }

    if (!elements.imageLightboxBackdrop.classList.contains("hidden")) {
      closeImageLightbox();
      return;
    }

    if (!elements.detailModalBackdrop.classList.contains("hidden")) {
      closeModal();
    }
  });
}
