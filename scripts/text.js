// Duty: safe text rendering helpers.
// Keeps text escaping intact while allowing newline display as line breaks.
const ALLOWED_HTML_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "code",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "sub",
  "sup",
  "u",
  "ul",
]);

function appendMultilineText(element, text) {
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    if (index > 0) {
      element.appendChild(document.createElement("br"));
    }
    element.appendChild(document.createTextNode(line));
  });
}

function looksLikeHtml(text) {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function isSafeHref(href) {
  return /^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(href);
}

function sanitizeNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tag = node.tagName.toLowerCase();
  if (!ALLOWED_HTML_TAGS.has(tag)) {
    const fragment = document.createDocumentFragment();
    node.childNodes.forEach((child) => {
      const cleanChild = sanitizeNode(child);
      if (cleanChild) {
        fragment.appendChild(cleanChild);
      }
    });
    return fragment;
  }

  const cleanElement = document.createElement(tag);

  if (tag === "a") {
    const href = node.getAttribute("href") || "";
    if (href && isSafeHref(href)) {
      cleanElement.setAttribute("href", href);
      if (/^https?:/i.test(href)) {
        cleanElement.setAttribute("target", "_blank");
        cleanElement.setAttribute("rel", "noopener noreferrer");
      }
    }
  }

  node.childNodes.forEach((child) => {
    const cleanChild = sanitizeNode(child);
    if (cleanChild) {
      cleanElement.appendChild(cleanChild);
    }
  });

  return cleanElement;
}

function appendSanitizedHtml(element, html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.childNodes.forEach((node) => {
    const cleanNode = sanitizeNode(node);
    if (cleanNode) {
      element.appendChild(cleanNode);
    }
  });
}

export function setMultilineText(element, value) {
  const text = value == null ? "" : String(value);

  element.textContent = "";

  if (!looksLikeHtml(text)) {
    appendMultilineText(element, text);
    return;
  }

  appendSanitizedHtml(element, text);
}