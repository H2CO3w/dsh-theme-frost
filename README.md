# dsh-theme-frost

A wallpaper plugin for the DSH (DeepSeek Harness) web UI.

It does two things:

- Shows your image as the page background.
- Turns the interface into frosted glass, keeping the official palette.
Light and dark themes are supported.
Code, settings, and images all live in one folder.

## Install

Clone the repository where you want it, then link it into DSH:

```bash
git clone https://github.com/H2CO3w/dsh-theme-frost.git ~/dsh-theme-frost
dsh plugin --profile web add link:$HOME/dsh-theme-frost
```

Restart `dsh web` once.

You can also hand this to DeepSeek:

```
dsh 请帮我安装插件 https://github.com/H2CO3w/dsh-theme-frost
```

## Use

Only two things to remember:

1. Change the wallpaper: put images into `wallpapers/`
2. Tune the effect: edit `config.json`

Refresh the page after either change. No restart needed.
Supported images: `png` `jpg` `jpeg` `webp` `gif` `avif` `bmp` `svg`

Dark and light themes can use different images.

## Settings

`config.json` is created on first start.

- `blur`: blur amount.
- `surfaceOpacity`: main surface opacity.
- `panelOpacity`: settings panel opacity.
- `wallpaper`: which image to use when no scheme has its own. Empty means the first file in name order.
- `dark.wallpaper`: image for dark mode. Default reimu.jpg.
- `light.wallpaper`: image for light mode. Default marisa.jpg.
- `dark.brightness`: image brightness in dark mode.
- `dark.saturate`: image saturation in dark mode.
- `light.brightness`: image brightness in light mode.
- `light.saturate`: image saturation in light mode.

A value of the wrong type is ignored.
Broken JSON falls back to the defaults.

## Folder

```
dsh-theme-frost/
├── lib/              plugin code
├── wallpapers/       your images (ships reimu.jpg and marisa.jpg as demos)
├── config.json       your settings (auto-generated)
├── package.json      plugin manifest
├── cordis.patch.yml  mount configuration
├── test/             tests
└── README.md, README.zh.md
```

## Compatibility

- DSH 0.2.0-rc.1 or newer
- A browser with CSS color-mix
  (Chromium 111+, Firefox 113+, Safari 16.2+)

## License

MIT.
Note: the bundled `wallpapers/reimu.jpg` and `wallpapers/marisa.jpg` are not covered by the MIT license.
