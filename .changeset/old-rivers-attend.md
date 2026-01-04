---
"@usefy/use-debounce": patch
"@usefy/use-debounce-callback": patch
"@usefy/use-throttle": patch
"@usefy/use-throttle-callback": patch
---

Summary of Changes
Issue
When leading: false and trailing: false were both set, useDebounce and useDebounceCallback (and consequently useThrottle and useThrottleCallback) were still invoking callbacks when maxWait was specified. This behavior deviated from Lodash's standard behavior, where this configuration means "nothing happens."
Root Cause
In the maxWait handling logic, invokeRef.current() / invokeFunc() was called unconditionally when maxWait time elapsed, ignoring the leading and trailing options.
Fix Applied

1. useDebounce.ts (Line 233-236)

// Only invoke if at least one edge is enabled (matches lodash behavior)
if (leadingRef.current || trailingRef.current) {
invokeRef.current(time);
} 2. useDebounceCallback.ts (Line 286-289)

// Only invoke if at least one edge is enabled (matches lodash behavior)
if (leadingRef.current || trailingRef.current) {
return invokeFunc(time);
}
Tests Added
useDebounce.test.ts - 3 new test cases:
should never update when both leading and trailing are false
should never update even with maxWait when both edges are false
should never update with continuous rapid changes and maxWait
useDebounceCallback.test.ts - 1 new test case:
should not invoke callback when both leading and trailing are false even with maxWait
Storybook Updates
useThrottleCallback.stories.tsx - 2 new stories added:
BothEdges: Demonstrates default behavior with both edges enabled
BothDisabled: Demonstrates that callback never executes when both edges are disabled
Impact
useDebounce and useDebounceCallback now match Lodash's _.debounce behavior
useThrottle and useThrottleCallback (which use the debounce hooks internally with maxWait) now match Lodash's _.throttle behavior
All 47 useDebounce tests and 52 useDebounceCallback tests pass
