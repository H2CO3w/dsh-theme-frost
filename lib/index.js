// dsh-theme-frost — 宿主半
//
// 拥有 $DSH_HOME/theme-frost/ 这一个文件夹,并只读地通过 HTTP 暴露它:
//   GET /theme-frost/list            -> { dir, images, active }
//   GET /theme-frost/config          -> { config, path, notes }
//   GET /theme-frost/wallpapers/<f>  -> 图片字节
//
// config.json 每次请求都重新读取,所以调参只需刷新页面,不必重启 dsh。
//
// 刻意只导入 node:*:插件以 link: 安装时会被解析到源码的真实路径,裸的
// @deepseek-ai/* 就得从那里解析 —— 对小插件是不必要的失败面。
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { extname, join } from "node:path";

/** Cordis 不允许读取未声明的服务;声明后才能访问 ctx.webServer。 */
const inject = ["webServer"];

const LIST_PATH = "/theme-frost/list";
const CONFIG_PATH = "/theme-frost/config";
const IMAGE_PREFIX = "/theme-frost/wallpapers";
/** $DSH_HOME 下的插件目录,同时也是数据目录。 */
const ROOT = "theme-frost";
const WALLPAPERS = "wallpapers";

/** 允许的图片扩展名 -> 响应用的媒体类型。 */
const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
};

/** 每个数值字段的 [最小值, 最大值, 默认值];越界收敛,不报错。 */
const NUMBERS = {
  blur: [0, 80, 28],
  surfaceOpacity: [0.1, 1, 0.6],
  panelOpacity: [0.1, 1, 0.9],
  "dark.brightness": [0.2, 1.5, 0.52],
  "dark.saturate": [0, 3, 1.4],
  "light.brightness": [0.5, 2, 1.06],
  "light.saturate": [0, 3, 1.2],
};

/** 首次运行时写出的模板。 */
const DEFAULT_CONFIG = {
  blur: 28,
  surfaceOpacity: 0.6,
  panelOpacity: 0.9,
  wallpaper: "",
  dark: { brightness: 0.52, saturate: 1.4 },
  light: { brightness: 1.06, saturate: 1.2 },
};

/** $DSH_HOME,与 dsh-home-paths 的规则一致,但不导入它。 */
function dshHome() {
  const configured = process.env.DSH_HOME;
  return typeof configured === "string" && configured.length > 0
    ? configured.replace(/[/\\]+$/, "")
    : join(homedir(), ".dsh");
}

function rootDir() {
  return join(dshHome(), ROOT);
}

function wallpapersDir() {
  return join(rootDir(), WALLPAPERS);
}

function configPath() {
  return join(rootDir(), "config.json");
}

/** 读一个数值字段并收进范围;类型不对则退回默认值,两种情况都记进 notes。 */
function readNumber(value, [min, max, fallback], label, notes) {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    notes.push(`${label}: expected a number, got ${JSON.stringify(value)}; using ${fallback}`);
    return fallback;
  }
  const clamped = Math.min(max, Math.max(min, value));
  if (clamped !== value) notes.push(`${label}: ${value} is outside ${min}~${max}; clamped to ${clamped}`);
  return clamped;
}

/** 折成一个完整、合法的配置;notes 列出所有被修正的地方。 */
function normalizeConfig(raw) {
  const notes = [];
  const source = raw !== null && typeof raw === "object" ? raw : {};
  if (raw !== undefined && (raw === null || typeof raw !== "object")) {
    notes.push(`config.json: expected an object; using defaults`);
  }
  const config = {
    blur: readNumber(source.blur, NUMBERS.blur, "blur", notes),
    surfaceOpacity: readNumber(source.surfaceOpacity, NUMBERS.surfaceOpacity, "surfaceOpacity", notes),
    panelOpacity: readNumber(source.panelOpacity, NUMBERS.panelOpacity, "panelOpacity", notes),
    wallpaper: typeof source.wallpaper === "string" ? source.wallpaper : "",
  };
  for (const scheme of ["dark", "light"]) {
    const section = source[scheme] !== null && typeof source[scheme] === "object" ? source[scheme] : {};
    if (source[scheme] !== undefined && (source[scheme] === null || typeof source[scheme] !== "object")) {
      notes.push(`${scheme}: expected an object; using defaults`);
    }
    config[scheme] = {
      brightness: readNumber(section.brightness, NUMBERS[`${scheme}.brightness`], `${scheme}.brightness`, notes),
      saturate: readNumber(section.saturate, NUMBERS[`${scheme}.saturate`], `${scheme}.saturate`, notes),
    };
  }
  return { config, notes };
}

/** 缺失的文件不算错误;读不了或解析失败则退回默认值并说明。 */
async function readConfig() {
  let text;
  try {
    text = await readFile(configPath(), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return normalizeConfig(undefined);
    return { ...normalizeConfig(undefined), notes: [`config.json: cannot read (${error.code})`] };
  }
  try {
    return normalizeConfig(JSON.parse(text));
  } catch (error) {
    return { ...normalizeConfig(undefined), notes: [`config.json: invalid JSON (${error.message})`] };
  }
}

/** 目录里的图片文件名,按名称排序;目录不存在则视为空。 */
async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && CONTENT_TYPES[extname(entry.name).toLowerCase()] !== undefined)
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

/** 指定且存在则用它,否则取排序第一张。 */
function resolveActive(images, requested) {
  return requested.length > 0 && images.includes(requested) ? requested : images[0] ?? null;
}

function sendNotFound(res) {
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("not found");
}

function sendJson(res, body) {
  res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

/** 插件主体:准备目录,然后占住三个只读路由。 */
function apply(ctx) {
  const dir = wallpapersDir();

  // 首次运行给出一个可改的模板;已存在的文件永不覆盖。
  void (async () => {
    await mkdir(dir, { recursive: true });
    await writeFile(configPath(), `${JSON.stringify(DEFAULT_CONFIG, undefined, 2)}\n`, { flag: "wx" }).catch(() => {});
    const images = await listImages(dir);
    ctx.logger?.info?.(
      `dsh-theme-frost: ${images.length} image(s) in ${dir} (${images.join(", ") || "empty"}); tune ${configPath()}`,
    );
  })().catch((error) => ctx.logger?.warn?.(`dsh-theme-frost: setup failed: ${String(error)}`));

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: LIST_PATH,
        handler: async (req, res) => {
          const images = await listImages(dir);
          const { config } = await readConfig();
          sendJson(res, { dir, images, active: resolveActive(images, config.wallpaper) });
        },
      }),
    "dsh-theme-frost: list",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: CONFIG_PATH,
        handler: async (req, res) => sendJson(res, await readConfig()),
      }),
    "dsh-theme-frost: config",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "prefix",
        path: IMAGE_PREFIX,
        handler: async (req, res) => {
          const pathname = new URL(req.url, "http://localhost").pathname;
          const name = decodeURIComponent(pathname.slice(IMAGE_PREFIX.length)).replace(/^\/+/, "");
          // 只允许单个文件名:不含分隔符、不穿越、不是隐藏文件。
          if (!name || name.includes("/") || name.includes("\\") || name.includes("..") || name.startsWith(".")) {
            sendNotFound(res);
            return;
          }
          const type = CONTENT_TYPES[extname(name).toLowerCase()];
          const info = type === undefined ? undefined : await stat(join(dir, name)).catch(() => undefined);
          if (type === undefined || info === undefined || !info.isFile()) {
            sendNotFound(res);
            return;
          }
          res.writeHead(200, {
            "content-type": type,
            "content-length": String(info.size),
            "cache-control": "no-cache",
            "x-content-type-options": "nosniff",
          });
          createReadStream(join(dir, name)).pipe(res);
        },
      }),
    "dsh-theme-frost: images",
  );
}

export { apply, inject };
