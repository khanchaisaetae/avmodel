// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createExplorerControls(scope) {
  function switchTab(id) {
    for (const b of document.querySelectorAll("[data-tab]"))
      b.classList.toggle("active", b.dataset.tab === id);
    scope.$("port-pane").hidden = id !== "ports";
    scope.$("review-pane").hidden = id !== "review";
  }

  function selectPort(id, { focus = true } = {}) {
    scope.selected = scope.device.ports.find((p) => p.id === id) || null;
    scope.pendingPoint = null;
    scope.renderPorts();
    scope.renderDetail();
    if (scope.selected) {
      scope.$("selection-label").textContent =
        scope.selected.label +
        " · " +
        scope.positionLabel(scope.getMapping(id));
      if (focus) scope.focusPort(id);
      else scope.updateSelection();
      scope.lesson?.onPortSelected(scope.selected);
    }
  }

  function bind() {
    for (const b of document.querySelectorAll("[data-view]"))
      b.addEventListener("click", () => scope.setView(b.dataset.view));
    for (const b of document.querySelectorAll("[data-tab]"))
      b.addEventListener("click", () => switchTab(b.dataset.tab));
    for (const b of document.querySelectorAll("[data-filter]"))
      b.addEventListener("click", () => {
        scope.filter = b.dataset.filter;
        document
          .querySelectorAll("[data-filter]")
          .forEach((x) => x.classList.toggle("active", x === b));
        scope.renderPorts();
      });
    scope.$("port-search").addEventListener("input", scope.renderPorts);
    scope
      .$("reset-view")
      .addEventListener("click", () => scope.setView("overview"));
    scope
      .$("retry")
      .addEventListener("click", () => scope.loadDevice(scope.device.id));
    scope.$("calibration-mode").addEventListener("change", () => {
      scope.$("review-banner").hidden = !scope.$("calibration-mode").checked;
      scope.pendingPoint = null;
      scope.renderReview();
    });
    scope.$("save-point").addEventListener("click", () => {
      if (!scope.selected || !scope.pendingPoint) return;
      scope.localMappings[scope.selected.id] = { ...scope.pendingPoint };
      scope.pendingPoint = null;
      scope.saveLocal();
      scope.renderPorts();
      scope.renderDetail();
      scope.updateSelection();
      scope.toast("บันทึกจุดร่างแล้ว ตรวจภาพและกดยืนยันตำแหน่งเมื่อพร้อม");
    });
    scope.$("approve").addEventListener("click", () => {
      const m = scope.selected && scope.getMapping(scope.selected.id);
      if (!m) return;
      scope.localMappings[scope.selected.id] = {
        ...m,
        status: "local_reviewed",
      };
      scope.saveLocal();
      scope.renderPorts();
      scope.renderDetail();
      scope.updateSelection();
      scope.toast("ยืนยันตำแหน่งในเบราว์เซอร์นี้แล้ว สามารถส่งออกผลตรวจได้");
    });
    scope.$("discard-local").addEventListener("click", () => {
      if (!scope.selected) return;
      delete scope.localMappings[scope.selected.id];
      scope.pendingPoint = null;
      scope.saveLocal();
      scope.renderPorts();
      scope.renderDetail();
      scope.updateSelection();
      scope.toast("คืนค่าตำแหน่งเดิมของพอร์ตนี้แล้ว");
    });
    scope.$("export").addEventListener("click", () => {
      const data = {
        schema_version: "1.0.0",
        coordinate_space: scope.baseline.coordinate_space,
        exported_at: new Date().toISOString(),
        mappings: scope.localMappings,
      };
      download("AV_Port_Lab_Calibration.json", JSON.stringify(data, null, 2));
      scope.toast("ส่งออกเฉพาะผลตรวจที่ปรับในเบราว์เซอร์นี้แล้ว");
    });
    scope.$("import").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        if (file.size > 2e6) throw new Error("ไฟล์ปรับเทียบมีขนาดใหญ่เกินไป");
        const accepted = scope.validateCalibration(
          JSON.parse(await file.text()),
          scope.catalog,
          scope.baseline,
        );
        scope.localMappings = { ...scope.localMappings, ...accepted };
        scope.saveLocal();
        scope.renderPorts();
        scope.renderDetail();
        scope.updateSelection();
        scope.toast(
          "นำเข้าผลตรวจ " + Object.keys(accepted).length + " รายการแล้ว",
        );
      } catch (error) {
        scope.toast(error.message);
      }
      e.target.value = "";
    });
  }

  function download(name, value) {
    const url = URL.createObjectURL(
      new Blob([value], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return { bind, download, switchTab, selectPort };
}
