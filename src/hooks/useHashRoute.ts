import { useCallback, useEffect, useState } from 'react'
import type { Route } from '../types/simulation'
import { moduleById } from '../lib/modules'

/**
 * `#/` → workshop hub · `#/sim/<module-id>` → simulation. Unknown modules fall back to the hub.
 * Draft modules are only routable when `allowDrafts` is set (dev builds), so work in progress can be
 * viewed without flipping the catalog status.
 */
export function parseRoute(hash: string, allowDrafts = false): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'sim' && parts[1]) {
    const mod = moduleById(parts[1])
    if (mod && (mod.status === 'active' || allowDrafts)) return { name: 'sim', moduleId: mod.id }
  }
  return { name: 'hub' }
}

const ALLOW_DRAFTS = import.meta.env.DEV

export function routeToHash(route: Route) {
  return route.name === 'sim' ? `#/sim/${route.moduleId}` : '#/'
}

/** Site title, matching index.html. */
export const SITE_TITLE = 'HowLikeDat — See how things actually jalan inside'

/** Tab title for a route: module first, so open tabs and history entries stay tellable apart. */
export function routeTitle(route: Route) {
  const name = route.name === 'sim' ? moduleById(route.moduleId)?.name : undefined
  return name ? `${name} — HowLikeDat` : SITE_TITLE
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash, ALLOW_DRAFTS))

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash, ALLOW_DRAFTS))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    document.title = routeTitle(route)
  }, [route])

  const navigate = useCallback((next: Route) => {
    const hash = routeToHash(next)
    if (window.location.hash === hash) setRoute(next)
    else window.location.hash = hash
  }, [])

  return { route, navigate }
}
