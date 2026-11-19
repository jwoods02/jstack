---
name: eval-check
description: Checks a measured number before you trust, report or act on it. Use for a benchmark, a speedup or regression, a latency or throughput figure, or an eval score.
---

# Eval check

A measured number can describe something other than the work you meant. Before you report or act on it, answer these with evidence from a run, not from reading the code.

1. **What claim would change a decision?** Write it before you run, such as "export is 30% faster at p50 on the 60k-row dataset".
2. **What limits it?** Name what stops it being twice as good: a core, a lock, the disk, the network or the load generator. Get it from a profile or system counters in a run you don't report.
3. **Was each side run fairly?** Same build, flags, data and cache state as production. A side left on defaults compares configurations, not code.
4. **Is it possible?** Check it against bandwidth and core counts. Removing a piece that takes 10% of the run saves at most about 11%. A result past a limit measured a cache, a no-op or a bug.
5. **Did the work happen and succeed?** Count errors and check outputs. Rejections are fast, and unawaited work produces numbers for work that never ran.
6. **Does it repeat?** Run each side at least five times, alternating, and report the median and range. A gap inside the spread is no measurable difference.
7. **Does it matter end to end?** Report a micro result as a share of what a user waits on.

For an eval score, ask whether every trial did the task, whether the gap holds across trials and models, and whether the scenario matters.

Lead with the verdict (faster, slower, no measurable difference or inconclusive), then the number, run count, range and limiter. It's inconclusive when you can't name the limiter or couldn't check step 5.
