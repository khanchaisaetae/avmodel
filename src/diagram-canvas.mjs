import { worldDelta, diagramCoordinate } from "./workspace-geometry.mjs?v=20261025-placement";
// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramCanvas(scope) {
  function renderNode(node) {
    const card = scope.el(
      "article",
      undefined,
      "diagram-node" +
        (scope.selection?.kind === "node" && scope.selection.id === node.id
          ? " selected"
          : ""),
    );
    card.id = "design-" + node.id;
    card.style.left = node.x + "px";
    card.style.top = node.y + "px";
    card.setAttribute("aria-label", scope.DEVICE_NAMES[node.id]);
    const grip = scope.button(
      "⠿ " + scope.DEVICE_NAMES[node.id],
      () => {
        scope.selection = { kind: "node", id: node.id };
        scope.renderProperties();
      },
      "node-drag",
    );
    grip.setAttribute(
      "aria-label",
      "เลือกหรือย้าย " + scope.DEVICE_NAMES[node.id],
    );
    grip.addEventListener("keydown", (event) => {
      const delta = {
        ArrowLeft: [-20, 0],
        ArrowRight: [20, 0],
        ArrowUp: [0, -20],
        ArrowDown: [0, 20],
      }[event.key];
      if (delta) {
        event.preventDefault();
        scope.moveNode(node.id, ...delta);
        document.querySelector("#design-" + node.id + " .node-drag")?.focus();
      }
    });
    card.append(grip);
    const art = scope.el("div", undefined, "node-art");
    art.innerHTML = scope.deviceArt(node.id);
    card.append(art);
    const controls = scope.el("div", undefined, "node-controls");
    const power = scope.button(node.power ? "⏻ เปิดอยู่" : "⏻ ปิดอยู่", () =>
      scope.changeNode(node.id, { power: !node.power }),
    );
    power.setAttribute("aria-pressed", String(node.power));
    power.setAttribute(
      "aria-label",
      (node.power ? "ปิด" : "เปิด") + "เครื่อง " + scope.DEVICE_NAMES[node.id],
    );
    controls.append(power);
    if (["dell", "bluray"].includes(node.id)) {
      const enabled = scope.button(
        node.id === "dell"
          ? "ส่งภาพออกจอ: " + (node.enabled ? "เปิด" : "ปิด")
          : "เล่น / ส่งภาพ: " + (node.enabled ? "เปิด" : "ปิด"),
        () => scope.changeNode(node.id, { enabled: !node.enabled }),
      );
      enabled.setAttribute("aria-pressed", String(node.enabled));
      controls.append(enabled);
    }
    if (["tv", "epson", "vertex"].includes(node.id)) {
      const select = scope.el("select");
      select.id = "setting-" + node.id;
      const label = scope.el(
        "label",
        node.id === "vertex" ? "SOURCE · แหล่งภาพ" : "Input · ช่องรับภาพ",
      );
      label.htmlFor = select.id;
      if (node.id === "vertex") {
        for (const value of ["CAMERA", "HDMI IN", "PC1", "PC2"]) {
          const option = scope.el("option", value);
          option.value = value;
          select.append(option);
        }
        select.value = node.source;
      } else {
        const blank = scope.el("option", "ยังไม่เลือก Input");
        blank.value = "";
        select.append(blank);
        for (const p of scope.catalog.devices
          .find((d) => d.id === node.id)
          .ports.filter(
            (p) => p.video_capable === true && scope.portSupportsSide(p, "in"),
          )) {
          const option = scope.el("option", p.label);
          option.value = p.id;
          select.append(option);
        }
        select.value = node.input;
      }
      select.addEventListener("change", () =>
        scope.changeNode(
          node.id,
          node.id === "vertex"
            ? { source: select.value }
            : { input: select.value },
        ),
      );
      controls.append(label, select);
    }
    const group = scope.el("div", undefined, "port-buttons");
    for (const side of ["in", "out"]) {
      const b = scope.button(
        side === "in" ? "อินพุตพอร์ต" : "เอาท์พุตพอร์ต",
        () => scope.openPorts(node.id, side),
      );
      b.id = "design-" + side + "-" + node.id;
      if (scope.pending?.id === node.id && scope.pending.side === side)
        b.classList.add("pending");
      group.append(b);
    }
    controls.append(group);
    card.append(controls);
    const endpoints = scope.el("div", undefined, "node-endpoints");
    let count = 0;
    scope.state.links.forEach((l, i) => {
      if (l.from === node.id || l.to === node.id) {
        const out = l.from === node.id,
          p = scope.el(
            "p",
            i +
              1 +
              ". " +
              (out ? "OUT → " : "→ IN ") +
              scope.ports.get(out ? l.sourcePortId : l.sinkPortId).label,
          );
        p.dataset.linkEndpoint = l.id + (out ? "-out" : "-in");
        endpoints.append(p);
        count++;
      }
    });
    if (!count) endpoints.textContent = "ยังไม่มีสายเชื่อมต่อ";
    card.append(endpoints);
    let drag = null;
    grip.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      scope.workspace?.beginMove();
      drag = {
        x: event.clientX,
        y: event.clientY,
        startX: node.x,
        startY: node.y,
        xNow: node.x,
        yNow: node.y,
      };
      grip.setPointerCapture(event.pointerId);
      scope.selection = { kind: "node", id: node.id };
      scope.renderProperties();
    });
    grip.addEventListener("pointermove", (event) => {
      if (!drag) return;
      drag.xNow = diagramCoordinate(drag.startX + worldDelta(event.clientX - drag.x, scope.workspace?.scale || 1));
      drag.yNow = diagramCoordinate(drag.startY + worldDelta(event.clientY - drag.y, scope.workspace?.scale || 1));
      card.style.left = drag.xNow + "px";
      card.style.top = drag.yNow + "px";
      drawWires();
    });
    const finish = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (d.xNow !== node.x || d.yNow !== node.y)
        scope.changeNode(node.id, {
          x: Math.round(d.xNow),
          y: Math.round(d.yNow),
        });
    };
    grip.addEventListener("pointerup", finish);
    grip.addEventListener("pointercancel", finish);
    return card;
  }

  function drawWires() {
    const svg = scope.$("diagram-wires"),
      labels = scope.$("diagram-wire-labels");
    svg.innerHTML =
      '<defs><marker id="design-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#648b98"/></marker></defs>';
    labels.replaceChildren();
    const board = scope.$("diagram-canvas").getBoundingClientRect(), scale = scope.workspace?.scale || 1;
    scope.state.links.forEach((l, i) => {
      const a = scope.$("design-" + l.from).getBoundingClientRect(),
        b = scope.$("design-" + l.to).getBoundingClientRect(),
        aTag = document
          .querySelector('[data-link-endpoint="' + l.id + '-out"]')
          ?.getBoundingClientRect(),
        bTag = document
          .querySelector('[data-link-endpoint="' + l.id + '-in"]')
          ?.getBoundingClientRect(),
        x = (a.right - board.left) / scale,
        y =
          (aTag ? aTag.top + aTag.height / 2 : a.top + a.height / 2) -
          board.top,
        tx = (b.left - board.left) / scale,
        ty =
          (bTag ? bTag.top + bTag.height / 2 : b.top + b.height / 2) -
          board.top,
        m = (x + tx) / 2;
      const wy = worldDelta(y, scale), wty = worldDelta(ty, scale);
      const make = (cls) => {
        const p = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        p.setAttribute("d", `M${x} ${wy} C${m} ${wy} ${m} ${wty} ${tx} ${wty}`);
        p.setAttribute("class", cls);
        p.addEventListener("click", () => {
          scope.selection = { kind: "wire", id: l.id };
          scope.render();
        });
        return p;
      };
      const hit = make("diagram-hit"),
        path = make(
          "diagram-wire" + (scope.selection?.id === l.id ? " selected" : ""),
        );
      path.setAttribute("marker-end", "url(#design-arrow)");
      svg.append(hit, path);
      const label = scope.button(
        i +
          1 +
          ". " +
          (scope.WIRE_CHOICES.find((c) => c.id === l.cableId)?.label ||
            "＋ เลือกชนิดสาย"),
        () => {
          scope.selection = { kind: "wire", id: l.id };
          scope.render();
          scope.$("selected-cable")?.focus();
        },
        "canvas-wire-label" + (scope.selection?.id === l.id ? " selected" : ""),
      );
      label.style.left = m + "px";
      label.style.top = (wy + wty) / 2 - 24 + "px";
      label.title = "คลิกเพื่อเลือกชนิดสาย";
      label.setAttribute(
        "aria-label",
        "สาย " +
          (i + 1) +
          " " +
          scope.DEVICE_NAMES[l.from] +
          " ไป " +
          scope.DEVICE_NAMES[l.to],
      );
      label.id = "design-wire-" + i;
      labels.append(label);
    });
  }
  return { renderNode, drawWires };
}
