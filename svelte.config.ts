import vercel from '@sveltejs/adapter-vercel'
import type { Config } from '@sveltejs/kit'

const config = {
  kit: {
    adapter: vercel(),
  },
} satisfies Config

export default config
