import { entry_collections, entry_path } from './entries'
import { all_entry_entries } from './entries.server'
import { entry_index } from './relations'

export interface SitemapEntry {
  lastmod?: string
  path: string
}

function latest_date(entries: { published: string; updated?: string }[]) {
  return entries.reduce<string | undefined>((latest, entry) => {
    const date = entry.updated ?? entry.published
    return !latest || date > latest ? date : latest
  }, undefined)
}

/**
 * Public, canonical routes only. Pagination is intentionally excluded
 * because its first page already has a canonical collection route.
 */
export async function sitemap_entries(): Promise<SitemapEntry[]> {
  const indexed_entries = entry_index(await all_entry_entries())
  const collection_entries = new Map(
    entry_collections.map((collection) => [
      collection,
      indexed_entries.filter((entry) => entry.collection === collection),
    ]),
  )

  return [
    { lastmod: latest_date(indexed_entries), path: '/' },
    { path: '/about' },
    { path: '/friends' },
    ...entry_collections.map((collection) => ({
      lastmod: latest_date(collection_entries.get(collection) ?? []),
      path: entry_path(collection),
    })),
    ...indexed_entries.map((entry) => ({
      lastmod: entry.updated ?? entry.published,
      path: entry_path(entry.collection, entry.id),
    })),
  ].sort((left, right) => left.path.localeCompare(right.path))
}
