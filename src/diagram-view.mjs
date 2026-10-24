// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramView(scope) {
  function render() {
    const task = scope.selectedTask();
    scope.$("diagram-task").value = scope.state.taskId;
    scope.$("diagram-title").textContent = task.id + " · " + task.title;
    scope.$("diagram-goal").textContent = task.goal;
    scope.$("diagram-reason").value = scope.state.reason;
    scope.$("diagram-conclusion").value = scope.state.conclusion;
    scope.$("analysis-conclusion").hidden = task.id !== "analysis-01";
    scope.$("drawing-instruction").textContent = scope.pending
      ? "เลือก" +
        (scope.pending.side === "out" ? "อินพุต" : "เอาท์พุต") +
        "พอร์ตของอีกอุปกรณ์ · ต้นที่เลือก: " +
        scope.ports.get(scope.pending.portId).label
      : "เพิ่มอุปกรณ์ เลือกพอร์ต แล้วเขียนเส้นทางสัญญาณด้วยตนเอง";
    if (scope.pending) {
      scope.$("drawing-instruction").append(
        scope.button("ยกเลิกการเลือกปลายสาย", () => {
          scope.pending = null;
          render();
        }),
      );
    }
    scope.$("diagram-undo").disabled = !scope.history.length;
    scope.$("diagram-redo").disabled = !scope.future.length;
    scope.$("diagram-clear").disabled =
      !scope.state.nodes.length && !scope.state.reason;
    scope.$("empty-canvas").hidden = scope.state.nodes.length > 0;
    for (const b of scope.$("diagram-devices").querySelectorAll("button"))
      b.disabled = scope.state.nodes.some((n) => n.id === b.dataset.device);
    scope
      .$("diagram-nodes")
      .replaceChildren(...scope.state.nodes.map(scope.renderNode));
    scope.renderProperties();
    const source = scope.$("preview-source"),
      selected = source.value;
    source.replaceChildren();
    const sources = task.sources.length
      ? task.sources
      : scope.state.nodes
          .filter((n) => ["dell", "bluray", "vertex"].includes(n.id))
          .map((n) => n.id);
    for (const id of sources) {
      const option = scope.el("option", scope.SOURCE_NAMES[id]);
      option.value = id;
      source.append(option);
    }
    if (sources.includes(selected)) source.value = selected;
    source.disabled = !task.sources.length;
    scope.drawWires();
    scope.renderReview();
    scope.activity?.render();
  }
  return { render };
}
