// Duty: content loading and normalization.
// Keeps network/data-shape concerns outside rendering logic.
import { contentMap } from "./config.js";

export function normalizeContent(raw) {
  return {
    ...raw,
    labels: {
      ...raw.labels,
      skills: raw.labels?.skills || "Skills",
      moreDetails: raw.labels?.moreDetails || "More",
      noSkillsYet: raw.labels?.noSkillsYet || "Add your skills here",
      evidenceTitle: raw.labels?.evidenceTitle || "Evidence",
    },
    sectionDetails: raw.sectionDetails || {},
    trainingDetails: raw.trainingDetails || {},
    educationDetails: raw.educationDetails || {},
    experienceDetails: raw.experienceDetails || {},
    skillEvidence: raw.skillEvidence || {},
    skillRows: raw.skillRows || [],
    skills: raw.skills || [],
  };
}

export function getSectionLabelMap(data) {
  return {
    bio: data.labels.bio,
    experience: data.labels.experience,
    trainings: data.labels.trainings,
    education: data.labels.education,
    skills: data.labels.skills,
    certifications: data.labels.certifications,
  };
}

export async function loadContent(lang) {
  const path = contentMap[lang];
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}
