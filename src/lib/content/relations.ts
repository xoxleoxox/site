import type { CollectionEntry, EntryCollection } from './entries'

export interface EntrySummary {
  collection: EntryCollection
  id: string
  published: string
  summary: string
  title: string
  updated?: string
}

function compare_entries(left: EntrySummary, right: EntrySummary) {
  return (
    right.published.localeCompare(left.published) ||
    left.id.localeCompare(right.id)
  )
}

export function entry_index(entries: CollectionEntry[]): EntrySummary[] {
  return entries
    .map((entry) => ({
      collection: entry.collection,
      id: entry.id,
      published: entry.frontmatter.published,
      summary: entry.frontmatter.summary,
      title: entry.frontmatter.title,
      updated: entry.frontmatter.updated,
    }))
    .sort(compare_entries)
}
