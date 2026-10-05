# dsh-theme-frost

磨砂壁纸插件:从文件夹里取一张图片,设为 DSH 网页端的全局背景。
配色沿用官方原版(深色/浅色都支持),只改变表面 token 的不透明度。

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

## 用法

1. 把图片放进 `wallpapers/`(支持 `png` `jpg` `jpeg` `webp` `gif` `avif` `bmp` `svg`)。
2. 想指定用哪张,改 `config.json` 的 `wallpaper`;留空则**按文件名排序取第一张**。
3. 硬刷新浏览器(`Ctrl+Shift+R`)。

**改图片和改配置都不需要重启 dsh** —— 宿主半每次请求都重新读文件。
删光图片后刷新,回落到官方原版配色。

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

## 它怎么工作

- **宿主半**:创建文件夹,提供三个只读路由 —— `/theme-frost/list`(图片名列表
  与生效项)、`/theme-frost/config`(配置与校验说明)、
  `/theme-frost/wallpapers/<文件名>`(图片字节)。没有写入接口,也没有信任栅栏:
  每个请求都被限制在单个带图片扩展名的文件名内,无法越出该目录。
- **客户端半**:**纯 CSS**。在应用后方铺一层固定、过扫描、一次性模糊的壁纸层,
  再把官方主题的表面 token 从实色换成带 alpha 的同色值 —— 配色一个字节没改,
  只改了不透明度。

两个刻意的设计取舍:

- **为什么不是给每个面板加 `backdrop-filter`**:面板类名每次构建都会重新哈希
  (如 `.SB_kFW_root`),只有 `body[data-ds-dark-theme]` 是官方主题包自己写入的
  稳定钩子。模糊整张壁纸一次,只需要这一个钩子,也不必知道任何组件类名。
- **为什么透明度用 `calc()` 派生**:`--dsh-frost-a` 是唯一的旋钮,各层表面加固定
  偏移(`+ .06` / `+ .12` / `+ .18`),所以即使把基础不透明度拉到很低,层级关系
  依然可读,不会糊成一片。

## 安装

```bash
dsh plugin --profile web add link:/absolute/path/to/theme-frost
```

新插件需要**重启一次** `dsh web`(客户端会缓存插件集合元数据);
之后改 CSS 或改配置只需硬刷新。

## 给后来者的两个坑(都是实际踩过的)

**1. Cordis 不允许直接读未声明的服务。** 宿主半必须导出模块级 `inject`:

```js
const inject = ["webServer"];
export { apply, inject };
```

漏掉的话会报 `cannot get property "webServer" without inject`,而启动输出里
只有一句 `warning: 1 entry did not activate`,很容易被当成无关警告忽略掉。

**2. 与官方主题同优先级的 CSS 会静默失效。** 官方有一条

```css
body[data-ds-dark-theme]{ --dsw-alias-bg-base: …; }
```

与本插件同形同优先级。同优先级由**文档顺序**决胜,而 `<style>` 的注入顺序
取决于各包的加载时机 —— 一旦官方的排在后面,本插件的 token 覆盖就全部被顶掉:
面板恢复不透明,壁纸被完整遮住,表现为"纯色界面、零报错"。修法是把优先级
抬高一档:

```css
body[data-ds-dark-theme][data-ds-dark-theme]{ … }
```

同理,浅色分支用 `body:not([data-ds-dark-theme]):not([data-ds-dark-theme])`。

## 后续可做

设置页里的图片选择器、模糊/透明滑块、深浅色分别选图、支持图片 URL。

## 示例与第三方素材

`examples/` 里放了两张演示图:

| 文件 | 说明 |
|---|---|
| `examples/aurora.svg` | 本仓库原创,随 MIT 许可 |
| `examples/reimu.jpg` | 东方 Project 同人素材,**版权归原作者**,不适用本仓库的 MIT 许可 |

想用它们,复制到运行时目录再刷新即可:

```bash
cp examples/aurora.svg "$DSH_HOME/theme-frost/wallpapers/"
```

`wallpapers/` 与 `config.json` 是你的运行时数据,已在 `.gitignore` 中排除;
新使用者第一次启动时插件会自动创建它们,并写出 `config.json` 模板
(内容与 `config.example.json` 一致)。
