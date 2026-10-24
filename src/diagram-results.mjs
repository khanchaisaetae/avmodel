// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramResults(scope) {
  function renderReview() {
    const box = scope.$("diagram-result");
    box.replaceChildren();
    if (!scope.review) {
      box.append(
        scope.el("p", "ผังฉบับแก้ไข · กดตรวจผังเมื่อพร้อม ไม่มีคะแนน"),
      );
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
  }
  return { renderReview };
}
