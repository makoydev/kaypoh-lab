/** Form controls own their own keys; typing in one must never reach a simulation shortcut. */
const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'])

/**
 * Whether a keydown should be left alone by the module shortcut handlers.
 *
 * Two reasons to bow out: the key is aimed at a form control, or it carries a browser/OS modifier.
 * ⌘C, ⌘R, ⌘P, Ctrl+F and ⌘1/2/3 belong to the browser — without this guard, copying text also
 * cycled the casing and printing also toggled the torque path. Shift is ours: it is the
 * "bigger step" modifier on the arrow keys.
 */
export function ignoreShortcut(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return true
  const target = e.target as HTMLElement | null
  if (!target) return false
  if (FORM_TAGS.has(target.tagName)) return true
  // `isContentEditable` is the real-browser answer; jsdom never sets it, so fall back to the attribute.
  return target.isContentEditable === true || target.closest?.('[contenteditable=""],[contenteditable="true"]') != null
}
