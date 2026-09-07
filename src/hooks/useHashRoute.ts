import { useCallback, useEffect, useState } from 'react'
import type { Route } from '../types/simulation'
import { moduleById } from '../lib/modules'

/** `#/` → workshop hub · `#/sim/<module-id>` → simulation. Unknown modules fall back to the hub. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'sim' && parts[1]) {
    const mod = moduleById(parts[1])
    if (mod && mod.status === 'active') return { name: 'sim', moduleId: mod.id }
  }
  return { name: 'hub' }
}

export function routeToHash(route: Route) {
  return route.name === 'sim' ? `#/sim/${route.moduleId}` : '#/'
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    const hash = routeToHash(next)
    if (window.location.hash === hash) setRoute(next)
    else window.location.hash = hash
  }, [])

  return { route, navigate }
}
