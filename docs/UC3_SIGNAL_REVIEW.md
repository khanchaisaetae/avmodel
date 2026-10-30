# UC3 logical signal review — 2026-10-30

- Dell USB-C → HDMI: conditional adapter route using `ref/Dell_G7_7588_Official_Port_Confirmation.md` and catalog `display_routes`. Requires a compatible DisplayPort-over-USB-C to HDMI adapter. Does not change the physical USB I/O classification.
- Vertex RGB OUT → Epson Computer1: native VGA wiring. PC1 routes RGB IN 1, PC2 routes RGB IN 2 (Vertex manual pages 6, 11); HDMI IN routes HDMI OUT only. Source-switch cross-type restrictions retain the accepted project constraints.
- Free design: trace each TV/projector's selected input upstream; inspect source power/output and Vertex source selection. Report actual source and traversed ports. Does not certify the learner's unstated system goal.
- Configurable Epson Computer2/Monitor Out without explicit mode, unsupported converters, and simultaneous mixed camera outputs remain indeterminate.
- Ready means logical routing under the simulation's assumptions, not certification of timings, adapter hardware, EDID, HDCP, or physical cable health.
- Rules are isolated in diagram-signal.mjs. Other scenario engines retain their existing scope; taskOverride callers retain their previous evaluator.
