import { describe, it, expect } from 'vitest'

// SETUP-03 sanity test: proves Vitest is wired and runs.
describe('sample', () => {
  it('does basic math', () => {
    expect(1 + 1).toBe(2)
  })
})
