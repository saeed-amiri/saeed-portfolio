// Duty: section-level rendering and metadata.
// Responsible for content blocks, list rendering, and detail-trigger buttons.
import { elements } from "./elements.js";

export function initializeSectionMetadata() {
  elements.sectionPanels.forEach((panel, index) => {
    panel.dataset.sectionIndex = String(index);
    panel.dataset.hasDetails = "false";
  });
}

export function annotateSectionDetailAvailability(sectionDetails) {
  elements.sectionPanels.forEach((panel) => {
    const key = panel.dataset.sectionKey;
    panel.dataset.hasDetails = sectionDetails[key] ? "true" : "false";
  });
}

export function ensureSectionDetailTriggers(data) {
  elements.sectionPanels.forEach((panel) => {
    if (
      panel.dataset.sectionKey === "trainings" ||
      panel.dataset.sectionKey === "education" ||
      panel.dataset.sectionKey === "experience"
    ) {
      const existingTrigger = panel.querySelector(".section-heading-row .detail-trigger");
      if (existingTrigger) {
        existingTrigger.classList.add("hidden");
      }
      return;
    }

    const heading = panel.querySelector("h2");
    if (!heading) {
      return;
    }

    let row = panel.querySelector(".section-heading-row");
    if (!row) {
      row = document.createElement("div");
      row.className = "section-heading-row";
      heading.parentNode.insertBefore(row, heading);
      row.appendChild(heading);
    }

    let trigger = row.querySelector(".detail-trigger");
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "detail-trigger";
      trigger.dataset.action = "open-section-detail";
      trigger.dataset.sectionKey = panel.dataset.sectionKey;
      row.appendChild(trigger);
    }

    trigger.textContent = data.labels.moreDetails;
    trigger.classList.toggle("hidden", panel.dataset.hasDetails !== "true");
  });
}

export function fillTimeline(container, entries, entryType) {
  container.innerHTML = "";
  entries.forEach((entry, index) => {
    const wrap = document.createElement("article");
    wrap.className = "timeline-item";
    wrap.dataset.entryType = entryType;
    wrap.dataset.entryId = entry.id || `${entryType}-${index}`;

    const title = document.createElement("h3");
    title.textContent = `${entry.role} - ${entry.org}`;

    if (entryType === "trainings" || entryType === "education" || entryType === "experience") {
      const headingRow = document.createElement("div");
      headingRow.className = "timeline-heading-row";

      const action = document.createElement("button");
      action.type = "button";
      action.className = "detail-trigger";
      action.dataset.action =
        entryType === "trainings"
          ? "open-training-detail"
          : entryType === "education"
            ? "open-education-detail"
            : "open-experience-detail";

      if (entryType === "trainings") {
        action.dataset.trainingId = entry.id || `training-${index}`;
      } else if (entryType === "education") {
        action.dataset.educationId = entry.id || `education-${index}`;
      } else {
        action.dataset.experienceId = entry.id || `experience-${index}`;
      }

      action.textContent = "More";

      headingRow.append(title, action);
      wrap.appendChild(headingRow);
    } else {
      wrap.appendChild(title);
    }

    const period = document.createElement("p");
    period.className = "period";
    period.textContent = entry.period;

    const summary = document.createElement("p");
    summary.textContent = entry.summary;

    wrap.append(period, summary);

    container.appendChild(wrap);
  });
}

export function fillCertifications(entries) {
  elements.certGrid.innerHTML = "";
  entries.forEach((entry, index) => {
    const card = document.createElement("article");
    card.className = "cert-card";
    card.dataset.entryType = "certification";
    card.dataset.entryId = entry.id || `cert-${index}`;

    const image = document.createElement("img");
    image.src = entry.image;
    image.alt = entry.title;

    const anchor = document.createElement("a");
    anchor.href = entry.link;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = entry.title;

    card.append(image, anchor);
    elements.certGrid.appendChild(card);
  });
}

export function renderSkills(data) {
  elements.skillsList.innerHTML = "";

  if (Array.isArray(data.skillRows) && data.skillRows.length) {
    const list = document.createElement("div");
    list.className = "skills-cv-list";

    data.skillRows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "skills-cv-row";

      const heading = document.createElement("h3");
      heading.className = "skills-cv-title";
      heading.textContent = row.category;

      const details = document.createElement("p");
      details.className = "skills-cv-text";
      details.textContent = row.items;

      item.append(heading, details);
      list.appendChild(item);
    });

    elements.skillsList.appendChild(list);
    return;
  }

  if (!data.skills.length) {
    const empty = document.createElement("p");
    empty.className = "meta";
    empty.textContent = data.labels.noSkillsYet;
    elements.skillsList.appendChild(empty);
    return;
  }

  data.skills.forEach((skill, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skill-chip";
    button.dataset.action = "open-skill-evidence";
    button.dataset.skillId = skill.id || `skill-${index}`;
    button.textContent = skill.name;
    elements.skillsList.appendChild(button);
  });
}
