// Duty: detail modal rendering and close behavior.
// Supports both section-level details and skill evidence popups.
import { elements } from "./elements.js";
import { state } from "./state.js";
import { setMultilineText } from "./text.js";

export function openModal(payload) {
  elements.detailModalTitle.textContent = payload.title || "Details";
  elements.detailModalContent.innerHTML = "";

  if (payload.summary) {
    const summary = document.createElement("p");
    setMultilineText(summary, payload.summary);
    elements.detailModalContent.appendChild(summary);
  }

  if (Array.isArray(payload.bullets) && payload.bullets.length) {
    const list = document.createElement("ul");
    payload.bullets.forEach((item) => {
      const li = document.createElement("li");
      setMultilineText(li, item);
      list.appendChild(li);
    });
    elements.detailModalContent.appendChild(list);
  }

  if (Array.isArray(payload.images) && payload.images.length) {
    const imageWrap = document.createElement("div");
    imageWrap.className = "modal-images";

    payload.images.forEach((image) => {
      const img = document.createElement("img");
      img.src = image.src;
      img.alt = image.alt || payload.title || "Detail image";
      imageWrap.appendChild(img);
    });

    elements.detailModalContent.appendChild(imageWrap);
  }

  if (Array.isArray(payload.links) && payload.links.length) {
    const linksWrap = document.createElement("div");
    linksWrap.className = "modal-links";

    payload.links.forEach((link) => {
      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      setMultilineText(anchor, link.label);
      linksWrap.appendChild(anchor);
    });

    elements.detailModalContent.appendChild(linksWrap);
  }

  elements.detailModalBackdrop.classList.remove("hidden");
  elements.detailModalBackdrop.setAttribute("aria-hidden", "false");
}

export function closeModal() {
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
  elements.detailModalClose.addEventListener("click", closeModal);

  elements.detailModalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.detailModalBackdrop) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.detailModalBackdrop.classList.contains("hidden")) {
      closeModal();
    }
  });
}
