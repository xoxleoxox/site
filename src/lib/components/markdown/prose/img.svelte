<script lang="ts">
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'

  interface Props extends Record<string, unknown> {
    alt?: string
    class?: string
    decoding?: 'async' | 'auto' | 'sync'
    height?: number | string
    loading?: 'eager' | 'lazy'
    src?: string
    title?: string
    width?: number | string
  }

  function positive_number(value: number | string | undefined) {
    const number = Number(value)
    return Number.isFinite(number) && number > 0 ? number : undefined
  }

  type MediaState = 'failed' | 'pending' | 'ready'

  let {
    alt = '',
    class: class_name,
    decoding = 'async',
    height,
    loading = 'lazy',
    src,
    title,
    width,
    ...attributes
  }: Props = $props()

  let image: HTMLImageElement | undefined = $state()
  let lightbox: HTMLDialogElement | undefined = $state()
  let lightbox_open = $state(false)
  let media_state: MediaState = $state('pending')
  let current_src: string | undefined
  let source_initialized = false

  /** 同一篇正文里的图，放大后可左右切换 */
  let siblings: HTMLImageElement[] = $state([])
  let active_index = $state(0)
  let slide_direction = $state(0)
  let touch_start_x: number | null = null
  let ignore_click = false

  const active_image = $derived(siblings[active_index])
  const active_src = $derived(active_image?.src ?? src)
  const active_alt = $derived(active_image?.alt ?? alt)
  const has_siblings = $derived(siblings.length > 1)
  const can_previous = $derived(has_siblings && active_index > 0)
  const can_next = $derived(has_siblings && active_index < siblings.length - 1)

  const aspect_ratio = $derived.by(() => {
    const image_width = positive_number(width)
    const image_height = positive_number(height)

    if (image_width && image_height) {
      return `${image_width} / ${image_height}`
    }

    return '3 / 2'
  })

  function image_loaded() {
    media_state = 'ready'
  }

  function image_failed() {
    media_state = 'failed'
  }

  function open_lightbox() {
    if (!lightbox || lightbox.open) return

    const root = image?.closest('.comark-content') ?? image?.closest('article')
    const found = root
      ? Array.from(root.querySelectorAll<HTMLImageElement>('.media-frame img'))
      : []

    // 加载失败的图不参与切换（当前这张除外，否则点它会没有落点）
    siblings = (found.length > 0 ? found : image ? [image] : []).filter(
      (candidate) => candidate === image || candidate.naturalWidth > 0,
    )

    const index = image ? siblings.indexOf(image) : -1
    active_index = index >= 0 ? index : 0
    slide_direction = 0

    lightbox_open = true
    lightbox.showModal()
  }

  function close_lightbox() {
    ignore_click = false
    lightbox?.close()
  }

  function navigate(step: -1 | 1) {
    const next = active_index + step
    if (next < 0 || next >= siblings.length) return false

    slide_direction = step
    active_index = next
    return true
  }

  /** 切换动效；减动效偏好下不做位移和淡入 */
  function slide_transition() {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced) return { duration: 0 }

    return { x: slide_direction * 24, duration: 220, opacity: 0 }
  }

  function lightbox_keydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      navigate(-1)
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      navigate(1)
    }
  }

  function stage_touch_start(event: TouchEvent) {
    touch_start_x = event.touches[0]?.clientX ?? null
  }

  function stage_touch_end(event: TouchEvent) {
    if (touch_start_x === null) return

    const end = event.changedTouches[0]?.clientX ?? touch_start_x
    const distance = end - touch_start_x
    touch_start_x = null

    if (Math.abs(distance) < 40) return

    const changed = navigate(distance < 0 ? 1 : -1)
    if (!changed) return

    // 滑动换图之后浏览器还会补一次 click，别让它把预览关掉；
    // 有些环境不补 click，所以定时复位，避免吞掉下一次点击
    ignore_click = true
    setTimeout(() => {
      ignore_click = false
    }, 400)
  }

  function stage_click() {
    if (ignore_click) {
      ignore_click = false
      return
    }

    close_lightbox()
  }

  function lightbox_click(event: MouseEvent) {
    // 点遮罩（dialog 本体、而非图片或工具条）时关闭
    if (event.target === lightbox) close_lightbox()
  }

  $effect(() => {
    if (!source_initialized) {
      current_src = src
      source_initialized = true
      return
    }

    if (src === current_src) return
    current_src = src
    media_state = 'pending'
  })

  onMount(() => {
    if (!image || !image.complete) return
    media_state = image.naturalWidth > 0 ? 'ready' : 'failed'
  })
</script>

<figure class={class_name} data-state={media_state}>
  <div
    class="media-frame"
    data-content-media
    style:aspect-ratio={aspect_ratio}
  >
    <img
      {...attributes}
      {alt}
      {decoding}
      {height}
      {loading}
      {src}
      {width}
      bind:this={image}
      onerror={image_failed}
      onload={image_loaded}
    />
    <span aria-hidden="true" class="media-failure">图片无法显示</span>
    {#if src && media_state === 'ready'}
      <button
        type="button"
        class="media-zoom"
        aria-label={alt ? `放大图片：${alt}` : '放大图片'}
        onclick={open_lightbox}
      ></button>
    {/if}
  </div>
  {#if title}<figcaption>{title}</figcaption>{/if}
  {#if media_state === 'failed'}
    <span class="sr-only" role="status"
      >图片无法显示：{alt || '未提供替代文本'}</span
    >
  {/if}
</figure>

{#if src}
  <dialog
    bind:this={lightbox}
    class="lightbox"
    aria-label={active_alt ? `图片预览：${active_alt}` : '图片预览'}
    onclick={lightbox_click}
    onkeydown={lightbox_keydown}
    onclose={() => {
      lightbox_open = false
      ignore_click = false
    }}
  >
    <button
      type="button"
      class="lightbox-close"
      aria-label="关闭预览"
      onclick={close_lightbox}
    >
      <span aria-hidden="true">×</span>
    </button>
    {#if lightbox_open}
      <button
        type="button"
        class="lightbox-stage"
        aria-label="关闭预览"
        onclick={stage_click}
        ontouchstart={stage_touch_start}
        ontouchend={stage_touch_end}
      >
        {#key active_index}
          <img
            class="lightbox-image"
            src={active_src}
            alt={active_alt}
            decoding="async"
            in:fly={slide_transition()}
          />
        {/key}
      </button>

      {#if has_siblings}
        <button
          type="button"
          class="lightbox-arrow previous"
          aria-label="上一张"
          disabled={!can_previous}
          onclick={() => navigate(-1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          class="lightbox-arrow next"
          aria-label="下一张"
          disabled={!can_next}
          onclick={() => navigate(1)}
        >
          <span aria-hidden="true">›</span>
        </button>
        <p class="lightbox-count" aria-live="polite">
          {active_index + 1} / {siblings.length}{active_alt
            ? `：${active_alt}`
            : ''}
        </p>
      {/if}
    {/if}
  </dialog>
{/if}

<style>
  figure {
    inline-size: min(100%, 22rem);
    margin: var(--prose-block-gap) auto 0;
  }

  figure.wide {
    inline-size: 100%;
  }

  .media-frame {
    position: relative;
    inline-size: 100%;
    overflow: hidden;
    border: 1px solid var(--color-rule);
    background: var(--color-prose-surface);
  }

  .media-frame img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
    object-position: center;
    opacity: 0;
    transition: opacity 260ms ease-out;
  }

  figure[data-state='ready'] .media-frame img {
    opacity: 1;
  }

  figure[data-state='failed'] .media-frame img {
    opacity: 0;
  }

  .media-failure {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.45;
    opacity: 0;
    pointer-events: none;
  }

  figure[data-state='failed'] .media-failure {
    opacity: 1;
  }

  figcaption {
    margin-top: 0.625rem;
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.45;
  }

  /* 点击放大的透明命中层：覆盖在图片上，保持图片语义不变 */
  .media-zoom {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: block;
    inline-size: 100%;
    block-size: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: zoom-in;
  }

  .media-zoom:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: -2px;
  }

  .lightbox {
    inline-size: 100vi;
    block-size: 100vb;
    max-inline-size: 100vi;
    max-block-size: 100vb;
    margin: 0;
    padding: clamp(1rem, 4vi, 3rem);
    border: 0;
    background: transparent;
    cursor: zoom-out;
  }

  .lightbox[open] {
    display: grid;
    place-items: center;
  }

  .lightbox::backdrop {
    background: color-mix(in oklab, #000 84%, transparent);
  }

  .lightbox-stage {
    display: grid;
    place-items: center;
    min-inline-size: 0;
    min-block-size: 0;
    /* 别铺满整屏：最大跟正文栏同宽，高度留出上下呼吸 */
    max-inline-size: min(100%, 48rem);
    max-block-size: 76vb;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: zoom-out;
  }

  .lightbox-stage:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 4px;
  }

  .lightbox-image {
    max-inline-size: 100%;
    /* 直接用视口单位限制高度：stage 只有 max-height，百分比解析不出来 */
    max-block-size: 76vb;
    inline-size: auto;
    block-size: auto;
    object-fit: contain;
  }

  .lightbox-close {
    position: fixed;
    inset-block-start: clamp(0.75rem, 3vi, 1.5rem);
    inset-inline-end: clamp(0.75rem, 3vi, 1.5rem);
    display: grid;
    place-items: center;
    inline-size: 2.5rem;
    block-size: 2.5rem;
    padding: 0;
    border: 1px solid color-mix(in oklab, #fff 35%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, #000 45%, transparent);
    color: #fff;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
  }

  .lightbox-close:hover,
  .lightbox-close:focus-visible {
    background: color-mix(in oklab, #000 65%, transparent);
  }

  .lightbox-close:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .lightbox-arrow {
    position: fixed;
    inset-block-start: 50%;
    display: grid;
    place-items: center;
    inline-size: 2.75rem;
    block-size: 2.75rem;
    padding: 0;
    border: 1px solid color-mix(in oklab, #fff 35%, transparent);
    border-radius: 999px;
    background: color-mix(in oklab, #000 45%, transparent);
    color: #fff;
    font-size: 1.6rem;
    line-height: 1;
    cursor: pointer;
    transform: translateY(-50%);
  }

  .lightbox-arrow.previous {
    inset-inline-start: clamp(0.75rem, 3vi, 1.5rem);
  }

  .lightbox-arrow.next {
    inset-inline-end: clamp(0.75rem, 3vi, 1.5rem);
  }

  .lightbox-arrow:hover:not(:disabled) {
    background: color-mix(in oklab, #000 65%, transparent);
  }

  .lightbox-arrow:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  .lightbox-arrow:disabled {
    opacity: 0.25;
    pointer-events: none;
  }

  .lightbox-count {
    position: fixed;
    inset-block-end: clamp(0.75rem, 3vi, 1.5rem);
    inset-inline: 0;
    z-index: 1;
    margin: 0 auto;
    color: color-mix(in oklab, #fff 78%, transparent);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  :global(body:has(.lightbox[open])) {
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    img {
      transition: none;
    }
  }
</style>
