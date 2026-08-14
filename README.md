# dsh-client-chat-skin

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 聊天界面换壁纸、换肤的**客户端插件**（遵循官方 `dsh.client` 插件契约）。

- 6 套预设皮肤（樱花粉 / 薄荷海盐 / 深夜星空 / 赛博霓虹 / 落日暖阳 / 极简毛玻璃），全部 CSS 渐变实现，离线可用
- 自定义壁纸：上传本地图片（自动压缩为 1600px JPEG data URL），即点即换
- 压暗 / 毛玻璃滑杆：微调表面透明度与 `backdrop-filter` 强度
- **原生设置卡片**：注册进 设置 → 通用 → "换肤 / 壁纸"（`settings.general.item` 槽位，与官方"外观"行同机制）
- 🎨 悬浮面板：右下角快速切换入口，与设置卡片共享同一份状态（localStorage `dsh.chatSkin.v1`，重启自动恢复）
- 深色 / 浅色主题独立适配（跟随官方 `body[data-ds-dark-theme]`）

## 插件契约

按官方客户端插件规范（`packages/client/AGENTS.md`、`docs/subsystems/client-modules.md`）：

| 契约点 | 本插件 |
|---|---|
| 包声明 | `package.json` 中 `dsh.client`：`platform: "web"`、`immediately: true`、inject 依赖边 |
| Host 入口 | `exports["."]` → `src/index.js`（Cordis Loader 需要；无副作用的 `apply`） |
| 入口 | `exports["./client"]` → `src/client/index.js`（节点端扫描进 `window.__DSH_BOOT__`，服务 `/plugins/<id>/client.js`） |
| 模块注册 | `__ModuleLoader__.load` 的 `id` 与包名同为 `dsh-client-chat-skin` |
| 导出纪律 | 仅导出 `apply` / `inject`（`inject: ["slots", "locale"]`） |
| 组合 UI | 只通过 `ctx.slots.register({ name, id, order, store, locale, inject }, Component)` |
| Store | `createSkinRowStore()` 工厂（`defineStore`）；组件 `useStore` 读、`actions.sync` 写 |
| 本地化 | `ctx.locale.register("chat-skin", { zh, en })` |

## 安装

```bash
node scripts/install.mjs            # 自动使用 $DSH_HOME（缺省 ~/.dsh）；--home 可指定
```

脚本会：把本包复制到 `$DSH_HOME/profiles/web/node_modules/dsh-client-chat-skin/`，并在
`$DSH_HOME/profiles/web/cordis.patch.yml` 幂等地追加 Loader 行：

```yaml
- insert:
    - id: chat-skin
      name: dsh-client-chat-skin
```

**重启 DeepSeek Harness**（Cmd+Q 完全退出后重开）后生效。验证：

```bash
curl -s http://127.0.0.1:64287/ | grep -o 'dsh-client-chat-skin'   # __DSH_BOOT__ 应出现
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:64287/plugins/dsh-client-chat-skin/client.js  # 200
```

卸载：`node scripts/uninstall.mjs`（删除 patch 行与包目录，重启还原）。

## 使用

- **设置 → 通用 → 换肤 / 壁纸**：预设方块、上传壁纸、移除、压暗/毛玻璃滑杆、恢复默认
- **🎨 悬浮按钮**（右下角）：快速切换入口

## 架构

```
src/index.js            # Host 端 no-op 入口：供 Cordis Loader 组装插件树
src/client/index.js     # 插件体：vanilla 引擎（CSS token 覆盖 + 壁纸层 + 悬浮面板）
                        #        + React 设置卡片（settings.general.item 槽位）
scripts/install.mjs     # 安装（幂等：复制包 + patch cordis.patch.yml）
scripts/uninstall.mjs   # 卸载
docs/architecture.md    # DSH Web GUI 定制机制深潜（client plugin 契约 / patch / DOM）
docs/tokens.md          # --dsw-* CSS token 全集（浅/深色对照）与覆盖方法
assets/sample-wallpaper.svg  # 样例壁纸
```

换肤原理：注入 `<style>` 覆盖官方 `--dsw-*` token（`body[data-ds-skin=...]` 特异性必胜），
并用 `position:fixed; z-index:-1` 的全屏层承载壁纸；各表面 token 半透明后壁纸透出。
详见 [docs/architecture.md](docs/architecture.md)。

## 定制皮肤

编辑 `src/client/index.js` 的 `PRESETS` 数组（单文件，无构建步骤；改完重跑
`scripts/install.mjs` 并重启）。预设字段：`id / label / dot / wall / dim / blur /
surface / accent / ink / extra`。附加 CSS 用 `body[data-ds-skin="<id>"]` 作用域书写。

## Model Experience

无模型面：本插件是纯浏览器侧 UI 插件（`dsh.client` 浏览器半体），不注册工具、不注入
system prompt、不参与任何模型请求。其所有副作用（CSS 注入、设置卡片、localStorage）都在
浏览器页面内完成。

#### KV Cache effect

无：插件不发送任何 provider 请求。

## Known Limitations and Deferred Work

- **新增插件行需重启**：Loader 条目在启动时组合，`cordis.patch.yml` 的变更不会热生效；
  bundle 内容热更只走 `pnpm run dev:web` 的 HMR 链（`ClientModuleRegistry.rebuilt`）。
- **样式以 token 为主**：未硬编码组件 hashed 类名（每次构建会变）；个别元素如需精确
  定位，需从运行中的 bundle 现抓类名（方法见 docs/architecture.md）。
- **设置卡片依赖 React 环境**：`react/jsx-runtime` 或 `defineStore` 不可用时自动退化为
  纯 vanilla 引擎（CSS 注入 + 🎨 悬浮面板），不报错。
- **自定义壁纸存 localStorage**：受浏览器配额（约 5MB）限制；引擎已压缩至 1600px JPEG。
- **动态插件互操作**：本插件是静态 Loader 行，与 `cordis_*` 动态包机制互不相通（见 docs/architecture.md）。
