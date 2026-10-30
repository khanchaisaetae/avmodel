// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramResults(scope) {
  function renderReview() {
    const box = scope.$("diagram-result");
    box.replaceChildren();
    if (!scope.review) {
      box.append(
        scope.el("p", "ผังฉบับแก้ไข · กดตรวจผังเมื่อพร้อม ไม่มีคะแนน"),
      );
      scope.activity?.renderReview();
      scope.workspace?.render();
      return;
    }
    box.append(
      scope.el(
        "p",
        scope.review.message,
        "result-item" +
          (scope.review.structureReady && scope.review.live?.status === "ready"
            ? " ready"
            : ""),
      ),
    );
    if (scope.review.live?.imageVisible)
      box.append(
        scope.el(
          "p",
          "ภาพปัจจุบัน: " + scope.SOURCE_NAMES[scope.review.live.actualSource],
        ),
      );
    for (const r of scope.review.displayResults || []) {
      const title = r.displayId === "tv" ? "Sony TV" : "Epson Projector";
      const status = r.status === "ready" ? "ภาพถึงจอ" : r.status === "indeterminate" ? "ยังตรวจยืนยันไม่ได้" : r.imageVisible ? "มีภาพจากแหล่งอื่น" : "ยังไม่มีภาพ";
      const item = scope.el("div", `${title} · ${status}: ${r.message}`, "result-item " + r.status);
      if (r.path.length) item.append(scope.el("p", "เส้นทางที่ตรวจ: " + r.path.join(" → ")));
      box.append(item);
    }
    const goodLinks = (scope.review.linkResults || []).filter(r => r.status === "compatible");
    if (goodLinks.length) {
      const details = scope.el("details");
      details.append(scope.el("summary", `ช่วงสายที่ต่อได้ ${goodLinks.length} ช่วง · ดูเงื่อนไข`));
      for (const r of goodLinks) details.append(scope.el("p", r.message));
      box.append(details);
    }
    for (const issue of scope.review.issues) {
      const item = scope.el("div", issue.message, "result-item " + issue.kind);
      if (issue.linkId)
        item.append(
          scope.button("ไปที่สายนี้", () => {
            scope.selection = { kind: "wire", id: issue.linkId };
            scope.renderProperties();
            scope.drawWires();
            const i = scope.state.links.findIndex((l) => l.id === issue.linkId);
            scope
              .$("design-wire-" + i)
              ?.scrollIntoView({ block: "center", inline: "center" });
          }),
        );
      box.append(item);
    }
    if (!scope.state.reason.trim())
      box.append(
        scope.el("p", "เพิ่มเหตุผลประกอบเพื่อให้ผู้อื่นเข้าใจผังของคุณ"),
      );
    scope.activity?.renderReview();
      scope.workspace?.render();
  }
  return { renderReview };
}
