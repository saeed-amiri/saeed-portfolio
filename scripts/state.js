// Duty: shared runtime state for current UI session.
// All modules read/write this object instead of duplicating state.
export const state = {
  lang: getInitialLang(),
  activeSectionKey: null,
  content: null,
};

function getInitialLang() {
  try {
    return localStorage.getItem("lang") || "en";
  } catch {
    return "en";
  }
}
