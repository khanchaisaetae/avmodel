// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createLessonTasks(scope) {
  function build() {
    if (!scope.states.has(scope.stateKey()))
      scope.put(scope.initialScenario(scope.task));
    scope.$("scenario-title").textContent =
      scope.task.id + " · " + scope.task.title;
    scope.$("scenario-goal").textContent = scope.task.goal;
    scope.$("timing-assumption").textContent =
      "กำหนดภาพ " +
      (scope.task.mode === "1280x800@60" ? "1280 × 800" : "1920 × 1080") +
      " ที่ 60 Hz ให้แหล่งภาพ Vertex และสาย HDMI ในชุดฝึกรองรับ เป็นเงื่อนไขบทเรียน ไม่เพิ่มเป็นสเปกเครื่องจริง";
    scope.buildBoard();
    scope.render();
  }

  function chooseTask(id) {
    scope.$("reason-error").hidden = true;
    scope.closeContext();
    scope.closeModel();
    scope.task = scope.SCENARIOS.find((t) => t.id === id) || scope.SCENARIOS[0];
    if(scope.learningMode==='assessment'){
      scope.states.delete(scope.stateKey());scope.histories.delete(scope.stateKey());scope.reasons.delete(scope.stateKey());
    }
    scope.activeSegment = 0;
    scope.lastResult = null;
    scope.assessmentReviewed = false;
    build();
    scope.onScenarioChange?.();
  }

  function renderTaskPicker() {
    const pending =
      scope.SCENARIOS.find((t) => t.id === scope.$("scenario-select").value) ||
      scope.task;
    scope
      .$("task-preview")
      .replaceChildren(
        scope.create("h3", pending.title),
        scope.create("p", pending.goal),
      );
    scope.$("scenario-progress").textContent =
      "สำเร็จแล้ว " +
      scope.completed.size +
      " / " +
      scope.SCENARIOS.length +
      " โจทย์";
    scope.$("completion-list").replaceChildren();
    for (const t of scope.SCENARIOS)
      scope
        .$("completion-list")
        .append(
          scope.create(
            "p",
            (scope.completed.has(t.id) ? "✓ " : "○ ") + t.id + " · " + t.title,
          ),
        );
  }
  return { build, chooseTask, renderTaskPicker };
}
