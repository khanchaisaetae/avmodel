import {MAX_DIAGRAM_COORDINATE} from "./workspace-geometry.mjs?v=20261025-placement";
import { SCENARIOS, DEVICE_NAMES } from "./scenario-catalog.mjs";
import { WIRE_CHOICES } from "./lesson-cables.mjs";
export const DIAGRAM_TASKS = [
  ...SCENARIOS,
  {
    id: "free",
    title: "ออกแบบระบบอิสระ",
    goal: "สร้างผัง เลือกอุปกรณ์และอธิบายความต้องการใช้งานของระบบ",
    devices: [],
    sources: [],
    displayId: null,
  },

];

export const getDiagramTask = (id) => DIAGRAM_TASKS.find((t) => t.id === id);

export function emptyDiagram(taskId = "2-01") {
  return {
    version: 1,
    taskId,
    nodes: [],
    links: [],
    reason: "",
    conclusion: "unsure",
  };
}

export function parseDiagram(value, catalog) {
  if (
    !value ||
    value.version !== 1 ||
    !getDiagramTask(value.taskId) ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.links) ||
    value.nodes.length > 5 ||
    value.links.length > 20
  )
    throw Error("รูปแบบไฟล์ผังไม่รองรับ");
  const portIds = new Set(
      catalog.devices.flatMap((d) => d.ports.map((p) => p.id)),
    ),
    ids = new Set(),
    nodeIds = new Set();
  const nodes = value.nodes.map((n) => {
    if (
      !Object.hasOwn(DEVICE_NAMES, n.id) ||
      nodeIds.has(n.id) ||
      !Number.isFinite(n.x) ||
      !Number.isFinite(n.y) ||
      n.x < 0 ||
      n.x > MAX_DIAGRAM_COORDINATE ||
      n.y < 0 ||
      n.y > MAX_DIAGRAM_COORDINATE
    )
      throw Error("ข้อมูลอุปกรณ์หรือตำแหน่งไม่ถูกต้อง");
    nodeIds.add(n.id);
    return {
      id: n.id,
      x: n.x,
      y: n.y,
      power: n.power === true,
      enabled: n.enabled === true,
      input:
        typeof n.input === "string" &&
        portIds.has(n.input) &&
        n.input.startsWith(n.id + ":")
          ? n.input
          : "",
      source: ["CAMERA", "HDMI IN", "PC1", "PC2"].includes(n.source)
        ? n.source
        : "CAMERA",
    };
  });
  const links = value.links.map((l) => {
    if (
      typeof l.id !== "string" ||
      !/^w[\w-]{1,60}$/.test(l.id) ||
      ids.has(l.id) ||
      !nodeIds.has(l.from) ||
      !nodeIds.has(l.to) ||
      l.from === l.to ||
      !portIds.has(l.sourcePortId) ||
      !portIds.has(l.sinkPortId) ||
      !l.sourcePortId.startsWith(l.from + ":") ||
      !l.sinkPortId.startsWith(l.to + ":") ||
      !(l.cableId === "" || WIRE_CHOICES.some((c) => c.id === l.cableId))
    )
      throw Error("ข้อมูลสายหรือพอร์ตไม่ถูกต้อง");
    ids.add(l.id);
    return {
      id: l.id,
      from: l.from,
      to: l.to,
      sourcePortId: l.sourcePortId,
      sinkPortId: l.sinkPortId,
      cableId: l.cableId,
    };
  });
  return {
    version: 1,
    taskId: value.taskId,
    nodes,
    links,
    reason: typeof value.reason === "string" ? value.reason.slice(0, 4000) : "",
    conclusion: ["possible", "impossible", "unsure"].includes(value.conclusion)
      ? value.conclusion
      : "unsure",
  };
}
