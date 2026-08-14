# DSH Web GUI CSS token 表（--dsw-*）

> 来源：应用 dist `index.css`（`body{...}` 浅色块与 `body[data-ds-dark-theme]{...}` 深色块），
> 随构建可能增减；需要最新全集时用 `curl -s http://127.0.0.1:64287/assets/<index-*.css>` 重新提取。
> 深色列标 "—" 表示该 token 未在深色块中重定义（沿用浅色值）。

## 用法要点

- 全部定义在 `<body>` 上，后代继承；覆盖时写在 `body[data-ds-skin="<id>"]` /
  `body[data-ds-dark-theme][data-ds-skin="<id>"]` 作用域下即可胜过官方（见 architecture.md）。
- 常用分组：
  - **表面**：`bg-base`（应用框架）/ `bg-layer-1..3`（卡片层级）/ `bg-module-platform` /
    `bg-overlay` / `specific-sidebar-fill`（侧栏）/ `specific-bubble`（聊天气泡）/
    `specific-input-major`（输入框）/ `specific-menu`（菜单）/ `tooltip-bg`
  - **文字**：`label-primary / secondary / tertiary / caption / dimmed`
  - **边框**：`border-l1 / l2 / l3 / l4`
  - **品牌**：`brand-primary / brand-text / button-primary-fill`
  - **代码块**：`markdown-code-block / markdown-code-block-banner / markdown-inline-code`
  - **滚动条**：`scrollbar-bg-l1 / scrollbar-hover-l1 / scrollbar-bg-l2 / scrollbar-hover-l2`

## 全集（L=浅色主题，D=深色主题）

| Token | L | D |
|---|---|---|
| `dsw-alias-bg-base` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-950)` |
| `dsw-alias-bg-layer-1` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-875)` |
| `dsw-alias-bg-layer-2` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-850)` |
| `dsw-alias-bg-layer-3` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-alias-bg-mask-1` | `rgba(0, 0, 0, .24)` | `rgba(0, 0, 0, .5)` |
| `dsw-alias-bg-mask-2` | `rgba(0, 0, 0, .12)` | `rgba(0, 0, 0, .2)` |
| `dsw-alias-bg-mask-3` | `rgba(0, 0, 0, .48)` | `rgba(0, 0, 0, .48)` |
| `dsw-alias-bg-mask-drop` | `rgba(255, 255, 255, .7)` | `rgba(39, 39, 48, .7)` |
| `dsw-alias-bg-mask-photo` | `rgba(0, 0, 0, .88)` | `rgba(0, 0, 0, .88)` |
| `dsw-alias-bg-module-platform` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-alias-bg-multi-select` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-850)` |
| `dsw-alias-bg-overlay` | `var(--dsw-static-neutral-bluish-150)` | `var(--dsw-static-neutral-bluish-700)` |
| `dsw-alias-bg-skeleton` | `rgba(0, 0, 0, .04)` | `rgba(255, 255, 255, .08)` |
| `dsw-alias-border-inverted` | `rgba(0, 0, 0, 0)` | `rgba(255, 255, 255, .06)` |
| `dsw-alias-border-inverted2` | `rgba(0, 0, 0, 0)` | `rgba(255, 255, 255, .08)` |
| `dsw-alias-border-l1` | `rgba(0, 0, 0, .04)` | `rgba(255, 255, 255, .06)` |
| `dsw-alias-border-l2` | `rgba(0, 0, 0, .1)` | `rgba(255, 255, 255, .12)` |
| `dsw-alias-border-l2-darkmode-thin` | `rgba(0, 0, 0, .1)` | `rgba(255, 255, 255, .06)` |
| `dsw-alias-border-l3` | `rgba(0, 0, 0, .12)` | `rgba(255, 255, 255, .16)` |
| `dsw-alias-border-l4` | `rgba(0, 0, 0, .16)` | `rgba(255, 255, 255, .2)` |
| `dsw-alias-brand-primary` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` |
| `dsw-alias-brand-primary-invert` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` |
| `dsw-alias-brand-primary-new-colorprimary-new-color` | `rgb(65, 118, 230)` | `var(--dsw-static-deepseek-450)` |
| `dsw-alias-brand-text` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` |
| `dsw-alias-button-contrast-fill` | `var(--dsw-static-neutral-bluish-700)` | `var(--dsw-static-neutral-bluish-50)` |
| `dsw-alias-button-elevated-fill` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-750)` |
| `dsw-alias-button-floating-fill` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-850)` |
| `dsw-alias-button-floating-hover` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-alias-button-ghost-active-border` | `var(--dsw-static-neutral-bluish-500)` | `var(--dsw-static-neutral-bluish-600)` |
| `dsw-alias-button-ghost-active-fill` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-750)` |
| `dsw-alias-button-ghost-active-hover` | `var(--dsw-static-neutral-bluish-150)` | `var(--dsw-static-neutral-bluish-700)` |
| `dsw-alias-button-info-fill` | `var(--dsw-static-deepseek-500)` | `var(--dsw-static-deepseek-400)` |
| `dsw-alias-button-info-hover` | `var(--dsw-static-deepseek-400)` | `var(--dsw-static-deepseek-500)` |
| `dsw-alias-button-primary-dimmed` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-750)` |
| `dsw-alias-button-primary-fill` | `var(--dsw-alias-brand-primary)` | `var(--dsw-alias-brand-primary)` |
| `dsw-alias-button-primary-hover` | `var(--dsw-static-neutral-bluish-750)` | `var(--dsw-static-neutral-bluish-100)` |
| `dsw-alias-button-tool-bar-fill` | `rgba(84, 85, 87, .5)` | `rgba(84, 85, 87, .5)` |
| `dsw-alias-button-tool-bar-fill-invisible` | `rgba(31, 31, 31, .36)` | `rgba(31, 31, 31, .36)` |
| `dsw-alias-button-tool-bar-hover` | `rgba(84, 85, 87, .6)` | `rgba(84, 85, 87, .6)` |
| `dsw-alias-interactive-bg-active` | `rgba(38, 49, 72, .1)` | `rgba(255, 255, 255, .14)` |
| `dsw-alias-interactive-bg-hover` | `rgba(38, 49, 72, .06)` | `rgba(255, 255, 255, .08)` |
| `dsw-alias-interactive-bg-hover-accent` | `rgba(38, 49, 72, .14)` | `rgba(255, 255, 255, .24)` |
| `dsw-alias-interactive-bg-hover-danger` | `rgba(236, 19, 19, .05)` | `rgba(242, 90, 90, .15)` |
| `dsw-alias-interactive-bg-hover-solid` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-alias-label-caption` | `var(--dsw-static-neutral-bluish-400)` | `var(--dsw-static-neutral-bluish-600)` |
| `dsw-alias-label-dimmed` | `var(--dsw-static-neutral-bluish-200)` | `var(--dsw-static-neutral-bluish-750)` |
| `dsw-alias-label-primary` | `var(--dsw-static-neutral-bluish-1000)` | `var(--dsw-static-neutral-bluish-50)` |
| `dsw-alias-label-primary-bluish` | `var(--dsw-static-blue-900)` | `var(--dsw-static-neutral-bluish-50)` |
| `dsw-alias-label-primary-dimmed` | `var(--dsw-static-neutral-bluish-950)` | `var(--dsw-static-neutral-bluish-100)` |
| `dsw-alias-label-primary-foreground` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-1000)` |
| `dsw-alias-label-primary-inverted` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-alias-label-secondary` | `var(--dsw-static-neutral-bluish-700)` | `var(--dsw-static-neutral-bluish-300)` |
| `dsw-alias-label-tertiary` | `var(--dsw-static-neutral-bluish-600)` | `var(--dsw-static-neutral-bluish-400)` |
| `dsw-alias-markdown-citation` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-alias-markdown-code-block` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-900)` |
| `dsw-alias-markdown-code-block-banner` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-850)` |
| `dsw-alias-markdown-code-segment-selected` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-alias-markdown-code-segment-unselected` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-900)` |
| `dsw-alias-markdown-inline-code` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-850)` |
| `dsw-alias-markdown-placeholder` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-bluish-850)` |
| `dsw-alias-markdown-tag` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-850)` |
| `dsw-alias-scrollbar-bg-l1` | `var(--dsw-static-neutral-200)` | `var(--dsw-static-neutral-700)` |
| `dsw-alias-scrollbar-bg-l2` | `var(--dsw-static-neutral-200)` | `var(--dsw-static-neutral-600)` |
| `dsw-alias-scrollbar-hover-l1` | `var(--dsw-static-neutral-300)` | `var(--dsw-static-neutral-600)` |
| `dsw-alias-scrollbar-hover-l2` | `var(--dsw-static-neutral-300)` | `var(--dsw-static-neutral-550)` |
| `dsw-alias-state-business-primary` | `var(--dsw-static-deepseek-500)` | `var(--dsw-static-deepseek-400)` |
| `dsw-alias-state-business-tertiary` | `var(--dsw-static-deepseek-100)` | `var(--dsw-static-deepseek-800)` |
| `dsw-alias-state-error-primary` | `var(--dsw-static-red-600)` | `var(--dsw-static-red-400)` |
| `dsw-alias-state-error-secondary` | `var(--dsw-static-red-400)` | `var(--dsw-static-red-400)` |
| `dsw-alias-state-success-primary` | `var(--dsw-static-green-500)` | `var(--dsw-static-green-500)` |
| `dsw-alias-state-success-secondary` | `var(--dsw-static-green-400)` | `var(--dsw-static-green-400)` |
| `dsw-alias-state-success-tertiary` | `var(--dsw-static-green-100)` | `var(--dsw-static-green-900)` |
| `dsw-alias-state-warn-label` | `var(--dsw-static-amber-600)` | `var(--dsw-static-amber-600)` |
| `dsw-alias-state-warn-primary` | `var(--dsw-static-amber-500)` | `var(--dsw-static-amber-500)` |
| `dsw-alias-state-warn-secondary` | `var(--dsw-static-amber-400)` | `var(--dsw-static-amber-400)` |
| `dsw-alias-state-warn-tertiary` | `var(--dsw-static-amber-100)` | `var(--dsw-static-amber-900)` |
| `dsw-alias-toast-bg` | `var(--dsw-static-neutral-bluish-800)` | `var(--dsw-static-neutral-bluish-750)` |
| `dsw-alias-tooltip-bg` | `var(--dsw-static-neutral-bluish-850)` | `var(--dsw-static-neutral-bluish-750)` |
| `dsw-specific-bubble` | `var(--dsw-static-deepseek-50)` | `var(--dsw-static-neutral-bluish-850)` |
| `dsw-specific-bubble-highlight` | `var(--dsw-static-deepseek-200)` | `var(--dsw-static-neutral-bluish-750)` |
| `dsw-specific-input-major` | `var(--dsw-static-neutral-bluish-00)` | `var(--dsw-static-neutral-bluish-850)` |
| `dsw-specific-login-input` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-900)` |
| `dsw-specific-menu` | `var(--dsw-alias-bg-layer-3)` | `var(--dsw-alias-bg-layer-3)` |
| `dsw-specific-selector` | `var(--dsw-static-neutral-bluish-60)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-specific-sidebar-fill` | `var(--dsw-static-neutral-bluish-50)` | `var(--dsw-static-neutral-bluish-900)` |
| `dsw-specific-sidebar-nav-item-active` | `var(--dsw-static-neutral-bluish-100)` | `var(--dsw-static-neutral-bluish-750)` |
| `dsw-specific-sidebar-nav-item-active-accent` | `var(--dsw-static-deepseek-100)` | `var(--dsw-static-neutral-bluish-800)` |
| `dsw-specific-sidebar-nav-item-hover` | `var(--dsw-static-neutral-bluish-75)` | `var(--dsw-static-neutral-bluish-850)` |

## 静态色（节选）

深色主题常用静态色（design-platform.css 定义，完整列表见该文件）：

| Token | 浅色 | 深色 |
|---|---|---|
| `--dsw-static-neutral-bluish-00` | `rgb(255,255,255)` | `rgb(255,255,255)` |
| `--dsw-static-neutral-bluish-50` | `rgb(249,250,251)` | `rgb(249,250,251)` |
| `--dsw-static-neutral-bluish-100` | `rgb(235,238,242)` | `rgb(235,238,242)` |
| `--dsw-static-neutral-bluish-600` | `rgb(129,133,140)` | `rgb(129,133,140)` |
| `--dsw-static-neutral-bluish-700` | `rgb(97,102,107)` | `rgb(97,102,107)` |
| `--dsw-static-neutral-bluish-750` | `rgb(67,69,74)` | `rgb(67,69,74)` |
| `--dsw-static-neutral-bluish-800` | `rgb(53,54,56)` | `rgb(53,54,56)` |
| `--dsw-static-neutral-bluish-850` | `rgb(44,44,46)` | `rgb(44,44,46)` |
| `--dsw-static-neutral-bluish-875` | `rgb(35,35,36)` | `rgb(35,35,36)` |
| `--dsw-static-neutral-bluish-900` | `rgb(27,27,28)` | `rgb(27,27,28)` |
| `--dsw-static-neutral-bluish-950` | `rgb(21,21,23)` | `rgb(21,21,23)` |
| `--dsw-static-deepseek-50` | `rgb(237,243,254)` | `rgb(237,243,254)` |
| `--dsw-static-deepseek-100` | `rgb(228,237,253)` | `rgb(228,237,253)` |
| `--dsw-static-deepseek-450` | `rgb(86,134,254)` | `rgb(86,134,254)` |
| `--dsw-static-deepseek-500` | `rgb(65,118,230)` | `rgb(65,118,230)` |

> 静态色不随主题切换的（浅/深同值）保持原样；随主题切换的深色值以
> `body[data-ds-dark-theme]` 块为准（节选省略了大部分同值行）。
