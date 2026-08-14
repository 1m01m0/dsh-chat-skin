#!/usr/bin/env node
/* dsh-client-chat-skin — 卸载客户端插件（幂等）
 * 用法：node uninstall.mjs [--home <dsh-home>]
 */
import { readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const PLUGIN_ID = "chat-skin";
const PLUGIN_NAME = "dsh-client-chat-skin";

function dshHome() {
	const flag = process.argv.findIndex((a) => a === "--home");
	if (flag !== -1 && process.argv[flag + 1]) return resolve(process.argv[flag + 1]);
	if (process.env.DSH_HOME && process.env.DSH_HOME.trim().length > 0) return resolve(process.env.DSH_HOME);
	return join(homedir(), ".dsh");
}
const ok = (msg) => console.log("✓ " + msg);
const warn = (msg) => console.log("· " + msg);

const home = dshHome();
const profile = join(home, "profiles", "web");
const patchFile = join(profile, "cordis.patch.yml");
const installDir = join(profile, "node_modules", PLUGIN_NAME);

/* 1. 移除 patch 行：删除包含我们的 id/name 的 insert 组 */
if (existsSync(patchFile)) {
	let patch = await readFile(patchFile, "utf8");
	const lines = patch.split("\n");
	const out = [];
	let i = 0;
	let removed = false;
	while (i < lines.length) {
		const line = lines[i];
		// 归属注释（无论是否紧邻 insert 组）一律删除
		if (/^#\s*dsh-chat-skin:/.test(line.trimStart())) {
			removed = true;
			i++;
			continue;
		}
		const isInsert = /^-\s*insert:/.test(line.trimStart());
		if (isInsert) {
			// 收集该 insert 组（后续缩进行）
			const group = [line];
			let j = i + 1;
			while (j < lines.length && /^\s+\S/.test(lines[j]) && !/^-\s*\S/.test(lines[j])) {
				group.push(lines[j]);
				j++;
			}
			if (group.some((l) => l.includes("id: " + PLUGIN_ID) && l.includes(PLUGIN_NAME)) ||
				group.some((l) => l.includes("name: " + PLUGIN_NAME))) {
				removed = true;
				// 连带删除紧邻的归属注释行
				if (out.length > 0 && out[out.length - 1].trimStart().startsWith("#") &&
					out[out.length - 1].includes(PLUGIN_NAME)) out.pop();
				i = j; // 整组丢弃
				continue;
			}
			out.push(...group);
			i = j;
			continue;
		}
		// 兜底：单独的 - id: chat-skin / name 行
		if (line.includes("id: " + PLUGIN_ID) || line.includes("name: " + PLUGIN_NAME)) {
			removed = true;
			i++;
			continue;
		}
		out.push(line);
		i++;
	}
	if (removed) {
		await writeFile(patchFile, out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");
		ok("已从 cordis.patch.yml 移除 " + PLUGIN_NAME + " 行");
	} else {
		warn("cordis.patch.yml 中没有 " + PLUGIN_NAME + " 条目，跳过");
	}
} else {
	warn("未找到 " + patchFile);
}

/* 2. 删除插件目录 */
if (existsSync(installDir)) {
	await rm(installDir, { recursive: true, force: true });
	ok("已删除 " + installDir);
} else {
	warn("插件目录不存在（" + installDir + "）");
}

console.log("");
console.log("重启 DeepSeek Harness 后生效。");
