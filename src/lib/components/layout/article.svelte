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
      /* 封面交接要正文不短于交接行程 S，否则滚到 d > A 就开始露底，页底还会压住页脚。
         这里必须绑 S 而不是「一屏」：今天窄屏 S = 100lvh（app.css 的窄屏覆写），两者数值相同，
         但 S 一旦调大（更慢的交接）这条就会跟着变够。
         也别改成 dvh：地址栏出现时 dvh 比 lvh 小，纸面就盖不住了。
         原作首页正文比一屏高，碰不到这条边界，所以原作没写 */
      min-height: var(--stage-transition-span);
    }

    .article-content {
      --article-floating-clearance: calc(
        3.5rem + env(safe-area-inset-bottom)
      );

      padding-block-end: max(3rem, var(--article-floating-clearance));
    }
  }
</style>
