---
"@usefy/virtual-keyboard": patch
---

Fix broken theme selectors in the published stylesheet. The old dark-theme host rule used `:global(...)`, which the CSS-module scoper emits literally — an invalid pseudo-class that made browsers drop the entire rule (and left an unscoped `.keyboard.dark` selector shipping in the bundle as a hazard for CSS optimizers). The `[data-theme="dark"]` host hook is now a properly scoped rule and **works for the first time**: a keyboard with the default `theme="system"` under a `data-theme="dark"` ancestor now renders dark (previously it silently stayed light). An explicit `theme="light"` prop overrides a dark host theme (controlled-prop precedence, matching `@usefy/spotlight-tour`).
