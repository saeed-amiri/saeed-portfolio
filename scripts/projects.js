// Duty: render the projects page from modular JSON content.
// Keeps project updates data-only by loading one folder per project.
import { openModal, setupModalDismissHandlers } from "./modal.js";
import { setMultilineText } from "./text.js";

const PROJECTS_BASE_PATH = "../content/projects";

const elements = {
  brandName: document.getElementById("brandName"),
  profilePhoto: document.getElementById("projectProfilePhoto"),
  ownerName: document.getElementById("projectOwnerName"),
  ownerHeadline: document.getElementById("projectOwnerHeadline"),
  ownerMeta: document.getElementById("projectOwnerMeta"),
  contactEmail: document.getElementById("projectContactEmail"),
  linkedin: document.getElementById("projectLinkedin"),
  github: document.getElementById("projectGithub"),
  content: document.getElementById("projectsContent"),
  railList: document.getElementById("projectRailList"),
  footer: document.getElementById("projectFooterText"),
};

const projectDetailsById = new Map();

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

function resolveProjectPath(path, filePath) {
  if (typeof path !== "string" || path.length === 0 || isAbsoluteOrExternalPath(path)) {
    return path;
  }

  if (path.startsWith("../") || path.startsWith("./") || !path.includes("/")) {
    return joinPath(dirname(filePath), path);
  }

  return path;
}

function resolveProjectDetail(detail, filePath) {
  if (!detail || typeof detail !== "object") {
    return detail;
  }

  const resolved = { ...detail };

  if (Array.isArray(detail.images)) {
    resolved.images = detail.images.map((image) => ({
      ...image,
      src: resolveProjectPath(image?.src, filePath),
    }));
  }

  if (Array.isArray(detail.content)) {
    resolved.content = detail.content.map((block) => {
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
          src: resolveProjectPath(image?.src, filePath),
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
          url: resolveProjectPath(link?.url, filePath),
        }));

        if (Array.isArray(nextBlock.items)) {
          nextBlock.items = resolvedLinks;
        }
        if (Array.isArray(nextBlock.links)) {
          nextBlock.links = resolvedLinks;
        }
      }

      return nextBlock;
    });
  }

  return resolved;
}

function renderProfile(profile = {}) {
  elements.brandName.textContent = profile.name || "Saeed Amiri";
  elements.ownerName.textContent = profile.name || "Saeed Amiri";
  elements.ownerHeadline.textContent = profile.headline || "Project Portfolio";
  elements.ownerMeta.textContent = profile.meta || "ML, MLOps, and Scientific Computing";

  if (profile.photo) {
    elements.profilePhoto.src = profile.photo;
  }

  if (profile.photoAlt) {
    elements.profilePhoto.alt = profile.photoAlt;
  }

  if (profile.email) {
    elements.contactEmail.href = `mailto:${profile.email}`;
    elements.contactEmail.textContent = profile.email;
  }

  if (profile.linkedin) {
    elements.linkedin.href = profile.linkedin;
  }

  if (profile.github) {
    elements.github.href = profile.github;
  }
}

function createProjectCard(projectId, project, moreLabel) {
  const item = document.createElement("article");
  item.className = "timeline-item";

  const title = document.createElement("h3");
  title.textContent = project.title || "Untitled Project";

  const detail = projectDetailsById.get(projectId);
  if (detail) {
    const headingRow = document.createElement("div");
    headingRow.className = "timeline-heading-row";

    const action = document.createElement("button");
    action.type = "button";
    action.className = "detail-trigger";
    action.dataset.action = "open-project-detail";
    action.dataset.projectId = projectId;
    action.textContent = moreLabel;

    headingRow.append(title, action);
    item.appendChild(headingRow);
  } else {
    item.appendChild(title);
  }

  const period = document.createElement("p");
  period.className = "period";
  setMultilineText(period, project.period || "Ongoing");

  const summary = document.createElement("p");
  setMultilineText(summary, project.summary || "Project summary coming soon.");

  item.append(period, summary);

  if (Array.isArray(project.links) && project.links.length) {
    const linksWrap = document.createElement("div");
    linksWrap.className = "quick-links";

    project.links.forEach((link) => {
      const anchor = document.createElement("a");
      anchor.className = "action-link";
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.textContent = link.label;
      linksWrap.appendChild(anchor);
    });

    item.appendChild(linksWrap);
  }

  return item;
}

function renderSection(section, projectsById, moreLabel) {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.id = section.id;

  const heading = document.createElement("h2");
  heading.textContent = section.title;
  panel.appendChild(heading);

  if (section.description) {
    const description = document.createElement("p");
    setMultilineText(description, section.description);
    panel.appendChild(description);
  }

  const timeline = document.createElement("div");
  timeline.className = "timeline";

  const projectIds = Array.isArray(section.projectIds) ? section.projectIds : [];
  projectIds.forEach((projectId) => {
    const project = projectsById.get(projectId);
    if (project) {
      timeline.appendChild(createProjectCard(projectId, project, moreLabel));
    }
  });

  panel.appendChild(timeline);
  elements.content.appendChild(panel);
}

function renderRail(sections) {
  elements.railList.innerHTML = "";

  sections.forEach((section) => {
    const item = document.createElement("li");
    const anchor = document.createElement("a");
    anchor.className = "rail-link";
    anchor.href = `#${section.id}`;
    anchor.setAttribute("aria-label", section.title);

    const dot = document.createElement("span");
    dot.className = "rail-dot";

    const label = document.createElement("span");
    label.className = "rail-label";
    label.textContent = section.railLabel || section.title;

    anchor.append(dot, label);
    item.appendChild(anchor);
    elements.railList.appendChild(item);
  });
}

async function loadProjectsData() {
  const manifest = await fetchJson(joinPath(PROJECTS_BASE_PATH, "manifest.json"));
  const sections = Array.isArray(manifest.sections) ? manifest.sections : [];

  const allProjectIds = [
    ...new Set(sections.flatMap((section) => (Array.isArray(section.projectIds) ? section.projectIds : []))),
  ];

  const projectsById = new Map();
  await Promise.all(
    allProjectIds.map(async (projectId) => {
      const projectBasePath = joinPath(PROJECTS_BASE_PATH, `projects/${projectId}`);
      const project = await fetchJson(joinPath(projectBasePath, "front.json"));

      try {
        const detailPath = joinPath(projectBasePath, "detail.json");
        const detail = await fetchJson(detailPath);
        projectDetailsById.set(projectId, resolveProjectDetail(detail, detailPath));
      } catch {
        // A project can intentionally omit detail.json and skip the More button.
      }

      projectsById.set(projectId, project);
    })
  );

  return { manifest, sections, projectsById };
}

async function renderProjectsPage() {
  const { manifest, sections, projectsById } = await loadProjectsData();
  const moreLabel = manifest.labels?.moreDetails || "More";

  if (manifest.pageTitle) {
    document.title = manifest.pageTitle;
  }

  renderProfile(manifest.profile);
  elements.content.innerHTML = "";

  sections.forEach((section) => {
    renderSection(section, projectsById, moreLabel);
  });

  renderRail(sections);

  elements.content.addEventListener("click", (event) => {
    const detailTrigger = event.target.closest('[data-action="open-project-detail"]');
    if (!detailTrigger) {
      return;
    }

    const detail = projectDetailsById.get(detailTrigger.dataset.projectId);
    if (!detail) {
      return;
    }

    openModal(detail);
  });

  setupModalDismissHandlers();

  if (manifest.footer) {
    elements.footer.textContent = manifest.footer;
  }
}

renderProjectsPage().catch((err) => {
  console.error(err);
  elements.content.innerHTML = "<section class='panel'><p>Failed to load project content.</p></section>";
});
