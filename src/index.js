/**
 * Host-side persistence for dsh-client-chat-skin.
 *
 * The native Harness shell intentionally starts the Web profile on port 0, so
 * its loopback origin changes between launches. Browser localStorage is scoped
 * to that origin and therefore cannot be the durable source of truth. This
 * Host half stores the (already compressed) skin state below DSH_HOME/data and
 * exposes it only through a same-origin WebServer route.
 */
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROUTE = "/api/plugins/dsh-client-chat-skin/state";
const MAX_BODY_BYTES = 16 * 1024 * 1024;
const HISTORY_LIMIT = 5;

function dshHome() {
	if (process.env.DSH_HOME && process.env.DSH_HOME.trim()) return resolve(process.env.DSH_HOME);
	// <home>/profiles/web/node_modules/dsh-client-chat-skin/src/index.js
	return resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
}

export const STATE_FILE = join(dshHome(), "data", "chat-skin", "state.json");

function isImageDataUrl(value) {
	return typeof value === "string" && /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

export function normalizeState(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const history = Array.isArray(value.h)
		? value.h
			.filter((entry) => entry && typeof entry.id === "string" && entry.id.length <= 100 && isImageDataUrl(entry.data))
			.slice(0, HISTORY_LIMIT)
			.map((entry) => ({ id: entry.id, data: entry.data }))
		: [];
	const active = typeof value.a === "string" && history.some((entry) => entry.id === value.a)
		? value.a
		: null;
	return {
		c: typeof value.c === "string" && /^#[0-9a-f]{6}$/i.test(value.c) ? value.c.toLowerCase() : null,
		a: active,
		h: history
	};
}

async function readState() {
	try {
		return normalizeState(JSON.parse(await readFile(STATE_FILE, "utf8")));
	} catch (error) {
		if (error && error.code === "ENOENT") return null;
		throw error;
	}
}

async function writeState(state) {
	await mkdir(dirname(STATE_FILE), { recursive: true, mode: 0o700 });
	const temp = STATE_FILE + ".tmp-" + process.pid + "-" + Math.random().toString(36).slice(2);
	try {
		await writeFile(temp, JSON.stringify(state), { encoding: "utf8", mode: 0o600 });
		await rename(temp, STATE_FILE);
	} catch (error) {
		await unlink(temp).catch(() => {});
		throw error;
	}
}

function sendJson(res, status, value) {
	const body = JSON.stringify(value);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"content-length": Buffer.byteLength(body)
	});
	res.end(body);
}

async function readJsonBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += bytes.length;
		if (size > MAX_BODY_BYTES) {
			const error = new Error("skin state exceeds 16 MiB");
			error.statusCode = 413;
			throw error;
		}
		chunks.push(bytes);
	}
	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function stateRoute(req, res) {
	if (req.method === "GET") {
		try {
			sendJson(res, 200, { version: 1, state: await readState() });
		} catch {
			sendJson(res, 500, { error: "state-read-failed" });
		}
		return;
	}
	if (req.method === "PUT") {
		try {
			const state = normalizeState(await readJsonBody(req));
			if (!state) {
				sendJson(res, 400, { error: "invalid-state" });
				return;
			}
			await writeState(state);
			sendJson(res, 200, { version: 1, state });
		} catch (error) {
			sendJson(res, error && error.statusCode === 413 ? 413 : 400, {
				error: error && error.statusCode === 413 ? "state-too-large" : "state-write-failed"
			});
		}
		return;
	}
	res.writeHead(405, { allow: "GET, PUT" });
	res.end();
}

export function apply(ctx) {
	ctx.inject(["webServer"], (httpCtx) => {
		httpCtx.effect(
			() => httpCtx.webServer.register({ kind: "exact", path: ROUTE, handler: stateRoute }),
			"dsh-client-chat-skin: durable local state route"
		);
	});
}
