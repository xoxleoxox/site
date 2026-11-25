<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props extends Record<string, unknown> {
    children?: Snippet
    class?: string
    label?: string
    layout?: string
  }

  const layouts = ['scroll', 'grid'] as const
  type Layout = (typeof layouts)[number]

  let {
    children,
    class: class_name,
    label = '图片',
    layout = 'scroll',
    ...attributes
  }: Props = $props()

  const active_layout = $derived(
    (layouts as readonly string[]).includes(layout)
      ? (layout as Layout)
      : 'scroll',
  )
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  {...attributes}
  class={['gallery', class_name].filter(Boolean).join(' ')}
  data-layout={active_layout}
  role="group"
  aria-label={label}
  tabindex={active_layout === 'scroll' ? 0 : undefined}
>
  {@render children?.()}
</div>

<style>
  .gallery {
    margin-top: var(--prose-block-gap);
  }

  .gallery:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  /* 横向滑动：一张一张吸附（推特式相册） */
  .gallery[data-layout='scroll'] {
    display: flex;
    padding-block-end: 0.35rem;
    gap: 0.75rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .gallery[data-layout='scroll']::-webkit-scrollbar {
    display: none;
  }

  /* 桌面端 hover / 聚焦时露出细滚动条，暗示可横向滚动 */
  .gallery[data-layout='scroll']:hover,
  .gallery[data-layout='scroll']:focus-visible {
    scrollbar-width: thin;
  }

  .gallery[data-layout='scroll']:hover::-webkit-scrollbar,
  .gallery[data-layout='scroll']:focus-visible::-webkit-scrollbar {
    display: block;
    block-size: 6px;
  }

  .gallery[data-layout='scroll']::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-rule) 70%, transparent);
  }

  .gallery[data-layout='scroll'] :global(figure) {
    flex: 0 0 min(86%, 26rem);
    inline-size: auto;
    margin: 0;
    scroll-snap-align: center;
  }

  /* 只有一张图时不留「下一页」的空白 */
  .gallery[data-layout='scroll'] :global(figure:only-child) {
    flex-basis: 100%;
  }

  /* 九宫格式：两列网格 */
  .gallery[data-layout='grid'] {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .gallery[data-layout='grid'] :global(figure) {
    inline-size: 100%;
    margin: 0;
  }

  @media (width < 34rem) {
    .gallery[data-layout='grid'] {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
