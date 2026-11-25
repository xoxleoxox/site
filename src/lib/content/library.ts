import { createContext } from 'svelte'

import type { EntryCollection } from './entries'
import type { EntryIndexFrontmatter } from './schema'

export interface LibraryConfig {
  entries: Record<EntryCollection, EntryIndexFrontmatter>
}

export const [get_library_config, set_library_config] = createContext<{
  current: LibraryConfig
}>()
