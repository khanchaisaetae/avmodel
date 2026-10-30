import { getDiagramTask } from "./diagram-data.mjs?v=20261025-placement";
import { DEVICE_NAMES } from "./scenario-catalog.mjs";
import { validateSegment, evaluateScenario } from "./scenario-engine.mjs";
import {validateDiagramSegment, traceDiagramDisplay} from "./diagram-signal.mjs";
export function diagramRoutes(diagram, source, display) {
  const routes = [];
  function walk(id, path, seen) {
    if (id === display) {
      routes.push(path);
      return;
    }
    for (let i = 0; i < diagram.links.length; i++) {
      const l = diagram.links[i];
      if (l.from === id && !seen.has(l.to))
        walk(l.to, [...path, i], new Set([...seen, l.to]));
    }
  }
  walk(source, [], new Set([source]));
  return routes;
}

export function reviewDiagram(diagram, catalog, sourceId, taskOverride = null) {
  const task = taskOverride || getDiagramTask(diagram.taskId),
    issues = [],
    ports = new Map(
      catalog.devices.flatMap((d) => d.ports.map((p) => [p.id, p])),
    ),
    segments = diagram.links.map((l) => ({ from: l.from, to: l.to })),
    dynamic = { ...task, mode: task.mode || "1920x1080@60", segments },
    state = {
      links: diagram.links.map((l) => ({ ...l, connected: false })),
      power: Object.fromEntries(diagram.nodes.map((n) => [n.id, n.power])),
      sourceEnabled: Object.fromEntries(
        diagram.nodes.map((n) => [n.id, n.enabled]),
      ),
      displayInput:
        diagram.nodes.find((n) => n.id === task.displayId)?.input || "",
      vertexSource:
        diagram.nodes.find((n) => n.id === "vertex")?.source || "CAMERA",
      requestedSource: sourceId || task.sources[0],
      observedSources: [],
      attempts: 0,
    };
  // Check each submitted cable independently, then flag all sides of a conflict.
  const use = new Map();
  diagram.links.forEach((l, i) => {
    for (const id of [l.sourcePortId, l.sinkPortId])
      use.set(id, [...(use.get(id) || []), i]);
  });
  const linkResults = diagram.links.map((l, i) => {
    let r = taskOverride ? validateSegment(dynamic, state, i, catalog) : validateDiagramSegment(dynamic, state, i, catalog);
    if ([l.sourcePortId, l.sinkPortId].some((id) => use.get(id).length > 1))
      r = {
        status: "invalid",
        code: "PORT_OCCUPIED",
        message:
          "พอร์ตเดียวมีสายมากกว่าหนึ่งเส้น ต้องใช้พอร์ตหรืออุปกรณ์ที่รองรับ",
      };
    if (r.status !== "compatible")
      issues.push({
        kind: r.status,
        linkId: l.id,
        message: "สาย " + (i + 1) + ": " + r.message,
      });
    return r;
  });
  state.links = state.links.map((l, i) => ({
    ...l,
    connected: linkResults[i].status === "compatible",
  }));
  const displayResults = taskOverride ? [] : diagram.nodes.filter(n => ["tv", "epson"].includes(n.id)).map(n => traceDiagramDisplay(diagram, catalog, linkResults, n.id, sourceId));
  if (task.id === "free") return {
    issues, linkResults, state, live: null, displayResults, structureReady: false,
    message: displayResults.length ? "ตรวจพอร์ต สาย และภาพแยกแต่ละจอแล้ว · ผังอิสระไม่มีคำตอบตายตัว ให้เทียบผลกับความต้องการที่เขียนไว้" : "เพิ่มจอ Sony TV หรือ Epson เพื่อทดลองเส้นทางภาพ · ตรวจสายที่มีอยู่ได้ ไม่มีคะแนน",
  };
  const missing = task.devices.filter(
      (id) => !diagram.nodes.some((n) => n.id === id),
    ),
    extra = diagram.nodes.filter((n) => !task.devices.includes(n.id));
  for (const id of missing)
    issues.push({
      kind: "missing",
      message: "ยังไม่มี " + DEVICE_NAMES[id] + " ในผัง",
    });
  for (const n of extra)
    issues.push({
      kind: "extra",
      message: DEVICE_NAMES[n.id] + " ไม่อยู่ในเงื่อนไขโจทย์นี้",
    });
  const actual = segments.map((l) => l.from + ">" + l.to),
    expected = task.segments.map((l) => l.from + ">" + l.to),
    same =
      actual.length === expected.length &&
      expected.every(
        (e) =>
          actual.filter((a) => a === e).length ===
          expected.filter((a) => a === e).length,
      );
  if (!same)
    issues.push({
      kind: "topology",
      message:
        "เส้นทางยังไม่ครบตามเงื่อนไขโจทย์ ตรวจว่าจะส่งตรง ผ่าน Vertex หรือใช้หลายแหล่งภาพ",
    });
  const routes = task.sources.map((source) => ({
    source,
    segments: diagramRoutes(diagram, source, task.displayId)[0] || [],
  }));
  for (const route of routes)
    if (diagramRoutes(diagram, route.source, task.displayId).length > 1)
      issues.push({
        kind: "topology",
        message:
          "พบมากกว่าหนึ่งเส้นทางจาก " +
          DEVICE_NAMES[route.source] +
          " ไปยังจอ ตรวจความซ้ำซ้อนของผัง",
      });
  const structureReady =
    !missing.length && !extra.length && same && issues.length === 0;
  const live = taskOverride ? evaluateScenario({ ...dynamic, routes }, state, catalog) : traceDiagramDisplay(diagram, catalog, linkResults, task.displayId, sourceId || task.sources[0]);
  return {
    issues,
    linkResults,
    state,
    live,
    displayResults,
    structureReady,
    message: structureReady
      ? live.status === "ready"
        ? "ผังครบและภาพตรงตามแหล่งที่เลือก"
        : live.message
      : "ทบทวนรายการในผังด้านล่าง แล้วตรวจใหม่ได้ ไม่มีคะแนน",
  };
}
