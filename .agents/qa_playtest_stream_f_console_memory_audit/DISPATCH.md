# Dispatch: Stream F Console & Memory Audit Critic

## Working Directory
`/Users/user/src/water-invader/.agents/qa_playtest_stream_f_console_memory_audit`

## Role
Stream F Console & Memory Audit Critic (`teamwork_preview_critic`)

## Required Reading
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/COLLABORATION.md`
- `/Users/user/src/water-invader/tests/stress/telemetry_stress_collector.ts`

## Mission
Conduct an exhaustive runtime console error, warning, unhandled exception, and memory leak audit during extended gameplay:
1. Console Listener:
   - Capture 100% of `console.error`, `console.warn`, `pageerror`, and unhandled promise rejections.
   - Filter out benign Next.js HMR/dev-server pings.
2. Memory Leak & Telemetry Profiling:
   - Run playtest sessions using `SwarmBotEngine` and `telemetry_stress_collector.ts`.
   - Measure JS Heap growth rate (`growthRateMbPerMin`). Verify heap slope is stable and below 15.0 MB/min.
   - Monitor active Web Audio node count (`activeOscillators + activeGains`). Verify no unbounded node accumulation during rapid weapon firing and explosions.
   - Monitor frame drops and stutters (>33ms, >50ms, >1000ms).
3. Document any discovered runtime anomalies, null reference exceptions, or audio context warnings.

## Deliverable
Write your comprehensive audit report and anomaly log to `/Users/user/src/water-invader/.agents/qa_playtest_stream_f_console_memory_audit/handoff.md` and send a message back.

## 2026-09-10T10:44:57Z
You are qa_playtest_stream_f_console_memory_audit.
Your working directory is: /Users/user/src/water-invader/.agents/qa_playtest_stream_f_console_memory_audit
Read DISPATCH.md in your working directory first, along with ORIGINAL_REQUEST.md, PROJECT.md, COLLABORATION.md, and telemetry_stress_collector.ts.
Conduct extended browser console error, warning, and memory leak audit using SwarmBotEngine and telemetry_stress_collector. Verify heap slope <15 MB/min and zero critical anomalies.
Write complete report to /Users/user/src/water-invader/.agents/qa_playtest_stream_f_console_memory_audit/handoff.md.
Send message back when complete.

