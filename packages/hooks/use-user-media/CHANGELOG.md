# @usefy/use-user-media

## 1.1.0

### Minor Changes

- a71ab92: Add `@usefy/use-user-media` — camera and microphone streams, with a teardown you can rely on

  `getUserMedia` looks like a one-line API and is not. This hook packages the
  parts that only become obvious after they have gone wrong in front of someone:

  - **Every track is stopped** on unmount, on `stop()`, and when a stream is
    replaced — including a stream that arrives _after_ the component unmounted,
    because the user answered the permission sheet late and nobody is going to
    render it. A leaked track keeps the camera light on, and users read that as
    spyware rather than as a bug.
  - **Race-safe acquisition** — a superseded request releases its stream instead
    of quietly re-opening the camera, so out-of-order resolutions cannot leave the
    wrong one live.
  - **Honest states** — `idle · prompting · granted · denied · unsupported ·
error`. `prompting` is separate because a UI must not show "camera
    unavailable" over the top of the permission dialog.
  - **Actionable errors** — every `DOMException` normalized to a reason
    (`denied`, `not-found`, `in-use`, `over-constrained`, `unsupported`) with a
    message a user can act on.
  - **Devices, switching and torch** — enumerate video inputs (after the first
    grant, which is when browsers reveal them), cycle through them, or open one by
    id as an `exact` constraint; torch is capability-probed and reports failure
    rather than lying when a device advertises support and then refuses.
  - **Opt-in by default** — nothing opens until `start()`, because a permission
    prompt nobody asked for is the fastest way to be denied permanently.

  SSR-safe, StrictMode-safe, zero dependencies. Extracted while building
  `@usefy/qr-scanner`, which composes it.
