import { entry_collections } from '$lib/content/entries'
import { content_dependency } from '$lib/content/hmr'
import type { LibraryConfig } from '$lib/content/library'
import { read_content } from '$lib/content/query.server'
import { entry_index_frontmatter_schema } from '$lib/content/schema'

import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ depends }) => {
  entry_collections.forEach((collection) => {
    depends(content_dependency(collection))
  })

  const entries = await Promise.all(
    entry_collections.map(async (collection) => {
      const document = await read_content(
        collection,
        entry_index_frontmatter_schema,
      )
      if (!document) throw new Error(`Missing content/${collection}.md.`)
      return [collection, document.document.frontmatter] as const
    }),
  )

  return {
    library: {
      entries: Object.fromEntries(entries) as LibraryConfig['entries'],
    },
  }
}
