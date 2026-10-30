import { mountEditorWorkspace } from "./editor-workspace.mjs?v=20261027-nav";
import { createDiagramState } from "./diagram-state.mjs?v=20261025-placement";
import { createDiagramStorage } from "./diagram-storage.mjs?v=20261026-resume";
import { createDiagramControls } from "./diagram-controls.mjs?v=20261030-cables";
import { createDiagramCanvas } from "./diagram-canvas.mjs?v=20261025-placement";
import { createDiagramResults } from "./diagram-results.mjs?v=20261030-recheck";
import { createDiagramView } from "./diagram-view.mjs?v=20261025-ux";
import { createDiagramDownload } from "./diagram-download.mjs";
import { bindDiagramEvents } from "./diagram-events.mjs?v=20261030-recheck";
import {
  DIAGRAM_TASKS,
  getDiagramTask,
  emptyDiagram,
  parseDiagram,
  reviewDiagram,
  exportDiagramSvg,
} from "./diagram-model.mjs?v=20261025-placement";
import { DEVICE_NAMES, SOURCE_NAMES } from "./scenario-catalog.mjs";
import {
  WIRE_CHOICES,
  portSupportsSide,
  portDirection,
  portFunction,
} from "./lesson-cables.mjs";
import { deviceArt } from "./device-art.mjs";
const $ = (id) => document.getElementById(id),
  el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  },
  copy = (s) => JSON.parse(JSON.stringify(s));
let activity = null;
let workspace = null;
const storagePrefix = "av-port-lab.diagram.v1.";
let catalog,
  state,
  selection = null,
  pending = null,
  review = null,
  picker = null,
  noticeTimer,
  confirmation;
const history = [],
  future = [],
  ports = new Map();
function notice(message) {
  $("diagram-notice").textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => ($("diagram-notice").textContent = ""), 5500);
}

async function init() {
  try {
    const r = await fetch("data/port-catalog.json");
    if (!r.ok) throw Error("โหลดข้อมูลพอร์ตไม่สำเร็จ");
    catalog = await r.json();
    for (const d of catalog.devices)
      for (const p of d.ports) ports.set(p.id, p);
    for (const t of DIAGRAM_TASKS) {
      const o = el("option", t.id + " · " + t.title);
      o.value = t.id;
      $("diagram-task").append(o);
    }
    for (const d of catalog.devices) {
      const b = button("", () => addDevice(d.id));
      b.dataset.device = d.id;
      const art = el("span");
      art.innerHTML = deviceArt(d.id);
      b.append(art, el("strong", "＋ " + DEVICE_NAMES[d.id]));
      $("diagram-devices").append(b);
    }
    state = loadTask(activity?.initialTaskId || "2-01");
    render();
    workspace = mountEditorWorkspace(moduleScope);
    workspace.render();

  } catch (e) {
    $("diagram-result").textContent = e.message;
    notice(e.message);
  }
}

const moduleScope = {
  get workspace() { return workspace; },
  get activity() { return activity; },
  get $() {
    return $;
  },
  get DEVICE_NAMES() {
    return DEVICE_NAMES;
  },
  get SOURCE_NAMES() {
    return SOURCE_NAMES;
  },
  get WIRE_CHOICES() {
    return WIRE_CHOICES;
  },
  get ask() {
    return ask;
  },
  get button() {
    return button;
  },
  get catalog() {
    return catalog;
  },
  set catalog(value) {
    catalog = value;
  },
  get changeNode() {
    return changeNode;
  },
  get commit() {
    return commit;
  },
  get confirmation() {
    return confirmation;
  },
  set confirmation(value) {
    confirmation = value;
  },
  get copy() {
    return copy;
  },
  get deviceArt() {
    return deviceArt;
  },
  get download() {
    return download;
  },
  get drawWires() {
    return drawWires;
  },
  get el() {
    return el;
  },
  get emptyDiagram() {
    return emptyDiagram;
  },
  get exportDiagramSvg() {
    return exportDiagramSvg;
  },
  get future() {
    return future;
  },
  get getDiagramTask() {
    return getDiagramTask;
  },
  get history() {
    return history;
  },
  get resumeTask() { return resumeTask; },
  get loadTask() {
    return loadTask;
  },
  get moveNode() {
    return moveNode;
  },
  get notice() {
    return notice;
  },
  get openPorts() {
    return openPorts;
  },
  get parseDiagram() {
    return parseDiagram;
  },
  get pending() {
    return pending;
  },
  set pending(value) {
    pending = value;
  },
  get picker() {
    return picker;
  },
  set picker(value) {
    picker = value;
  },
  get portDirection() {
    return portDirection;
  },
  get portFunction() {
    return portFunction;
  },
  get portSupportsSide() {
    return portSupportsSide;
  },
  get ports() {
    return ports;
  },
  get render() {
    return render;
  },
  get renderNode() {
    return renderNode;
  },
  get renderProperties() {
    return renderProperties;
  },
  get renderReview() {
    return renderReview;
  },
  get review() {
    return review;
  },
  set review(value) {
    review = value;
  },
  get reviewDiagram() {
    return activity?.reviewDiagram || reviewDiagram;
  },
  get save() {
    return save;
  },
  get selectedTask() {
    return selectedTask;
  },
  get selection() {
    return selection;
  },
  set selection(value) {
    selection = value;
  },
  get state() {
    return state;
  },
  set state(value) {
    state = value;
  },
  get storagePrefix() {
    return storagePrefix;
  },
};
const { commit, changeNode, selectedTask, addDevice, moveNode } =
  createDiagramState(moduleScope);
const { save, loadTask, resumeTask } = createDiagramStorage(moduleScope);
const { ask, openPorts, choosePort, cableSelect, button, renderProperties } =
  createDiagramControls(moduleScope);
const { renderNode, drawWires } = createDiagramCanvas(moduleScope);
const { renderReview } = createDiagramResults(moduleScope);
const { render } = createDiagramView(moduleScope);
const { download } = createDiagramDownload(moduleScope);
bindDiagramEvents(moduleScope);
init();
