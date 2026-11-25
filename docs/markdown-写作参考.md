# 本站 Markdown 写法参考

> 适用于本站内容目录（`content/**/*.md`）。本文按站点实际启用的解析器 **comark + 插件** 核对整理（comark 0.6.2，2026-11-25）。标 ✅ 的都已在本地渲染验证。
>
> 注意：VSCode / GitHub 的普通 Markdown 预览**不认识**本文里的扩展写法（`:组件`、`::块`、`+++` frontmatter、`$公式$` 等），会原样显示。要看真实效果，用 `npm run dev` 本地起站，或看线上页面。

## 1. 文章头信息（frontmatter，TOML）

用 `+++` 包住（**不是** `---`），必须放在文件最开头。

```toml
+++
title = "文章标题"                 # 必填
summary = "列表里显示的一句话摘要"   # 文章必填
published = "2026-11-25"           # 必填，ISO 日期；要带引号
updated = "2026-11-26"             # 可选
description = "给别人看的简介"      # 可选
font = "serif"                     # 可选，默认 sans
+++
```

## 2. 标准 Markdown（CommonMark + GFM，全支持）

标题 `#`~`######`、**粗体**、*斜体*、~~删除线~~、`` `行内代码` ``、[链接](https://example.com)、![图片](img.webp)、`>` 引用、有序/无序列表、`---` 分隔线、表格（`:---` / `:---:` / `---:` 控制对齐）、任务列表 `- [x]` / `- [ ]`。

## 3. 元素属性 `{...}` ✅

加在粗体 / 斜体 / 链接 / 图片 / 行内代码后面：

```markdown
**重点**{#important .highlight}
[链接](https://x.com){target="_blank" .external}
![图](a.webp){width="800"}
[一段被包起来的文字]{.yellow}
```

## 4. 行内组件 `:名字[内容]` ✅

- `:accent[文字]` — 强调色（衬线字体）
- `:mark[文字]` — 荧光 / 波浪下划线标记
- `:kbd[Ctrl]` — 键盘键位
- `:sup[2]` / `:sub[2]` — 上标 / 下标

可带属性：`:accent[文字]{.某个class}`；单独占一行也合法。

## 5. 块组件 `::名字{属性}` … `::` ✅

```markdown
::details{summary="点我展开"}
里面是折叠内容，支持 **Markdown**。
::

::block{align="center" font="serif"}
居中的一段排版块。
::
```

- `details` 支持 `summary`、`open`（默认展开）
- `block` 支持 `align`（start/center/end/justify）、`font`（sans/serif）
- 另有 `definition-list` / `definition-term` / `definition-description` 三个可拼定义列表，但较繁琐，一般直接用普通列表即可
- **嵌套组件要用更多冒号**：外层 `::`，内层 `:::`，再往里 `::::`

## 6. 提示块（GitHub 风格）✅

```markdown
> [!NOTE]
> 这是一条提示。
```

支持 `NOTE` / `TIP` / `IMPORTANT` / `WARNING` / `CAUTION`。

> 别写成 `::: tip`（那是别的框架的语法），本站不认。

## 7. 脚注 ✅

```markdown
正文引用[^1]。

[^1]: 这是脚注内容。
```

文末自动汇总，默认小标题「脚注」。

## 8. 数学公式 ✅（KaTeX）

行内 `$E=mc^2$`；块级：

```markdown
$$
\int_0^1 x^2\,dx
$$
```

公式在浏览器端渲染，SSR 出来的 HTML 里看不到，属正常。

## 9. 代码块（含高亮）✅

````markdown
```ts
const a = 1
```
```js [server.js]        ← 带文件名
```js {1-3,5}            ← 行高亮
```js {1-3} [utils.ts]   ← 组合
````

高亮主题为站点的 rangi（eclat）。

## 10. 两个坑

- **中文排版交给引擎**：中英文之间自动加空格、标点前空格自动清理。不要手动敲这些空格，敲了也会被 normalize。
- **预览工具不认扩展写法**：见文首提示。
