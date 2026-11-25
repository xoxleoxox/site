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

  let scroller: HTMLDivElement | undefined = $state()
  let scrollable = $state(false)
  let can_previous = $state(false)
  let can_next = $state(false)

  function figures() {
    if (!scroller) return [] as HTMLElement[]
    return Array.from(scroller.querySelectorAll('figure')) as HTMLElement[]
  }

  /** 每张图在「居中吸附」下对应的 scrollLeft */
  function snap_positions() {
    if (!scroller) return [] as number[]

    const viewport = scroller.clientWidth
    const max = Math.max(0, scroller.scrollWidth - viewport)

    return figures().map((figure) =>
      Math.min(
        max,
        Math.max(0, figure.offsetLeft - (viewport - figure.clientWidth) / 2),
      ),
    )
  }

  function current_index(positions: number[]) {
    if (!scroller || positions.length === 0) return 0

    const position = Math.abs(scroller.scrollLeft)
    let nearest = 0

    positions.forEach((candidate, index) => {
      if (
        Math.abs(candidate - position) <
        Math.abs(positions[nearest] - position)
      ) {
        nearest = index
      }
    })

    return nearest
  }

  function measure() {
    if (!scroller) return

    const positions = snap_positions()
    const index = current_index(positions)

    scrollable = positions.length > 1 && scroller.scrollWidth > scroller.clientWidth + 4
    can_previous = scrollable && index > 0
    can_next = scrollable && index < positions.length - 1
  }

  function scroll_by(direction: -1 | 1) {
    if (!scroller) return

    const positions = snap_positions()
    if (positions.length === 0) return

    const target = positions[current_index(positions) + direction]
    if (target === undefined) return

    const reduce_motion = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches

    scroller.scrollTo({
      left: target,
      behavior: reduce_motion ? 'auto' : 'smooth',
    })
  }

  $effect(() => {
    if (active_layout !== 'scroll' || !scroller) {
      scrollable = false
      return
    }

    const element = scroller
    measure()

    const resize_observer = new ResizeObserver(measure)
    resize_observer.observe(element)

    // 懒加载的图落地后宽度会变，重新判断是否可滚
    element.addEventListener('load', measure, true)
    window.addEventListener('resize', measure)

    return () => {
      resize_observer.disconnect()
      element.removeEventListener('load', measure, true)
      window.removeEventListener('resize', measure)
    }
  })
</script>

<div class="gallery-shell">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    {...attributes}
    bind:this={scroller}
    class={['gallery', class_name].filter(Boolean).join(' ')}
    data-layout={active_layout}
    role="group"
    aria-label={label}
    tabindex={active_layout === 'scroll' ? 0 : undefined}
    onscroll={measure}
  >
    {@render children?.()}
  </div>

  {#if active_layout === 'scroll' && scrollable}
    <button
      type="button"
      class="gallery-arrow previous"
      aria-label="上一张"
      disabled={!can_previous}
      onclick={() => scroll_by(-1)}
    >
      <span aria-hidden="true">‹</span>
    </button>
    <button
      type="button"
      class="gallery-arrow next"
      aria-label="下一张"
      disabled={!can_next}
      onclick={() => scroll_by(1)}
    >
      <span aria-hidden="true">›</span>
    </button>
  {/if}
</div>

<style>
  .gallery-shell {
    position: relative;
    margin-top: var(--prose-block-gap);
  }

  .gallery {
    margin: 0;
  }

  .gallery:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  /* 横向滑动：一张一张吸附（推特式相册） */
  .gallery[data-layout='scroll'] {
    display: flex;
    padding-block: 0.15rem;
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

  /* 左右箭头：替代滚动条，提示可横滑 */
  .gallery-arrow {
    position: absolute;
    inset-block-start: 50%;
    z-index: 2;
    display: grid;
    place-items: center;
    inline-size: 2rem;
    block-size: 2rem;
    padding: 0;
    border: 1px solid var(--color-rule);
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-paper) 92%, transparent);
    color: var(--color-ink);
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
    transform: translateY(-50%);
    transition:
      opacity 140ms ease-out,
      background-color 140ms ease-out;
  }

  .gallery-arrow.previous {
    inset-inline-start: -0.35rem;
  }

  .gallery-arrow.next {
    inset-inline-end: -0.35rem;
  }

  .gallery-arrow:hover:not(:disabled) {
    background: var(--color-paper);
  }

  .gallery-arrow:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .gallery-arrow:disabled {
    opacity: 0;
    pointer-events: none;
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

    .gallery-arrow {
      inline-size: 1.75rem;
      block-size: 1.75rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .gallery-arrow {
      transition: none;
    }
  }
</style>
