// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramControls(scope) {
  function ask(title, detail, action) {
    scope.$("confirm-title").textContent = title;
    scope.$("confirm-detail").textContent = detail;
    scope.confirmation = action;
    scope.$("confirm-action").showModal();
    scope.$("confirm-cancel").focus();
  }

  function openPorts(id, side) {
    const selectedLink = !scope.pending && scope.selection?.kind === "wire"
      ? scope.state.links.find(l => l.id === scope.selection.id && l[side === "out" ? "from" : "to"] === id)
      : null;
    scope.picker = { id, side, editLinkId: selectedLink?.id };
    scope.$("picker-side").textContent =
      side === "in" ? "อินพุตพอร์ต" : "เอาท์พุตพอร์ต";
    scope.$("picker-title").textContent = scope.DEVICE_NAMES[id];
    scope.$("picker-help").textContent =
      side === "out"
        ? "เลือกพอร์ตต้นทาง จากนั้นเลือกอินพุตพอร์ตบนอุปกรณ์ปลายทาง"
        : scope.pending
          ? "เลือกพอร์ตรับภาพสำหรับสายจาก " +
            scope.DEVICE_NAMES[scope.pending.id]
          : "เลือกได้เพื่อเริ่มจากปลายรับ แล้วไปเลือกเอาท์พุตพอร์ตต้นทาง";
    if (selectedLink) scope.$("picker-help").textContent = "แก้พอร์ตของสายที่เลือก · เลือกพอร์ตใหม่เพื่อแทนปลายเดิม โดยไม่เพิ่มสาย";
    scope.$("picker-list").replaceChildren();
    for (const port of scope.catalog.devices
      .find((d) => d.id === id)
      .ports.filter((p) => scope.portSupportsSide(p, side))) {
      const b = scope.el("button");
      b.append(
        scope.el("strong", port.label),
        scope.el(
          "small",
          scope.portDirection(port) + " · " + scope.portFunction(port),
        ),
      );
      b.addEventListener("click", () => choosePort(id, side, port.id));
      scope.$("picker-list").append(b);
    }
    if (!scope.$("picker-list").childElementCount)
      scope
        .$("picker-list")
        .append(scope.el("p", "ไม่มีพอร์ตในกลุ่มนี้ตามเอกสารอ้างอิง"));
    scope.$("port-picker").showModal();
  }

  function choosePort(id, side, portId) {
    scope.$("port-picker").close();
    const editLinkId = scope.picker?.editLinkId;
    scope.picker = null;
    if (editLinkId) {
      const key = side === "out" ? "sourcePortId" : "sinkPortId";
      scope.pending = null;
      scope.commit({...scope.state, links: scope.state.links.map(l => l.id === editLinkId ? {...l, [key]: portId} : l)});
      scope.notice("เปลี่ยนพอร์ตของสายเดิมแล้ว · ตรวจผังใหม่ได้");
      return;
    }
    if (!scope.pending || scope.pending.side === side) {
      scope.pending = { id, side, portId };
      scope.render();
      scope.notice(
        "เลือกแล้ว: " +
          scope.ports.get(portId).label +
          " · เลือก" +
          (side === "out" ? "อินพุต" : "เอาท์พุต") +
          "พอร์ตของอีกอุปกรณ์",
      );
      return;
    }
    if (scope.pending.id === id) {
      scope.notice("เลือกปลายสายจากคนละอุปกรณ์");
      return;
    }
    const from = side === "out" ? { id, portId } : scope.pending,
      to = side === "in" ? { id, portId } : scope.pending;
    if (scope.state.links.length >= 20) {
      scope.notice("ผังนี้รองรับสายได้ไม่เกิน 20 เส้น");
      return;
    }
    const link = {
      id:
        "w" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2),
      from: from.id,
      to: to.id,
      sourcePortId: from.portId,
      sinkPortId: to.portId,
      cableId: "",
    };
    scope.pending = null;
    scope.selection = { kind: "wire", id: link.id };
    scope.commit({ ...scope.state, links: [...scope.state.links, link] });
    scope.notice("สร้างเส้นเชื่อมแล้ว เลือกชนิดสายด้านบนผัง");
  }

  function cableSelect(link) {
    const select = scope.el("select");
    select.id = "selected-cable";
    const blank = scope.el("option", "ยังไม่เลือกชนิดสาย");
    blank.value = "";
    select.append(blank);
    for (const groupName of new Set(scope.WIRE_CHOICES.map((c) => c.group))) {
      const group = scope.el("optgroup");
      group.label = groupName;
      for (const c of scope.WIRE_CHOICES.filter((c) => c.group === groupName)) {
        const option = scope.el(
          "option",
          c.label + (c.engineSupported ? "" : " · ยังไม่จำลอง"),
        );
        option.value = c.id;
        option.title = c.description;
        group.append(option);
      }
      select.append(group);
    }
    select.value = link.cableId;
    select.addEventListener("change", () =>
      scope.commit({
        ...scope.state,
        links: scope.state.links.map((l) =>
          l.id === link.id ? { ...l, cableId: select.value } : l,
        ),
      }),
    );
    return select;
  }

  function button(text, fn, cls) {
    const b = scope.el("button", text, cls);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }

  function renderProperties() {
    scope.workspace?.showSelection();
    const box = scope.$("diagram-selection");
    box.replaceChildren();
    if (!scope.selection) {
      box.append(scope.el("p", "เลือกอุปกรณ์หรือเส้นในผังเพื่อแก้ไข"));
      return;
    }
    if (scope.selection.kind === "wire") {
      const link = scope.state.links.find((l) => l.id === scope.selection.id);
      if (!link) {
        scope.selection = null;
        renderProperties();
        return;
      }
      box.append(
        scope.el(
          "p",
          "สาย " + (scope.state.links.indexOf(link) + 1),
          "selection-title",
        ),
        scope.el(
          "p",
          scope.DEVICE_NAMES[link.from] +
            " · " +
            scope.ports.get(link.sourcePortId).label +
            " OUT → " +
            scope.DEVICE_NAMES[link.to] +
            " · " +
            scope.ports.get(link.sinkPortId).label +
            " IN",
        ),
      );
      const label = scope.el("label", "ชนิดสายเชื่อมต่อ");
      label.htmlFor = "selected-cable";
      box.append(
        label,
        cableSelect(link),
        button(
          "ลบสายเส้นนี้",
          () => {
            scope.selection = null;
            scope.commit({
              ...scope.state,
              links: scope.state.links.filter((l) => l.id !== link.id),
            });
          },
          "danger",
        ),
      );
      return;
    }
    const node = scope.state.nodes.find((n) => n.id === scope.selection.id);
    if (!node) {
      scope.selection = null;
      renderProperties();
      return;
    }
    box.append(
      scope.el("p", scope.DEVICE_NAMES[node.id], "selection-title"),
      scope.el("p", "ลากแถบชื่ออุปกรณ์ หรือใช้ปุ่มลูกศรย้ายทีละ 20 หน่วย"),
    );
    const moves = scope.el("div", undefined, "move-buttons");
    for (const [label, x, y] of [
      ["←", -20, 0],
      ["↑", 0, -20],
      ["↓", 0, 20],
      ["→", 20, 0],
    ])
      moves.append(button(label, () => scope.moveNode(node.id, x, y)));
    const moveDetails = scope.el("details");
    moveDetails.append(scope.el("summary", "ย้ายด้วยปุ่ม"), moves);
    box.append(moveDetails);
    box.append(
      button("ดูโมเดลและพอร์ต 3 มิติ ↗", () => {
        scope.$("model-title").textContent = scope.DEVICE_NAMES[node.id];
        scope.$("model-frame").src =
          "index.html?embedded=1&device=" + encodeURIComponent(node.id);
        scope.$("model-preview").showModal();
      }),
    );
    box.append(
      button(
        "ลบอุปกรณ์",
        () =>
          ask(
            "ลบ " + scope.DEVICE_NAMES[node.id] + "?",
            "สายที่เชื่อมกับอุปกรณ์นี้จะถูกลบด้วย สามารถย้อนกลับได้",
            () => {
              scope.pending = null;
              scope.selection = null;
              scope.commit({
                ...scope.state,
                nodes: scope.state.nodes.filter((n) => n.id !== node.id),
                links: scope.state.links.filter(
                  (l) => l.from !== node.id && l.to !== node.id,
                ),
              });
            },
          ),
        "danger",
      ),
    );
  }
  return { ask, openPorts, choosePort, cableSelect, button, renderProperties };
}
