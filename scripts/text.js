// Duty: safe text rendering helpers.
// Keeps text escaping intact while allowing newline display as line breaks.
export function setMultilineText(element, value) {
  const text = value == null ? "" : String(value);
  const lines = text.split("\n");

  element.textContent = "";
  lines.forEach((line, index) => {
    if (index > 0) {
      element.appendChild(document.createElement("br"));
    }
    element.appendChild(document.createTextNode(line));
  });
}