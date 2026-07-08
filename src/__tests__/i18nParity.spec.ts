// @vitest-environment node
import { describe, it, expect } from 'vitest'

import en from '@/i18n/messages/en'
import ja from '@/i18n/messages/ja'

// vue-i18n is configured with fallbackLocale: 'en', which means a key missing from ja.ts
// would silently render the English value instead of failing (Pitfall 7). That masking hides
// gaps until a user notices English text leaking through a Japanese UI. This test removes the
// mask: it recursively collects every dotted key path from each locale object and asserts the
// two sets are exactly equal, so en and ja can never drift out of parity - across ALL blocks
// (nav/app/dashboard/search/validation/card/chart/wmo/detail/notFound/settings).

// Recursively flatten a nested message object into its set of dotted leaf key paths.
// e.g. { card: { retry: 'x' } } -> ['card.retry']
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value && typeof value === 'object'
      ? keyPaths(value as Record<string, unknown>, path)
      : [path]
  })
}

describe('i18n en/ja key parity', () => {
  it('has an identical key set in both locales', () => {
    const enKeys = keyPaths(en).sort()
    const jaKeys = keyPaths(ja).sort()

    // Sorted arrays make the diff readable when a mismatch is introduced.
    expect(jaKeys).toEqual(enKeys)
  })
})
