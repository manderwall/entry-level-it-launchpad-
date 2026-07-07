// Shared modal behavior: focus trap, initial focus, Escape-to-close,
// backdrop-click-to-close, and returning focus to whatever triggered the
// modal on close. Used by splash.mjs, help.mjs, and the Settings dialog
// in common.mjs so keyboard/screen-reader users get consistent behavior
// everywhere instead of three separate half-implementations.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Wires an already-appended overlay element for accessible modal behavior.
 * @param {HTMLElement} overlay - the `.splash-overlay` element, already in the DOM.
 * @param {() => void} [onClose] - extra cleanup to run when the modal closes.
 * @returns {() => void} a `close()` function you can also call programmatically.
 */
export function trapModal(overlay, onClose) {
  const previouslyFocused = document.activeElement;

  function focusables() {
    return [...overlay.querySelectorAll(FOCUSABLE)];
  }

  const first = focusables()[0];
  if (first) first.focus();
  else overlay.setAttribute("tabindex", "-1"), overlay.focus();

  function onKeydown(e) {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    if (e.shiftKey && document.activeElement === firstItem) {
      e.preventDefault();
      lastItem.focus();
    } else if (!e.shiftKey && document.activeElement === lastItem) {
      e.preventDefault();
      firstItem.focus();
    }
  }

  function onBackdropClick(e) {
    if (e.target === overlay) close();
  }

  function close() {
    document.removeEventListener("keydown", onKeydown);
    overlay.removeEventListener("click", onBackdropClick);
    overlay.remove();
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    if (onClose) onClose();
  }

  document.addEventListener("keydown", onKeydown);
  overlay.addEventListener("click", onBackdropClick);

  return close;
}
