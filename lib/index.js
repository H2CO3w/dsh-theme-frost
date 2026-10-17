// dsh-theme-frost — host half.
//
// Serves this folder's runtime data read-only:
//   GET /theme-frost/state             -> { config, active: { dark, light } }
//   GET /theme-frost/wallpapers/<file> -> image bytes
//
// config.json is re-read on every request, so edits need only a page refresh.
// Code, config and images live in the same folder (a link-installed plugin), so
// the plugin stays self-contained.
import { createReadStream, realpathSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

export const inject = ["webServer"];

/** The plugin's own folder (real path, so a link install resolves to the checkout). */
const ROOT = realpathSync(join(import.meta.dirname, ".."));
const STATE = "/theme-frost/state";
const IMAGES = "/theme-frost/wallpapers";

/** Allowed wallpaper extensions and their response media type. */
const TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
};

/** First-run template, and the values a partial config falls back to. */
const DEFAULTS = {
  blur: 2,
  surfaceOpacity: 0.5,
  panelOpacity: 0.9,
  wallpaper: "",
  dark: { wallpaper: "reimu.jpg", brightness: 0.2, saturate: 1.4 },
  light: { wallpaper: "marisa.jpg", brightness: 1.05, saturate: 1.2 },
};

function notFound(res) {
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("not found");
}

/** Read config.json, falling back to DEFAULTS per field. */
async function readConfig(root) {
  let raw = {};
  try {
    raw = JSON.parse(await readFile(join(root, "config.json"), "utf8"));
  } catch {}
  if (raw === null || typeof raw !== "object") raw = {};
  return {
    ...DEFAULTS,
    ...raw,
    dark: { ...DEFAULTS.dark, ...raw.dark },
    light: { ...DEFAULTS.light, ...raw.light },
  };
}

export function apply(ctx, config) {
  const root = config?.dir ?? ROOT;
  const images = join(root, "wallpapers");

  void (async () => {
    await mkdir(images, { recursive: true });
    await writeFile(join(root, "config.json"), `${JSON.stringify(DEFAULTS, undefined, 2)}\n`, {
      flag: "wx",
    }).catch(() => {});
  })().catch((error) => ctx.logger?.warn?.(`dsh-theme-frost: ${String(error)}`));

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: STATE,
        handler: async (_req, res) => {
          const config = await readConfig(root);
          const files = (await readdir(images).catch(() => []))
            .filter((name) => TYPES[extname(name).toLowerCase()] !== undefined)
            .sort();
          const pick = (name) => (files.includes(name) ? name : null);
          const fallback = pick(config.wallpaper) ?? files[0] ?? null;
          const active = {
            dark: pick(config.dark.wallpaper) ?? fallback,
            light: pick(config.light.wallpaper) ?? fallback,
          };
          res.writeHead(200, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          });
          res.end(JSON.stringify({ config, active }));
        },
      }),
    "dsh-theme-frost: state",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "prefix",
        path: IMAGES,
        handler: async (req, res) => {
          let name;
          try {
            name = decodeURIComponent(
              new URL(req.url, "http://x").pathname.slice(IMAGES.length + 1),
            );
          } catch {
            name = "";
          }
          if (!name || basename(name) !== name || name.startsWith(".")) return notFound(res);
          const path = join(images, name);
          const type = TYPES[extname(name).toLowerCase()];
          const info = type === undefined ? undefined : await stat(path).catch(() => undefined);
          if (info === undefined || !info.isFile()) return notFound(res);
          res.writeHead(200, {
            "content-type": type,
            "cache-control": "no-cache",
            // A wallpaper is an image, never a document: neutralise scripts in an
            // SVG opened directly at this URL.
            "content-security-policy": "sandbox",
          });
          createReadStream(path).pipe(res);
        },
      }),
    "dsh-theme-frost: images",
  );
}
