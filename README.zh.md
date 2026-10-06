# dsh-theme-frost

[English](README.md) | 中文

**一个 [DSH](https://github.com/deepseek-ai/deepseek-harness)(DeepSeek Harness)插件。**

从文件夹里取一张图片,设为 DSH 网页端的全局壁纸。配色沿用官方原版(深色/浅色都支持),只调整界面的透明度。

## 一、它有什么不一样

- **设置面板清晰。** 透明度分两档,设置面板、插件管理与其他分开
- **兼容 DSH 0.1.7 及以上。** Node 端只导入 `node:*`,浏览器端一个模块都不导入
- **换图和改配置不用重启。** 图片和配置都在每次刷新时重新读取,改完直接刷新页面。
- **配置文件写错仍能运行。** 数值越界会自动收进范围,类型写错会退回默认值,并且告诉你动了哪一项;JSON 语法写错也只是回落到默认配置。
- **代码精简。** 两个 JS 文件共 360 行(约 15 KB),没有构建步骤、没有第三方依赖。
- **安全** 只有三个只读接口,没有任何写入功能。

## 二、用法

**安装**(二选一):

```bash
# 从 GitHub 装
dsh plugin --profile web add github:H2CO3w/dsh-theme-frost

# 本地开发时用 link: 指向源码目录
dsh plugin --profile web add link:/absolute/path/to/theme-frost
```

装完需要**重启一次** `dsh web`;之后换图、改配置都不用。

**换壁纸**:

1. 把图片放进 `wallpapers/`(支持 `png` `jpg` `jpeg` `webp` `gif` `avif` `bmp` `svg`)。
2. 想指定用哪张,改 `config.json` 里的 `wallpaper`;留空则**按文件名排序取第一张**。
3. 硬刷新浏览器(`Ctrl+Shift+R`)。

**换图和改配置都不需要重启。** 把图片删光再刷新,就会回到官方原版配色。

## 三、配置项

`config.json` 八个字段:

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

## 四、示例与素材

`examples/` 里初始放了两张演示图:

| 文件 | 说明 |
|---|---|
| `examples/aurora.svg` | 本仓库原创,随 MIT 许可 |
| `examples/reimu.jpg` | 东方 Project 同人素材,**版权归原作者**,不适用本仓库的 MIT 许可 |

想用它们,复制到运行时目录再刷新即可:

```bash
cp examples/aurora.svg "$DSH_HOME/theme-frost/wallpapers/"
```

## 五、目录结构

代码和数据住在同一个目录里:

```
$DSH_HOME/theme-frost/          (默认 ~/dsh/theme-frost/,取决于 $DSH_HOME)
├── lib/index.js         Node 端:建文件夹、读配置、提供只读接口
├── lib/client.js        浏览器端:注入样式,把图铺成壁纸层
├── package.json         插件声明(dsh.bundle / dsh.client)
├── cordis.patch.yml     挂载配置
├── README.zh.md         本文件(中文版)
├── config.json          ← 你调的数值
└── wallpapers/          ← 你放的图
```

仓库里还带 `examples/`(演示图)、`config.example.json`(配置模板)和 `LICENSE`。

`wallpapers/` 与 `config.json` 是运行时数据,已在 `.gitignore` 中排除;第一次启动时插件会自动创建它们,并写出 `config.json` 模板(内容与 `config.example.json` 一致)。
