import { describe, it, expect } from 'vitest'

import { isTrustedOrigin } from '@/lib/widgetMessages'

describe('isTrustedOrigin', () => {
  it('returns true when the origin exactly matches the allowed origin', () => {
    expect(isTrustedOrigin('http://localhost:5174', 'http://localhost:5174')).toBe(true)
  })

  it('returns false for a different origin', () => {
    expect(isTrustedOrigin('http://evil.example', 'http://localhost:5174')).toBe(false)
  })

  it('returns false for a matching host on a different port', () => {
    expect(isTrustedOrigin('http://localhost:9999', 'http://localhost:5174')).toBe(false)
  })
})
