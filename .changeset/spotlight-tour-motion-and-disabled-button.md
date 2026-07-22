---
"@usefy/spotlight-tour": patch
---

Fix tooltip motion and the disabled-button visibility.

- **Tooltip motion**: on a step change the tooltip now glides smoothly from the
  previous position to the new one — same duration and easing as the spotlight
  morph — instead of teleporting. The previous position is retained as the
  transition's from-state (no hidden flash, no jump), and the glide duration is
  now correctly inherited on the tooltip (the effective transition duration is
  published on the portal root, so reduced motion / `transitionDuration={0}`
  make it instant too). Continuous tracking updates (scroll, resize, auto-scroll
  in flight) are snapped 1:1 with the transition disabled, removing the
  rubber-band lag where the tooltip chased its target.
- **Disabled buttons**: a gated step's disabled Next is no longer a near-invisible
  low-opacity accent. It uses explicit disabled tokens
  (`--usefy-tour-accent-disabled-bg` / `-color`, plus secondary equivalents) for
  both the light and dark palettes, so the button stays a solid, clearly-visible
  (yet clearly inactive) control on every surface.
