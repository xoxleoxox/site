<script lang="ts">
  import { onMount } from 'svelte'

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
    lightbox_open = true
    lightbox.showModal()
  }

  function close_lightbox() {
    lightbox?.close()
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
    aria-label={alt ? `图片预览：${alt}` : '图片预览'}
    onclick={lightbox_click}
    onclose={() => (lightbox_open = false)}
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
      <img class="lightbox-image" {src} {alt} decoding="async" />
    {/if}
    <a
      class="lightbox-original"
      href={src}
      target="_blank"
      rel="noopener noreferrer">原图</a
    >
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

  img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
    object-position: center;
    opacity: 0;
    transition: opacity 260ms ease-out;
  }

  figure[data-state='ready'] img {
    opacity: 1;
  }

  figure[data-state='failed'] img {
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
    gap: 0.75rem;
    grid-template-rows: minmax(0, 1fr) auto;
  }

  .lightbox::backdrop {
    background: color-mix(in oklab, #000 84%, transparent);
  }

  .lightbox-image {
    max-inline-size: 100%;
    max-block-size: 100%;
    inline-size: auto;
    block-size: auto;
    object-fit: contain;
    cursor: default;
    animation: lightbox-fade-in 160ms ease-out;
  }

  @keyframes lightbox-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
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

  .lightbox-original {
    justify-self: center;
    color: color-mix(in oklab, #fff 82%, transparent);
    font-size: 0.75rem;
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }

  :global(body:has(.lightbox[open])) {
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    img {
      transition: none;
    }

    .lightbox-image {
      animation: none;
    }
  }
</style>
