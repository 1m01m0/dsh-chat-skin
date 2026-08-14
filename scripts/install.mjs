#!/usr/bin/env node
/* dsh-chat-skin skill — 安装客户端插件到 Web profile（幂等，可重复执行）
 *
 * 步骤：
 *  1. 解析 DSH home（--home 参数 > $DSH_HOME > ~/.dsh）
 *  2. 复制 plugin/dsh-chat-skin 到 <home>/profiles/web/node_modules/
 *  3. 幂等地在 cordis.patch.yml 追加 Loader insert 行
 *  4. 打印下一步（重启应用 + 验证命令）
 *
 * 用法：node install-plugin.mjs [--home <dsh-home>]
 */
import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_SRC = join(HERE, "..");
const PLUGIN_ID = "chat-skin";
const PLUGIN_NAME = "dsh-client-chat-skin";

function dshHome() {
	const flag = process.argv.findIndex((a) => a === "--home");
	if (flag !== -1 && process.argv[flag + 1]) return resolve(process.argv[flag + 1]);
	if (process.env.DSH_HOME && process.env.DSH_HOME.trim().length > 0) return resolve(process.env.DSH_HOME);
	return join(homedir(), ".dsh");
}
function fail(msg) {
	console.error("✗ " + msg);
	process.exit(1);
}
const ok = (msg) => console.log("✓ " + msg);

const home = dshHome();
const profile = join(home, "profiles", "web");
const patchFile = join(profile, "cordis.patch.yml");
const installDir = join(profile, "node_modules", PLUGIN_NAME);

console.log("DSH home : " + home);
console.log("Profile  : " + profile);
if (!existsSync(join(profile, "cordis.yml"))) {
	fail("未找到 " + join(profile, "cordis.yml") + "。请确认 DSH home 正确（可用 --home 指定），" +
		"或先以 --profile web 启动过一次应用以生成 profile。");
}

/* 1. 复制插件包 */
await rm(installDir, { recursive: true, force: true });
await mkdir(dirname(installDir), { recursive: true });
await cp(PLUGIN_SRC, installDir, { recursive: true });
ok("插件已复制到 " + installDir);

/* 2. 幂等 patch cordis.patch.yml */
let patch = "";
try { patch = await readFile(patchFile, "utf8"); } catch { patch = ""; }
if (patch.includes("name: " + PLUGIN_NAME)) {
	ok("cordis.patch.yml 已包含 " + PLUGIN_NAME + "，跳过 patch");
} else {
	// 清理上次卸载遗留的孤儿注释（防止重复）
	patch = patch.replace(/^# dsh-chat-skin:.*\n?/gm, "");
	const INSERT = [
		"# dsh-client-chat-skin: chat wallpaper / skin client plugin (installed by scripts/install.mjs)",
		"- insert:",
		"    - id: " + PLUGIN_ID,
		"      name: " + PLUGIN_NAME,
		""
	].join("\n");
	let next;
	if (/^\[\]\s*$/m.test(patch)) {
		// 空数组行：把 [] 行换成 insert 块（保留其余内容）
		next = patch.replace(/^\[\]\s*$/m, INSERT);
	} else {
		const trimmed = patch.replace(/\s+$/, "");
		if (trimmed.endsWith("]")) {
			// 以 flow-array 结尾（少见）：在 ] 之前插入块
			const idx = trimmed.lastIndexOf("]");
			next = trimmed.slice(0, idx) + "\n" + INSERT + "]\n";
		} else {
			next = trimmed + "\n" + INSERT;
		}
	}
	await writeFile(patchFile, next);
	ok("cordis.patch.yml 已追加 insert 行：" + PLUGIN_ID + " -> " + PLUGIN_NAME);
}

/* 3. 下一步 */
console.log("");
console.log("接下来：");
console.log("  1. 完全退出并重新启动 DeepSeek Harness（Loader 条目在启动时组合，必须重启才生效）");
console.log("  2. 打开聊天界面，右下角出现 🎨 悬浮按钮即可换肤/上传壁纸");
console.log("  3. 验证（应用重启后执行）：");
console.log("     curl -s http://127.0.0.1:64287/ | grep -o '" + PLUGIN_NAME + "'   # 应出现在 __DSH_BOOT__");
console.log("     curl -s -o /dev/null -w '%{http_code}\\n' http://127.0.0.1:64287/plugins/" + PLUGIN_NAME + "/client.js   # 应输出 200");
console.log("  卸载：node " + join(HERE, "uninstall.mjs") + " [--home <dsh-home>]");
