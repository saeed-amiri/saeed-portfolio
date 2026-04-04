const contentMap = {
  en: "content/en.json",
  de: "content/de.json",
};

const state = {
  lang: localStorage.getItem("lang") || "en",
};

const elements = {
  langEn: document.getElementById("langEn"),
  langDe: document.getElementById("langDe"),
  downloadPdf: document.getElementById("downloadPdf"),
  fullName: document.getElementById("fullName"),
  brandName: document.getElementById("brandName"),
  headline: document.getElementById("headline"),
  location: document.getElementById("location"),
  contactEmail: document.getElementById("contactEmail"),
  linkedin: document.getElementById("linkedin"),
  github: document.getElementById("github"),
  profilePhoto: document.getElementById("profilePhoto"),
  bioTitle: document.getElementById("bioTitle"),
  bioText: document.getElementById("bioText"),
  featuredTitle: document.getElementById("featuredTitle"),
  thesisLink: document.getElementById("thesisLink"),
  mlopsLink: document.getElementById("mlopsLink"),
  experienceTitle: document.getElementById("experienceTitle"),
  educationTitle: document.getElementById("educationTitle"),
  certTitle: document.getElementById("certTitle"),
  experienceList: document.getElementById("experienceList"),
  educationList: document.getElementById("educationList"),
  certGrid: document.getElementById("certGrid"),
  footerText: document.getElementById("footerText"),
};

function setLanguageButtonState() {
  elements.langEn.classList.toggle("active", state.lang === "en");
  elements.langDe.classList.toggle("active", state.lang === "de");
}

function fillTimeline(container, entries) {
  container.innerHTML = "";
  entries.forEach((entry) => {
    const wrap = document.createElement("article");
    wrap.className = "timeline-item";

    const title = document.createElement("h3");
    title.textContent = `${entry.role} - ${entry.org}`;

    const period = document.createElement("p");
    period.className = "period";
    period.textContent = entry.period;

    const summary = document.createElement("p");
    summary.textContent = entry.summary;

    wrap.append(title, period, summary);
    container.appendChild(wrap);
  });
}

function fillCertifications(entries) {
  elements.certGrid.innerHTML = "";
  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "cert-card";

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

async function loadContent(lang) {
  const path = contentMap[lang];
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

function applyContent(data) {
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

  elements.featuredTitle.textContent = data.labels.featured;
  elements.thesisLink.href = data.links.thesis.url;
  elements.thesisLink.textContent = data.links.thesis.label;

  elements.mlopsLink.href = data.links.mlops.url;
  elements.mlopsLink.textContent = data.links.mlops.label;

  elements.experienceTitle.textContent = data.labels.experience;
  elements.educationTitle.textContent = data.labels.education;
  elements.certTitle.textContent = data.labels.certifications;

  fillTimeline(elements.experienceList, data.experience);
  fillTimeline(elements.educationList, data.education);
  fillCertifications(data.certifications);

  elements.footerText.textContent = data.footer;
  elements.downloadPdf.textContent = data.labels.downloadPdf;
}

async function render(lang) {
  state.lang = lang;
  localStorage.setItem("lang", lang);
  setLanguageButtonState();

  const data = await loadContent(lang);
  applyContent(data);
}

function setupEvents() {
  elements.langEn.addEventListener("click", () => render("en"));
  elements.langDe.addEventListener("click", () => render("de"));
  elements.downloadPdf.addEventListener("click", () => window.print());
}

setupEvents();
render(state.lang).catch((err) => {
  console.error(err);
  document.body.innerHTML = "<main style='padding:1rem;'>Failed to load portfolio content.</main>";
});
