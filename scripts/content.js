// Duty: content loading and normalization.
// Keeps network/data-shape concerns outside rendering logic.
import { contentMap } from "./config.js";

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

function joinPath(base, relativePath) {
  return `${base.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

async function loadTimelineSection(basePath, sectionConfig) {
  const ids = await fetchJson(joinPath(basePath, sectionConfig.index));
  const entries = await Promise.all(
    ids.map((id) => fetchJson(joinPath(basePath, `${sectionConfig.itemsDir}/${id}/front.json`)))
  );

  const details = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        details[id] = await fetchJson(joinPath(basePath, `${sectionConfig.itemsDir}/${id}/detail.json`));
      } catch {
        // Allow missing detail files for entries that do not need a modal.
      }
    })
  );

  const sectionDetail = sectionConfig.detail
    ? await fetchJson(joinPath(basePath, sectionConfig.detail)).catch(() => null)
    : null;

  return { entries, details, sectionDetail };
}

async function loadSkillEvidence(basePath, sectionConfig) {
  if (!sectionConfig.evidenceIndex || !sectionConfig.evidenceDir) {
    return {};
  }

  const ids = await fetchJson(joinPath(basePath, sectionConfig.evidenceIndex));
  const evidence = {};

  await Promise.all(
    ids.map(async (id) => {
      evidence[id] = await fetchJson(joinPath(basePath, `${sectionConfig.evidenceDir}/${id}.json`));
    })
  );

  return evidence;
}

async function loadModularContent(basePath) {
  const manifest = await fetchJson(joinPath(basePath, "manifest.json"));
  const meta = await fetchJson(joinPath(basePath, manifest.meta));

  const data = {
    ...meta,
    bio: "",
    experience: [],
    trainings: [],
    education: [],
    certifications: [],
    skills: [],
    skillRows: [],
    sectionDetails: {},
    trainingDetails: {},
    educationDetails: {},
    experienceDetails: {},
    skillEvidence: {},
  };

  const bioConfig = manifest.sections?.bio;
  if (bioConfig?.front) {
    const bioFront = await fetchJson(joinPath(basePath, bioConfig.front));
    data.bio = bioFront.bio || "";
  }
  if (bioConfig?.detail) {
    data.sectionDetails.bio = await fetchJson(joinPath(basePath, bioConfig.detail)).catch(() => null);
  }

  const experienceConfig = manifest.sections?.experience;
  if (experienceConfig?.index && experienceConfig?.itemsDir) {
    const timeline = await loadTimelineSection(basePath, experienceConfig);
    data.experience = timeline.entries;
    data.experienceDetails = timeline.details;
    if (timeline.sectionDetail) {
      data.sectionDetails.experience = timeline.sectionDetail;
    }
  }

  const trainingsConfig = manifest.sections?.trainings;
  if (trainingsConfig?.index && trainingsConfig?.itemsDir) {
    const timeline = await loadTimelineSection(basePath, trainingsConfig);
    data.trainings = timeline.entries;
    data.trainingDetails = timeline.details;
    if (timeline.sectionDetail) {
      data.sectionDetails.trainings = timeline.sectionDetail;
    }
  }

  const educationConfig = manifest.sections?.education;
  if (educationConfig?.index && educationConfig?.itemsDir) {
    const timeline = await loadTimelineSection(basePath, educationConfig);
    data.education = timeline.entries;
    data.educationDetails = timeline.details;
    if (timeline.sectionDetail) {
      data.sectionDetails.education = timeline.sectionDetail;
    }
  }

  const skillsConfig = manifest.sections?.skills;
  if (skillsConfig?.front) {
    const skillsFront = await fetchJson(joinPath(basePath, skillsConfig.front));
    data.skills = skillsFront.skills || [];
    data.skillRows = skillsFront.skillRows || [];
  }
  if (skillsConfig?.detail) {
    const sectionDetail = await fetchJson(joinPath(basePath, skillsConfig.detail)).catch(() => null);
    if (sectionDetail) {
      data.sectionDetails.skills = sectionDetail;
    }
  }
  data.skillEvidence = await loadSkillEvidence(basePath, skillsConfig || {});

  const certConfig = manifest.sections?.certifications;
  if (certConfig?.front) {
    const certFront = await fetchJson(joinPath(basePath, certConfig.front));
    data.certifications = certFront.certifications || [];
  }
  if (certConfig?.detail) {
    const sectionDetail = await fetchJson(joinPath(basePath, certConfig.detail)).catch(() => null);
    if (sectionDetail) {
      data.sectionDetails.certifications = sectionDetail;
    }
  }

  return data;
}

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

  if (path.endsWith(".json")) {
    return fetchJson(path);
  }

  return loadModularContent(path);
}
