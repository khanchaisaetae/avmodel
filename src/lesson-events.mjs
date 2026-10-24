// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function bindLessonEvents(scope) {
  scope.$("learning-mode").addEventListener("change", () => {
    scope.closeContext();
    scope.closeModel();
    scope.learningMode = scope.$("learning-mode").value;
    scope.activeSegment = 0;
    scope.lastResult = null;
    scope.assessmentReviewed = false;
    scope.$("reason-error").hidden = true;
    scope.build();
  });
  scope.$("connection-reason").addEventListener("input", () => {
    scope.reasons.set(scope.stateKey(), scope.$("connection-reason").value);
    scope.$("reason-error").hidden = true;
    scope.assessmentReviewed = false;
    scope.lastResult = null;
    scope.render();
  });
  scope.$("submit-assessment").addEventListener("click", () => {
    scope.closeContext();
    const checked = scope.reviewLearning(
      scope.task,
      scope.getState(),
      scope.catalog,
      scope.learningMode,
      { submitted: true, reason: scope.$("connection-reason").value },
    );
    scope.$("reason-error").hidden = !checked.needsReason;
    if (checked.needsReason) {
      scope.$("connection-reason").focus();
      return;
    }
    scope.put(checked.state);
    scope.lastResult = checked.result;
    scope.assessmentReviewed = true;
    scope.render();
  });
  scope.$("jump-results").addEventListener("click", () => {
    scope.pane.scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    scope.$("target-source").focus({ preventScroll: true });
  });
  scope
    .$("back-to-system")
    .addEventListener("click", () =>
      scope
        .$("connection-board")
        .scrollIntoView({
          block: "center",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        }),
    );
  scope.$("next-source").addEventListener("click", () => {
    scope.mutate(scope.nextSource(scope.task, scope.getState()));
    scope.openSetting(scope.task.displayId, "input", scope.$("choose-input"));
  });
  scope.$("go-issue").addEventListener("click", () => {
    const issue = scope.issueLocation(
      scope.task,
      scope.getState(),
      scope.lastResult,
      scope.lastResult?.segment ?? scope.activeSegment,
    );
    if (!issue) return;
    if (issue.step === 0) {
      const i = issue.segment >= 0 ? issue.segment : scope.activeSegment;
      scope.$("wire-label-" + i).scrollIntoView({ block: "center" });
      const plan = scope.task.segments[i],
        link = scope.getState().links[i],
        source = scope.ports.get(link.sourcePortId),
        sink = scope.ports.get(link.sinkPortId);
      scope.activeSegment = i;
      if (!source || source.video_capable === false)
        scope.openPorts(plan.from, "out", scope.$("ports-out-" + plan.from));
      else if (!sink || sink.video_capable === false)
        scope.openPorts(plan.to, "in", scope.$("ports-in-" + plan.to));
      else scope.openWire(i, scope.$("wire-label-" + i));
      return;
    }
    const id = issue.device || scope.task.displayId;
    scope.$("node-" + id).scrollIntoView({ block: "center" });
    if (
      scope.lastResult?.code === "DISPLAY_OFF" ||
      scope.lastResult?.code === "POWER_OFF"
    )
      scope.$("power-" + id).focus({ preventScroll: true });
    else if (scope.lastResult?.code === "SOURCE_DISABLED")
      scope.$("enable-" + id)?.focus({ preventScroll: true });
    else if (id === "vertex")
      scope.openSetting(id, "source", scope.$("choose-source"));
    else
      scope.openSetting(scope.task.displayId, "input", scope.$("choose-input"));
  });
  scope
    .$("next-scenario")
    .addEventListener("click", () =>
      scope.chooseTask(
        scope.SCENARIOS[
          scope.SCENARIOS.findIndex((t) => t.id === scope.task.id) + 1
        ].id,
      ),
    );
  scope.$("undo-lesson").addEventListener("click", () => {
    scope.closeContext();
    const entry = scope.histories.get(scope.stateKey())?.pop();
    if (!entry) return;
    scope.put(entry.state);
    scope.activeSegment = entry.activeSegment;
    scope.lastResult = null;
    scope.assessmentReviewed = false;
    scope.render();
  });
  scope.$("reset-lesson").addEventListener("click", () => {
    scope.closeContext();
    scope.reset.showModal();
  });
  scope.$("cancel-reset").addEventListener("click", () => scope.reset.close());
  scope.$("confirm-reset").addEventListener("click", () => {
    scope.put(scope.initialScenario(scope.task));
    scope.histories.set(scope.stateKey(), []);
    if (scope.learningMode === "practice") {
      scope.completed.delete(scope.task.id);
      scope.persist();
    }
    scope.activeSegment = 0;
    scope.lastResult = null;
    scope.assessmentReviewed = false;
    scope.reasons.delete(scope.stateKey());
    scope.$("reason-error").hidden = true;
    scope.reset.close();
    scope.render();
  });
  scope.$("close-context").addEventListener("click", () => {
    scope.closeContext(true);
    scope.render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !scope.pop.hidden) {
      e.preventDefault();
      scope.closeContext(true);
      scope.render();
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (
      !scope.pop.hidden &&
      !scope.pop.contains(e.target) &&
      !e.target.closest("[data-menu-anchor]")
    ) {
      scope.closeContext();
    }
  });
  window.addEventListener("resize", () => {
    scope.positionContext();
    if (scope.active) scope.render();
  });
  window.addEventListener("scroll", scope.positionContext, true);
  for (const id of ["close-model", "use-model-port"])
    scope.$(id).addEventListener("click", scope.closeModel);
  scope.model.addEventListener("close", () => {
    if (scope.stage.parentElement === scope.$("model-holder"))
      scope.home.after(scope.stage);
    if (scope.active)
      scope
        .$("ports-" + scope.modelPortSide + "-" + scope.modelDevice)
        ?.focus({ preventScroll: true });
  });
  scope.$("open-tasks").addEventListener("click", () => {
    scope.closeContext();
    scope.$("scenario-select").value = scope.task.id;
    scope.renderTaskPicker();
    scope.picker.showModal();
  });
  scope.$("scenario-select").addEventListener("change", scope.renderTaskPicker);
  scope.$("close-tasks").addEventListener("click", () => scope.picker.close());
  scope.$("start-task").addEventListener("click", () => {
    const id = scope.$("scenario-select").value;
    scope.picker.close();
    scope.chooseTask(id);
  });
  return {};
}
