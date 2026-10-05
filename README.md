# dsh-theme-frost

**一个 [DSH](https://github.com/deepseek-ai/deepseek-harness)(DeepSeek Harness)插件。**

从文件夹里取一张图片,设为 DSH 网页端的全局磨砂壁纸。配色沿用官方原版(深色/浅色都支持),只改变表面 token 的不透明度。

## 这个文件夹是全自包含的

代码和数据住在同一个目录里:

```
$DSH_HOME/theme-frost/          (默认 ~/dsh/theme-frost/,取决于 $DSH_HOME)
├── lib/index.js         代码 · 宿主半:建文件夹、读配置、提供只读 HTTP 路由
├── lib/client.js        代码 · 客户端半:注入 CSS,把图铺成壁纸层
├── package.json         代码 · 插件声明(dsh.bundle / dsh.client)
├── cordis.patch.yml     代码 · 挂载行
├── README.md            代码 · 本文件
├── config.json          数据 · ← 你调的数值
└── wallpapers/          数据 · ← 你放的图
```

仓库里还带 `examples/`(演示图)、`config.example.json`(配置模板)和 `LICENSE`。

## 用法

1. 把图片放进 `wallpapers/`(支持 `png` `jpg` `jpeg` `webp` `gif` `avif` `bmp` `svg`)。
2. 想指定用哪张,改 `config.json` 的 `wallpaper`;留空则**按文件名排序取第一张**。
3. 硬刷新浏览器(`Ctrl+Shift+R`)。

**改图片和改配置都不需要重启 dsh。** 删光图片后刷新就会回落到官方原版配色。

## config.json 字段

| 字段 | 范围 | 默认 | 作用 |
|---|---|---|---|
| `blur` | 0 ~ 80 | 28 | 模糊半径(px)。`0` = 壁纸清晰锐利 |
| `surfaceOpacity` | 0.1 ~ 1 | 0.6 | 玻璃档:主背景、侧栏、消息气泡的不透明度 |
| `panelOpacity` | 0.1 ~ 1 | 0.9 | 高层档:设置面板、插件管理、输入框卡片、审批卡等 |
| `wallpaper` | 文件名或 `""` | `""` | 指定用哪张图;留空 = 按文件名取第一张 |
| `dark.brightness` | 0.2 ~ 1.5 | 0.52 | 深色模式下壁纸亮度(压暗,避免刺眼) |
| `dark.saturate` | 0 ~ 3 | 1.4 | 深色模式饱和度 |
| `light.brightness` | 0.5 ~ 2 | 1.06 | 浅色模式亮度(提亮,避免发灰) |
| `light.saturate` | 0 ~ 3 | 1.2 | 浅色模式饱和度 |

数值超范围会被自动收进范围,类型写错的字段退回默认值,两者都会在
`/theme-frost/config` 响应的 `notes` 里说明 —— 不会静默失效。

## 安装

从 GitHub 安装:

```bash
dsh plugin --profile web add github:H2CO3w/dsh-theme-frost
```

本地开发时用 `link:` 指向源码目录:

```bash
dsh plugin --profile web add link:/absolute/path/to/theme-frost
```

新插件需要**重启一次** `dsh web`(客户端会缓存插件集合元数据);
之后改 CSS 或改配置只需硬刷新。

## 示例与素材

`examples/` 里初始放了两张演示图:

| 文件 | 说明 |
|---|---|
| `examples/aurora.svg` | 本仓库原创,随 MIT 许可 |
| `examples/reimu.jpg` | 东方 Project 同人素材,**版权归原作者**,不适用本仓库的 MIT 许可 |

想用它们,复制到运行时目录再刷新即可:

```bash
cp examples/aurora.svg "$DSH_HOME/theme-frost/wallpapers/"
```

`wallpapers/` 与 `config.json` 是你的运行时数据,已在 `.gitignore` 中排除;
第一次启动时插件会自动创建它们,并写出 `config.json` 模板
(内容与 `config.example.json` 一致)。
