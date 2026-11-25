import { entry_collections } from '$lib/content/entries'
import {
  all_entry_entries,
  collection_labels,
} from '$lib/content/entries.server'
import { extract_headings } from '$lib/content/headings'
import { content_dependency } from '$lib/content/hmr'
import { read_content } from '$lib/content/query.server'
import { entry_index } from '$lib/content/relations'
import { home_frontmatter_schema } from '$lib/content/schema'

import type { PageServerLoad } from './$types'

export const prerender = true

export const load: PageServerLoad = async ({ depends }) => {
  depends(content_dependency('home'))
  entry_collections.forEach((collection) => {
    depends(content_dependency(collection))
  })

  const [home, entries, labels] = await Promise.all([
    read_content('home', home_frontmatter_schema),
    all_entry_entries(),
    collection_labels(),
  ])
  if (!home) throw new Error('Missing content/home.md.')

  const indexed_entries = entry_index(entries)

  return {
    collection_labels: labels,
    document: home.document,
    recent: indexed_entries.slice(0, 6),
    toc: extract_headings(home.document.nodes),
  }
}
