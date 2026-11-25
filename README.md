# xoxleoxoxのSPACE

lithium_peko 的个人站点：SvelteKit + comark 的静态站点，内容全部由 `content/` 下的 Markdown 驱动，部署在 Vercel。

线上地址：<https://kessoku.bond>

## 本地开发

需要 Node 22+ 与 pnpm 11（版本写在 `package.json` 的 `devEngines`）。

```bash
pnpm install
pnpm dev        # 本地开发
pnpm check      # svelte-check 类型检查
pnpm build      # 生产构建（adapter-vercel）
pnpm preview    # 预览构建产物
pnpm lint       # oxlint
pnpm fmt        # oxfmt
```

## 内容

- `content/site.md`：站点标题、SEO、菜单、页脚、注释等全局配置
- `content/home.md`、`about.md`、`friends.md`、`records.md`、`fragment.md`：各页面与版块配置
- `content/records/*.md`、`content/fragment/*.md`：文章，frontmatter 用 TOML（`title` / `summary` / `published`，可选 `updated`、`font` 等）
- Markdown 支持的写法（含 `::gallery` 相册）见 [`docs/markdown-写作参考.md`](docs/markdown-写作参考.md)

## 部署

推送到 `main` 后由 Vercel 自动构建，生产域名 `kessoku.bond`；`www` 308 跳转到裸域名。

## 许可

代码以 [EUPL-1.2](LICENSE) 发布。本站基于 [caelyreth/site](https://github.com/caelyreth/site)（原作者 Yu）修改而来，保留了原项目的许可与出处。
