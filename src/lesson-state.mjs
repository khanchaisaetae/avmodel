// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createLessonState(scope) {
  function mutate(next) {
    const h = scope.histories.get(scope.stateKey()) || [];
    h.push({
      state: scope.clone(scope.getState()),
      activeSegment: scope.activeSegment,
    });
    if (h.length > 40) h.shift();
    scope.histories.set(scope.stateKey(), h);
    scope.put(next);
    scope.lastResult = null;
    scope.assessmentReviewed = false;
    scope.render();
  }

  function changeLink(index, patch) {
    const checked = scope.updateSegmentSelection(
      scope.task,
      scope.getState(),
      index,
      patch,
      scope.catalog,
    );
    mutate(checked.state);
    scope.lastResult = { ...checked.result, segment: index };
    scope.render();
  }

  function pickPort(deviceId, portId, side) {
    const plan = scope.task.segments[scope.activeSegment];
    if ((side === "out" ? plan.from : plan.to) !== deviceId) return;
    const key = side === "out" ? "sourcePortId" : "sinkPortId";
    if (scope.getState().links[scope.activeSegment][key] === portId) return;
    changeLink(scope.activeSegment, { [key]: portId });
  }
  return { mutate, changeLink, pickPort };
}
