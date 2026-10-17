import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { apply } from "../lib/index.js";

test("serves config, wallpapers and rejects unsafe names", async (t) => {
  const home = await mkdtemp(join(tmpdir(), "dsh-theme-frost-"));
  t.after(() => rm(home, { recursive: true, force: true }));

  const images = join(home, "wallpapers");
  await mkdir(images, { recursive: true });
  await writeFile(join(images, "a.svg"), "<svg xmlns='http://www.w3.org/2000/svg'/>");
  await writeFile(join(images, "b.svg"), "<svg xmlns='http://www.w3.org/2000/svg'/>");
  await writeFile(
    join(home, "config.json"),
    JSON.stringify({ blur: 12, dark: { wallpaper: "a.svg" }, light: { wallpaper: "b.svg" } }),
  );

  const routes = [];
  apply(
    {
      effect: (start) => void start(),
      logger: { warn() {} },
      webServer: {
        register: (route) => {
          routes.push(route);
          return () => {};
        },
      },
    },
    { dir: home },
  );

  const server = createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    const route = routes.find((candidate) =>
      candidate.kind === "exact"
        ? pathname === candidate.path
        : pathname === candidate.path || pathname.startsWith(`${candidate.path}/`),
    );
    if (route === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }
    Promise.resolve(route.handler(req, res)).catch((error) => {
      res.writeHead(500);
      res.end(String(error));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const state = await getJson(`${base}/theme-frost/state`);
  assert.equal(state.config.blur, 12);
  assert.equal(state.config.panelOpacity, 0.9, "missing fields fall back to defaults");
  assert.equal(state.config.dark.saturate, 1.4);
  assert.deepEqual(state.active, { dark: "a.svg", light: "b.svg" });

  const image = await request(`${base}/theme-frost/wallpapers/${state.active.dark}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers["content-type"], "image/svg+xml");

  await writeFile(join(home, "config.json"), "{ broken");
  const broken = await getJson(`${base}/theme-frost/state`);
  assert.equal(broken.config.blur, 2, "broken JSON falls back to defaults");
  assert.deepEqual(
    broken.active,
    { dark: "a.svg", light: "a.svg" },
    "unknown default images fall back to the first file",
  );

  assert.equal((await request(`${base}/theme-frost/wallpapers/nope.txt`)).status, 404);
  assert.equal((await request(`${base}/theme-frost/wallpapers/..%2Fconfig.json`)).status, 404);
  assert.equal((await request(`${base}/theme-frost/wallpapers/.hidden.svg`)).status, 404);
});

function request(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}

async function getJson(url) {
  const response = await request(url);
  assert.equal(response.status, 200);
  return JSON.parse(response.body.toString("utf8"));
}
