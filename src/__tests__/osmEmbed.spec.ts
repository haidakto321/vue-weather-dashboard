import { describe, it, expect } from 'vitest'

import { buildOsmEmbedUrl } from '@/lib/osmEmbed'

describe('buildOsmEmbedUrl', () => {
  it('builds a bbox centered on the point with a matching marker (London)', () => {
    const url = buildOsmEmbedUrl(51.5085, -0.1257)
    expect(url).toBe(
      'https://www.openstreetmap.org/export/embed.html?bbox=-0.1757,51.4585,-0.0757,51.5585&layer=mapnik&marker=51.5085,-0.1257',
    )
  })

  it('handles the 0,0 origin point without a malformed bbox', () => {
    const url = buildOsmEmbedUrl(0, 0)
    expect(url).toBe(
      'https://www.openstreetmap.org/export/embed.html?bbox=-0.0500,-0.0500,0.0500,0.0500&layer=mapnik&marker=0.0000,0.0000',
    )
  })
})
