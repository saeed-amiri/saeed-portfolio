// Duty: app entrypoint and orchestration.
// Wires modules together and keeps top-level flow easy to read.
import { featureFlags } from "./config.js";
import { loadContent, normalizeContent, getSectionLabelMap } from "./content.js";
import { elements } from "./elements.js";
import {
  annotateSectionDetailAvailability,
  ensureSectionDetailTriggers,
  fillCertifications,
  fillTimeline,
  initializeSectionMetadata,
  renderSkills,
} from "./sections.js";
import { buildSectionRail, scrollToSection, setupSectionObserver, updateRailActiveState } from "./rail.js";
import {
  openSectionDetail,
  openSkillEvidence,
  openTrainingDetail,
  openEducationDetail,
  openExperienceDetail,
  setupModalDismissHandlers,
} from "./modal.js";
import { state } from "./state.js";
import { setMultilineText } from "./text.js";

let hashJumpFrameA = null;
let hashJumpFrameB = null;

const detailOpeners = {
  section: openSectionDetail,
  experience: openExperienceDetail,
  training: openTrainingDetail,
  education: openEducationDetail,
  skill: openSkillEvidence,
};

const detailTypeAliases = {
  section: "section",
  sec: "section",
  experience: "experience",
  exp: "experience",
  training: "training",
  trainings: "training",
  education: "education",
  edu: "education",
  skill: "skill",
  skills: "skill",
};

const detailTypeDefaultSectionId = {
  section: null,
  experience: "experienceSection",
  training: "trainingsSection",
  education: "educationSection",
  skill: "skillsSection",
};

function clearPendingHashJump() {
  if (hashJumpFrameA !== null) {
    cancelAnimationFrame(hashJumpFrameA);
    hashJumpFrameA = null;
  }

  if (hashJumpFrameB !== null) {
    cancelAnimationFrame(hashJumpFrameB);
    hashJumpFrameB = null;
  }
}

function getHashTargetElement() {
  const hash = window.location.hash;
  if (!hash) {
    return null;
  }

  let id = hash.slice(1);
  if (!id) {
    return null;
  }

  try {
    id = decodeURIComponent(id);
  } catch {
    // Keep raw hash if decoding fails for malformed URLs.
  }

  if (!id) {
    return null;
  }

  const byId = document.getElementById(id);
  if (byId) {
    return byId;
  }

  // Fallback for anchor targets that use name instead of id.
  if (typeof CSS?.escape === "function") {
    return document.querySelector(`[name="${CSS.escape(id)}"]`);
  }

  return document.getElementsByName(id)[0] || null;
}

function jumpToHashTarget() {
  const target = getHashTargetElement();
  if (!target) {
    return;
  }

  target.scrollIntoView({ block: "start", behavior: "auto" });
}

function normalizeDetailType(type) {
  if (!type) {
    return "";
  }

  return detailTypeAliases[String(type).trim().toLowerCase()] || "";
}

function parseDeepLinkDetail() {
  const params = new URLSearchParams(window.location.search);

  const explicitType = normalizeDetailType(params.get("detailType") || params.get("openType"));
  const explicitId = (params.get("detailId") || params.get("openId") || "").trim();
  if (explicitType && explicitId) {
    return { type: explicitType, id: explicitId };
  }

  const encoded = (params.get("open") || params.get("detail") || params.get("modal") || "").trim();
  if (!encoded) {
    return null;
  }

  const separatorIndex = encoded.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex >= encoded.length - 1) {
    return null;
  }

  const rawType = encoded.slice(0, separatorIndex);
  const rawId = encoded.slice(separatorIndex + 1).trim();
  const type = normalizeDetailType(rawType);

  if (!type || !rawId) {
    return null;
  }

  return { type, id: rawId };
}

function scrollToDefaultSectionForDetail(detail) {
  if (!detail || window.location.hash) {
    return;
  }

  const sectionId = detailTypeDefaultSectionId[detail.type];
  if (!sectionId) {
    return;
  }

  const section = document.getElementById(sectionId);
  if (!section) {
    return;
  }

  section.scrollIntoView({ block: "start", behavior: "auto" });
}

function openDeepLinkedDetail() {
  const detail = parseDeepLinkDetail();
  if (!detail) {
    return;
  }

  scrollToDefaultSectionForDetail(detail);

  const openDetail = detailOpeners[detail.type];
  if (typeof openDetail !== "function") {
    return;
  }

  openDetail(detail.id);
}

function schedulePostRenderHashJump() {
  clearPendingHashJump();

  hashJumpFrameA = requestAnimationFrame(() => {
    hashJumpFrameA = null;
    hashJumpFrameB = requestAnimationFrame(() => {
      hashJumpFrameB = null;
      jumpToHashTarget();
      openDeepLinkedDetail();
    });
  });
}

function setLanguageButtonState() {
  elements.langEn.classList.toggle("active", state.lang === "en");
  elements.langDe.classList.toggle("active", state.lang === "de");
}

function applyContent(raw) {
  const data = normalizeContent(raw);
  state.content = data;

  document.documentElement.lang = state.lang;
  document.title = data.pageTitle;

  elements.fullName.textContent = data.profile.name;
  elements.brandName.textContent = data.profile.name;
  elements.headline.textContent = data.profile.headline;
  elements.location.textContent = data.profile.location;

  elements.contactEmail.href = `mailto:${data.profile.email}`;
  elements.contactEmail.textContent = data.profile.email;

  elements.linkedin.href = data.profile.linkedin;
  elements.linkedin.textContent = data.labels.linkedin;

  elements.github.href = data.profile.github;
  elements.github.textContent = data.labels.github;

  elements.profilePhoto.src = data.profile.photo;
  elements.profilePhoto.alt = data.labels.profilePhotoAlt;

  if (elements.aboutNavLink) {
    elements.aboutNavLink.textContent = state.lang === "de" ? "Uber mich" : "About Me";
  }

  elements.bioTitle.textContent = data.labels.bio;
  setMultilineText(elements.bioText, data.bio);

  elements.experienceTitle.textContent = data.labels.experience;
  elements.trainingsTitle.textContent = data.labels.trainings;
  elements.educationTitle.textContent = data.labels.education;
  elements.skillsTitle.textContent = data.labels.skills;
  elements.certTitle.textContent = data.labels.certifications;

  fillTimeline(elements.experienceList, data.experience, "experience");
  fillTimeline(elements.trainingsList, data.trainings || [], "trainings");
  fillTimeline(elements.educationList, data.education, "education");

  elements.trainingsList
    .querySelectorAll('[data-action="open-training-detail"]')
    .forEach((button) => {
      button.textContent = data.labels.moreDetails;
    });

  elements.experienceList
    .querySelectorAll('[data-action="open-experience-detail"]')
    .forEach((button) => {
      button.textContent = data.labels.moreDetails;
    });

  elements.educationList
    .querySelectorAll('[data-action="open-education-detail"]')
    .forEach((button) => {
      button.textContent = data.labels.moreDetails;
    });

  renderSkills(data);
  fillCertifications(data.certifications);

  annotateSectionDetailAvailability(data.sectionDetails);
  ensureSectionDetailTriggers(data);
  buildSectionRail(getSectionLabelMap(data), {
    top: data.labels.railTop,
    bottom: data.labels.railBottom,
  });
  updateRailActiveState();

  elements.footerText.textContent = data.footer;
  elements.downloadPdf.textContent = data.labels.downloadPdf;

  schedulePostRenderHashJump();
}

async function render(lang) {
  state.lang = lang;
  try {
    localStorage.setItem("lang", lang);
  } catch {
    // Ignore persistence issues (private mode/restricted storage) and keep UI functional.
  }
  setLanguageButtonState();

  const data = await loadContent(lang);
  applyContent(data);
}

function setupEvents() {
  elements.langEn.addEventListener("click", () => render("en"));
  elements.langDe.addEventListener("click", () => render("de"));
  elements.downloadPdf.addEventListener("click", () => window.print());

  elements.sectionRailList.addEventListener("click", (event) => {
    const button = event.target.closest(".rail-link");
    if (!button) {
      return;
    }
    scrollToSection(button.dataset.sectionKey);
  });

  elements.contentRoot.addEventListener("click", (event) => {
    const detailTrigger = event.target.closest('[data-action="open-section-detail"]');
    if (detailTrigger && featureFlags.detailOverlays) {
      openSectionDetail(detailTrigger.dataset.sectionKey);
      return;
    }

    const trainingTrigger = event.target.closest('[data-action="open-training-detail"]');
    if (trainingTrigger && featureFlags.detailOverlays) {
      openTrainingDetail(trainingTrigger.dataset.trainingId);
      return;
    }

    const experienceTrigger = event.target.closest('[data-action="open-experience-detail"]');
    if (experienceTrigger && featureFlags.detailOverlays) {
      openExperienceDetail(experienceTrigger.dataset.experienceId);
      return;
    }

    const educationTrigger = event.target.closest('[data-action="open-education-detail"]');
    if (educationTrigger && featureFlags.detailOverlays) {
      openEducationDetail(educationTrigger.dataset.educationId);
      return;
    }

    const skillTrigger = event.target.closest('[data-action="open-skill-evidence"]');
    if (skillTrigger && featureFlags.skillEvidenceDrilldown) {
      openSkillEvidence(skillTrigger.dataset.skillId);
    }
  });

  window.addEventListener("hashchange", jumpToHashTarget);

  setupModalDismissHandlers();
}

function init() {
  initializeSectionMetadata();
  setupSectionObserver();
  setupEvents();
}

init();
render(state.lang).catch((err) => {
  console.error(err);
  document.body.innerHTML = "<main style='padding:1rem;'>Failed to load portfolio content.</main>";
});
