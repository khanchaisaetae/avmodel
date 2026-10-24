// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createLessonContext(scope) {
  function closeContext(restore = false) {
    scope.pop.hidden = true;
    scope.context = null;
    if (restore && scope.anchor?.isConnected)
      scope.anchor.focus({ preventScroll: true });
    scope.anchor = null;
    for (const el of scope.table.querySelectorAll(".is-selected,.is-focused"))
      el.classList.remove("is-selected", "is-focused");
    for (const b of scope.table.querySelectorAll("[data-menu-anchor]"))
      b.setAttribute("aria-expanded", "false");
  }

  function positionContext() {
    if (scope.pop.hidden || !scope.anchor?.isConnected) return;
    const r = scope.anchor.getBoundingClientRect(),
      w = scope.pop.getBoundingClientRect().width,
      h = scope.pop.getBoundingClientRect().height;
    scope.pop.style.left =
      Math.max(10, Math.min(r.left + (r.width - w) / 2, innerWidth - w - 10)) +
      "px";
    scope.pop.style.top =
      Math.max(10, Math.min(r.bottom + 8, innerHeight - h - 12)) + "px";
  }

  function startContext(kind, id, button) {
    closeContext();
    scope.context = { kind, deviceId: id };
    scope.anchor = button;
    scope.$("context-eyebrow").textContent =
      kind === "wire"
        ? "เลือกชนิดสาย"
        : kind === "ports"
          ? "พอร์ตครบทุกช่อง"
          : "ตั้งค่าที่อุปกรณ์";
    scope.$("context-title").textContent =
      kind === "wire"
        ? "สาย " +
          (scope.activeSegment + 1) +
          " · " +
          scope.short(scope.task.segments[scope.activeSegment].from) +
          " → " +
          scope.short(scope.task.segments[scope.activeSegment].to)
        : scope.DEVICE_NAMES[id];
    scope.$("context-content").replaceChildren();
    scope.pop.hidden = false;
  }

  function focusContext() {
    positionContext();
    (scope.pop.querySelector("select") || scope.$("close-context")).focus({
      preventScroll: true,
    });
  }

  function addLabel(parent, text, control) {
    const label = scope.create("label", text, "context-field-label");
    label.htmlFor = control.id;
    parent.append(label, control);
  }

  function sidePorts(id, side) {
    return scope.devicePorts(id).filter((p) => scope.portSupportsSide(p, side));
  }

  function incidentSegments(id, side) {
    return scope.task.segments.flatMap((seg, i) =>
      (side === "in" ? seg.to === id : seg.from === id) ? [i] : [],
    );
  }

  function openPorts(id, side, button) {
    const indices = incidentSegments(id, side);
    if (indices.length && !indices.includes(scope.activeSegment))
      scope.activeSegment = indices[0];
    startContext("ports", id, button);
    Object.assign(scope.context, {
      side,
      assignable: indices.length > 0,
      inspectedPortId: null,
    });
    scope.$("context-eyebrow").textContent =
      side === "in" ? "อินพุตพอร์ต" : "เอาท์พุตพอร์ต";
    const box = scope.$("context-content");
    if (indices.length) {
      const assign = scope.create("select");
      assign.id = "port-segment";
      for (const i of indices) {
        const seg = scope.task.segments[i],
          o = scope.create(
            "option",
            "สาย " +
              (i + 1) +
              " · " +
              scope.short(seg.from) +
              " → " +
              scope.short(seg.to),
          );
        o.value = i;
        assign.append(o);
      }
      addLabel(box, "เลือกปลายของสาย", assign);
      assign.value = scope.activeSegment;
      assign.addEventListener("change", () => {
        scope.activeSegment = Number(assign.value);
        scope.lastResult = null;
        scope.render();
      });
    }
    box.append(
      scope.create(
        "p",
        indices.length
          ? "เลือกพอร์ตจากอุปกรณ์นี้ แล้วเลือกชนิดสายจากเส้นในผัง ระบบจะต่อให้เมื่อเลือกครบ"
          : "โจทย์นี้ไม่มีสาย" +
              (side === "in" ? "เข้า" : "ออก") +
              "ของอุปกรณ์นี้ สำรวจพอร์ตและตำแหน่งได้",
        "context-note",
      ),
    );
    const list = scope.create("div", undefined, "full-port-list");
    list.id = "device-port-list";
    for (const port of sidePorts(id, side)) {
      const b = scope.create("button");
      b.type = "button";
      b.dataset.portChoice = port.id;
      b.append(
        scope.create("strong", port.label),
        scope.create(
          "small",
          scope.portDirection(port) + " · " + scope.portFunction(port),
        ),
      );
      b.addEventListener("click", () => {
        if (scope.context?.assignable) scope.pickPort(id, port.id, side);
        else {
          scope.context.inspectedPortId = port.id;
          renderContext();
        }
      });
      list.append(b);
    }
    if (!list.childElementCount)
      list.append(
        scope.create(
          "p",
          "ไม่มีพอร์ตในกลุ่มนี้ตามข้อมูลอ้างอิง",
          "context-note",
        ),
      );
    box.append(list);
    const inspect = scope.create(
      "button",
      "ดูตำแหน่งบนโมเดล 3 มิติ ↗",
      "quiet-button full-width",
    );
    inspect.id = "inspect-device";
    inspect.addEventListener("click", () => scope.openModel(id, side));
    box.append(inspect);
    scope.render();
    focusContext();
  }

  function openSetting(id, kind, button) {
    startContext(kind, id, button);
    const box = scope.$("context-content"),
      select = scope.create("select");
    select.id = kind === "source" ? "vertex-source" : "lesson-input";
    if (kind === "source") {
      for (const v of ["CAMERA", "HDMI IN", "PC1", "PC2"]) {
        const o = scope.create(
          "option",
          v === "CAMERA" ? "CAMERA · กล้อง Vertex" : v,
        );
        o.value = v;
        select.append(o);
      }
    } else {
      const blank = scope.create("option", "ยังไม่เลือก Input");
      blank.value = "";
      select.append(blank);
      for (const p of scope
        .devicePorts(id)
        .filter(
          (p) =>
            p.video_capable === true &&
            (p.direction === "in" ||
              p.connection_kind === "configurable_video"),
        )) {
        const o = scope.create("option", p.label);
        o.value = p.id;
        select.append(o);
      }
    }
    addLabel(
      box,
      kind === "source" ? "SOURCE · เลือกแหล่งภาพ" : "Input · เลือกช่องรับภาพ",
      select,
    );
    box.append(
      scope.create(
        "p",
        kind === "source"
          ? "เลือกว่าจะส่งภาพจากกล้องหรืออินพุตใดของ Vertex"
          : "เลือกช่องรับภาพให้ตรงกับช่องที่เสียบสายจริง",
        "context-note",
      ),
    );
    select.addEventListener("change", () =>
      scope.mutate({
        ...scope.getState(),
        [kind === "source" ? "vertexSource" : "displayInput"]: select.value,
      }),
    );
    scope.render();
    focusContext();
  }

  function openWire(i, button) {
    scope.activeSegment = Number(i);
    startContext("wire", null, button || scope.$("wire-label-" + i));
    const box = scope.$("context-content"),
      cable = scope.create("select");
    cable.id = "wire-cable";
    const blank = scope.create("option", "ยังไม่เลือกสาย / ถอดสาย");
    blank.value = "";
    cable.append(blank);
    for (const groupName of [
      ...new Set(scope.WIRE_CHOICES.map((c) => c.group)),
    ]) {
      const group = scope.create("optgroup");
      group.label = groupName;
      for (const c of scope.WIRE_CHOICES.filter((c) => c.group === groupName)) {
        const o = scope.create(
          "option",
          c.label + (c.engineSupported ? "" : " · ยังไม่จำลอง"),
        );
        o.value = c.id;
        o.title = c.availability + " · " + c.description;
        group.append(o);
      }
      cable.append(group);
    }
    addLabel(box, "ชนิดสายเชื่อมต่อ", cable);
    cable.addEventListener("change", () =>
      scope.changeLink(scope.activeSegment, { cableId: cable.value }),
    );
    scope.render();
    focusContext();
  }

  function renderContext() {
    if (scope.pop.hidden || !scope.context) return;
    const state = scope.getState(),
      link = state.links[scope.activeSegment];
    if (scope.context.kind === "ports") {
      if (scope.$("port-segment"))
        scope.$("port-segment").value = scope.activeSegment;
      const side = scope.context.side === "out" ? "sourcePortId" : "sinkPortId",
        selected = scope.context.assignable
          ? link[side]
          : scope.context.inspectedPortId;
      for (const b of scope.$("device-port-list").querySelectorAll("button"))
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.portChoice === selected),
        );
    } else if (scope.context.kind === "source")
      scope.$("vertex-source").value = state.vertexSource;
    else if (scope.context.kind === "input")
      scope.$("lesson-input").value = state.displayInput;
    else if (scope.context.kind === "wire")
      scope.$("wire-cable").value = link.cableId;
  }
  return {
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
  };
}
