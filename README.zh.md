# dsh-theme-frost

一个 DSH（DeepSeek Harness）网页端壁纸插件。

它做两件事：

- 把你的图片铺成网页背景。
- 把界面做成磨砂玻璃，配色仍用官方主题。
深色、浅色都支持。
代码、设置、图片都在同一个文件夹里。

## 安装

把仓库 clone 到你想放的位置，再链接进 DSH：

```bash
git clone https://github.com/H2CO3w/dsh-theme-frost.git ~/dsh-theme-frost
dsh plugin --profile web add link:$HOME/dsh-theme-frost
```

重启一次 `dsh web`。

也可以把下面这句话发给 DeepSeek：

```
dsh 请帮我安装插件 https://github.com/H2CO3w/dsh-theme-frost
```

## 使用

只需要记住两件事：

1. 换壁纸：把图片放进 `wallpapers/`
2. 调效果：改 `config.json`

改完刷新网页，不用重启。
图片支持：`png` `jpg` `jpeg` `webp` `gif` `avif` `bmp` `svg`

深色和浅色可以各用一张图。

## 设置

`config.json` 第一次启动时自动生成。

- `blur`：模糊程度。
- `surfaceOpacity`：主界面的透明度。
- `panelOpacity`：设置面板的透明度。
- `wallpaper`：深色、浅色都没单独指定时用哪张图。留空表示按文件名取第一张。
- `dark.wallpaper`：深色模式用哪张图。默认 reimu.jpg。
- `light.wallpaper`：浅色模式用哪张图。默认 marisa.jpg。
- `dark.brightness`：深色模式下图片亮度。
- `dark.saturate`：深色模式下图片饱和度。
- `light.brightness`：浅色模式下图片亮度。
- `light.saturate`：浅色模式下图片饱和度。

类型写错的值会被忽略。
JSON 写坏会回到默认值。

## 文件夹

```
dsh-theme-frost/
├── lib/              插件代码
├── wallpapers/       你的图片（自带 reimu.jpg、marisa.jpg 作为演示）
├── config.json       你的设置（自动生成）
├── package.json      插件信息
├── cordis.patch.yml  挂载配置
├── test/             测试
└── README.md、README.zh.md
```


## 兼容性

- DSH 0.2.0-rc.1 及以上
- 浏览器需要支持 CSS color-mix
  （Chromium 111+、Firefox 113+、Safari 16.2+）

## 许可

MIT。
注：文件自带 `wallpapers/reimu.jpg`、`wallpapers/marisa.jpg` 不适用 MIT 许可。
