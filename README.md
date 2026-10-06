# dsh-theme-frost

English | [中文](README.zh.md)

**A [DSH](https://github.com/deepseek-ai/deepseek-harness) (DeepSeek Harness) plugin.**

Takes an image from a folder and sets it as the global wallpaper of the DSH web UI. The official palette is kept (both light and dark are supported); only the opacity of the interface changes.

## 1. What's different

- **Settings stay readable.** Opacity comes in two tiers; the settings panel and the plugin manager are separate from the rest.
- **Compatible with DSH 0.1.7 and later.** The Node side imports only `node:*`; the browser side imports no module at all.
- **No restart to change the image or the config.** Images and config are both re-read on every refresh; just refresh the page when done.
- **A broken config still runs.** Out-of-range numbers are automatically clamped into range, wrong types fall back to their defaults, and it tells you which one it touched; invalid JSON likewise just falls back to the default config.
- **Compact code.** Two JS files, 360 lines in total (about 15 KB); no build step, no third-party dependencies.
- **Safe.** Three read-only endpoints, and no write capability at all.

## 2. Usage

**Install** (either one):

```bash
# from GitHub
dsh plugin --profile web add github:H2CO3w/dsh-theme-frost

# for local development, point link: at the source folder
dsh plugin --profile web add link:/absolute/path/to/theme-frost
```

Restart `dsh web` **once** after installing; after that neither changing the image nor changing the config needs it.

**Change the wallpaper**:

1. Put images into `wallpapers/` (`png` `jpg` `jpeg` `webp` `gif` `avif` `bmp` `svg`).
2. To pick one, change `wallpaper` in `config.json`; leaving it empty uses the **first file in name order**.
3. Hard-refresh the browser (`Ctrl+Shift+R`).

**Neither changing images nor changing the config needs a restart.** Delete every image and refresh, and it returns to the official palette.

## 3. Configuration

The eight fields in `config.json`:

| Field | Range | Default | Effect |
|---|---|---|---|
| `blur` | 0 ~ 80 | 28 | Blur radius in px. `0` = the wallpaper stays sharp |
| `surfaceOpacity` | 0.1 ~ 1 | 0.6 | Glass tier: main background, sidebar, message bubbles |
| `panelOpacity` | 0.1 ~ 1 | 0.9 | Upper tier: settings, plugin manager, input cards, approval cards, etc. |
| `wallpaper` | a file name or `""` | `""` | Which image to use; empty = the first in name order |
| `dark.brightness` | 0.2 ~ 1.5 | 0.52 | Wallpaper brightness in dark mode (dimmed, to avoid glare) |
| `dark.saturate` | 0 ~ 3 | 1.4 | Saturation in dark mode |
| `light.brightness` | 0.5 ~ 2 | 1.06 | Wallpaper brightness in light mode (brightened, to avoid looking muddy) |
| `light.saturate` | 0 ~ 3 | 1.2 | Saturation in light mode |

## 4. Examples and assets

`examples/` ships two demo images to start with:

| File | Note |
|---|---|
| `examples/aurora.svg` | Original to this repository, under the MIT license |
| `examples/reimu.jpg` | Touhou Project fan art, **copyright its original author**, not covered by this repository's MIT license |

To use them, copy one into the runtime folder and refresh:

```bash
cp examples/aurora.svg "$DSH_HOME/theme-frost/wallpapers/"
```

## 5. Layout

Code and data live in the same folder:

```
$DSH_HOME/theme-frost/          (defaults to ~/dsh/theme-frost/, depends on $DSH_HOME)
├── lib/index.js         Node side: creates the folder, reads config, serves read-only endpoints
├── lib/client.js        Browser side: injects styles, paints the image as the wallpaper layer
├── package.json         Plugin manifest (dsh.bundle / dsh.client)
├── cordis.patch.yml     Mount config
├── README.md            This file
├── config.json          ← your values
└── wallpapers/          ← your images
```

The repository also carries `examples/` (demo images), `config.example.json` (a config template) and `LICENSE`.

`wallpapers/` and `config.json` are runtime data, excluded through `.gitignore`; on first start the plugin creates them and writes a `config.json` template (identical in content to `config.example.json`).
