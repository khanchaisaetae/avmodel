import { createLessonState } from "./lesson-state.mjs";
import { createLessonContext } from "./lesson-context.mjs";
import { createLessonModel } from "./lesson-model.mjs";
import { createLessonBoard } from "./lesson-board.mjs";
import { createLessonResults } from "./lesson-results.mjs?v=20261024-troubleshoot";
import { createLessonTasks } from "./lesson-tasks.mjs";
import { createLessonShell } from "./lesson-shell.mjs";
import { bindLessonEvents } from "./lesson-events.mjs";
import { reviewLearning as baseReviewLearning } from "./learning-mode.mjs?v=20261024-learning-ui";
import {
  WIRE_CHOICES,
  portDirection,
  portFunction,
  portSupportsSide,
} from "./lesson-cables.mjs?v=20261024-learning-ui";
import { SCENARIOS, DEVICE_NAMES, SOURCE_NAMES } from "./scenario-catalog.mjs";
import {
  initialScenario as baseInitialScenario,
  updateSegmentSelection,
  evaluateScenario,
  nextSource,
} from "./scenario-engine.mjs?v=20261024-learning-ui";
import {
  systemLayout,
  visibleSignalSegments,
  issueLocation as baseIssueLocation,
} from "./lesson-view.mjs?v=20261024-learning-ui";
import { deviceArt } from "./device-art.mjs";
const $ = (id) => document.getElementById(id),
  clone = (s) => JSON.parse(JSON.stringify(s));
const short = (id) =>
  ({
    dell: "Dell",
    bluray: "Sony Blu-ray",
    vertex: "Vertex",
    epson: "Epson",
    tv: "Sony TV",
  })[id];
const create = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
export function mountConnectionLesson({
  catalog,
  viewPort,
  viewDevice,
  updateCable,
  onScenarioChange,
  scenarios = SCENARIOS,
  progressKey = "av-port-lab.scenario-progress.v1",
  activity = null,
}) {
  const issueLocation = activity?.issueLocation || baseIssueLocation;
  const initialScenario = activity?.initial || baseInitialScenario;
  const reviewLearning = activity?.review || baseReviewLearning;
  let learningMode = "practice",
    assessmentReviewed = false;
  let active = false,
    task = scenarios[0],
    activeSegment = 0,
    lastResult = null,
    context = null,
    anchor = null,
    modelDevice = null,
    modelSide = "sourcePortId",
    modelPortSide = "out",
    modelAssignable = false,
    modelInspected = null;
  const table = $("lesson-visual"),
    pane = $("lesson-pane"),
    stage = document.querySelector(".stage"),
    home = document.createComment("3D stage home");
  stage.before(home);
  const ports = new Map(
      catalog.devices.flatMap((d) => d.ports.map((p) => [p.id, p])),
    ),
    states = new Map(),
    histories = new Map(),
    known = new Set(scenarios.map((t) => t.id)),
    key = progressKey;
  let completed = new Set();
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(v)) completed = new Set(v.filter((id) => known.has(id)));
  } catch {}
  const stateKey = () => task.id + ":" + learningMode,
    reasons = new Map();
  const getState = () => states.get(stateKey()),
    put = (s) => states.set(stateKey(), s),
    devicePorts = (id) => catalog.devices.find((d) => d.id === id).ports;
  const persist = () => {
    try {
      localStorage.setItem(key, JSON.stringify([...completed]));
    } catch {}
  };

  const { pop, model, picker, reset } = createLessonShell({
    table,
    pane,
    create,
    SCENARIOS: scenarios,
    $,
  });
  reset.id = "reset-dialog";
  reset.setAttribute("aria-labelledby", "reset-title");
  reset.innerHTML =
    '<h2 id="reset-title">เริ่มโจทย์นี้ใหม่?</h2><p>ล้างสาย การตั้งค่า และผลสำเร็จเฉพาะโจทย์นี้</p><div class="table-actions"><button id="cancel-reset" type="button" class="quiet-button" autofocus>กลับไปฝึกต่อ</button><button id="confirm-reset" type="button" class="primary">เริ่มใหม่</button></div>';
  document.body.append(reset);

  const moduleScope = {
    get activity() { return activity; },
    get $() {
      return $;
    },
    get DEVICE_NAMES() {
      return DEVICE_NAMES;
    },
    get SCENARIOS() {
      return scenarios;
    },
    get SOURCE_NAMES() {
      return SOURCE_NAMES;
    },
    get WIRE_CHOICES() {
      return WIRE_CHOICES;
    },
    get active() {
      return active;
    },
    set active(value) {
      active = value;
    },
    get activeSegment() {
      return activeSegment;
    },
    set activeSegment(value) {
      activeSegment = value;
    },
    get anchor() {
      return anchor;
    },
    set anchor(value) {
      anchor = value;
    },
    get assessmentReviewed() {
      return assessmentReviewed;
    },
    set assessmentReviewed(value) {
      assessmentReviewed = value;
    },
    get build() {
      return build;
    },
    get buildBoard() {
      return buildBoard;
    },
    get catalog() {
      return catalog;
    },
    get changeLink() {
      return changeLink;
    },
    get chooseTask() {
      return chooseTask;
    },
    get clone() {
      return clone;
    },
    get closeContext() {
      return closeContext;
    },
    get closeModel() {
      return closeModel;
    },
    get completed() {
      return completed;
    },
    set completed(value) {
      completed = value;
    },
    get context() {
      return context;
    },
    set context(value) {
      context = value;
    },
    get create() {
      return create;
    },
    get deviceArt() {
      return deviceArt;
    },
    get devicePorts() {
      return devicePorts;
    },
    get evaluateScenario() {
      return evaluateScenario;
    },
    get getState() {
      return getState;
    },
    get histories() {
      return histories;
    },
    get home() {
      return home;
    },
    get incidentSegments() {
      return incidentSegments;
    },
    get initialScenario() {
      return initialScenario;
    },
    get issueLocation() {
      return issueLocation;
    },
    get lastResult() {
      return lastResult;
    },
    set lastResult(value) {
      lastResult = value;
    },
    get learningMode() {
      return learningMode;
    },
    set learningMode(value) {
      learningMode = value;
    },
    get model() {
      return model;
    },
    get modelAssignable() {
      return modelAssignable;
    },
    set modelAssignable(value) {
      modelAssignable = value;
    },
    get modelDevice() {
      return modelDevice;
    },
    set modelDevice(value) {
      modelDevice = value;
    },
    get modelInspected() {
      return modelInspected;
    },
    set modelInspected(value) {
      modelInspected = value;
    },
    get modelPortSide() {
      return modelPortSide;
    },
    set modelPortSide(value) {
      modelPortSide = value;
    },
    get modelSide() {
      return modelSide;
    },
    set modelSide(value) {
      modelSide = value;
    },
    get mutate() {
      return mutate;
    },
    get nextSource() {
      return nextSource;
    },
    get onScenarioChange() {
      return onScenarioChange;
    },
    get openModel() {
      return openModel;
    },
    get openPorts() {
      return openPorts;
    },
    get openSetting() {
      return openSetting;
    },
    get openWire() {
      return openWire;
    },
    get pane() {
      return pane;
    },
    get persist() {
      return persist;
    },
    get pickPort() {
      return pickPort;
    },
    get picker() {
      return picker;
    },
    get pop() {
      return pop;
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
    get positionContext() {
      return positionContext;
    },
    get put() {
      return put;
    },
    get reasons() {
      return reasons;
    },
    get render() {
      return render;
    },
    get renderBoard() {
      return renderBoard;
    },
    get renderContext() {
      return renderContext;
    },
    get renderModel() {
      return renderModel;
    },
    get renderTaskPicker() {
      return renderTaskPicker;
    },
    get reset() {
      return reset;
    },
    get reviewLearning() {
      return reviewLearning;
    },
    get short() {
      return short;
    },
    get sidePorts() {
      return sidePorts;
    },
    get stage() {
      return stage;
    },
    get stateKey() {
      return stateKey;
    },
    get states() {
      return states;
    },
    get systemLayout() {
      return systemLayout;
    },
    get table() {
      return table;
    },
    get task() {
      return task;
    },
    set task(value) {
      task = value;
    },
    get updateCable() {
      return updateCable;
    },
    get updateSegmentSelection() {
      return updateSegmentSelection;
    },
    get viewDevice() {
      return viewDevice;
    },
    get viewPort() {
      return viewPort;
    },
    get visibleSignalSegments() {
      return visibleSignalSegments;
    },
  };
  const { mutate, changeLink, pickPort } = createLessonState(moduleScope);
  const {
    closeContext,
    positionContext,
    startContext,
    focusContext,
    addLabel,
    sidePorts,
    incidentSegments,
    openPorts,
    openSetting,
    openWire,
    renderContext,
  } = createLessonContext(moduleScope);
  const { openModel, closeModel, renderModel } = createLessonModel(moduleScope);
  const { deviceButton, buildBoard, endpointY, renderBoard } =
    createLessonBoard(moduleScope);
  const { render } = createLessonResults(moduleScope);
  const { build, chooseTask, renderTaskPicker } =
    createLessonTasks(moduleScope);
  activity?.mount(moduleScope);
  bindLessonEvents(moduleScope);
  build();
  return {
    enter() {
      active = true;
      render();
    },
    leave() {
      active = false;
      closeContext();
      closeModel();
      picker.close();
      reset.close();
      updateCable(null);
    },
    onPortSelected(p) {
      if (!active || !model.open || p.id.split(":")[0] !== modelDevice) return;
      if (!portSupportsSide(p, modelPortSide)) {
        $("model-selection").textContent =
          "ช่องนี้อยู่ในกลุ่ม" +
          (modelPortSide === "in" ? "เอาท์พุตพอร์ต" : "อินพุตพอร์ต");
        return;
      }
      if (modelAssignable) pickPort(modelDevice, p.id, modelPortSide);
      else {
        modelInspected = p.id;
        renderModel();
      }
    },
    onDeviceChanged() {
      if (active) render();
    },
    get active() {
      return active;
    },
    get deviceIds() {
      return task.devices;
    },
  };
}
