// Duty: content loading and normalization.
// Keeps network/data-shape concerns outside rendering logic.
import { contentMap } from "./config.js";

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

function joinPath(base, relativePath) {
  return `${base.replace(/\/$/, "")}/${relativePath.replace(/^\//, "")}`;
}

function dirname(path) {
  const index = path.lastIndexOf("/");
  return index === -1 ? "" : path.slice(0, index);
}

function isAbsoluteOrExternalPath(path) {
  return (
    path.startsWith("/") ||
    path.startsWith("data:") ||
    path.startsWith("blob:") ||
    /^[a-z]+:\/\//i.test(path)
  );
}

function resolveJsonPath(path, filePath) {
  if (typeof path !== "string" || path.length === 0 || isAbsoluteOrExternalPath(path)) {
    return path;
  }

  // Preserve project-root style paths that already work in current content.
  if (path.startsWith("assets/") || path.startsWith("content/")) {
    return path;
  }

  // Treat bare filenames and explicit relative paths as JSON-file-relative.
  if (!path.includes("/") || path.startsWith("./") || path.startsWith("../")) {
    return joinPath(dirname(filePath), path);
  }

  return path;
}

function resolveMediaPaths(payload, filePath) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  function resolveContentBlock(block) {
    if (!block || typeof block !== "object") {
      return block;
    }

    const nextBlock = { ...block };
    const type = (nextBlock.type || "").toLowerCase();

    if (type === "images" || type === "image") {
      const images = Array.isArray(nextBlock.items)
        ? nextBlock.items
        : Array.isArray(nextBlock.images)
          ? nextBlock.images
          : [];

      const resolvedImages = images.map((image) => ({
        ...image,
        src: resolveJsonPath(image?.src, filePath),
      }));

      if (Array.isArray(nextBlock.items)) {
        nextBlock.items = resolvedImages;
      }
      if (Array.isArray(nextBlock.images)) {
        nextBlock.images = resolvedImages;
      }
    }

    if (type === "links") {
      const links = Array.isArray(nextBlock.items)
        ? nextBlock.items
        : Array.isArray(nextBlock.links)
          ? nextBlock.links
          : [];

      const resolvedLinks = links.map((link) => ({
        ...link,
        url: resolveJsonPath(link?.url, filePath),
      }));

      if (Array.isArray(nextBlock.items)) {
        nextBlock.items = resolvedLinks;
      }
      if (Array.isArray(nextBlock.links)) {
        nextBlock.links = resolvedLinks;
      }
    }

    if (type === "tabs" && Array.isArray(nextBlock.tabs)) {
      nextBlock.tabs = nextBlock.tabs.map((tab) => {
        if (!tab || typeof tab !== "object") {
          return tab;
        }

        const nextTab = { ...tab };
        if (Array.isArray(nextTab.content)) {
          nextTab.content = nextTab.content.map((innerBlock) => resolveContentBlock(innerBlock));
        }

        if (Array.isArray(nextTab.images)) {
          nextTab.images = nextTab.images.map((image) => ({
            ...image,
            src: resolveJsonPath(image?.src, filePath),
          }));
        }

        if (Array.isArray(nextTab.links)) {
          nextTab.links = nextTab.links.map((link) => ({
            ...link,
            url: resolveJsonPath(link?.url, filePath),
          }));
        }

        return nextTab;
      });
    }

    return nextBlock;
  }

  const resolved = { ...payload };

  if (Array.isArray(payload.images)) {
    resolved.images = payload.images.map((image) => ({
      ...image,
      src: resolveJsonPath(image?.src, filePath),
    }));
  }

  if (Array.isArray(payload.links)) {
    resolved.links = payload.links.map((link) => ({
      ...link,
      url: resolveJsonPath(link?.url, filePath),
    }));
  }

  if (Array.isArray(payload.content)) {
    resolved.content = payload.content.map((block) => resolveContentBlock(block));
  }

  if (Array.isArray(payload.certifications)) {
    resolved.certifications = payload.certifications.map((cert) => ({
      ...cert,
      image: resolveJsonPath(cert?.image, filePath),
      link: resolveJsonPath(cert?.link, filePath),
    }));
  }

  if (payload.profile?.photo) {
    resolved.profile = {
      ...payload.profile,
      photo: resolveJsonPath(payload.profile.photo, filePath),
    };
  }

  return resolved;
}

async function fetchJsonWithResolvedMedia(path) {
  const payload = await fetchJson(path);
  return resolveMediaPaths(payload, path);
}

async function loadTimelineSection(basePath, sectionConfig) {
  const ids = await fetchJson(joinPath(basePath, sectionConfig.index));
  const entries = await Promise.all(ids.map((id) => {
    const frontPath = joinPath(basePath, `${sectionConfig.itemsDir}/${id}/front.json`);
    return fetchJsonWithResolvedMedia(frontPath);
  }));

  const details = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const detailPath = joinPath(basePath, `${sectionConfig.itemsDir}/${id}/detail.json`);
        details[id] = await fetchJsonWithResolvedMedia(detailPath);
      } catch {
        // Allow missing detail files for entries that do not need a modal.
      }
    })
  );

  const sectionDetail = sectionConfig.detail
    ? await fetchJsonWithResolvedMedia(joinPath(basePath, sectionConfig.detail)).catch(() => null)
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
      const evidencePath = joinPath(basePath, `${sectionConfig.evidenceDir}/${id}.json`);
      evidence[id] = await fetchJsonWithResolvedMedia(evidencePath);
    })
  );

  return evidence;
}

async function loadModularContent(basePath) {
  const manifest = await fetchJson(joinPath(basePath, "manifest.json"));
  const meta = await fetchJsonWithResolvedMedia(joinPath(basePath, manifest.meta));

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
    const bioFront = await fetchJsonWithResolvedMedia(joinPath(basePath, bioConfig.front));
    data.bio = bioFront.bio || "";
  }
  if (bioConfig?.detail) {
    data.sectionDetails.bio = await fetchJsonWithResolvedMedia(joinPath(basePath, bioConfig.detail)).catch(() => null);
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
    const skillsFront = await fetchJsonWithResolvedMedia(joinPath(basePath, skillsConfig.front));
    data.skills = skillsFront.skills || [];
    data.skillRows = skillsFront.skillRows || [];
  }
  if (skillsConfig?.detail) {
    const sectionDetail = await fetchJsonWithResolvedMedia(joinPath(basePath, skillsConfig.detail)).catch(() => null);
    if (sectionDetail) {
      data.sectionDetails.skills = sectionDetail;
    }
  }
  data.skillEvidence = await loadSkillEvidence(basePath, skillsConfig || {});

  const certConfig = manifest.sections?.certifications;
  if (certConfig?.front) {
    const certFront = await fetchJsonWithResolvedMedia(joinPath(basePath, certConfig.front));
    data.certifications = certFront.certifications || [];
  }
  if (certConfig?.detail) {
    const sectionDetail = await fetchJsonWithResolvedMedia(joinPath(basePath, certConfig.detail)).catch(() => null);
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
