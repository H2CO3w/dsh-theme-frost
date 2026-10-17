// dsh-theme-frost — browser half.
//
// Fetches the state once, paints the wallpaper behind the app and turns the
// official surfaces translucent. Tint colors come from the official palette
// tokens, so a theme palette change is followed automatically; with no wallpaper
// nothing is overridden.
window.__ModuleLoader__.load({
  id: "dsh-theme-frost",
  factory() {
    // The doubled attribute selector adds one specificity step over the official
    // body[data-ds-dark-theme] rules, independent of <style> order. color-mix()
    // keeps the palette while the alpha stays a variable.
    const CSS = `
body::before{content:"";position:fixed;inset:-60px;z-index:-1;pointer-events:none;background-image:var(--dsh-frost-image);background-size:cover;background-position:center;filter:blur(var(--dsh-frost-blur)) saturate(var(--dsh-frost-saturate)) brightness(var(--dsh-frost-brightness))}
body[data-ds-dark-theme][data-ds-dark-theme]{
  --dsh-frost-image:var(--dsh-frost-image-dark);
  --dsh-frost-saturate:var(--dsh-frost-dark-saturate);
  --dsh-frost-brightness:var(--dsh-frost-dark-brightness);
  --dsw-alias-bg-base:color-mix(in srgb,var(--dsw-static-neutral-bluish-950) calc(var(--dsh-frost-a)*100%),transparent);
  --dsw-alias-bg-layer-1:color-mix(in srgb,var(--dsw-static-neutral-bluish-875) calc((var(--dsh-frost-a) + .06)*100%),transparent);
  --dsw-alias-bg-layer-2:color-mix(in srgb,var(--dsw-static-neutral-bluish-850) calc(var(--dsh-frost-panel)*100%),transparent);
  --dsw-alias-bg-layer-3:color-mix(in srgb,var(--dsw-static-neutral-bluish-800) calc(var(--dsh-frost-panel)*100%),transparent);
  --dsw-specific-sidebar-fill:color-mix(in srgb,var(--dsw-static-neutral-bluish-900) calc((var(--dsh-frost-a) - .08)*100%),transparent);
  --dsw-specific-input-major:color-mix(in srgb,var(--dsw-static-neutral-bluish-850) calc(var(--dsh-frost-panel)*100%),transparent);
  --dsw-specific-bubble:color-mix(in srgb,var(--dsw-static-neutral-bluish-850) calc((var(--dsh-frost-a) + .04)*100%),transparent);
  --dsw-specific-sidebar-nav-item-active-accent:color-mix(in srgb,var(--dsw-static-deepseek-450) 20%,transparent);
  --dsw-alias-interactive-bg-hover-accent:color-mix(in srgb,var(--dsw-static-deepseek-450) 22%,transparent);
}
body:not([data-ds-dark-theme]):not([data-ds-dark-theme]){
  --dsh-frost-image:var(--dsh-frost-image-light);
  --dsh-frost-saturate:var(--dsh-frost-light-saturate);
  --dsh-frost-brightness:var(--dsh-frost-light-brightness);
  --dsw-alias-bg-base:color-mix(in srgb,var(--dsw-static-neutral-bluish-00) calc((var(--dsh-frost-a) + .02)*100%),transparent);
  --dsw-alias-bg-layer-1:color-mix(in srgb,var(--dsw-static-neutral-bluish-00) calc((var(--dsh-frost-a) + .06)*100%),transparent);
  --dsw-alias-bg-layer-2:color-mix(in srgb,var(--dsw-static-neutral-bluish-00) calc(var(--dsh-frost-panel)*100%),transparent);
  --dsw-alias-bg-layer-3:color-mix(in srgb,var(--dsw-static-neutral-bluish-00) calc(var(--dsh-frost-panel)*100%),transparent);
  --dsw-specific-sidebar-fill:color-mix(in srgb,var(--dsw-static-neutral-bluish-50) calc((var(--dsh-frost-a) - .02)*100%),transparent);
  --dsw-specific-input-major:color-mix(in srgb,var(--dsw-static-neutral-bluish-00) calc(var(--dsh-frost-panel)*100%),transparent);
  --dsw-specific-bubble:color-mix(in srgb,var(--dsw-static-deepseek-50) calc((var(--dsh-frost-a) + .10)*100%),transparent);
  --dsw-specific-sidebar-nav-item-active-accent:color-mix(in srgb,var(--dsw-static-deepseek-450) 16%,transparent);
  --dsw-alias-interactive-bg-hover-accent:color-mix(in srgb,var(--dsw-static-deepseek-450) 14%,transparent);
}
`;

    /** Config field -> inline CSS variable, read through the matching getter. */
    const FIELDS = [
      ["--dsh-frost-blur", (config) => config.blur, "px"],
      ["--dsh-frost-a", (config) => config.surfaceOpacity],
      ["--dsh-frost-panel", (config) => config.panelOpacity],
      ["--dsh-frost-dark-brightness", (config) => config.dark?.brightness],
      ["--dsh-frost-dark-saturate", (config) => config.dark?.saturate],
      ["--dsh-frost-light-brightness", (config) => config.light?.brightness],
      ["--dsh-frost-light-saturate", (config) => config.light?.saturate],
    ];

    /** One CSS url() per scheme; "none" keeps the layer empty. */
    const imageUrl = (name) =>
      name ? `url("/theme-frost/wallpapers/${encodeURIComponent(name)}")` : "none";

    function apply(ctx) {
      ctx.effect(() => {
        const style = document.createElement("style");
        style.textContent = CSS;
        document.head.append(style);
        return () => style.remove();
      }, "dsh-theme-frost: stylesheet");

      ctx.effect(() => {
        const root = document.documentElement;
        let cancelled = false;
        fetch("/theme-frost/state")
          .then((response) => (response.ok ? response.json() : null))
          .then((state) => {
            const active = state?.active;
            if (cancelled || !active || (!active.dark && !active.light)) return;
            for (const [name, pick, unit = ""] of FIELDS) {
              const value = pick(state.config ?? {});
              if (typeof value === "number" && Number.isFinite(value)) {
                root.style.setProperty(name, value + unit);
              }
            }
            root.style.setProperty("--dsh-frost-image-dark", imageUrl(active.dark));
            root.style.setProperty("--dsh-frost-image-light", imageUrl(active.light));
          })
          .catch(() => {});
        return () => {
          cancelled = true;
          for (const [name] of FIELDS) root.style.removeProperty(name);
          root.style.removeProperty("--dsh-frost-image-dark");
          root.style.removeProperty("--dsh-frost-image-light");
        };
      }, "dsh-theme-frost: wallpaper");
    }

    return { apply };
  },
});
