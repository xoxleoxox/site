<script lang="ts">
  import { observe_viewport_threshold } from '$lib/browser/viewport-threshold'
  import TableOfContents from '$lib/components/navigation/table-of-contents.svelte'
  import type { Snippet } from 'svelte'

  import { get_page_chrome } from './page-chrome'
  import PaperDeck from './paper-deck.svelte'

  interface Props {
    children?: Snippet
    has_footer?: boolean
  }

  let { children, has_footer = false }: Props = $props()
  const chrome = get_page_chrome()
  const observe_content = observe_viewport_threshold({
    ratio: 0.6,
    on_change(active) {
      chrome.content_active = active
    },
  })
</script>

<article id="content" class="article" {@attach observe_content}>
  <PaperDeck edge={has_footer} top_edge>
    <div class="article-content">
      {@render children?.()}
    </div>
  </PaperDeck>
  {#if chrome.toc.length}
    <TableOfContents entries={chrome.toc} />
  {/if}
</article>

<style>
  .article {
    display: flex;
    flex: 1;
    width: 100%;
    max-width: var(--frame-measure);
    margin: 0 auto;
    flex-direction: column;
  }

  .article-content {
    flex: 1;
    padding-block: clamp(1.75rem, 3vw, 2.5rem) clamp(3rem, 7vw, 5rem);
    padding-inline: var(--inline-gutter);
  }

  .article :global(.toc-rail) {
    position: fixed;
    top: 50svh;
    left: var(--content-rail-start);
    transform: translateY(-50%);
  }

  @media (width < 40rem) {
    .article {
      position: relative;
      z-index: 22;
      /* 窄屏保留「纸面盖住 hero」：hero 钉住一个视口，正文从下方滑上来盖住它 */
      margin-top: calc(-1 * var(--stage-transition-span));
      /* 封面交接要正文至少一屏高：正文短于一屏时，hero 底部的 intro 会从正文下沿露出来，
         靠到页底还会压住页脚。原作首页正文比一屏高，碰不到这条边界，所以原作没写 */
      min-height: var(--stable-viewport-block);
    }

    .article-content {
      --article-floating-clearance: calc(
        3.5rem + env(safe-area-inset-bottom)
      );

      padding-block-end: max(3rem, var(--article-floating-clearance));
    }
  }
</style>
