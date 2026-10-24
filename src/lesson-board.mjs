// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createLessonBoard(scope) {
  function deviceButton(id, text, cls, handler) {
    const b = scope.create("button", text, cls);
    b.type = "button";
    b.id = id;
    b.addEventListener("click", handler);
    return b;
  }

  function buildBoard() {
    const layout = scope.systemLayout(scope.task);
    scope.$("connection-board").dataset.size = scope.task.devices.length;
    scope.$("board-nodes").replaceChildren();
    scope.$("wire-labels").replaceChildren();
    for (const id of scope.task.devices) {
      const [x, y] = layout[id],
        node = scope.create("article", undefined, "board-device direct-device");
      node.id = "node-" + id;
      node.style.left = x / 10 + "%";
      node.style.top = y / 5 + "%";
      node.setAttribute("aria-label", scope.DEVICE_NAMES[id]);
      const art = scope.create("div", undefined, "device-art");
      art.innerHTML = scope.deviceArt(id);
      node.append(art, scope.create("h3", scope.short(id)));
      const power = deviceButton(
        "power-" + id,
        "",
        "on-device power-control",
        () =>
          scope.mutate({
            ...scope.getState(),
            power: {
              ...scope.getState().power,
              [id]: !scope.getState().power[id],
            },
          }),
      );
      node.append(power);
      if (scope.task.sources.includes(id) && id !== "vertex")
        node.append(
          deviceButton("enable-" + id, "", "on-device output-control", () =>
            scope.mutate({
              ...scope.getState(),
              sourceEnabled: {
                ...scope.getState().sourceEnabled,
                [id]: !scope.getState().sourceEnabled[id],
              },
            }),
          ),
        );
      if (id === "vertex") {
        const b = deviceButton(
          "choose-source",
          "",
          "on-device source-control",
          () => scope.openSetting(id, "source", scope.$("choose-source")),
        );
        b.dataset.menuAnchor = "true";
        node.append(b);
      }
      if (id === scope.task.displayId) {
        const b = deviceButton(
          "choose-input",
          "",
          "on-device input-control",
          () => scope.openSetting(id, "input", scope.$("choose-input")),
        );
        b.dataset.menuAnchor = "true";
        node.append(b);
        const preview = scope.create("div", undefined, "display-preview");
        preview.id = "display-preview";
        preview.setAttribute("aria-hidden", "true");
        const caption = scope.create("span", undefined, "display-caption");
        caption.id = "display-caption";
        node.append(preview, caption);
      }
      const group = scope.create("div", undefined, "port-side-buttons");
      for (const side of ["in", "out"]) {
        const buttonId = "ports-" + side + "-" + id,
          b = deviceButton(
            buttonId,
            side === "in" ? "อินพุตพอร์ต" : "เอาท์พุตพอร์ต",
            "device-ports-button",
            () => scope.openPorts(id, side, scope.$(buttonId)),
          );
        b.dataset.menuAnchor = "true";
        group.append(b);
      }
      node.append(group);
      const endpoint = scope.create("div", undefined, "node-port-map");
      endpoint.id = "port-map-" + id;
      node.append(endpoint);
      scope.$("board-nodes").append(node);
    }
    scope.task.segments.forEach((_, i) => {
      const b = deviceButton("wire-label-" + i, "", "wire-label", () =>
        scope.openWire(i, scope.$("wire-label-" + i)),
      );
      b.dataset.number = String(i + 1);
      b.dataset.menuAnchor = "true";
      scope.$("wire-labels").append(b);
    });
  }

  function endpointY(id, index, side, fallback) {
    const board = scope.$("connection-board").getBoundingClientRect(),
      tag = scope
        .$("port-map-" + id)
        .querySelector('[data-endpoint="' + index + "-" + side + '"]');
    if (!tag || !board.height) return fallback;
    const rect = tag.getBoundingClientRect();
    return ((rect.top + rect.height / 2 - board.top) / board.height) * 500;
  }

  function renderBoard(s, live, issue) {
    const layout = scope.systemLayout(scope.task),
      flow = scope.visibleSignalSegments(scope.task, s, live),
      svg = scope.$("system-wires");
    svg.innerHTML =
      '<defs><marker id="wire-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>';
    for (const id of scope.task.devices) {
      const endpoint = scope.$("port-map-" + id);
      endpoint.replaceChildren();
      for (const side of ["in", "out"]) {
        for (const i of scope.incidentSegments(id, side)) {
          const link = s.links[i],
            p = scope.ports.get(
              link[side === "in" ? "sinkPortId" : "sourcePortId"],
            ),
            tag = scope.create(
              "span",
              (side === "in" ? "→ IN · " : "OUT → · ") +
                (p?.label || "ยังไม่เลือก"),
              "endpoint-tag " + side,
            );
          tag.dataset.endpoint = i + "-" + side;
          tag.title =
            "สาย " + (i + 1) + " · " + (p?.label || "ยังไม่เลือกพอร์ต");
          tag.prepend(scope.create("b", String(i + 1)));
          endpoint.append(tag);
        }
      }
      const on = s.power[id],
        node = scope.$("node-" + id),
        power = scope.$("power-" + id);
      power.textContent = on ? "⏻ เปิดอยู่" : "⏻ ปิดอยู่";
      power.setAttribute(
        "aria-label",
        (on ? "ปิด" : "เปิด") + "เครื่อง " + scope.short(id),
      );
      power.setAttribute("aria-pressed", String(on));
      node.classList.toggle("issue", issue?.device === id);
      node.classList.toggle("is-focused", scope.context?.deviceId === id);
      for (const side of ["in", "out"])
        scope
          .$("ports-" + side + "-" + id)
          .setAttribute(
            "aria-expanded",
            String(
              scope.context?.kind === "ports" &&
                scope.context.deviceId === id &&
                scope.context.side === side,
            ),
          );
      if (scope.$("enable-" + id)) {
        const b = scope.$("enable-" + id);
        b.textContent =
          id === "dell"
            ? s.sourceEnabled[id]
              ? "ส่งภาพออกจอ: เปิด"
              : "ส่งภาพออกจอ: ปิด"
            : s.sourceEnabled[id]
              ? "เล่น / ส่งภาพ: เปิด"
              : "เล่น / ส่งภาพ: ปิด";
        b.setAttribute("aria-pressed", String(s.sourceEnabled[id]));
      }
    }
    if (scope.$("choose-source"))
      scope
        .$("choose-source")
        .setAttribute(
          "aria-expanded",
          String(scope.context?.kind === "source"),
        );
    scope
      .$("choose-input")
      .setAttribute("aria-expanded", String(scope.context?.kind === "input"));
    if (scope.$("choose-source"))
      scope.$("choose-source").textContent = "SOURCE: " + s.vertexSource + " ⌄";
    scope.$("choose-input").textContent =
      "Input: " +
      (scope.ports.get(s.displayInput)?.label || "ยังไม่เลือก") +
      " ⌄";
    scope.task.segments.forEach((seg, i) => {
      const l = s.links[i],
        [sx, sy] = layout[seg.from],
        [tx, ty] = layout[seg.to],
        incoming = scope.task.segments.filter((p) => p.to === seg.to),
        offset =
          incoming.length > 1 ? (incoming.indexOf(seg) === 0 ? -42 : 42) : 0,
        x1 = sx + 100,
        x2 = tx - 100,
        y1 = endpointY(seg.from, i, "out", sy),
        y2 = endpointY(seg.to, i, "in", ty + offset),
        mx = (x1 + x2) / 2,
        path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`,
      );
      path.setAttribute("marker-end", "url(#wire-arrow)");
      path.setAttribute(
        "class",
        "system-wire" +
          (l.connected ? " is-connected" : "") +
          (flow.includes(i)
            ? live.signalCorrect
              ? " is-live"
              : " is-wrong"
            : "") +
          (issue?.segment === i ? " has-issue" : ""),
      );
      const hit = path.cloneNode();
      hit.setAttribute("class", "system-wire-hit");
      hit.removeAttribute("marker-end");
      for (const el of [hit, path])
        el.addEventListener("click", () =>
          scope.openWire(i, scope.$("wire-label-" + i)),
        );
      svg.append(hit, path);
      const hilite = () => {
          path.classList.add("is-hovered");
          label.classList.add("wire-hovered");
        },
        unhilite = () => {
          path.classList.remove("is-hovered");
          label.classList.remove("wire-hovered");
        };
      for (const el of [hit, path]) {
        el.addEventListener("pointerenter", hilite);
        el.addEventListener("pointerleave", unhilite);
      }
      const label = scope.$("wire-label-" + i);
      label.style.left = mx / 10 + "%";
      label.style.top = ((y1 + y2) / 2 - 27) / 5 + "%";
      label.classList.toggle("is-live", flow.includes(i));
      label.classList.toggle(
        "is-selected",
        scope.context?.kind === "wire" && scope.activeSegment === i,
      );
      label.classList.toggle("has-issue", issue?.segment === i);
      label.setAttribute(
        "aria-expanded",
        String(scope.context?.kind === "wire" && scope.activeSegment === i),
      );
      const cable = scope.WIRE_CHOICES.find((c) => c.id === l.cableId);
      label.title = "คลิกเพื่อเลือกชนิดสาย";
      label.onpointerenter = hilite;
      label.onpointerleave = unhilite;
      label.onfocus = hilite;
      label.onblur = unhilite;
      label.replaceChildren(
        scope.create(
          "strong",
          (flow.includes(i) ? "▶ " : l.connected ? "✓ " : "＋ ") +
            "สาย " +
            (i + 1) +
            " · " +
            (cable?.label || "เลือกสาย"),
        ),
      );
      if (cable && !l.connected) label.append(scope.create("em", "ยังไม่ต่อ"));
      label.append(scope.create("small", "คลิกเพื่อเลือกชนิดสาย", "wire-hint"));
      label.append(
        scope.create(
          "span",
          flow.includes(i)
            ? "▶ มีสัญญาณภาพ"
            : l.connected
              ? "✓ ต่อสายแล้ว"
              : "＋ ยังไม่ต่อ",
          "wire-state",
        ),
      );
      label.setAttribute(
        "aria-label",
        "สาย " +
          (i + 1) +
          " " +
          scope.short(seg.from) +
          " ไป " +
          scope.short(seg.to) +
          " " +
          (l.connected ? "ต่อแล้ว" : "เลือกชนิดสาย"),
      );
    });
    const preview = scope.$("display-preview");
    preview.dataset.source = live.imageVisible ? live.actualSource : "none";
    preview.innerHTML = live.imageVisible
      ? live.actualSource === "dell"
        ? '<span class="mini-slide"><i></i><b>บทเรียน</b><em></em></span>'
        : live.actualSource === "bluray"
          ? '<span class="mini-film"><i>▶</i><em></em></span>'
          : '<span class="mini-document"><i></i><b>เอกสาร</b><em></em></span>'
      : '<span class="no-picture">ไม่มีสัญญาณ</span>';
    scope.$("display-caption").textContent = live.imageVisible
      ? "ภาพจาก " + scope.SOURCE_NAMES[live.actualSource]
      : "ยังไม่มีภาพ";
  }
  return { deviceButton, buildBoard, endpointY, renderBoard };
}
