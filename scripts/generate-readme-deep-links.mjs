#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const README_PATH = path.join(repoRoot, "README.md");
const CV_BASE_URL = "https://saeed-amiri.github.io/saeed-portfolio/";
const PROJECTS_BASE_URL = "https://saeed-amiri.github.io/saeed-portfolio/pages/projects.html";

const START_MARKER = "<!-- BEGIN AUTO-DEEP-LINKS -->";
const END_MARKER = "<!-- END AUTO-DEEP-LINKS -->";

function readJson(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasFile(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function cvLink(type, id, sectionId) {
  return `${CV_BASE_URL}?open=${type}:${id}#${sectionId}`;
}

function projectsLink(projectId, sectionId) {
  return `${PROJECTS_BASE_URL}?open=project:${projectId}#${sectionId}`;
}

function bulletLinks(links) {
  if (!links.length) {
    return ["- None"];
  }
  return links.map((link) => `- \`${link}\``);
}

function buildGeneratedSection() {
  const experienceIds = readJson("content/en/sections/experience/index.json");
  const trainingIds = readJson("content/en/sections/trainings/index.json");
  const educationIds = readJson("content/en/sections/education/index.json");
  const skillEvidenceIds = readJson("content/en/sections/skills/evidence/index.json");

  const projectManifest = readJson("content/projects/manifest.json");
  const projectSections = Array.isArray(projectManifest.sections) ? projectManifest.sections : [];

  const projectEntries = [];
  projectSections.forEach((section) => {
    const sectionId = section?.id;
    const projectIds = Array.isArray(section?.projectIds) ? section.projectIds : [];
    projectIds.forEach((projectId) => {
      const detailPath = `content/projects/projects/${projectId}/detail.json`;
      if (sectionId && hasFile(detailPath)) {
        projectEntries.push({ projectId, sectionId });
      }
    });
  });

  const lines = [
    START_MARKER,
    "",
    "Regenerate this section:",
    "",
    "`node scripts/generate-readme-deep-links.mjs`",
    "",
    "You can open a page, jump to a section, and open a specific `More` modal directly from one URL.",
    "",
    "Rule:",
    "",
    "`<page-url>?open=<type>:<id>#<sectionId>`",
    "",
    "Alternative explicit form:",
    "",
    "`<page-url>?detailType=<type>&detailId=<id>#<sectionId>`",
    "",
    "How it works:",
    "",
    "- `open=<type>:<id>` tells the JavaScript which modal to open.",
    "- `#<sectionId>` scrolls to the section anchor.",
    "- Modal open happens after content render, so it works for dynamic content.",
    "",
    "Your example explained:",
    "",
    "- `https://saeed-amiri.github.io/saeed-portfolio/?open=experience:exp-mlops-engineer#experienceSection`",
    "- `experience` = modal group",
    "- `exp-mlops-engineer` = specific item id",
    "- `experienceSection` = scroll target in the CV page",
    "",
    "### CV page deep links (`index.html`)",
    "",
    "Base URL:",
    "",
    `\`${CV_BASE_URL}\``,
    "",
    "Experience `More` links:",
    "",
    ...bulletLinks(experienceIds.map((id) => cvLink("experience", id, "experienceSection"))),
    "",
    "Training `More` links:",
    "",
    ...bulletLinks(trainingIds.map((id) => cvLink("training", id, "trainingsSection"))),
    "",
    "Education `More` links:",
    "",
    ...bulletLinks(educationIds.map((id) => cvLink("education", id, "educationSection"))),
    "",
    "Skill evidence `More` links:",
    "",
    ...bulletLinks(skillEvidenceIds.map((id) => cvLink("skill", id, "skillsSection"))),
    "",
    "### Projects page deep links (`pages/projects.html`)",
    "",
    "Base URL:",
    "",
    `\`${PROJECTS_BASE_URL}\``,
    "",
    "Project `More` links:",
    "",
    ...bulletLinks(projectEntries.map(({ projectId, sectionId }) => projectsLink(projectId, sectionId))),
    "",
    "Alternative explicit form (German Load Forecast):",
    "",
    "- `https://saeed-amiri.github.io/saeed-portfolio/pages/projects.html?detailType=project&detailId=german-load-forecast#featured-projects`",
    "",
    "Note:",
    "",
    "- A project link only opens a modal if that project has a `detail.json` file.",
    "",
    END_MARKER,
  ];

  return lines.join("\n");
}

function replaceDeepLinksSection(readmeText, generatedBlock) {
  const markerPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, "m");
  if (markerPattern.test(readmeText)) {
    return readmeText.replace(markerPattern, generatedBlock);
  }

  const sectionHeader = "## Deep links for More buttons";
  const sectionStart = readmeText.indexOf(sectionHeader);
  if (sectionStart === -1) {
    throw new Error(`Cannot find section header: ${sectionHeader}`);
  }

  const afterHeader = readmeText.indexOf("\n", sectionStart + sectionHeader.length);
  const remainder = readmeText.slice(afterHeader + 1);
  const nextHeadingRelative = remainder.search(/^##\s+/m);
  const sectionEnd = nextHeadingRelative === -1 ? readmeText.length : afterHeader + 1 + nextHeadingRelative;

  const before = readmeText.slice(0, afterHeader + 1);
  const after = readmeText.slice(sectionEnd);
  const blockWithSpacing = `\n${generatedBlock}\n\n`;
  return `${before}${blockWithSpacing}${after}`;
}

function main() {
  const readme = fs.readFileSync(README_PATH, "utf8");
  const generatedBlock = buildGeneratedSection();
  const updatedReadme = replaceDeepLinksSection(readme, generatedBlock);

  if (updatedReadme !== readme) {
    fs.writeFileSync(README_PATH, updatedReadme);
    console.log("Updated README deep links section.");
  } else {
    console.log("README deep links section already up to date.");
  }
}

main();