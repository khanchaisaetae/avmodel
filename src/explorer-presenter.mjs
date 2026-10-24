// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createExplorerPresenter(scope) {
  function sourceIsConfirmed(p) {
    return p.capability_status === "verified_reference";
  }

  function positionLabel(m) {
    return !m
      ? "ยังไม่ระบุตำแหน่ง"
      : m.user_acceptance?.status === "accepted"
        ? "ผู้ใช้ตรวจรับตำแหน่งแล้ว"
        : ["reviewed", "local_reviewed"].includes(m.status)
          ? "ตรวจตำแหน่งแล้ว"
          : m.status === "local_draft"
            ? "จุดที่ปรับไว้ · รอตรวจ"
            : "ตำแหน่งเสนอ · รอตรวจ";
  }

  function symbol(p) {
    if (p.connector === "hdmi") return "HDMI";
    if (p.connector === "vga") return "RGB";
    if (p.connector?.startsWith("usb")) return "USB";
    if (p.connection_kind === "power") return "DC";
    if (p.connection_kind === "audio") return "♪";
    if (p.connector === "rj45") return "LAN";
    return "○";
  }

  function direction(p) {
    const d = p.video_direction || p.direction;
    return d === "out"
      ? "OUT"
      : d === "in"
        ? "IN"
        : d === "bidirectional"
          ? "I/O"
          : "MODE";
  }

  function renderDevices() {
    const nav = scope.$("devices");
    nav.replaceChildren();
    for (const d of scope.catalog.devices.filter(
      (d) =>
        scope.appMode !== "practice" || scope.lesson?.deviceIds.includes(d.id),
    )) {
      const meta = scope.META[d.id],
        b = document.createElement("button");
      b.className = "device" + (d.id === scope.device?.id ? " active" : "");
      b.dataset.device = d.id;
      b.setAttribute("aria-pressed", String(d.id === scope.device?.id));
      b.innerHTML = `<span class="device-icon">${scope.icon(meta.icon)}</span>`;
      const labels = document.createElement("span");
      labels.append(
        scope.text("strong", meta.title),
        scope.text("small", meta.sub),
      );
      b.append(labels, scope.text("span", "›", "arrow"));
      b.addEventListener("click", () => scope.loadDevice(d.id));
      nav.append(b);
    }
  }

  function renderPorts() {
    const list = scope.$("ports");
    list.replaceChildren();
    const query = scope.$("port-search").value.trim().toLowerCase();
    const ports = scope.device.ports.filter(
      (p) =>
        (scope.filter === "all" ||
          (scope.filter === "video"
            ? p.video_capable === true
            : p.video_capable !== true)) &&
        `${p.label} ${p.connector || ""}`.toLowerCase().includes(query),
    );
    for (const p of ports) {
      const m = scope.getMapping(p.id),
        b = document.createElement("button");
      b.className = "port" + (scope.selected?.id === p.id ? " active" : "");
      b.dataset.port = p.id;
      b.setAttribute("aria-pressed", String(scope.selected?.id === p.id));
      b.append(scope.text("span", symbol(p), "port-symbol"));
      const block = document.createElement("span");
      block.append(scope.text("span", p.label, "port-title"));
      const sub = scope.text("span", positionLabel(m), "port-subtitle");
      const dot = scope.text(
        "i",
        "",
        "mapping-dot " +
          (m?.status?.includes("reviewed") ? "reviewed" : m ? "candidate" : ""),
      );
      sub.prepend(dot);
      block.append(sub);
      b.append(
        block,
        scope.text(
          "span",
          direction(p),
          "port-direction " + (direction(p) === "OUT" ? "out" : ""),
        ),
      );
      b.addEventListener("click", () => scope.selectPort(p.id));
      list.append(b);
    }
    if (!ports.length)
      list.append(
        scope.text("p", "ไม่พบพอร์ตที่ตรงกับการค้นหา", "muted small"),
      );
    scope.$("port-count").textContent = scope.device.ports.length + " รายการ";
  }

  function infoRow(label, value) {
    const row = scope.text("div", "", "info-row");
    row.append(scope.text("span", label), scope.text("span", value));
    return row;
  }

  function renderDetail() {
    const el = scope.$("detail");
    el.replaceChildren();
    if (!scope.selected) {
      el.append(
        scope.text(
          "p",
          "เลือกพอร์ตเพื่อดูหน้าที่และเอกสารอ้างอิง",
          "muted small",
        ),
      );
      scope.renderReview();
      return;
    }
    const p = scope.selected,
      m = scope.getMapping(p.id),
      head = scope.text("div", "", "detail-top");
    head.append(
      scope.text("span", "รายละเอียดพอร์ต", "tiny-title"),
      scope.text(
        "span",
        sourceIsConfirmed(p) ? "มีหลักฐานอ้างอิง" : "ยังยืนยันไม่ครบ",
        "badge " + (sourceIsConfirmed(p) ? "" : "amber"),
      ),
    );
    el.append(head, scope.text("h3", p.label));
    el.append(
      infoRow(
        "ทิศทางสัญญาณ",
        p.video_direction
          ? "ภาพส่งออก (OUT) / ข้อมูล USB รับ–ส่ง"
          : p.direction === "out"
            ? "ส่งออก · OUT"
            : p.direction === "in"
              ? "รับเข้า · IN"
              : p.direction === "bidirectional"
                ? "รับ–ส่งข้อมูล · I/O"
                : "เปลี่ยนตามโหมดการทำงาน",
      ),
    );
    el.append(
      infoRow(
        "ชนิดหัวต่อ",
        {
          hdmi: "HDMI",
          usb_a: "USB Type-A",
          usb_b: "USB Type-B",
          usb_c: "USB Type-C",
          vga: "D-Sub 15 / VGA",
          rca: "RCA",
          rj45: "RJ-45",
          mini_din4: "Mini-DIN 4",
          dsub9: "D-Sub 9",
          dc_barrel: "DC",
          ac_inlet: "AC",
          mini_jack_3_5: "แจ็คสเตอริโอ 3.5 มม.",
          phone_jack_6_35: "Phone 1/4 นิ้ว (6.35 มม.)",
          toslink: "Optical / TOSLINK",
        }[p.connector] || "เอกสารยังไม่ระบุ",
      ),
      infoRow(
        "ความสามารถด้านภาพ",
        p.connection_kind === "usb_media"
          ? "เล่นไฟล์สื่อ · ไม่ใช่อินพุตภาพสด"
          : p.video_capable === true
            ? "รองรับตามเงื่อนไข"
            : p.video_capable === false
              ? "ไม่ใช่พอร์ตส่งภาพ"
              : "ยังไม่ยืนยัน",
      ),
      infoRow("ตำแหน่งบนโมเดล", positionLabel(m)),
    );
    const descriptions = [];
    if (p.evidence[0]?.detail_th) descriptions.push(p.evidence[0].detail_th);
    if (p.requirements)
      descriptions.push(
        "ต้องใช้: " +
          p.requirements
            .map(
              (r) =>
                ({
                  compatible_computer: "คอมพิวเตอร์ที่รองรับ",
                  "Epson USB Display software": "โปรแกรม Epson USB Display",
                  "USB-B cable": "สาย USB Type-B",
                  compatible_HDBaseT_transmitter: "ตัวส่ง HDBaseT ที่รองรับ",
                  "USB cable": "สาย USB",
                  "documented driver/software": "ไดรเวอร์และโปรแกรมตามคู่มือ",
                  "select UVC CAMERA": "เลือก UVC CAMERA ในโปรแกรม",
                })[r] || r,
            )
            .join(", "),
      );
    if (p.notes_th?.length)
      descriptions.push(
        ...p.notes_th.filter(
          (n) => !/direction=|ตัวตรวจ|inferred|geometry|assessment/.test(n),
        ),
      );
    if (p.connection_kind === "configurable_video")
      descriptions.push("ต้องตั้งค่าโหมดพอร์ตก่อนใช้งาน");
    if (descriptions.length)
      el.append(scope.text("p", descriptions.join(" · "), "detail-note"));
    for (const e of p.evidence) {
      const s = scope.catalog.sources[e.source_id];
      if (!s) continue;
      const a = document.createElement("a");
      a.className = "source-link";
      a.target = "_blank";
      a.rel = "noopener";
      a.href =
        e.url ||
        encodeURI(s.path) + (e.pdf_pages ? "#page=" + e.pdf_pages[0] : "");
      a.textContent =
        "↗ " +
        (e.source_id === "dell_official"
          ? "คู่มือ Dell อย่างเป็นทางการ"
          : s.model) +
        (e.pdf_pages
          ? " · หน้า " + e.pdf_pages.join(", ")
          : " · ข้อมูลอ้างอิง");
      el.append(a);
      if (e.basis === "diagram_only")
        el.append(
          scope.text("small", "ยืนยันจากภาพแผงพอร์ตในเอกสาร", "muted small"),
        );
    }
    if (m?.user_acceptance?.status === "accepted")
      el.append(
        scope.text(
          "p",
          "ผู้ใช้ยืนยันตรวจรับตำแหน่งเมื่อ 23 ต.ค. 2026",
          "detail-note",
        ),
      );
    if (m?.reference_review && !m?.user_acceptance)
      el.append(
        scope.text(
          "p",
          "ตรวจตำแหน่งใหม่เทียบคู่มือหน้า 28, 38 · รอผู้ใช้ตรวจรับ",
          "muted small",
        ),
      );
    if (m) {
      const b = scope.text("button", "⌖ ดูใกล้ที่พอร์ตนี้", "focus-button");
      b.addEventListener("click", () => scope.focusPort(p.id));
      el.append(b);
      const panel = scope.text("button", "ดูแผงพอร์ตโดยรอบ", "focus-button");
      panel.addEventListener("click", () => scope.focusPort(p.id, 2.8));
      el.append(panel);
    } else {
      el.append(
        scope.text(
          "p",
          scope.baseline.unmapped?.[p.id]?.reason ||
            "ยังไม่ได้จับคู่จุดบนโมเดล เปิดแท็บตรวจตำแหน่งเพื่อระบุตำแหน่ง",
          "muted small",
        ),
      );
    }
    scope.renderReview();
  }
  return {
    sourceIsConfirmed,
    positionLabel,
    symbol,
    direction,
    renderDevices,
    renderPorts,
    infoRow,
    renderDetail,
  };
}
