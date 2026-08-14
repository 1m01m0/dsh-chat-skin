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
		 *    槽位（与官方 Appearance 行同款机制），可换预设/传壁纸/调参数
		 *  - 状态持久化在 localStorage（key: dsh.chatSkin.v1）
		 *
		 * 依赖（浏览器端 resolve，均已在官方 roster 中）：
		 *  - react/jsx-runtime（shell 内核种子）
		 *  - @deepseek-ai/dsh-client-runtime/client 的 defineStore
		 * ------------------------------------------------------------------ */

		const STORAGE_KEY = "dsh.chatSkin.v1";
		const STYLE_ID = "dsh-chat-skin-style";
		const CORE_ID = "dsh-chat-skin-core";
		const WALL_ID = "dsh-chat-skin-wall";
		const FAB_ID = "dsh-chat-skin-fab";
		const PANEL_ID = "dsh-chat-skin-panel";
		const SETTINGS_NS = "chat-skin";

		/* ------------------- React 依赖（失败则退化为纯 CSS 引擎）------------------- */
		let react_jsx_runtime = null;
		let defineStore = null;
		try {
			react_jsx_runtime = require("react/jsx-runtime");
			defineStore = require("@deepseek-ai/dsh-client-runtime/client").defineStore;
		} catch (e) { /* 无 React 环境：仅保留 vanilla 引擎 */ }

		/* ----------------------------- 预设 ----------------------------- */
		const PRESETS = [
			{
				id: "sakura", label: "樱花粉",
				dot: "linear-gradient(135deg,#ffd7e6,#ff8fc0)",
				wall: "radial-gradient(700px 520px at 82% 8%,rgba(255,190,220,.9),transparent 65%),radial-gradient(620px 500px at 8% 92%,rgba(255,228,240,.92),transparent 62%),linear-gradient(160deg,#fff3f7 0%,#ffdde9 48%,#ffc3da 100%)",
				dim: 0.05, blur: 0,
				surface: { light: [255,244,249], dark: [42,25,35] },
				accent: { light: "#e84393", dark: "#ff7ab8" },
				ink: { light: "#4a2b3d", dark: "#ffdcec" },
				extra: ""
			},
			{
				id: "mint", label: "薄荷海盐",
				dot: "linear-gradient(135deg,#d9fff2,#4fd1a5)",
				wall: "radial-gradient(700px 520px at 12% 12%,rgba(217,255,242,.95),transparent 62%),radial-gradient(640px 520px at 88% 88%,rgba(201,242,229,.9),transparent 60%),linear-gradient(160deg,#eafaf4 0%,#d6f5e8 48%,#c0ecdc 100%)",
				dim: 0.04, blur: 0,
				surface: { light: [235,250,244], dark: [15,30,26] },
				accent: { light: "#0f9d6e", dark: "#34d399" },
				ink: { light: "#1e3a33", dark: "#d3f5e8" },
				extra: ""
			},
			{
				id: "starry", label: "深夜星空",
				dot: "radial-gradient(circle at 30% 30%,#fff 1px,transparent 1.5px),radial-gradient(circle at 60% 65%,#fff 1px,transparent 1.5px),linear-gradient(160deg,#0b1026,#1a1033 60%,#2b1a4a)",
				wall: "radial-gradient(1.2px 1.2px at 18% 28%,rgba(255,255,255,.9),transparent 60%),radial-gradient(1px 1px at 36% 68%,rgba(255,255,255,.7),transparent 60%),radial-gradient(1.4px 1.4px at 52% 18%,rgba(255,255,255,.95),transparent 60%),radial-gradient(1px 1px at 66% 44%,rgba(255,255,255,.6),transparent 60%),radial-gradient(1.6px 1.6px at 78% 74%,rgba(255,235,200,.9),transparent 60%),radial-gradient(1px 1px at 88% 30%,rgba(255,255,255,.8),transparent 60%),radial-gradient(1.1px 1.1px at 8% 78%,rgba(255,255,255,.65),transparent 60%),linear-gradient(170deg,#070b1c 0%,#0e1530 45%,#241743 100%)",
				dim: 0.1, blur: 0,
				surface: { light: [232,236,250], dark: [13,16,34] },
				accent: { light: "#5b7cfa", dark: "#8ab4ff" },
				ink: { light: "#232a4d", dark: "#dde4ff" },
				extra: ""
			},
			{
				id: "cyber", label: "赛博霓虹",
				dot: "linear-gradient(135deg,#00e5ff,#ff2bd6)",
				wall: "radial-gradient(900px 620px at 15% 8%,rgba(0,229,255,.28),transparent 62%),radial-gradient(900px 700px at 88% 92%,rgba(255,43,214,.26),transparent 62%),linear-gradient(160deg,#0a0e1f 0%,#12122a 45%,#1a0f2e 100%)",
				dim: 0.18, blur: 0,
				surface: { light: [228,235,255], dark: [15,18,36] },
				accent: { light: "#0891b2", dark: "#22d3ee" },
				ink: { light: "#1c2540", dark: "#cfe8ff" },
				extra: "@keyframes dsh-skin-hue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}@media (prefers-reduced-motion:reduce){body[data-ds-skin=\"cyber\"] #" + WALL_ID + "{animation:none}}body[data-ds-skin=\"cyber\"] #" + WALL_ID + "{animation:dsh-skin-hue 30s linear infinite}"
			},
			{
				id: "sunset", label: "落日暖阳",
				dot: "linear-gradient(135deg,#ff9a56,#ff5e62 55%,#b44e8f)",
				wall: "radial-gradient(900px 620px at 80% 12%,rgba(255,214,165,.5),transparent 62%),radial-gradient(700px 600px at 12% 88%,rgba(255,120,90,.35),transparent 60%),linear-gradient(165deg,#ff9a56 0%,#ff5e62 42%,#b44e8f 72%,#6b3f8f 100%)",
				dim: 0.22, blur: 0,
				surface: { light: [255,241,235], dark: [42,22,32] },
				accent: { light: "#e8590c", dark: "#ff9e7a" },
				ink: { light: "#4a2414", dark: "#ffe4d6" },
				extra: ""
			},
			{
				id: "frosted", label: "极简毛玻璃",
				dot: "linear-gradient(135deg,#eef2f7,#c7d2e0)",
				wall: "linear-gradient(135deg,#f4f6fa 0%,#dde4ee 55%,#c3cfe0 100%)",
				dim: 0, blur: 14,
				surface: { light: [255,255,255], dark: [30,33,40] },
				accent: { light: "#4176e6", dark: "#7aa2ff" },
				ink: { light: "#1f2937", dark: "#e6ebf5" },
				extra: "body[data-ds-skin=\"frosted\"] #root > *{backdrop-filter:blur(14px) saturate(1.15);-webkit-backdrop-filter:blur(14px) saturate(1.15)}body[data-ds-skin=\"frosted\"] #root > * *{backdrop-filter:none}"
			}
		];

		/* --------------------------- 核心样式 --------------------------- */
		const CORE_CSS = "#" + WALL_ID + "{position:fixed;inset:0;z-index:-1;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;transition:opacity .35s ease}#" + WALL_ID + "::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,var(--dsh-skin-dim,0))}#" + FAB_ID + "{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:46px;height:46px;border:none;border-radius:50%;cursor:pointer;font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center;background:conic-gradient(from 210deg,#ff6b6b,#feca57,#48dbfb,#a29bfe,#ff6b6b);box-shadow:0 4px 14px rgba(0,0,0,.35);transition:transform .15s ease}#" + FAB_ID + ":hover{transform:scale(1.08)}#" + PANEL_ID + "{position:fixed;right:20px;bottom:76px;z-index:2147483001;width:296px;max-height:min(70vh,640px);overflow:auto;box-sizing:border-box;display:none;flex-direction:column;gap:12px;padding:14px;border-radius:16px;background:rgba(22,22,28,.94);color:#eaeaea;font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.08)}#" + PANEL_ID + ".open{display:flex}#" + PANEL_ID + " .dsk-head{display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:600}#" + PANEL_ID + " .dsk-close{background:none;border:none;color:#9a9aa2;cursor:pointer;font-size:15px;padding:2px 6px;border-radius:6px}#" + PANEL_ID + " .dsk-close:hover{background:rgba(255,255,255,.1);color:#fff}#" + PANEL_ID + " .dsk-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}#" + PANEL_ID + " .dsk-item{display:flex;align-items:center;gap:8px;padding:7px 8px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.04);cursor:pointer;color:#eaeaea;font-size:12.5px;text-align:left}#" + PANEL_ID + " .dsk-item:hover{background:rgba(255,255,255,.09)}#" + PANEL_ID + " .dsk-item.on{border-color:#5b8cff;background:rgba(91,140,255,.14)}#" + PANEL_ID + " .dsk-dot{width:34px;height:34px;flex:none;border-radius:9px;border:1px solid rgba(255,255,255,.15);background-size:cover;background-position:center}#" + PANEL_ID + " .dsk-sec{font-size:11px;color:#9a9aa2;letter-spacing:.5px}#" + PANEL_ID + " .dsk-row{display:flex;align-items:center;gap:8px}#" + PANEL_ID + " .dsk-btn{flex:1;padding:7px 8px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(255,255,255,.06);color:#eaeaea;cursor:pointer;font-size:12.5px}#" + PANEL_ID + " .dsk-btn:hover{background:rgba(255,255,255,.12)}#" + PANEL_ID + " .dsk-range{flex:1;display:flex;align-items:center;gap:8px;color:#c9c9cf;font-size:12px}#" + PANEL_ID + " .dsk-range input{flex:1;accent-color:#5b8cff}#" + PANEL_ID + " .dsk-tip{font-size:11px;color:#8a8a92}@media (prefers-reduced-motion:reduce){#" + FAB_ID + "{transition:none}}" +
			/* 设置卡片（原生观感，沿用官方 token） */
			".dsk-s-group{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;padding:16px 0;display:flex}.dsk-s-title{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}.dsk-s-sub{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.dsk-s-cubes{flex-wrap:wrap;align-items:stretch;gap:8px;display:flex}.dsk-s-cube{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:14px;flex-direction:column;flex:1 1 150px;justify-content:center;align-items:center;gap:6px;padding:12px;font-size:13px;line-height:20px;display:flex;min-width:120px}.dsk-s-cube:hover:not(.dsk-s-on){background:var(--dsw-alias-interactive-bg-hover)}.dsk-s-on{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-static-neutral-bluish-400)}.dsk-s-dot{width:26px;height:26px;border-radius:8px;border:1px solid rgba(127,127,127,.25);background-size:cover;background-position:center}.dsk-s-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.dsk-s-btn{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:10px;padding:6px 12px;font-size:13px;line-height:20px}.dsk-s-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dsk-s-btn:disabled{opacity:.45;cursor:default}.dsk-s-range{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12.5px;flex:1 1 200px}.dsk-s-range input{flex:1;accent-color:var(--dsw-alias-brand-primary)}.dsk-s-tip{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}";

		/* --------------------------- 工具函数 --------------------------- */
		function hexToRgb(hex) {
			const h = hex.replace("#", "");
			return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
		}
		function rgba(triple, a) { return "rgba(" + triple[0] + "," + triple[1] + "," + triple[2] + "," + a + ")"; }
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
				if (!raw) return { p: null, w: null, d: 0, b: 0 };
				const s = JSON.parse(raw);
				return { p: typeof s.p === "string" ? s.p : null, w: typeof s.w === "string" ? s.w : null, d: typeof s.d === "number" ? s.d : 0, b: typeof s.b === "number" ? s.b : 0 };
			} catch (e) { return { p: null, w: null, d: 0, b: 0 }; }
		}
		function saveState(s) {
			try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* 忽略配额等错误 */ }
		}

		/* ------------------------- 皮肤 CSS 生成 ------------------------- */
		function buildSkinCSS(skin) {
			const parts = [];
			const preset = PRESETS.find((x) => x.id === skin.p);
			const wallCss = skin.w ? "url(\"" + skin.w + "\") center/cover no-repeat" : (preset ? preset.wall : "");
			parts.push("#" + WALL_ID + "{" + (wallCss ? "background:" + wallCss + ";" : "") + "--dsh-skin-dim:" + skin.d + "}");
			if (!skin.p && !skin.w) return parts.join("\n");
			const surf = preset ? preset.surface : { light: [245,245,248], dark: [28,28,34] };
			const accent = preset ? preset.accent : { light: "#4176e6", dark: "#7aa2ff" };
			const ink = preset ? preset.ink : { light: "#1f2937", dark: "#e6ebf5" };
			const themes = [
				{ sel: "body[data-ds-skin=\"" + (skin.p || "custom") + "\"]", c: surf.light, l: hexToRgb(ink.light), a: accent.light },
				{ sel: "body[data-ds-dark-theme][data-ds-skin=\"" + (skin.p || "custom") + "\"]", c: surf.dark, l: hexToRgb(ink.dark), a: accent.dark }
			];
			for (const t of themes) {
				const vars = [
					["--dsw-alias-bg-base", rgba(t.c, 0.5)],
					["--dsw-alias-bg-layer-1", rgba(t.c, 0.72)],
					["--dsw-alias-bg-layer-2", rgba(t.c, 0.78)],
					["--dsw-alias-bg-layer-3", rgba(t.c, 0.85)],
					["--dsw-alias-bg-module-platform", rgba(t.c, 0.82)],
					["--dsw-alias-bg-overlay", rgba(t.c, 0.9)],
					["--dsw-specific-sidebar-fill", rgba(t.c, 0.45)],
					["--dsw-specific-bubble", rgba(t.c, 0.66)],
					["--dsw-specific-bubble-highlight", rgba(t.c, 0.5)],
					["--dsw-specific-input-major", rgba(t.c, 0.6)],
					["--dsw-specific-menu", rgba(t.c, 0.95)],
					["--dsw-alias-tooltip-bg", rgba(t.c, 0.97)],
					["--dsw-alias-bg-mask-drop", rgba(t.c, 0.9)],
					["--dsw-alias-markdown-code-block", rgba(t.c, 0.55)],
					["--dsw-alias-markdown-code-block-banner", rgba(t.c, 0.5)],
					["--dsw-alias-markdown-inline-code", rgba(t.c, 0.6)],
					["--dsw-alias-border-l1", rgba(t.l, 0.1)],
					["--dsw-alias-border-l2", rgba(t.l, 0.14)],
					["--dsw-alias-border-l3", rgba(t.l, 0.18)],
					["--dsw-alias-label-primary", "#" + t.l.map((v) => v.toString(16).padStart(2, "0")).join("")],
					["--dsw-alias-label-secondary", rgba(t.l, 0.78)],
					["--dsw-alias-label-tertiary", rgba(t.l, 0.62)],
					["--dsw-alias-label-caption", rgba(t.l, 0.5)],
					["--dsw-alias-brand-primary", t.a],
					["--dsw-alias-brand-text", "#ffffff"],
					["--dsw-alias-button-primary-fill", t.a],
					["--dsw-alias-button-primary-hover", t.a],
					["--dsw-alias-interactive-bg-hover", rgba(t.l, 0.08)],
					["--dsw-alias-interactive-bg-active", rgba(t.l, 0.12)],
					["--dsw-alias-scrollbar-bg-l1", rgba(t.l, 0.1)],
					["--dsw-alias-scrollbar-hover-l1", rgba(t.l, 0.2)],
					["--dsw-alias-scrollbar-bg-l2", rgba(t.l, 0.1)],
					["--dsw-alias-scrollbar-hover-l2", rgba(t.l, 0.2)],
					["--dsw-alias-bg-skeleton", rgba(t.l, 0.06)],
					["--dsw-specific-sidebar-nav-item-active", rgba(t.l, 0.1)],
					["--dsw-specific-sidebar-nav-item-active-accent", rgba(t.l, 0.14)],
					["--dsw-specific-sidebar-nav-item-hover", rgba(t.l, 0.06)]
				];
				parts.push(t.sel + "{" + vars.map((v) => v[0] + ":" + v[1]).join(";") + "}");
			}
			if (preset && preset.extra) parts.push(preset.extra);
			return parts.join("\n");
		}

		/* --------------------------- 应用皮肤 --------------------------- */
		let engineOnChange = null;
		function applySkin(skin) {
			if (typeof document === "undefined") return;
			ensureStyle(STYLE_ID, buildSkinCSS(skin));
			const wall = ensureWall();
			if (!skin.p && !skin.w) {
				delete document.body.dataset.dsSkin;
				wall.style.opacity = "0";
			} else {
				document.body.dataset.dsSkin = skin.p || "custom";
				wall.style.opacity = "1";
				renderPanel(skin);
			}
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
					try { resolve(canvas.toDataURL("image/jpeg", 0.82)); }
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
			input.onchange = async () => {
				const f = input.files && input.files[0];
				if (!f) return;
				try {
					const raw = await fileToDataUrl(f);
					cb(await compressImage(raw, 1600));
				} catch (e) { alert("图片读取失败"); }
			};
			input.click();
		}

		/* --------------------------- 悬浮面板（vanilla） --------------------------- */
		let state = loadState();
		function renderPanel(skin) {
			const panel = document.getElementById(PANEL_ID);
			if (!panel) return;
			const items = panel.querySelector(".dsk-grid");
			items.innerHTML = "";
			const def = document.createElement("button");
			def.type = "button";
			def.className = "dsk-item" + (!skin.p && !skin.w ? " on" : "");
			def.innerHTML = "<span class='dsk-dot' style='background:linear-gradient(135deg,#9aa0aa,#5a5f6a)'></span><span>默认</span>";
			def.onclick = () => { state = { p: null, w: null, d: 0, b: 0 }; saveState(state); applySkin(state); };
			items.appendChild(def);
			for (const p of PRESETS) {
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "dsk-item" + (skin.p === p.id ? " on" : "");
				btn.innerHTML = "<span class='dsk-dot' style='background:" + p.dot + "'></span><span>" + p.label + "</span>";
				btn.onclick = () => { state = { ...state, p: p.id, w: null }; saveState(state); applySkin(state); };
				items.appendChild(btn);
			}
			const fileBtn = document.getElementById("dsk-file");
			const clearBtn = document.getElementById("dsk-clear");
			const dimRange = document.getElementById("dsk-dim");
			const blurRange = document.getElementById("dsk-blur");
			const dimVal = document.getElementById("dsk-dim-val");
			const blurVal = document.getElementById("dsk-blur-val");
			clearBtn.disabled = !skin.w;
			clearBtn.style.opacity = skin.w ? "1" : ".45";
			dimRange.value = String(Math.round(skin.d * 100));
			blurRange.value = String(skin.b);
			dimVal.textContent = Math.round(skin.d * 100) + "%";
			blurVal.textContent = skin.b + "px";
			fileBtn.onclick = () => pickImage((dataUrl) => {
				state = { ...state, p: state.p || "custom", w: dataUrl };
				saveState(state);
				applySkin(state);
			});
			clearBtn.onclick = () => { state = { ...state, w: null, p: state.p === "custom" ? null : state.p }; saveState(state); applySkin(state); };
			dimRange.oninput = () => {
				state.d = Number(dimRange.value) / 100;
				dimVal.textContent = dimRange.value + "%";
				saveState(state);
				ensureStyle(STYLE_ID, buildSkinCSS(state));
				const wall = document.getElementById(WALL_ID);
				if (wall) wall.style.setProperty("--dsh-skin-dim", String(state.d));
				if (engineOnChange) engineOnChange(state);
			};
			blurRange.oninput = () => {
				state.b = Number(blurRange.value);
				blurVal.textContent = blurRange.value + "px";
				saveState(state);
				ensureStyle(STYLE_ID, buildSkinCSS(state));
				if (engineOnChange) engineOnChange(state);
			};
		}
		function mountUI() {
			if (typeof document === "undefined" || document.getElementById(FAB_ID)) return;
			const fab = document.createElement("button");
			fab.id = FAB_ID;
			fab.type = "button";
			fab.title = "换肤 / 壁纸";
			fab.setAttribute("aria-label", "换肤 / 壁纸");
			fab.textContent = "🎨";
			const panel = document.createElement("div");
			panel.id = PANEL_ID;
			panel.innerHTML = "<div class='dsk-head'><span>DSH 换肤 / 壁纸</span><button type='button' class='dsk-close' aria-label='关闭'>✕</button></div><div class='dsk-grid'></div><div class='dsk-sec'>自定义壁纸</div><div class='dsk-row'><button type='button' class='dsk-btn' id='dsk-file'>📷 选择图片</button><button type='button' class='dsk-btn' id='dsk-clear'>移除</button></div><div class='dsk-row'><label class='dsk-range'>压暗 <input type='range' id='dsk-dim' min='0' max='70' step='1'><span id='dsk-dim-val'></span></label></div><div class='dsk-row'><label class='dsk-range'>毛玻璃 <input type='range' id='dsk-blur' min='0' max='24' step='1'><span id='dsk-blur-val'></span></label></div><div class='dsk-tip'>选择会保存在本机（localStorage），下次打开自动恢复。</div>";
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
			"skin.title": "换肤 / 壁纸",
			"skin.sub": "预设皮肤、自定义壁纸与表面效果",
			"skin.default": "默认",
			"skin.sakura": "樱花粉",
			"skin.mint": "薄荷海盐",
			"skin.starry": "深夜星空",
			"skin.cyber": "赛博霓虹",
			"skin.sunset": "落日暖阳",
			"skin.frosted": "极简毛玻璃",
			"skin.upload": "📷 选择图片",
			"skin.remove": "移除壁纸",
			"skin.reset": "恢复默认",
			"skin.dim": "压暗",
			"skin.blur": "毛玻璃",
			"skin.tip": "选择保存在本机（localStorage），重启应用后自动恢复。"
		};
		const en = {
			"skin.title": "Skin & Wallpaper",
			"skin.sub": "Presets, custom wallpaper and surface effects",
			"skin.default": "Default",
			"skin.sakura": "Sakura",
			"skin.mint": "Mint",
			"skin.starry": "Starry",
			"skin.cyber": "Cyberpunk",
			"skin.sunset": "Sunset",
			"skin.frosted": "Frosted",
			"skin.upload": "📷 Pick image",
			"skin.remove": "Remove",
			"skin.reset": "Reset",
			"skin.dim": "Dim",
			"skin.blur": "Blur",
			"skin.tip": "Your choice is saved locally and restored on next launch."
		};
		function createSkinRowStore() {
			if (!defineStore) return null;
			return defineStore({
				init: () => ({ p: null, w: null, d: 0, b: 0 }),
				actions: { sync: (d, p, w, dim, blur) => { d.p = p; d.w = w; d.d = dim; d.b = blur; } }
			});
		}
		function SkinRow(props) {
			const { t, useStore, setPreset, uploadWall, clearWall, setDim, setBlur, reset } = props;
			const s = useStore((x) => x);
			const jsx = react_jsx_runtime.jsx;
			const jsxs = react_jsx_runtime.jsxs;
			const cubes = [null, ...PRESETS];
			return jsxs("div", { className: "dsk-s-group", children: [
				jsx("div", { className: "dsk-s-title", children: t("skin.title") }),
				jsx("div", { className: "dsk-s-sub", children: t("skin.sub") }),
				jsxs("div", { className: "dsk-s-cubes", children: cubes.map((p) => {
					const on = p ? s.p === p.id : (!s.p && !s.w);
					return jsxs("button", {
						type: "button",
						className: "dsk-s-cube" + (on ? " dsk-s-on" : ""),
						"aria-pressed": on,
						onClick: () => (p ? setPreset(p.id) : reset()),
						children: [
							jsx("span", { className: "dsk-s-dot", style: { background: p ? p.dot : "linear-gradient(135deg,#9aa0aa,#5a5f6a)" } }),
							jsx("span", { children: p ? t("skin." + p.id) : t("skin.default") })
						]
					}, p ? p.id : "default");
				}) }),
				jsxs("div", { className: "dsk-s-row", children: [
					jsx("button", { type: "button", className: "dsk-s-btn", onClick: uploadWall, children: t("skin.upload") }),
					jsx("button", { type: "button", className: "dsk-s-btn", disabled: !s.w, onClick: clearWall, children: t("skin.remove") }),
					jsx("button", { type: "button", className: "dsk-s-btn", onClick: reset, children: t("skin.reset") })
				]}),
				jsxs("div", { className: "dsk-s-row", children: [
					jsxs("label", { className: "dsk-s-range", children: [
						jsx("span", { children: t("skin.dim") }),
						jsx("input", { type: "range", min: "0", max: "70", step: "1", value: String(Math.round(s.d * 100)), onChange: (e) => setDim(Number(e.target.value) / 100) }),
						jsx("span", { children: Math.round(s.d * 100) + "%" })
					]}),
					jsxs("label", { className: "dsk-s-range", children: [
						jsx("span", { children: t("skin.blur") }),
						jsx("input", { type: "range", min: "0", max: "24", step: "1", value: String(s.b), onChange: (e) => setBlur(Number(e.target.value)) }),
						jsx("span", { children: s.b + "px" })
					]})
				]}),
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
						engineOnChange = (skin) => actions.sync(skin.p, skin.w, skin.d, skin.b);
						actions.sync(state.p, state.w, state.d, state.b);
						const setPreset = (id) => { state = { ...state, p: id, w: null }; saveState(state); applySkin(state); };
						const uploadWall = () => pickImage((dataUrl) => { state = { ...state, w: dataUrl }; saveState(state); applySkin(state); });
						const clearWall = () => { state = { ...state, w: null, p: state.p === "custom" ? null : state.p }; saveState(state); applySkin(state); };
						const setDim = (v) => { state = { ...state, d: v }; saveState(state); applySkin(state); };
						const setBlur = (v) => { state = { ...state, b: v }; saveState(state); applySkin(state); };
						const reset = () => { state = { p: null, w: null, d: 0, b: 0 }; saveState(state); applySkin(state); };
						return { setPreset, uploadWall, clearWall, setDim, setBlur, reset };
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
				ctx.effect(() => {
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
