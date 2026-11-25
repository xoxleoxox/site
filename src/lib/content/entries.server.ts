import {
  entry_collections,
  entry_path,
  type CollectionEntry,
  type CollectionLabel,
  type EntryCollection,
  type EntryLink,
} from './entries'
import { page_count, paginate, read_content } from './query.server'
import { entry_index } from './relations'
import { entry_index_frontmatter_schema } from './schema'
import { entry_source } from './sources.server'
export { entry_source } from './sources.server'

export async function all_entry_entries(): Promise<CollectionEntry[]> {
  const groups = await Promise.all(
    entry_collections.map(async (collection) =>
      (await entry_source(collection).entries()).map((entry) => ({
        ...entry,
        collection,
      })),
    ),
  )

  return groups.flat()
}

export async function entry_links(): Promise<EntryLink[]> {
  const groups = await Promise.all(
    entry_collections.map(async (collection) => {
      const [document, entries] = await Promise.all([
        collection_document(collection),
        collection_entries(collection),
      ])
      const label = document.frontmatter.title

      return entries.map((entry) => ({
        collection: label,
        href: entry_path(collection, entry.id),
        id: `${collection}/${entry.id}`,
        published: entry.frontmatter.published,
        title: entry.frontmatter.title,
      }))
    }),
  )

  return groups
    .flat()
    .sort(
      (left, right) =>
        right.published.localeCompare(left.published) ||
        left.id.localeCompare(right.id),
    )
    .map(({ published: _published, ...entry }) => entry)
}

export async function collection_entries(
  collection: EntryCollection,
): Promise<CollectionEntry[]> {
  return (await entry_source(collection).entries()).map((entry) => ({
    ...entry,
    collection,
  }))
}

async function collection_document(collection: EntryCollection) {
  const document = await read_content(
    collection,
    entry_index_frontmatter_schema,
  )
  if (!document) throw new Error(`Missing content/${collection}.md.`)
  return document.document
}

export type { CollectionLabel }

export async function collection_labels(): Promise<
  Record<EntryCollection, CollectionLabel>
> {
  const labels = await Promise.all(
    entry_collections.map(async (collection) => {
      const document = await collection_document(collection)
      return [
        collection,
        {
          meta_label: document.frontmatter.meta_label,
          title: document.frontmatter.title,
        },
      ] as const
    }),
  )

  return Object.fromEntries(labels) as Record<
    EntryCollection,
    CollectionLabel
  >
}

export async function collection_page(
  collection: EntryCollection,
  page: number,
) {
  const [entries, document] = await Promise.all([
    all_entry_entries(),
    collection_document(collection),
  ])

  return {
    document,
    entries: paginate(
      entry_index(entries).filter(
        (entry) => entry.collection === collection,
      ),
      page,
    ),
  }
}

export async function collection_page_entries() {
  const indexed = entry_index(await all_entry_entries())

  return entry_collections.flatMap((collection) =>
    Array.from(
      {
        length: Math.max(
          0,
          page_count(
            indexed.filter((entry) => entry.collection === collection)
              .length,
          ) - 1,
        ),
      },
      (_, index) => ({ collection, page: String(index + 2) }),
    ),
  )
}

export function entry_route_entries() {
  return entry_collections.flatMap((collection) =>
    entry_source(collection)
      .keys()
      .map((entry) => ({ collection, entry })),
  )
}

export async function entry_page(collection: EntryCollection, id: string) {
  const [entry, entries] = await Promise.all([
    entry_source(collection).document(id),
    all_entry_entries(),
  ])
  if (!entry) return undefined

  const summary = entry_index(entries).find(
    (current) => current.collection === collection && current.id === id,
  )
  if (!summary) return undefined

  return {
    document: entry.document,
  }
}
