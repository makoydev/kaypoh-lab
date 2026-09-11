import { describe, expect, it } from 'vitest'
import { parseRoute, routeTitle, routeToHash, SITE_TITLE } from '../useHashRoute'

describe('parseRoute', () => {
  it('defaults to the hub', () => {
    expect(parseRoute('')).toEqual({ name: 'hub' })
    expect(parseRoute('#/')).toEqual({ name: 'hub' })
    expect(parseRoute('#garbage')).toEqual({ name: 'hub' })
  })

  it('opens the simulation for a live module', () => {
    expect(parseRoute('#/sim/v8-engine')).toEqual({ name: 'sim', moduleId: 'v8-engine' })
    expect(parseRoute('#sim/v8-engine')).toEqual({ name: 'sim', moduleId: 'v8-engine' })
    expect(parseRoute('#/sim/turbofan')).toEqual({ name: 'sim', moduleId: 'turbofan' })
    expect(parseRoute('#/sim/escapement')).toEqual({ name: 'sim', moduleId: 'escapement' })
  })

  it('refuses drafts and unknown modules', () => {
    expect(parseRoute('#/sim/differential')).toEqual({ name: 'hub' })
    expect(parseRoute('#/sim/does-not-exist')).toEqual({ name: 'hub' })
  })

  it('lets dev builds open drafts, but never unknown modules', () => {
    expect(parseRoute('#/sim/differential', true)).toEqual({ name: 'sim', moduleId: 'differential' })
    expect(parseRoute('#/sim/does-not-exist', true)).toEqual({ name: 'hub' })
  })

  it('round-trips through routeToHash', () => {
    const sim = { name: 'sim', moduleId: 'v8-engine' } as const
    expect(parseRoute(routeToHash(sim))).toEqual(sim)
    expect(parseRoute(routeToHash({ name: 'hub' }))).toEqual({ name: 'hub' })
  })
})

describe('routeTitle', () => {
  it('names the module on a simulation route', () => {
    expect(routeTitle({ name: 'sim', moduleId: 'v8-engine' })).toBe('V8 Engine — HowLikeDat')
    expect(routeTitle({ name: 'sim', moduleId: 'escapement' })).toBe('Mechanical Watch Escapement — HowLikeDat')
  })

  it('falls back to the site title for the hub and for unknown modules', () => {
    expect(routeTitle({ name: 'hub' })).toBe(SITE_TITLE)
    expect(routeTitle({ name: 'sim', moduleId: 'does-not-exist' })).toBe(SITE_TITLE)
  })
})
