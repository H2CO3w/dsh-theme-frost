// dsh-theme-frost — 客户端半(浏览器 bundle)
//
// 纯 CSS + 两次一次性 fetch。在应用后方铺一层固定、过扫描、只模糊一次的壁纸,
// 再把官方主题的表面 token 从实色改成带 alpha 的同色值,让壁纸透出来 ——
// 配色一个字节没改,只改了不透明度。
//
// 两处结构上的讲究(都是踩过坑才定下来的):
// 1. 默认值写在 :root,配置值写成 document.documentElement 的内联属性。
//    若默认值写在 body,body 自己的声明会盖过从 html 继承来的内联值;
//    而运行中的应用对 body 的改动远比 html 多。
// 2. 主题选择器重复了属性(body[data-ds-dark-theme][data-ds-dark-theme])。
//    官方主题有一条同形同优先级的规则,同优先级由文档顺序决胜,而 <style>
//    的注入顺序取决于各包加载时机;重复属性把优先级抬高一档,与顺序无关。
//
// 零构建:window.__ModuleLoader__.load({ id, factory }) 的 CJS 形式,无 JSX。
window.__ModuleLoader__.load({
  id: "dsh-theme-frost",
  factory: function () {
    var module = { exports: {} };

    var LIST_URL = "/theme-frost/list";
    var CONFIG_URL = "/theme-frost/config";
    var IMAGE_BASE = "/theme-frost/wallpapers/";
    var IMAGE_VAR = "--dsh-frost-image";

    // 不透明度分两档:--dsh-frost-a 是玻璃档(主背景、侧栏、气泡),
    // --dsh-frost-panel 是高层档(设置面板、输入框卡片等压着内容的表面)。
    // rgba() 的 alpha 里可以用 calc()/var(),括号外的回退值保证配置到达前也可用。
    var CSS = [
      ":root{--dsh-frost-blur:28px;--dsh-frost-a:.6;--dsh-frost-panel:.9;",
      "--dsh-frost-dark-brightness:.52;--dsh-frost-dark-saturate:1.4;",
      "--dsh-frost-light-brightness:1.06;--dsh-frost-light-saturate:1.2}",

      "body::before{content:'';position:fixed;inset:-60px;z-index:-1;pointer-events:none;",
      "background-image:var(" + IMAGE_VAR + ",none);background-size:cover;background-position:center;",
      "background-repeat:no-repeat;",
      "filter:blur(var(--dsh-frost-blur)) saturate(var(--dsh-frost-saturate,1.2)) brightness(var(--dsh-frost-brightness,1))}",

      // 色值全部取自官方主题,只是加了 alpha。
      "body[data-ds-dark-theme][data-ds-dark-theme]{",
      "--dsh-frost-saturate:var(--dsh-frost-dark-saturate);",
      "--dsh-frost-brightness:var(--dsh-frost-dark-brightness);",
      "--dsw-alias-bg-base:rgba(21,21,23,var(--dsh-frost-a,.6));",
      "--dsw-alias-bg-layer-1:rgba(35,35,36,calc(var(--dsh-frost-a,.6) + .06));",
      "--dsw-alias-bg-layer-2:rgba(44,44,46,var(--dsh-frost-panel,.9));",
      "--dsw-alias-bg-layer-3:rgba(53,54,56,var(--dsh-frost-panel,.9));",
      "--dsw-specific-sidebar-fill:rgba(27,27,28,calc(var(--dsh-frost-a,.6) - .08));",
      "--dsw-specific-input-major:rgba(44,44,46,var(--dsh-frost-panel,.9));",
      "--dsw-specific-bubble:rgba(44,44,46,calc(var(--dsh-frost-a,.6) + .04));",
      // 一点 DeepSeek 蓝(deepseek-450 #5686fe),落在两处中性强调面上。
      "--dsw-specific-sidebar-nav-item-active-accent:rgba(86,134,254,.20);",
      "--dsw-alias-interactive-bg-hover-accent:rgba(86,134,254,.22)}",

      "body:not([data-ds-dark-theme]):not([data-ds-dark-theme]){",
      "--dsh-frost-saturate:var(--dsh-frost-light-saturate);",
      "--dsh-frost-brightness:var(--dsh-frost-light-brightness);",
      "--dsw-alias-bg-base:rgba(255,255,255,calc(var(--dsh-frost-a,.6) + .02));",
      "--dsw-alias-bg-layer-1:rgba(255,255,255,calc(var(--dsh-frost-a,.6) + .06));",
      "--dsw-alias-bg-layer-2:rgba(255,255,255,var(--dsh-frost-panel,.9));",
      "--dsw-alias-bg-layer-3:rgba(255,255,255,var(--dsh-frost-panel,.9));",
      "--dsw-specific-sidebar-fill:rgba(249,250,251,calc(var(--dsh-frost-a,.6) - .02));",
      "--dsw-specific-input-major:rgba(255,255,255,var(--dsh-frost-panel,.9));",
      "--dsw-specific-bubble:rgba(237,243,254,calc(var(--dsh-frost-a,.6) + .10));",
      "--dsw-specific-sidebar-nav-item-active-accent:rgba(86,134,254,.16);",
      "--dsw-alias-interactive-bg-hover-accent:rgba(86,134,254,.14)}",
    ].join("");

    /** 只接受可用的数字,否则保留 CSS 里写死的默认值。 */
    function setVar(style, name, value, unit) {
      if (typeof value !== "number" || !isFinite(value)) return;
      style.setProperty(name, String(value) + (unit === undefined ? "" : unit));
    }

    function applyConfig(config) {
      if (config === null || typeof config !== "object") return;
      var style = document.documentElement.style;
      setVar(style, "--dsh-frost-blur", config.blur, "px");
      setVar(style, "--dsh-frost-a", config.surfaceOpacity);
      setVar(style, "--dsh-frost-panel", config.panelOpacity);
      var dark = config.dark !== null && typeof config.dark === "object" ? config.dark : {};
      var light = config.light !== null && typeof config.light === "object" ? config.light : {};
      setVar(style, "--dsh-frost-dark-brightness", dark.brightness);
      setVar(style, "--dsh-frost-dark-saturate", dark.saturate);
      setVar(style, "--dsh-frost-light-brightness", light.brightness);
      setVar(style, "--dsh-frost-light-saturate", light.saturate);
    }

    /** 插件主体:注入样式表,再取回壁纸与调参值。 */
    function apply(ctx) {
      ctx.effect(function () {
        var tag = document.createElement("style");
        tag.dataset.plugin = "dsh-theme-frost";
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return function () {
          tag.remove();
        };
      }, "dsh-theme-frost: stylesheet");

      ctx.effect(function () {
        var cancelled = false;
        var root = document.documentElement;
        function json(url) {
          return fetch(url, { headers: { accept: "application/json" } })
            .then(function (response) {
              return response.ok ? response.json() : undefined;
            })
            .catch(function () {
              return undefined; // 没有目录/服务或响应异常时保留默认值
            });
        }
        Promise.all([json(LIST_URL), json(CONFIG_URL)]).then(function (results) {
          if (cancelled) return;
          var list = results[0];
          var config = results[1];
          if (config !== undefined) applyConfig(config.config);
          var active = list !== undefined ? list.active || (list.images || [])[0] : undefined;
          if (active) {
            root.style.setProperty(IMAGE_VAR, 'url("' + IMAGE_BASE + encodeURIComponent(active) + '")');
          }
        });
        return function () {
          cancelled = true;
          root.style.removeProperty(IMAGE_VAR);
        };
      }, "dsh-theme-frost: wallpaper");
    }

    module.exports.apply = apply;
    return module.exports;
  },
});
