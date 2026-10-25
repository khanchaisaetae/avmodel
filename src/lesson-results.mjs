// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createLessonResults(scope) {
  function render() {
    let s = scope.getState();
    let live = scope.evaluateScenario(scope.task, s, scope.catalog);
    const practice = scope.learningMode === "practice";
    if (practice) {
      const reviewed = scope.reviewLearning(
        scope.task,
        s,
        scope.catalog,
        scope.learningMode,
      );
      scope.put(reviewed.state);
      s = reviewed.state;
      live = scope.evaluateScenario(scope.task, s, scope.catalog);
      scope.lastResult =
        !scope.activity?.maskFeedback && (scope.lastResult?.status === "invalid" ||
        scope.lastResult?.code === "UNSIMULATED_CABLE")
          ? scope.lastResult
          : reviewed.result;
      if (reviewed.result?.complete) {
        scope.completed.add(scope.task.id);
        scope.persist();
      }
    }
    const feedback =
        practice || scope.assessmentReviewed ? scope.lastResult : null,
      issue = feedback
        ? scope.issueLocation(
            scope.task,
            s,
            feedback,
            feedback.segment ?? scope.activeSegment,
          )
        : null,
      n = s.links.filter((l) => l.connected).length;
    scope.$("learning-mode").value = scope.learningMode;
    scope.$("mode-guidance").textContent = practice
      ? "โหมดฝึก · รับคำแนะนำทันทีเมื่อปรับอุปกรณ์ ภาพตรงเป้าหมายจะบันทึกให้อัตโนมัติ"
      : "โหมดประเมิน · ต่อระบบและอธิบายเหตุผลด้วยตนเอง แล้วส่งคำตอบเพื่อดูผล";
    scope.$("wire-count").textContent =
      "ต่อสายแล้ว " + n + " / " + s.links.length + " เส้น";
    scope.$("wiring-progress").textContent = n + "/" + s.links.length + " เส้น";
    scope.$("power-progress").textContent =
      "เปิด " +
      scope.task.devices.filter((id) => s.power[id]).length +
      "/" +
      scope.task.devices.length +
      " เครื่อง";
    scope.$("image-progress").textContent =
      s.observedSources.length + "/" + scope.task.sources.length + " แหล่ง";
    scope.$("target-source").textContent =
      scope.SOURCE_NAMES[s.requestedSource] +
      " → " +
      scope.short(scope.task.displayId);
    scope.$("source-coverage").textContent = scope.task.sources
      .map(
        (id) =>
          (s.observedSources.includes(id) ? "✓ " : "○ ") + scope.short(id),
      )
      .join(" · ");
    const summary = scope.$("lesson-screen");
    summary.setAttribute("role", "status");
    summary.setAttribute("aria-live", "polite");
    summary.dataset.visible = String(live.imageVisible);
    summary.dataset.correct = String(!!feedback?.signalCorrect);
    summary.dataset.status = feedback?.status || "pending";
    scope.$("screen-status").textContent = feedback?.complete
      ? "✓ สำเร็จครบโจทย์"
      : feedback?.status === "ready"
        ? "✓ แหล่งภาพนี้สำเร็จ"
        : !practice && !scope.assessmentReviewed
          ? "รอส่งคำตอบ"
          : live.imageVisible
            ? "▶ มีสัญญาณภาพ"
            : "○ ยังไม่มีสัญญาณภาพ";
    scope.$("screen-detail").textContent = feedback
      ? feedback.complete
        ? "ภาพปัจจุบัน: " +
          scope.SOURCE_NAMES[live.actualSource] +
          " · ตรงตามเป้าหมาย"
        : feedback.message
      : "ภาพปัจจุบัน: " +
        (live.imageVisible
          ? scope.SOURCE_NAMES[live.actualSource]
          : "ไม่มีภาพ") +
        " · วิเคราะห์การเชื่อมต่อก่อนส่งคำตอบ";
    scope.$("assessment-controls").hidden = practice;
    scope.$("submit-assessment").textContent = scope.assessmentReviewed
      ? "ส่งคำตอบอีกครั้ง"
      : "ส่งคำตอบและดูผล";
    if (document.activeElement !== scope.$("connection-reason"))
      scope.$("connection-reason").value =
        scope.reasons.get(scope.stateKey()) || "";
    scope.$("go-issue").hidden = !issue;
    scope.$("why-feedback").hidden = !issue;
    scope.$("why-detail").textContent =
      feedback?.code === "UNSIMULATED_CABLE"
        ? "สายนี้ยังไม่จำลองครบ จึงไม่ตัดสินว่าผิด ต้องตรวจหน้าที่พอร์ต ทิศทาง และอุปกรณ์แปลงที่รองรับ"
        : feedback?.code === "WRONG_SOURCE"
          ? "ตรวจ Input ของจอและ SOURCE ของ Vertex ให้สัมพันธ์กับแหล่งภาพที่โจทย์ต้องการ"
          : "ตรวจทิศทาง OUT → IN ชนิดหัวต่อ สาย และการเปิดเครื่องหรือส่งภาพจากอุปกรณ์";
    const remaining = scope.task.sources.find(
      (id) => !s.observedSources.includes(id),
    );
    scope.$("next-source").hidden = !(
      feedback?.status === "ready" &&
      !feedback.complete &&
      remaining
    );
    scope.$("next-source").textContent = remaining
      ? "ต่อไป: ภาพจาก " + scope.short(remaining)
      : "";
    scope.$("next-scenario").hidden =
      !feedback?.complete || scope.task.id === scope.SCENARIOS.at(-1).id;
    scope.$("undo-lesson").disabled = !scope.histories.get(scope.stateKey())
      ?.length;
    scope.renderBoard(
      s,
      !practice && !scope.assessmentReviewed
        ? { ...live, signalCorrect: true }
        : live,
      issue,
    );
    scope.renderContext();
    scope.positionContext();
    scope.renderModel();
    scope.updateCable(
      scope.active
        ? s.links
            .filter((l) => l.connected)
            .map((l) => ({
              ...l,
              color:
                scope.WIRE_CHOICES.find((c) => c.id === l.cableId)?.color ||
                0x8b9fa8,
            }))
        : null,
    );
    scope.activity?.render(scope, live);
    scope.transferSender?.render();
    scope.workspace?.render();
  }
  return { render };
}
