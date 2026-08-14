import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import test from "node:test";

const home = await mkdtemp(join(tmpdir(), "dsh-chat-skin-"));
process.env.DSH_HOME = home;
const plugin = await import("../src/index.js?test=" + Date.now());

class ResponseCapture {
	status = 0;
	headers = {};
	body = "";
	writeHead(status, headers = {}) { this.status = status; this.headers = headers; }
	end(body = "") { this.body += body; }
}

test.after(async () => { await rm(home, { recursive: true, force: true }); });

test("normalizes color, active history, and limit", () => {
	const items = Array.from({ length: 7 }, (_, index) => ({
		id: "item-" + index,
		data: "data:image/jpeg;base64," + Buffer.from(String(index)).toString("base64")
	}));
	assert.deepEqual(plugin.normalizeState({ c: "#AABBCC", a: "item-1", h: items }), {
		c: "#aabbcc",
		a: "item-1",
		h: items.slice(0, 5)
	});
});

test("PUT survives a later GET through the fixed Host file", async () => {
	const state = { c: "#123456", a: "wall", h: [{ id: "wall", data: "data:image/jpeg;base64,YQ==" }] };
	const putReq = Readable.from([JSON.stringify(state)]);
	putReq.method = "PUT";
	const putRes = new ResponseCapture();
	await plugin.stateRoute(putReq, putRes);
	assert.equal(putRes.status, 200);

	const stored = JSON.parse(await readFile(plugin.STATE_FILE, "utf8"));
	assert.deepEqual(stored, state);

	const getReq = Readable.from([]);
	getReq.method = "GET";
	const getRes = new ResponseCapture();
	await plugin.stateRoute(getReq, getRes);
	assert.equal(getRes.status, 200);
	assert.deepEqual(JSON.parse(getRes.body), { version: 1, state });
});
