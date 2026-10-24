// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createLessonModel(scope) {
  function openModel(id, side) {
    const inspection = scope.context?.inspectedPortId;
    scope.closeContext();
    scope.modelDevice = id;
    scope.modelPortSide = side;
    scope.modelSide = side === "out" ? "sourcePortId" : "sinkPortId";
    scope.modelAssignable =
      (side === "out"
        ? scope.task.segments[scope.activeSegment].from
        : scope.task.segments[scope.activeSegment].to) === id;
    scope.modelInspected = inspection || null;
    scope.$("model-dialog-title").textContent = scope.DEVICE_NAMES[id];
    const available = scope.sidePorts(id, side);
    scope.$("model-context").textContent =
      (side === "in" ? "อินพุตพอร์ต" : "เอาท์พุตพอร์ต") +
      " · " +
      (scope.modelAssignable
        ? "สาย " + (scope.activeSegment + 1)
        : "สำรวจตำแหน่ง");
    scope.$("model-ports-title").textContent =
      (side === "in" ? "อินพุตพอร์ต" : "เอาท์พุตพอร์ต") +
      " · " +
      available.length +
      " ช่อง";
    scope.$("model-port-list").replaceChildren();
    for (const port of available) {
      const b = scope.create("button");
      b.type = "button";
      b.dataset.modelPort = port.id;
      b.append(
        scope.create("strong", port.label),
        scope.create(
          "small",
          scope.portDirection(port) + " · " + scope.portFunction(port),
        ),
      );
      b.addEventListener("click", () => {
        if (scope.modelAssignable) scope.pickPort(id, port.id, side);
        else {
          scope.modelInspected = port.id;
          renderModel();
        }
        scope.viewPort(
          port.id,
          () => scope.active && scope.model.open && scope.modelDevice === id,
        );
      });
      scope.$("model-port-list").append(b);
    }
    scope.model.showModal();
    scope.$("model-holder").append(scope.stage);
    const portId = scope.modelAssignable
        ? scope.getState().links[scope.activeSegment][scope.modelSide]
        : scope.modelInspected,
      taskId = scope.task.id,
      index = scope.activeSegment,
      guard = () =>
        scope.active &&
        scope.model.open &&
        scope.task.id === taskId &&
        scope.activeSegment === index;
    portId ? scope.viewPort(portId, guard) : scope.viewDevice(id);
    renderModel();
  }

  function closeModel() {
    if (scope.model.open) scope.model.close();
    if (scope.stage.parentElement === scope.$("model-holder"))
      scope.home.after(scope.stage);
  }

  function renderModel() {
    if (!scope.model.open) return;
    const id = scope.modelAssignable
      ? scope.getState().links[scope.activeSegment][scope.modelSide]
      : scope.modelInspected;
    scope.$("model-selection").textContent = id
      ? "เลือกแล้ว: " + scope.ports.get(id).label
      : "ยังไม่เลือกพอร์ต";
    for (const b of scope.$("model-port-list").querySelectorAll("button"))
      b.setAttribute("aria-pressed", String(b.dataset.modelPort === id));
  }
  return { openModel, closeModel, renderModel };
}
