// Duty: detail modal rendering and close behavior.
// Supports both section-level details and skill evidence popups.
import { elements } from "./elements.js";
import { state } from "./state.js";
import { setMultilineText } from "./text.js";

function openImageLightbox(src, alt) {
  if (!src) {
    return;
  }

  elements.imageLightboxImg.src = src;
  elements.imageLightboxImg.alt = alt || "Expanded detail image";
  elements.imageLightboxBackdrop.classList.remove("hidden");
  elements.imageLightboxBackdrop.setAttribute("aria-hidden", "false");
}

function closeImageLightbox() {
  elements.imageLightboxBackdrop.classList.add("hidden");
  elements.imageLightboxBackdrop.setAttribute("aria-hidden", "true");
  elements.imageLightboxImg.src = "";
}

function appendBodyBlock(content) {
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

  elements.detailModalContent.appendChild(body);
}

function appendBulletsBlock(items) {
  if (!Array.isArray(items) || !items.length) {
    return;
  }

  const list = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    setMultilineText(li, item);
    list.appendChild(li);
  });
  elements.detailModalContent.appendChild(list);
}

function appendImagesBlock(images, fallbackTitle) {
  if (!Array.isArray(images) || !images.length) {
    return;
  }

  const imageWrap = document.createElement("div");
  imageWrap.className = "modal-images";

  images.forEach((image) => {
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || fallbackTitle || "Detail image";
    imageWrap.appendChild(img);
  });

  elements.detailModalContent.appendChild(imageWrap);
}

function appendLinksBlock(links) {
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

  elements.detailModalContent.appendChild(linksWrap);
}

function appendOrderedContentBlocks(blocks, fallbackTitle) {
  blocks.forEach((block) => {
    if (typeof block === "string") {
      appendBodyBlock(block);
      return;
    }

    if (!block || typeof block !== "object") {
      return;
    }

    const type = (block.type || "").toLowerCase();

    if (type === "summary") {
      const summary = document.createElement("p");
      setMultilineText(summary, block.text ?? block.value ?? "");
      elements.detailModalContent.appendChild(summary);
      return;
    }

    if (type === "body" || type === "text" || type === "html") {
      appendBodyBlock(block.text ?? block.body ?? block.html ?? block.value);
      return;
    }

    if (type === "bullets" || type === "list") {
      appendBulletsBlock(block.items ?? block.bullets);
      return;
    }

    if (type === "images" || type === "image") {
      const images = block.items ?? block.images;
      appendImagesBlock(images, fallbackTitle);
      return;
    }

    if (type === "links") {
      appendLinksBlock(block.items ?? block.links);
    }
  });
}

export function openModal(payload) {
  elements.detailModalTitle.textContent = payload.title || "Details";
  elements.detailModalContent.innerHTML = "";

  if (Array.isArray(payload.content)) {
    appendOrderedContentBlocks(payload.content, payload.title);

    elements.detailModalBackdrop.classList.remove("hidden");
    elements.detailModalBackdrop.setAttribute("aria-hidden", "false");
    return;
  }

  if (payload.summary) {
    const summary = document.createElement("p");
    setMultilineText(summary, payload.summary);
    elements.detailModalContent.appendChild(summary);
  }

  appendBodyBlock(payload.body ?? payload.content);
  appendBulletsBlock(payload.bullets);
  appendImagesBlock(payload.images, payload.title);
  appendLinksBlock(payload.links);

  elements.detailModalBackdrop.classList.remove("hidden");
  elements.detailModalBackdrop.setAttribute("aria-hidden", "false");
}

export function closeModal() {
  closeImageLightbox();
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

  elements.detailModalContent.addEventListener("click", (event) => {
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

  document.addEventListener("keydown", (event) => {
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
