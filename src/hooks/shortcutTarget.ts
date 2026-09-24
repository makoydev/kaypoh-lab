/** Controls that consume every key: typing in one must never reach a simulation shortcut. */
const TEXT_TAGS = new Set(['TEXTAREA', 'SELECT'])
/** Keys a focused button, checkbox or radio acts on itself. */
const ACTIVATION_KEYS = new Set([' ', 'Enter'])
/** Keys a focused range input moves its thumb with. */
const RANGE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'])
const PRESSABLE_INPUTS = new Set(['button', 'submit', 'reset', 'checkbox', 'radio'])
/** Stepping keys may auto-repeat when held; toggles and gear shifts must fire once per press. */
const REPEATABLE = new Set(['ArrowLeft', 'ArrowRight', ',', '.', '<', '>'])

/** The keys a focused element handles itself, or `'all'` when it swallows everything. */
function ownedKeys(target: HTMLElement): Set<string> | 'all' | null {
  if (TEXT_TAGS.has(target.tagName)) return 'all'
  if (target.tagName === 'BUTTON') return ACTIVATION_KEYS
  if (target.tagName === 'INPUT') {
    const type = (target as HTMLInputElement).type
    if (type === 'range') return RANGE_KEYS
    return PRESSABLE_INPUTS.has(type) ? ACTIVATION_KEYS : 'all'
  }
  // `isContentEditable` is the real-browser answer; jsdom never sets it, so fall back to the attribute.
  if (target.isContentEditable === true || target.closest?.('[contenteditable=""],[contenteditable="true"]') != null) return 'all'
  return null
}

/**
 * Whether a keydown should be left alone by the module shortcut handlers.
 *
 * Four reasons to bow out:
 * - Something earlier already claimed the key (an open popover or sheet closing on Esc).
 * - The key carries a browser/OS modifier. ⌘C, ⌘R, ⌘P, Ctrl+F and ⌘1/2/3 belong to the browser;
 *   without this guard, copying text also cycled the casing and printing also toggled the torque
 *   path. Shift is ours: it is the "bigger step" modifier on the arrow keys.
 * - The key is auto-repeating and is not a stepping key, so holding Space or C does not flicker.
 * - The focused control handles that key itself. A clicked button keeps focus, so a button only
 *   claims Space and Enter (otherwise one click on a HUD control silenced every shortcut); a
 *   slider claims its arrows; a text field claims everything.
 */
export function ignoreShortcut(e: KeyboardEvent) {
  if (e.defaultPrevented) return true
  if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return true
  if (e.repeat && !REPEATABLE.has(e.key)) return true
  const target = e.target as HTMLElement | null
  if (!target?.tagName) return false
  const owned = ownedKeys(target)
  return owned === 'all' || (owned !== null && owned.has(e.key))
}
