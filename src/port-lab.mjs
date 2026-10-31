import { META, icon } from "./explorer-device-meta.mjs";
import { createExplorerPresenter } from "./explorer-presenter.mjs";
import { createExplorerCalibration } from "./explorer-calibration.mjs";
import { createExplorerScene } from "./explorer-scene.mjs";
import { createExplorerModel } from "./explorer-model.mjs";
import { createExplorerControls } from "./explorer-controls.mjs";
import { createExplorerCables } from "./explorer-cables.mjs";
import { TROUBLESHOOT_TASKS } from "./troubleshoot-catalog.mjs";
import { createTroubleshootActivity } from "./troubleshoot-activity.mjs?v=20261031-clear-steps";
import { assetHash } from "./asset-hash.mjs";
import { SoftwareRenderer } from "./software-view.mjs";
import { validateCalibration, mappingCounts } from "./mapping-model.mjs";
if (new URLSearchParams(location.search).get("embedded") === "1") document.body.classList.add("embedded-view");
const troubleshooting = document.body.dataset.activity === "troubleshoot";
const activityPage = troubleshooting;
// Retired UC2 links open the port explorer; only UC5 mounts the shared lesson UI.
if (!troubleshooting && new URLSearchParams(location.search).has("mode")) {
  const url = new URL(location.href);
  url.searchParams.delete("mode");
  history.replaceState(null, "", url);
}
const $ = (id) => document.getElementById(id);

const text = (tag, value, cls) => {
  const el = document.createElement(tag);
  el.textContent = value;
  if (cls) el.className = cls;
  return el;
};
let catalog,
  baseline,
  device,
  selected = null,
  filter = "all",
  root,
  wrapper,
  scene,
  camera,
  renderer,
  controls,
  selectionBox,
  marker,
  nodeObjects = [],
  modelMeshes = [],
  loadSerial = 0,
  localMappings = {},
  pendingPoint = null,
  downPoint = null,
  toastTimer;
const storageKey = "av-port-lab.calibration.v1";
let lesson,
  appMode = "explore",
  lessonWire = null;
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 4500);
}

async function init() {
  try {
    if (!window.THREE)
      await new Promise((resolve) =>
        window.addEventListener("load", resolve, { once: true }),
      );
    [catalog, baseline] = await Promise.all(
      ["data/port-catalog.json", "data/model-mappings.json"].map(
        async (url) => {
          const r = await fetch(url);
          if (!r.ok) throw new Error("โหลดข้อมูลอ้างอิงไม่สำเร็จ");
          return r.json();
        },
      ),
    );
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved)
        localMappings = validateCalibration(
          JSON.parse(saved),
          catalog,
          baseline,
        );
    } catch {
      toast("ข้อมูลปรับเทียบเก่าไม่ตรงกับโมเดล ใช้ตำแหน่งตั้งต้นแทน");
    }
    bind();
    setup3D();
    if (troubleshooting) {
    const { mountConnectionLesson } = await import("./connection-lesson.mjs?v=20261031-clear-steps");
    lesson = mountConnectionLesson({
      catalog,
      ...(troubleshooting ? { scenarios: TROUBLESHOOT_TASKS, progressKey: "av-port-lab.troubleshoot-progress.v1", activity: createTroubleshootActivity() } : {}),
      viewDevice: loadDevice,
      viewPort: async (id, stillRelevant = () => true) => {
        const deviceId = id.split(":")[0];
        if (device?.id !== deviceId) await loadDevice(deviceId);
        if (
          appMode === "practice" &&
          device?.id === deviceId &&
          stillRelevant()
        )
          selectPort(id);
      },
      updateCable: drawLessonCable,
      onScenarioChange: () => {
        renderDevices();
        document.querySelector(".library .count").textContent =
          lesson.deviceIds.length + " โมเดล";
      },
    });
    }
    $("mode-explore").addEventListener("click", () => activityPage ? location.assign("index.html") : setAppMode("explore"));
    const launch = new URLSearchParams(location.search),
      requested = launch.get("device");
    await loadDevice(
      catalog.devices.some((d) => d.id === requested) ? requested : "dell",
    );
    const requestedPort = launch.get("port");
    if (requestedPort && device.ports.some(p => p.id === requestedPort)) selectPort(requestedPort);
    if (activityPage) setAppMode("practice");
  } catch (error) {
    $("load-message").textContent = error.message;
    $("retry").hidden = false;
    $("retry").onclick = () => location.reload();
    console.error(error);
  }
}

function setAppMode(mode) {
  if (!lesson || appMode === mode) return;
  appMode = mode;
  const practice = mode === "practice";
  document.body.classList.toggle("practice-mode", practice);
  $("mode-explore").setAttribute("aria-pressed", String(!practice));
  for(const [id,current] of [['mode-explore',!practice&&!activityPage]]){
    if(current)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');
  }
  $("lesson-pane").hidden = !practice;
  $("lesson-visual").hidden = !practice;
  document.querySelector(".inspector-tabs").hidden = practice;
  $("port-pane").hidden = practice;
  $("review-pane").hidden = true;
  $("calibration-mode").checked = false;
  $("review-banner").hidden = true;
  document.querySelector(".library .count").textContent = practice
    ? lesson.deviceIds.length + " โมเดล"
    : "5 โมเดล";
  document.querySelector(".library h1").textContent = practice
    ? "แก้ปัญหาภาพไม่ขึ้น"
    : "เริ่มจากอุปกรณ์ที่อยากสำรวจ";
  document.querySelector(".library .intro").textContent = practice
    ? "สังเกตอาการ ตรวจจากต้นทางถึงจอ แล้วคืนภาพพร้อมอธิบายสาเหตุ"
    : "เลือกโมเดล แล้วหมุนดูช่องต่อ หรือเลือกพอร์ตเพื่อดูรายละเอียด";
  document.querySelector(".library-foot p").textContent = practice
    ? "เลือก OUT → IN · เลือกสาย · ตั้งค่าเครื่อง"
    : "รู้จักพอร์ต · เข้าใจ IN / OUT";
  document.querySelector(".library-foot small").textContent = practice
    ? "ยูสเคส 5 · แก้ปัญหาภาพ"
    : "ยูสเคส 1 · สำรวจพอร์ต";
  if (practice) {
    lesson.enter();
    if (!lesson.deviceIds.includes(device.id)) loadDevice(lesson.deviceIds[0]);
  } else {
    lesson.leave();
    switchTab("ports");
  }
  renderDevices();
  resize();
}
const moduleScope = {
  get $() {
    return $;
  },
  get META() {
    return META;
  },
  get SoftwareRenderer() {
    return SoftwareRenderer;
  },
  get appMode() {
    return appMode;
  },
  set appMode(value) {
    appMode = value;
  },
  get assetHash() {
    return assetHash;
  },
  get baseline() {
    return baseline;
  },
  set baseline(value) {
    baseline = value;
  },
  get camera() {
    return camera;
  },
  set camera(value) {
    camera = value;
  },
  get catalog() {
    return catalog;
  },
  set catalog(value) {
    catalog = value;
  },
  get clearLessonCable() {
    return clearLessonCable;
  },
  get controls() {
    return controls;
  },
  set controls(value) {
    controls = value;
  },
  get device() {
    return device;
  },
  set device(value) {
    device = value;
  },
  get downPoint() {
    return downPoint;
  },
  set downPoint(value) {
    downPoint = value;
  },
  get filter() {
    return filter;
  },
  set filter(value) {
    filter = value;
  },
  get focusPort() {
    return focusPort;
  },
  get getMapping() {
    return getMapping;
  },
  get icon() {
    return icon;
  },
  get lesson() {
    return lesson;
  },
  set lesson(value) {
    lesson = value;
  },
  get lessonWire() {
    return lessonWire;
  },
  set lessonWire(value) {
    lessonWire = value;
  },
  get loadDevice() {
    return loadDevice;
  },
  get loadSerial() {
    return loadSerial;
  },
  set loadSerial(value) {
    loadSerial = value;
  },
  get localMappings() {
    return localMappings;
  },
  set localMappings(value) {
    localMappings = value;
  },
  get mappingCounts() {
    return mappingCounts;
  },
  get marker() {
    return marker;
  },
  set marker(value) {
    marker = value;
  },
  get modelMeshes() {
    return modelMeshes;
  },
  set modelMeshes(value) {
    modelMeshes = value;
  },
  get nodeObjects() {
    return nodeObjects;
  },
  set nodeObjects(value) {
    nodeObjects = value;
  },
  get pendingPoint() {
    return pendingPoint;
  },
  set pendingPoint(value) {
    pendingPoint = value;
  },
  get pickSurface() {
    return pickSurface;
  },
  get positionLabel() {
    return positionLabel;
  },
  get renderDetail() {
    return renderDetail;
  },
  get renderDevices() {
    return renderDevices;
  },
  get renderPorts() {
    return renderPorts;
  },
  get renderReview() {
    return renderReview;
  },
  get renderer() {
    return renderer;
  },
  set renderer(value) {
    renderer = value;
  },
  get root() {
    return root;
  },
  set root(value) {
    root = value;
  },
  get saveLocal() {
    return saveLocal;
  },
  get scene() {
    return scene;
  },
  set scene(value) {
    scene = value;
  },
  get selectPort() {
    return selectPort;
  },
  get selected() {
    return selected;
  },
  set selected(value) {
    selected = value;
  },
  get selectionBox() {
    return selectionBox;
  },
  set selectionBox(value) {
    selectionBox = value;
  },
  get setView() {
    return setView;
  },
  get storageKey() {
    return storageKey;
  },
  get text() {
    return text;
  },
  get toast() {
    return toast;
  },
  get updateSelection() {
    return updateSelection;
  },
  get validateCalibration() {
    return validateCalibration;
  },
  get wrapper() {
    return wrapper;
  },
  set wrapper(value) {
    wrapper = value;
  },
};
const {
  sourceIsConfirmed,
  positionLabel,
  symbol,
  direction,
  renderDevices,
  renderPorts,
  infoRow,
  renderDetail,
} = createExplorerPresenter(moduleScope);
const { getMapping, saveLocal, renderReview, pickSurface } =
  createExplorerCalibration(moduleScope);
const { setup3D, resize, setView, updateSelection, focusPort } =
  createExplorerScene(moduleScope);
const { disposeModel, loadDevice } = createExplorerModel(moduleScope);
const { bind, download, switchTab, selectPort } =
  createExplorerControls(moduleScope);
const { clearLessonCable, drawLessonCable } = createExplorerCables(moduleScope);
init();
