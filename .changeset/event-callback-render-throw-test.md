---
"@usefy/use-event-callback": patch
---

Add a test asserting the documented contract that invoking the returned callback **during render throws** (`useEventCallback: cannot call the callback while rendering.`). This exercises the previously-uncovered guard initializer, bringing statement/line/function coverage to a genuine 100% and making the README's "100% statement coverage" claim accurate (it was ~86% before). No runtime behavior change.
