window.__ModuleLoader__.load({
	id: "dsh-client-chat-skin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		/* ------------------------------------------------------------------
		 * dsh-chat-skin — 聊天界面壁纸 / 换肤引擎（client plugin）
		 *
		 * 双面：
		 *  - vanilla 引擎：注入 <style> 覆盖 --dsw-* token + 全屏壁纸层 +
		 *    右下角 🎨 悬浮面板（零依赖，材料化即注入样式，首帧无闪烁）
		 *  - React 原生设置卡片：注册进 设置 → 通用 的 settings.general.item
		 *    槽位（与官方 Appearance 行同款机制），提供调色盘与本地图片上传
		 *  - Host 端固定文件是持久化真源；localStorage 只做当前端口的首帧缓存
		 *
		 * 依赖（浏览器端 resolve，均已在官方 roster 中）：
		 *  - react/jsx-runtime（shell 内核种子）
		 *  - @deepseek-ai/dsh-client-runtime/client 的 defineStore
		 * ------------------------------------------------------------------ */

		const STORAGE_KEY = "dsh.chatSkin.v1";
		const STATE_ENDPOINT = "/api/plugins/dsh-client-chat-skin/state";
		const STYLE_ID = "dsh-chat-skin-style";
		const CORE_ID = "dsh-chat-skin-core";
		const WALL_ID = "dsh-chat-skin-wall";
		const FAB_ID = "dsh-chat-skin-fab";
		const PANEL_ID = "dsh-chat-skin-panel";
		const SETTINGS_NS = "chat-skin";
		const DEFAULT_COLOR = "#eef3f8";
		const HISTORY_LIMIT = 5;

		/* ------------------- React 依赖（失败则退化为纯 CSS 引擎）------------------- */
		let react_jsx_runtime = null;
		let defineStore = null;
		try {
			react_jsx_runtime = require("react/jsx-runtime");
			defineStore = require("@deepseek-ai/dsh-client-runtime/client").defineStore;
		} catch (e) { /* 无 React 环境：仅保留 vanilla 引擎 */ }

		/* --------------------------- 核心样式 --------------------------- */
		const CORE_CSS = [
			"#" + WALL_ID + "{position:fixed;inset:0;z-index:-1;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;transition:opacity .25s ease}",
			"#" + WALL_ID + "::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,.08)}",
			"#" + FAB_ID + "{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:46px;height:46px;border:0;border-radius:50%;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;background:conic-gradient(from 210deg,#ff6b6b,#feca57,#48dbfb,#a29bfe,#ff6b6b);box-shadow:0 6px 18px rgba(0,0,0,.28);transition:transform .15s ease}",
			"#" + FAB_ID + ":hover{transform:scale(1.06)}",
			"#" + PANEL_ID + "{position:fixed;right:20px;bottom:76px;z-index:2147483001;width:300px;box-sizing:border-box;display:none;flex-direction:column;gap:14px;padding:16px;border-radius:16px;background:rgba(22,22,28,.96);color:#f4f4f5;font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC',sans-serif;box-shadow:0 16px 44px rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.1)}",
			"#" + PANEL_ID + ".open{display:flex}",
			"#" + PANEL_ID + " .dsk-head{display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:600}",
			"#" + PANEL_ID + " .dsk-close{border:0;background:none;color:#a1a1aa;cursor:pointer;font-size:16px;padding:2px 6px}",
			"#" + PANEL_ID + " .dsk-color-row{display:flex;align-items:center;gap:12px}",
			"#" + PANEL_ID + " .dsk-color{width:52px;height:40px;padding:2px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:transparent;cursor:pointer}",
			"#" + PANEL_ID + " .dsk-color-code{font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#d4d4d8;text-transform:uppercase}",
			"#" + PANEL_ID + " .dsk-row{display:flex;gap:8px}",
			"#" + PANEL_ID + " .dsk-btn{flex:1;padding:8px 10px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(255,255,255,.07);color:#f4f4f5;cursor:pointer;font-size:12.5px}",
			"#" + PANEL_ID + " .dsk-btn:hover:not(:disabled){background:rgba(255,255,255,.13)}",
			"#" + PANEL_ID + " .dsk-btn:disabled{opacity:.38;cursor:default}",
			"#" + PANEL_ID + " .dsk-history-head{display:flex;align-items:center;justify-content:space-between;color:#d4d4d8;font-size:12px}",
			"#" + PANEL_ID + " .dsk-history-clear{border:0;background:none;color:#a1a1aa;cursor:pointer;font-size:11px;padding:2px 0}",
			"#" + PANEL_ID + " .dsk-history-clear:disabled{opacity:.35;cursor:default}",
			"#" + PANEL_ID + " .dsk-history-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}",
			"#" + PANEL_ID + " .dsk-history-item{position:relative;aspect-ratio:4/3}",
			"#" + PANEL_ID + " .dsk-history-thumb{width:100%;height:100%;border:2px solid transparent;border-radius:9px;background-position:center;background-size:cover;cursor:pointer}",
			"#" + PANEL_ID + " .dsk-history-thumb.active{border-color:#8ab4ff}",
			"#" + PANEL_ID + " .dsk-history-remove{position:absolute;right:3px;top:3px;width:20px;height:20px;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,.62);color:#fff;cursor:pointer;font-size:13px;line-height:20px}",
			"#" + PANEL_ID + " .dsk-history-empty{grid-column:1/-1;color:#71717a;font-size:11px;padding:4px 0}",
			"#" + PANEL_ID + " .dsk-tip{font-size:11px;color:#a1a1aa}",
			".dsk-s-group{border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;flex-direction:column;gap:14px;padding:20px 0}",
			".dsk-s-head{display:flex;flex-direction:column;gap:3px}",
			".dsk-s-title{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}",
			".dsk-s-sub{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}",
			".dsk-s-card{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-layer-1)}",
			".dsk-s-card-copy{display:flex;flex-direction:column;gap:2px;min-width:0}",
			".dsk-s-card-title{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}",
			".dsk-s-card-sub{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}",
			".dsk-s-picker{display:flex;align-items:center;gap:10px;flex:none}",
			".dsk-s-color{width:54px;height:40px;padding:2px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:transparent;cursor:pointer}",
			".dsk-s-code{min-width:64px;color:var(--dsw-alias-label-secondary);font:12px/18px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}",
			".dsk-s-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			".dsk-s-btn{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:transparent;border-radius:10px;padding:7px 12px;font-size:13px;line-height:20px}",
			".dsk-s-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}",
			".dsk-s-btn:disabled{opacity:.4;cursor:default}",
			".dsk-s-history-head{display:flex;align-items:center;justify-content:space-between;gap:12px}",
			".dsk-s-history-title{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}",
			".dsk-s-history-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}",
			".dsk-s-history-item{position:relative;aspect-ratio:4/3;min-width:0}",
			".dsk-s-history-thumb{width:100%;height:100%;box-sizing:border-box;border:2px solid transparent;border-radius:12px;background-position:center;background-size:cover;cursor:pointer;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}",
			".dsk-s-history-thumb:hover{box-shadow:inset 0 0 0 1px var(--dsw-static-neutral-bluish-400)}",
			".dsk-s-history-thumb.active{border-color:var(--dsw-alias-brand-primary)}",
			".dsk-s-history-remove{position:absolute;right:4px;top:4px;width:22px;height:22px;padding:0;border:0;border-radius:50%;background:rgba(0,0,0,.62);color:#fff;cursor:pointer;font-size:14px;line-height:22px}",
			".dsk-s-history-empty{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;padding:2px 0}",
			".dsk-s-tip{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}",
			"@media(max-width:720px){.dsk-s-card{align-items:flex-start;flex-direction:column}.dsk-s-actions{align-items:stretch;flex-direction:column}.dsk-s-btn{width:100%}.dsk-s-history-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}",
			"@media(prefers-reduced-motion:reduce){#" + FAB_ID + "{transition:none}}"
		].join("");

		/* --------------------------- 工具函数 --------------------------- */
		function hexToRgb(hex) {
			const h = hex.replace("#", "");
			return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
		}
		function rgba(triple, a) { return "rgba(" + triple[0] + "," + triple[1] + "," + triple[2] + "," + a + ")"; }
		function isHexColor(value) { return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value); }
		function isImageDataUrl(value) { return typeof value === "string" && value.startsWith("data:image/"); }
		function blendRgb(from, to, amount) {
			return from.map((value, index) => Math.round(value * (1 - amount) + to[index] * amount));
		}
		function newHistoryId() {
			return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
		}
		function normalizeState(value) {
			if (!value || typeof value !== "object" || Array.isArray(value)) return null;
			const history = Array.isArray(value.h) ? value.h
				.filter((entry) => entry && typeof entry.id === "string" && isImageDataUrl(entry.data))
				.slice(0, HISTORY_LIMIT)
				.map((entry) => ({ id: entry.id, data: entry.data })) : [];
			let active = typeof value.a === "string" && history.some((entry) => entry.id === value.a) ? value.a : null;
			if (!active && isImageDataUrl(value.w)) {
				const migrated = { id: newHistoryId(), data: value.w };
				history.unshift(migrated);
				active = migrated.id;
			}
			return {
				c: isHexColor(value.c) ? value.c.toLowerCase() : null,
				a: active,
				h: history.slice(0, HISTORY_LIMIT)
			};
		}
		function hasCustomization(skin) {
			return Boolean(skin.c || skin.a || skin.h.length);
		}
		function activeWall(skin) {
			const item = skin.h.find((entry) => entry.id === skin.a);
			return item ? item.data : null;
		}
		function ensureStyle(id, css) {
			if (typeof document === "undefined") return null;
			let tag = document.getElementById(id);
			if (!tag) {
				tag = document.createElement("style");
				tag.id = id;
				tag.setAttribute("data-plugin", "dsh-chat-skin");
				tag.setAttribute("data-plugin-css", id);
				document.head.appendChild(tag);
			}
			if (css !== undefined) tag.textContent = css;
			return tag;
		}
		function ensureWall() {
			if (typeof document === "undefined") return null;
			let wall = document.getElementById(WALL_ID);
			if (!wall) {
				wall = document.createElement("div");
				wall.id = WALL_ID;
				document.body.insertBefore(wall, document.body.firstChild);
			}
			return wall;
		}
		function loadState() {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				if (!raw) return { c: null, a: null, h: [] };
				return normalizeState(JSON.parse(raw)) || { c: null, a: null, h: [] };
			} catch (e) { return { c: null, a: null, h: [] }; }
		}
		function saveLocalState(s) {
			s.h = s.h.slice(0, HISTORY_LIMIT);
			while (true) {
				try {
					localStorage.setItem(STORAGE_KEY, JSON.stringify({ c: s.c, a: s.a, h: s.h }));
					return true;
				} catch (e) {
					if (s.h.length <= 1) {
						alert("背景图片过大，无法保存到本机历史");
						return false;
					}
					const removed = s.h.pop();
					if (removed && s.a === removed.id) s.a = null;
				}
			}
		}

		/* ------------------------- 皮肤 CSS 生成 ------------------------- */
		function buildSkinCSS(skin) {
			const parts = [];
			const wall = activeWall(skin);
			if (wall) parts.push("#" + WALL_ID + "{background-image:url(\"" + wall + "\")}");
			else if (skin.c) parts.push("#" + WALL_ID + "{background-color:" + skin.c + "}");
			if (!skin.c && !wall) return parts.join("\n");
			const chosen = hexToRgb(skin.c || DEFAULT_COLOR);
			const themes = [
				{ sel: "body[data-ds-skin=\"custom\"]", c: blendRgb(chosen, [255,255,255], 0.58) },
				{ sel: "body[data-ds-dark-theme][data-ds-skin=\"custom\"]", c: blendRgb(chosen, [20,22,28], 0.72) }
			];
			for (const t of themes) {
				const vars = [
					["--dsw-alias-bg-base", rgba(t.c, 0.48)],
					["--dsw-alias-bg-layer-1", rgba(t.c, 0.72)],
					["--dsw-alias-bg-layer-2", rgba(t.c, 0.78)],
					["--dsw-alias-bg-layer-3", rgba(t.c, 0.85)],
					["--dsw-alias-bg-module-platform", rgba(t.c, 0.82)],
					["--dsw-alias-bg-overlay", rgba(t.c, 0.92)],
					["--dsw-specific-sidebar-fill", rgba(t.c, 0.58)],
					["--dsw-specific-bubble", rgba(t.c, 0.66)],
					["--dsw-specific-bubble-highlight", rgba(t.c, 0.58)],
					["--dsw-specific-input-major", rgba(t.c, 0.7)],
					["--dsw-specific-menu", rgba(t.c, 0.95)],
					["--dsw-alias-tooltip-bg", rgba(t.c, 0.97)],
					["--dsw-alias-bg-mask-drop", rgba(t.c, 0.92)],
					["--dsw-alias-markdown-code-block", rgba(t.c, 0.55)],
					["--dsw-alias-markdown-code-block-banner", rgba(t.c, 0.5)],
					["--dsw-alias-markdown-inline-code", rgba(t.c, 0.6)]
				];
				parts.push(t.sel + "{" + vars.map((v) => v[0] + ":" + v[1]).join(";") + "}");
			}
			parts.push("body[data-ds-skin=\"custom\"] #root> *{backdrop-filter:blur(5px) saturate(1.06);-webkit-backdrop-filter:blur(5px) saturate(1.06)}");
			return parts.join("\n");
		}

		/* --------------------------- 应用皮肤 --------------------------- */
		let engineOnChange = null;
		function applySkin(skin) {
			if (typeof document === "undefined") return;
			ensureStyle(STYLE_ID, buildSkinCSS(skin));
			const wall = ensureWall();
			if (!skin.c && !activeWall(skin)) {
				delete document.body.dataset.dsSkin;
				wall.style.opacity = "0";
			} else {
				document.body.dataset.dsSkin = "custom";
				wall.style.opacity = "1";
			}
			renderPanel(skin);
			if (engineOnChange) engineOnChange(skin);
		}

		/* --------------------------- 图片压缩 --------------------------- */
		function fileToDataUrl(file) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onerror = () => reject(new Error("read-fail"));
				reader.onload = () => resolve(reader.result);
				reader.readAsDataURL(file);
			});
		}
		function compressImage(dataUrl, maxSide) {
			return new Promise((resolve) => {
				const img = new Image();
				img.onload = () => {
					let w = img.width, h = img.height;
					const scale = Math.min(1, maxSide / Math.max(w, h));
					w = Math.round(w * scale); h = Math.round(h * scale);
					const canvas = document.createElement("canvas");
					canvas.width = w; canvas.height = h;
					const ctx = canvas.getContext("2d");
					ctx.drawImage(img, 0, 0, w, h);
					try { resolve(canvas.toDataURL("image/jpeg", 0.78)); }
					catch (e) { resolve(dataUrl); }
				};
				img.onerror = () => resolve(dataUrl);
				img.src = dataUrl;
			});
		}
		function pickImage(cb) {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "image/*";
			input.hidden = true;
			document.body.appendChild(input);
			input.oncancel = () => input.remove();
			input.onchange = async () => {
				const f = input.files && input.files[0];
				if (!f) { input.remove(); return; }
				if (!f.type.startsWith("image/")) {
					alert("请选择图片文件");
					input.remove();
					return;
				}
				try {
					const raw = await fileToDataUrl(f);
					cb(await compressImage(raw, 1200));
				} catch (e) { alert("图片读取失败"); }
				finally { input.remove(); }
			};
			input.click();
		}

		/* --------------------------- 悬浮面板（vanilla） --------------------------- */
		let state = loadState();
		let stateRevision = 0;
		let hostReady = false;
		let hostSaveTimer = null;
		let pendingHostBody = null;
		let hostWrite = Promise.resolve();
		saveLocalState(state); // 当前端口首帧缓存；同时迁移旧版 `{ w }` 结构。

		function flushHostState() {
			if (!hostReady || !pendingHostBody) return;
			const body = pendingHostBody;
			pendingHostBody = null;
			hostWrite = hostWrite.then(async () => {
				const response = await fetch(STATE_ENDPOINT, {
					method: "PUT",
					headers: { "content-type": "application/json" },
					body
				});
				if (!response.ok) throw new Error("HTTP " + response.status);
			}).catch((error) => {
				console.warn("dsh-chat-skin: durable save failed", error);
			});
		}
		function queueHostState(s, immediate) {
			if (!hostReady) return;
			pendingHostBody = JSON.stringify({ c: s.c, a: s.a, h: s.h });
			if (hostSaveTimer) clearTimeout(hostSaveTimer);
			hostSaveTimer = setTimeout(() => {
				hostSaveTimer = null;
				flushHostState();
			}, immediate ? 0 : 180);
		}
		function saveState(s, immediate) {
			const saved = saveLocalState(s);
			queueHostState(s, immediate);
			return saved;
		}
		async function hydrateHostState(attempt) {
			const revisionAtStart = stateRevision;
			try {
				const response = await fetch(STATE_ENDPOINT, { headers: { accept: "application/json" }, cache: "no-store" });
				if (!response.ok) throw new Error("HTTP " + response.status);
				const payload = await response.json();
				const durable = normalizeState(payload && payload.state);
				hostReady = true;
				if (stateRevision !== revisionAtStart) {
					queueHostState(state, true);
					return;
				}
				if (durable) {
					state = durable;
					saveLocalState(state);
					applySkin(state);
				} else if (hasCustomization(state)) {
					// One-time migration from this origin's legacy localStorage.
					queueHostState(state, true);
				}
			} catch (error) {
				if (attempt < 3) {
					setTimeout(() => { void hydrateHostState(attempt + 1); }, 500 * (attempt + 1));
				} else {
					console.warn("dsh-chat-skin: durable state unavailable; using this port's cache", error);
				}
			}
		}
		void hydrateHostState(0);
		if (typeof window !== "undefined") {
			window.addEventListener("pagehide", flushHostState);
		}
		function updateState(next) {
			stateRevision += 1;
			state = next;
			saveState(state);
			applySkin(state);
		}
		function addHistory(dataUrl) {
			const duplicate = state.h.find((entry) => entry.data === dataUrl);
			const item = duplicate || { id: newHistoryId(), data: dataUrl };
			updateState({
				...state,
				a: item.id,
				h: [item, ...state.h.filter((entry) => entry.id !== item.id)].slice(0, HISTORY_LIMIT)
			});
		}
		function selectHistory(id) {
			if (!state.h.some((entry) => entry.id === id)) return;
			updateState({ ...state, a: id });
		}
		function deleteHistory(id) {
			updateState({ ...state, a: state.a === id ? null : state.a, h: state.h.filter((entry) => entry.id !== id) });
		}
		function clearHistory() {
			updateState({ ...state, a: null, h: [] });
		}
		function renderPanel(skin) {
			const panel = document.getElementById(PANEL_ID);
			if (!panel) return;
			const colorInput = document.getElementById("dsk-color");
			const colorCode = document.getElementById("dsk-color-code");
			const fileBtn = document.getElementById("dsk-file");
			const clearBtn = document.getElementById("dsk-clear");
			const resetBtn = document.getElementById("dsk-reset");
			const historyGrid = document.getElementById("dsk-history");
			const historyClearBtn = document.getElementById("dsk-history-clear");
			colorInput.value = skin.c || DEFAULT_COLOR;
			colorCode.textContent = skin.c || "默认";
			clearBtn.disabled = !skin.a;
			historyClearBtn.disabled = skin.h.length === 0;
			historyGrid.innerHTML = "";
			if (skin.h.length === 0) {
				const empty = document.createElement("div");
				empty.className = "dsk-history-empty";
				empty.textContent = "暂无历史背景";
				historyGrid.appendChild(empty);
			}
			for (const item of skin.h) {
				const cell = document.createElement("div");
				cell.className = "dsk-history-item";
				const thumb = document.createElement("button");
				thumb.type = "button";
				thumb.className = "dsk-history-thumb" + (skin.a === item.id ? " active" : "");
				thumb.setAttribute("aria-label", "使用历史背景");
				thumb.style.backgroundImage = "url(\"" + item.data + "\")";
				thumb.onclick = () => selectHistory(item.id);
				const remove = document.createElement("button");
				remove.type = "button";
				remove.className = "dsk-history-remove";
				remove.setAttribute("aria-label", "删除历史背景");
				remove.textContent = "×";
				remove.onclick = () => deleteHistory(item.id);
				cell.appendChild(thumb);
				cell.appendChild(remove);
				historyGrid.appendChild(cell);
			}
			colorInput.oninput = () => {
				colorCode.textContent = colorInput.value.toLowerCase();
				updateState({ ...state, c: colorInput.value.toLowerCase() });
			};
			colorInput.onchange = () => queueHostState(state, true);
			fileBtn.onclick = () => pickImage(addHistory);
			clearBtn.onclick = () => updateState({ ...state, a: null });
			resetBtn.onclick = () => updateState({ ...state, c: null, a: null });
			historyClearBtn.onclick = clearHistory;
		}
		function mountUI() {
			if (typeof document === "undefined" || document.getElementById(FAB_ID)) return;
			const fab = document.createElement("button");
			fab.id = FAB_ID;
			fab.type = "button";
			fab.title = "自定义背景";
			fab.setAttribute("aria-label", "自定义背景");
			fab.textContent = "🎨";
			const panel = document.createElement("div");
			panel.id = PANEL_ID;
			panel.innerHTML = "<div class='dsk-head'><span>自定义背景</span><button type='button' class='dsk-close' aria-label='关闭'>✕</button></div><label class='dsk-color-row'><input class='dsk-color' id='dsk-color' type='color' aria-label='背景颜色'><span><strong>背景颜色</strong><br><span class='dsk-color-code' id='dsk-color-code'></span></span></label><div class='dsk-row'><button type='button' class='dsk-btn' id='dsk-file'>上传本地照片</button><button type='button' class='dsk-btn' id='dsk-clear'>移除照片</button></div><button type='button' class='dsk-btn' id='dsk-reset'>恢复默认</button><div class='dsk-history-head'><span>历史背景</span><button type='button' class='dsk-history-clear' id='dsk-history-clear'>清空</button></div><div class='dsk-history-grid' id='dsk-history'></div><div class='dsk-tip'>最近 5 张照片保存在本机，重启后自动恢复。</div>";
			document.body.appendChild(fab);
			document.body.appendChild(panel);
			const toggle = () => {
				const open = panel.classList.toggle("open");
				if (open) renderPanel(state);
			};
			fab.onclick = toggle;
			panel.querySelector(".dsk-close").onclick = () => panel.classList.remove("open");
			document.addEventListener("keydown", (e) => { if (e.key === "Escape") panel.classList.remove("open"); });
			document.addEventListener("click", (e) => {
				if (panel.classList.contains("open") && !panel.contains(e.target) && !fab.contains(e.target)) panel.classList.remove("open");
			});
			renderPanel(state);
		}

		/* ------------------- 设置卡片（React，设置 → 通用） ------------------- */
		const zh = {
			"skin.title": "自定义背景",
			"skin.sub": "选择颜色，或上传本地照片作为背景",
			"skin.color": "背景颜色",
			"skin.colorTip": "点击色块打开系统调色盘",
			"skin.upload": "上传本地照片",
			"skin.remove": "移除照片",
			"skin.reset": "恢复默认",
			"skin.history": "历史背景",
			"skin.historyEmpty": "暂无历史背景，上传照片后会显示在这里。",
			"skin.historyUse": "使用历史背景",
			"skin.historyDelete": "删除历史背景",
			"skin.historyClear": "清空历史",
			"skin.tip": "最近 5 张照片保存在本机，超出容量时自动移除最旧记录。"
		};
		const en = {
			"skin.title": "Custom background",
			"skin.sub": "Choose a color or upload a local photo",
			"skin.color": "Background color",
			"skin.colorTip": "Click the swatch to open the system color picker",
			"skin.upload": "Upload local photo",
			"skin.remove": "Remove photo",
			"skin.reset": "Reset",
			"skin.history": "Background history",
			"skin.historyEmpty": "No history yet. Uploaded photos appear here.",
			"skin.historyUse": "Use historical background",
			"skin.historyDelete": "Delete historical background",
			"skin.historyClear": "Clear history",
			"skin.tip": "The latest 5 photos stay on this device; the oldest is removed when storage is full."
		};
		function createSkinRowStore() {
			if (!defineStore) return null;
			return defineStore({
				init: () => ({ c: null, a: null, h: [] }),
				actions: { sync: (d, color, active, history) => { d.c = color; d.a = active; d.h = history; } }
			});
		}
		function SkinRow(props) {
			const { t, useStore, setColor, uploadWall, clearWall, reset, selectWall, deleteWall, clearAllHistory } = props;
			const s = useStore((x) => x);
			const jsx = react_jsx_runtime.jsx;
			const jsxs = react_jsx_runtime.jsxs;
			return jsxs("div", { className: "dsk-s-group", children: [
				jsxs("div", { className: "dsk-s-head", children: [
					jsx("div", { className: "dsk-s-title", children: t("skin.title") }),
					jsx("div", { className: "dsk-s-sub", children: t("skin.sub") })
				]}),
				jsxs("div", { className: "dsk-s-card", children: [
					jsxs("div", { className: "dsk-s-card-copy", children: [
						jsx("div", { className: "dsk-s-card-title", children: t("skin.color") }),
						jsx("div", { className: "dsk-s-card-sub", children: t("skin.colorTip") })
					]}),
					jsxs("label", { className: "dsk-s-picker", children: [
						jsx("input", {
							type: "color",
							className: "dsk-s-color",
							value: s.c || DEFAULT_COLOR,
							"aria-label": t("skin.color"),
							onChange: (e) => setColor(e.target.value)
						}),
						jsx("span", { className: "dsk-s-code", children: s.c || "Default" })
					]})
				]}),
				jsxs("div", { className: "dsk-s-actions", children: [
					jsx("button", { type: "button", className: "dsk-s-btn", onClick: uploadWall, children: t("skin.upload") }),
					jsx("button", { type: "button", className: "dsk-s-btn", disabled: !s.a, onClick: clearWall, children: t("skin.remove") }),
					jsx("button", { type: "button", className: "dsk-s-btn", onClick: reset, children: t("skin.reset") })
				]}),
				jsxs("div", { className: "dsk-s-history-head", children: [
					jsx("div", { className: "dsk-s-history-title", children: t("skin.history") }),
					jsx("button", { type: "button", className: "dsk-s-btn", disabled: s.h.length === 0, onClick: clearAllHistory, children: t("skin.historyClear") })
				]}),
				s.h.length === 0
					? jsx("div", { className: "dsk-s-history-empty", children: t("skin.historyEmpty") })
					: jsx("div", { className: "dsk-s-history-grid", children: s.h.map((item) => jsxs("div", { className: "dsk-s-history-item", children: [
						jsx("button", {
							type: "button",
							className: "dsk-s-history-thumb" + (s.a === item.id ? " active" : ""),
							"aria-label": t("skin.historyUse"),
							style: { backgroundImage: "url(\"" + item.data + "\")" },
							onClick: () => selectWall(item.id)
						}),
						jsx("button", {
							type: "button",
							className: "dsk-s-history-remove",
							"aria-label": t("skin.historyDelete"),
							onClick: () => deleteWall(item.id),
							children: "×"
						})
					]}, item.id)) }),
				jsx("div", { className: "dsk-s-tip", children: t("skin.tip") })
			]});
		}

		/* --------------------------- 插件体 --------------------------- */
		let started = false;
		function apply(ctx) {
			if (started) return;
			started = true;
			const log = (msg) => { try { if (ctx && ctx.logger) ctx.logger.warn(msg); } catch (e) { /* noop */ } };
			try { applySkin(state); } catch (e) { log("dsh-chat-skin: " + e.message); }
			const boot = () => mountUI();
			if (typeof document !== "undefined") {
				if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
				else boot();
			}
			/* 设置卡片：需要 slots + locale + react；缺失时静默退化为悬浮面板 */
			try {
				if (ctx && ctx.slots && ctx.locale && react_jsx_runtime && defineStore) {
					const store = createSkinRowStore();
					const injected = (actions) => {
						engineOnChange = (skin) => actions.sync(skin.c, skin.a, skin.h);
						actions.sync(state.c, state.a, state.h);
						const setColor = (color) => updateState({ ...state, c: color.toLowerCase() });
						const uploadWall = () => pickImage(addHistory);
						const clearWall = () => updateState({ ...state, a: null });
						const reset = () => updateState({ ...state, c: null, a: null });
						return {
							setColor,
							uploadWall,
							clearWall,
							reset,
							selectWall: selectHistory,
							deleteWall: deleteHistory,
							clearAllHistory: clearHistory
						};
					};
					ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), "dsh-chat-skin: settings row dictionaries");
					ctx.slots.inject("settings.general.item", () => ctx.slots.register({
						name: "settings.general.item",
						id: "chat-skin",
						order: 20,
						store,
						locale: SETTINGS_NS,
						inject: injected
					}, SkinRow));
				}
			} catch (e) { log("dsh-chat-skin card: " + e.message); }
			if (ctx && typeof ctx.effect === "function") {
				ctx.effect(() => () => {
					if (hostSaveTimer) clearTimeout(hostSaveTimer);
					flushHostState();
					if (typeof window !== "undefined") window.removeEventListener("pagehide", flushHostState);
					for (const id of [STYLE_ID, CORE_ID, WALL_ID, FAB_ID, PANEL_ID]) {
						const el = document.getElementById(id);
						if (el) el.remove();
					}
				}, "dsh-chat-skin: teardown");
			}
		}

		/* 材料化副作用：核心样式尽早注入（与官方 ui-theme 同款时机） */
		ensureStyle(CORE_ID, CORE_CSS);

		/* 官方导出纪律（packages/client/AGENTS.md）：UI 插件只导出 apply/inject */
		exports.apply = apply;
		exports.inject = ["slots", "locale"];
		return module.exports;
	}
});
