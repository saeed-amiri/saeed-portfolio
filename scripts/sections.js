// Duty: section-level rendering and metadata.
// Responsible for content blocks, list rendering, and detail-trigger buttons.
import { elements } from "./elements.js";
import { setMultilineText } from "./text.js";

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
      panel.dataset.sectionKey === "bio" ||
      panel.dataset.sectionKey === "trainings" ||
      panel.dataset.sectionKey === "education" ||
      panel.dataset.sectionKey === "experience" ||
      panel.dataset.sectionKey === "skills"
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
    const roleLine = document.createElement("span");
    roleLine.className = "timeline-role";
    setMultilineText(roleLine, entry.role);

    const orgLine = document.createElement("span");
    orgLine.className = "timeline-org";
    setMultilineText(orgLine, entry.org);

    title.append(roleLine, orgLine);

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
    setMultilineText(period, entry.period);

    const summary = document.createElement("p");
    setMultilineText(summary, entry.summary);

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

  const inlineTabsBlock = Array.isArray(data.sectionDetails?.skills?.content)
    ? data.sectionDetails.skills.content.find(
        (block) => block && typeof block === "object" && (block.type || "").toLowerCase() === "tabs"
      )
    : null;

  const inlineTabs = Array.isArray(inlineTabsBlock?.tabs)
    ? inlineTabsBlock.tabs.filter((tab) => tab && typeof tab === "object")
    : [];

  if (inlineTabs.length) {
    const tabsWrap = document.createElement("section");
    tabsWrap.className = "modal-tabs";

    const tabList = document.createElement("div");
    tabList.className = "modal-tab-list";
    tabList.setAttribute("role", "tablist");

    const panelsWrap = document.createElement("div");
    panelsWrap.className = "modal-tab-panels";

    const tabNodes = [];
    const panelNodes = [];

    function appendBodyBlock(content, target) {
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

      target.appendChild(body);
    }

    function appendBulletsBlock(items, target) {
      if (!Array.isArray(items) || !items.length) {
        return;
      }

      const list = document.createElement("ul");
      items.forEach((item) => {
        const li = document.createElement("li");
        setMultilineText(li, item);
        list.appendChild(li);
      });
      target.appendChild(list);
    }

    function appendImagesBlock(images, fallbackTitle, target) {
      if (!Array.isArray(images) || !images.length) {
        return;
      }

      const imageWrap = document.createElement("div");
      imageWrap.className = "modal-images";

      images.forEach((image) => {
        const img = document.createElement("img");
        img.src = image.src;
        img.alt = image.alt || fallbackTitle || "Skill image";
        imageWrap.appendChild(img);
      });

      target.appendChild(imageWrap);
    }

    function appendLinksBlock(links, target) {
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

      target.appendChild(linksWrap);
    }

    function appendBlocks(blocks, fallbackTitle, target) {
      blocks.forEach((block) => {
        if (typeof block === "string") {
          appendBodyBlock(block, target);
          return;
        }

        if (!block || typeof block !== "object") {
          return;
        }

        const type = (block.type || "").toLowerCase();
        if (type === "summary") {
          const summary = document.createElement("p");
          setMultilineText(summary, block.text ?? block.value ?? "");
          target.appendChild(summary);
          return;
        }

        if (type === "body" || type === "text" || type === "html") {
          appendBodyBlock(block.text ?? block.body ?? block.html ?? block.value, target);
          return;
        }

        if (type === "bullets" || type === "list") {
          appendBulletsBlock(block.items ?? block.bullets, target);
          return;
        }

        if (type === "images" || type === "image") {
          appendImagesBlock(block.items ?? block.images, fallbackTitle, target);
          return;
        }

        if (type === "links") {
          appendLinksBlock(block.items ?? block.links, target);
        }
      });
    }

    inlineTabs.forEach((tab, index) => {
      const tabId = `skills-tab-${tab.id || index}`;
      const panelId = `skills-panel-${tab.id || index}`;

      const tabButton = document.createElement("button");
      tabButton.type = "button";
      tabButton.className = "modal-tab-button";
      tabButton.id = tabId;
      tabButton.setAttribute("role", "tab");
      tabButton.setAttribute("aria-controls", panelId);
      tabButton.setAttribute("aria-selected", "false");
      tabButton.tabIndex = -1;
      tabButton.textContent = tab.label || tab.title || `Tab ${index + 1}`;

      const panel = document.createElement("section");
      panel.className = "modal-tab-panel hidden";
      panel.id = panelId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);

      if (Array.isArray(tab.content)) {
        appendBlocks(tab.content, tab.title || tab.label, panel);
      }

      tabList.appendChild(tabButton);
      panelsWrap.appendChild(panel);
      tabNodes.push(tabButton);
      panelNodes.push(panel);
    });

    function activateTab(nextIndex) {
      tabNodes.forEach((tabNode, index) => {
        const active = index === nextIndex;
        tabNode.setAttribute("aria-selected", String(active));
        tabNode.tabIndex = active ? 0 : -1;
        panelNodes[index].classList.toggle("hidden", !active);
      });
    }

    tabList.addEventListener("click", (event) => {
      const tabNode = event.target.closest(".modal-tab-button");
      if (!tabNode) {
        return;
      }
      const index = tabNodes.indexOf(tabNode);
      if (index >= 0) {
        activateTab(index);
      }
    });

    tabList.addEventListener("keydown", (event) => {
      const currentIndex = tabNodes.findIndex((tabNode) => tabNode.getAttribute("aria-selected") === "true");
      if (currentIndex === -1) {
        return;
      }

      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabNodes.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabNodes.length) % tabNodes.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabNodes.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      activateTab(nextIndex);
      tabNodes[nextIndex].focus();
    });

    activateTab(0);
    tabsWrap.append(tabList, panelsWrap);
    elements.skillsList.appendChild(tabsWrap);
    return;
  }

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
      setMultilineText(details, row.items);

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
