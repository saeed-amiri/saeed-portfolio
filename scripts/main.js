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

  elements.bioTitle.textContent = data.labels.bio;
  elements.bioText.textContent = data.bio;

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
  buildSectionRail(getSectionLabelMap(data));
  updateRailActiveState();

  elements.footerText.textContent = data.footer;
  elements.downloadPdf.textContent = data.labels.downloadPdf;
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
