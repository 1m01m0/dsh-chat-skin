# DSH Web GUI 定制机制（架构深潜）

> 本文是 dsh-client-chat-skin 技能的底层参考：DSH Web 前端如何组装、客户端插件契约、
> patch 格式、CSS token 系统与 DOM 结构。定制任何"界面外观"类需求都从这里入手。

## 1. Web surface 组装

- Web 界面是 `dsh-web-app` bundle 叠加在 `dsh-base` 上的浏览器 surface。
- 每个 profile（`$DSH_HOME/profiles/web/`）由三层组成：
  1. `cordis.yml` —— 空条目列表（不要直接编辑）
  2. 各 bundle 自带的 `cordis.patch.yml`（如 `@deepseek-ai/dsh-web-app` 的插件大名单）
  3. **用户自己的 `profiles/web/cordis.patch.yml`** —— 编辑入口
- patch 是顶层 YAML 数组，支持三种条目：
  - `- insert:` 列表：**追加新插件行**（我们的换肤插件就是这么加的）
  - `- id: <row>` + `config:`：按 id 覆盖某行配置（整行 config 会被替换，需写全）
  - `- id: <row>` + `disabled: true`：停用某行
  - 值里可用 `!!js 表达式`（如 `!!js ctx.webStartup.host ?? '127.0.0.1'`）
- Loader 行格式（浏览器插件行就是 `{id, name}`）：

  ```yaml
  - insert:
      - id: chat-skin
        name: dsh-client-chat-skin
  ```

- **Loader 条目在启动时组合**：改 patch 后必须重启应用。运行时"插件清单"面板
  （`dsh-client-ui-settings-plugin-inventory`）只读展示，不能热加行。

## 2. 客户端插件（`dsh.client` 包）契约

### 包声明（package.json）

```json
{
  "name": "dsh-client-chat-skin",
  "exports": {
    ".": "./src/index.js",
    "./client": "./src/client/index.js"
  },
  "dsh": { "client": { "platform": "web", "immediately": true } }
}
```

顶层 Loader 条目会先导入 `exports["."]` 组装 Host 插件树，因此客户端专用包也必须
提供根入口。本插件的 `src/index.js` 只导出无副作用的 `apply`；浏览器逻辑仍全部位于
`exports["./client"]`，不会在 Node.js Host 中执行。

节点端（`@deepseek-ai/dsh-client-modules`）对每个 Loader 条目：
1. 解析包 `package.json`，校验 `dsh.client`：`platform` 必须为非空字符串，
   `inject` 必须为字符串数组（可省），`immediately` 必须为布尔（可省）；
2. 解析 `exports["./client"]`（字符串或 `{default}` 条件形式）；
3. 把包散列成 `/plugins/<包名>/client.js?rev=<12位sha1>`，编入
   `window.__DSH_BOOT__` 引导图（注入 `<head>` 第一个 script）；
4. 启动时扫描（`dsh.client` 缺失/包不可解析 → 缓存为"非客户端包"；
   **包集合变更要重启生效**，bundle 内容变更走 HMR 的 `rebuilt` 钩子）。

### 浏览器端模块格式（关键）

`client.js` 是**经典脚本**，同步注册 factory：

```js
window.__ModuleLoader__.load({
  id: "dsh-client-chat-skin", // 必须与 package.json 的 name 完全一致
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    // ... 副作用（注入 <style>）与引擎定义 ...
    exports.apply = apply;        // cordis 插件体
    return module.exports;
  }
});
```

- 模块是"惰性 CJS"：脚本执行只**注册** factory；factory 在**材料化**时执行，
  副作用（含 CSS 注入）在材料化时发生。
- factory 的 `require` 只能解析已注册的模块（官方包、种子词、boot 图条目）；
  **不要 require 相对路径** —— 零依赖最稳。
- `immediately: true`：shell 内核在 cordis 之前就加载并接管为插件条目
  （官方 `dsh-client-modules`、`dsh-client-hmr` 都是零依赖 immediately 的先例）。
- 内核接管后调用 `exports.apply(ctx)`（ctx 提供 `effect`/日志等）；
  `inject` 依赖边来自 boot 清单，不是包导出。

## 3. CSS token 系统（换肤的基石）

三层变量，全部定义在 **`<body>`** 上：

| 层 | 位置 | 例子 |
|---|---|---|
| static 静态色 | `body` / `body[data-ds-dark-theme]`（`design-platform.css`） | `--dsw-static-neutral-bluish-950` |
| alias 语义别名 | `body` / `body[data-ds-dark-theme]`（dist `index.css`） | `--dsw-alias-bg-base` |
| specific 专有 | 同上 | `--dsw-specific-sidebar-fill`、`--dsw-specific-bubble` |

- 深色主题 = body 上的 `data-ds-dark-theme` 属性（页面内联脚本按偏好设置）。
- 组件全部消费 alias/specific 变量 → **覆盖变量即可换肤**。
- 覆盖的必胜写法（特异性 + 注入顺序都占优）：

  ```css
  body[data-ds-skin="custom"] { --dsw-alias-bg-base: rgba(245,248,250,.5); }
  body[data-ds-dark-theme][data-ds-skin="custom"] { --dsw-alias-bg-base: rgba(24,26,32,.5); }
  ```

- 完整 token 表见 [tokens.md](tokens.md)；dist 里的源定义可随时重新提取：
  `curl -s http://127.0.0.1:64287/assets/<index-*.css>` 后按
  `body{...}` / `body[data-ds-dark-theme]{...}` 块解析。

## 4. DOM 结构与壁纸层

- 根元素：`<div id="root">`（无背景），应用内是 `AppFrame` 三栏 grid：
  sidebar（`--dsw-specific-sidebar-fill` 背景）/ center（聊天流）/ details。
- **类名是构建期 hash**（如 `.pI_x6G_frame`），每次构建都会变，**不要硬编码**。
- 壁纸层做法（dsh-client-chat-skin 引擎）：在 `<body>` 最前面插一个
  `position:fixed; inset:0; z-index:-1; pointer-events:none` 的 div。
  负 z-index 元素绘制在根元素背景之上、所有内容之下；body/html/#root 都没有背景，
  所以只要把各表面 token 改成半透明，壁纸就从背后透出来。

### 发现当前 hashed 类名（需要时）

```bash
# 从运行中的 bundle 里现抓（hash 随构建变，必须现抓）
curl -s http://127.0.0.1:64287/plugins/@deepseek-ai/dsh-client-ui-layout/client.js \
  | grep -o 'className: AppFrame_module_css_default.[a-zA-Z]*' | sort -u
# 或提取内联 CSS 串
curl -s .../client.js | grep -o 'const css = "[^"]*"'
```

优先 token 覆盖，其次属性/结构选择器（`#root > *`、`[data-*]`），最后才是 hash 类名。

## 5. 验证命令

```bash
# boot 清单包含插件
curl -s http://127.0.0.1:64287/ | grep -o 'dsh-client-chat-skin'
# bundle 可服务
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:64287/plugins/dsh-client-chat-skin/client.js
# Host 持久化接口（端口替换为当前启动端口）
curl -s http://127.0.0.1:64287/api/plugins/dsh-client-chat-skin/state
# 数据文件：$DSH_HOME/data/chat-skin/state.json；body 上有 data-ds-skin 属性
```

### 为什么不能只用 localStorage

macOS 原生壳以 `dsh web --port 0` 启动，操作系统会在每次启动时分配不同端口。
Web Storage 按 `scheme + host + port` 隔离，所以新端口看不到旧端口的 `localStorage`。
插件的 Host 入口因此注册固定同源接口，将状态原子写入
`$DSH_HOME/data/chat-skin/state.json`；浏览器缓存只用于减少首帧闪烁。数据目录位于 Git
仓库之外，照片不会被安装脚本或版本控制收集。

## 6. 其他入口

- 前端 dist：`node_modules/@deepseek-ai/dsh-web-frontend/dist/`（index.html 可注入临时样式，
  刷新即生效；会被应用更新覆盖，仅预览用）。
- 官方主题插件：`@deepseek-ai/dsh-client-ui-theme`（light/dark/system 偏好 +
  Appearance 设置行 + `--dsw-*` token 注入），我们的皮肤覆盖在其之上。
- 开发期热更：`pnpm run dev:web` 会重建客户端 bundle 并驱动 `dsh-client-hmr`，
  但仅限"内容变化"，不包含"新增插件行"。
