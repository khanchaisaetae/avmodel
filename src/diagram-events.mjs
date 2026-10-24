// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function bindDiagramEvents(scope) {
  scope.$("diagram-task").addEventListener("change", () => {
    scope.state = scope.loadTask(scope.$("diagram-task").value);
    scope.selection = null;
    scope.pending = null;
    scope.review = null;
    scope.history.length = 0;
    scope.future.length = 0;
    scope.render();
    scope.$("save-state").textContent =
      "เปิดผังของโจทย์นี้แล้ว · บันทึกอัตโนมัติเมื่อแก้ไข";
  });
  scope.$("diagram-reason").addEventListener("input", () => {
    scope.state = { ...scope.state, reason: scope.$("diagram-reason").value };
    scope.review = null;
    scope.save();
    scope.renderReview();
  });
  scope
    .$("diagram-conclusion")
    .addEventListener("change", () =>
      scope.commit({
        ...scope.state,
        conclusion: scope.$("diagram-conclusion").value,
      }),
    );
  scope.$("diagram-review").addEventListener("click", () => {
    scope.review = scope.reviewDiagram(
      scope.state,
      scope.catalog,
      scope.$("preview-source").value,
    );
    scope.renderReview();
  });
  scope.$("preview-source").addEventListener("change", () => {
    scope.review = null;
    scope.renderReview();
  });
  scope.$("diagram-undo").addEventListener("click", () => {
    if (!scope.history.length) return;
    scope.future.push(scope.copy(scope.state));
    scope.state = scope.history.pop();
    scope.selection = null;
    scope.pending = null;
    scope.review = null;
    scope.save();
    scope.render();
  });
  scope.$("diagram-redo").addEventListener("click", () => {
    if (!scope.future.length) return;
    scope.history.push(scope.copy(scope.state));
    scope.state = scope.future.pop();
    scope.selection = null;
    scope.pending = null;
    scope.review = null;
    scope.save();
    scope.render();
  });
  scope.$("diagram-clear").addEventListener("click", () =>
    scope.ask(
      "ล้างผังของโจทย์นี้?",
      "ลบอุปกรณ์ สาย และเหตุผลเฉพาะโจทย์นี้ ย้อนกลับได้",
      () => {
        scope.pending = null;
        scope.selection = null;
        scope.commit(scope.emptyDiagram(scope.state.taskId));
      },
    ),
  );
  scope
    .$("confirm-cancel")
    .addEventListener("click", () => scope.$("confirm-action").close());
  scope.$("confirm-ok").addEventListener("click", () => {
    scope.$("confirm-action").close();
    scope.confirmation?.();
    scope.confirmation = null;
  });
  scope
    .$("picker-close")
    .addEventListener("click", () => scope.$("port-picker").close());
  scope
    .$("diagram-json")
    .addEventListener("click", () =>
      scope.download(
        "AV-diagram-" + scope.state.taskId + ".json",
        JSON.stringify(scope.state, null, 2),
        "application/json",
      ),
    );
  scope
    .$("diagram-svg")
    .addEventListener("click", () =>
      scope.download(
        "AV-diagram-" + scope.state.taskId + ".svg",
        scope.exportDiagramSvg(scope.state, scope.catalog),
        "image/svg+xml",
      ),
    );
  scope.$("diagram-print").addEventListener("click", () => {
    const output = scope.$("print-diagram");
    output.innerHTML = scope.exportDiagramSvg(scope.state, scope.catalog, {
      includeReason: false,
    });
    const explanation = scope.el("section", undefined, "print-explanation");
    explanation.append(
      scope.el("h2", "แนวคิดและเหตุผล · " + scope.selectedTask().title),
    );
    if (scope.state.taskId === "analysis-01")
      explanation.append(
        scope.el(
          "p",
          "ข้อสรุป: " +
            {
              possible: "ทำได้ตามเงื่อนไข",
              impossible: "ทำไม่ได้ตามเงื่อนไข",
              unsure: "ยังไม่สรุป",
            }[scope.state.conclusion],
        ),
      );
    explanation.append(scope.el("p", scope.state.reason || "ยังไม่ได้ระบุ"));
    output.append(explanation);
    window.print();
  });
  scope.$("diagram-import").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error("ไฟล์ใหญ่เกิน 1 MB");
      const imported = scope.parseDiagram(
        JSON.parse(await file.text()),
        scope.catalog,
      );
      scope.ask(
        "เปิดผังจากไฟล์?",
        "จะแทนที่ฉบับในโจทย์ " +
          imported.taskId +
          " ที่บันทึกในเบราว์เซอร์นี้ ควรดาวน์โหลดฉบับเดิมไว้ก่อน",
        () => {
          scope.state = scope.loadTask(imported.taskId);
          scope.history.length = 0;
          scope.future.length = 0;
          scope.selection = null;
          scope.pending = null;
          scope.commit(imported);
          scope.notice("เปิดผังจากไฟล์เรียบร้อยแล้ว");
        },
      );
    } catch (e) {
      scope.notice("เปิดไฟล์ไม่ได้: " + e.message);
    }
    event.target.value = "";
  });
  scope
    .$("model-close")
    .addEventListener("click", () => scope.$("model-preview").close());
  scope.$("model-preview").addEventListener("close", () => {
    scope.$("model-frame").src = "about:blank";
  });
  window.addEventListener("resize", () => {
    if (scope.state) scope.drawWires();
  });
  return {};
}
