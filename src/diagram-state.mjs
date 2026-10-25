import {diagramCoordinate} from "./workspace-geometry.mjs?v=20261025-placement";
// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramState(scope) {
  function commit(next) {
    scope.history.push(scope.copy(scope.state));
    if (scope.history.length > 60) scope.history.shift();
    scope.future.length = 0;
    scope.state = next;
    scope.review = null;
    scope.save();
    scope.render();
  }

  function changeNode(id, patch) {
    commit({
      ...scope.state,
      nodes: scope.state.nodes.map((n) =>
        n.id === id ? { ...n, ...patch } : n,
      ),
    });
  }

  function selectedTask() {
    return scope.getDiagramTask(scope.state.taskId);
  }

  function addDevice(id) {
    if (scope.state.nodes.some((n) => n.id === id)) return;
    const positions = [
        [50, 50],
        [430, 50],
        [820, 70],
        [50, 430],
        [430, 430],
      ],
      point = positions[scope.state.nodes.length];
    scope.selection = { kind: "node", id };
    commit({
      ...scope.state,
      nodes: [
        ...scope.state.nodes,
        {
          id,
          x: point[0],
          y: point[1],
          power: false,
          enabled: false,
          input: "",
          source: "CAMERA",
        },
      ],
    });
  }

  function moveNode(id, dx, dy) {
    scope.workspace?.beginMove();
    const n = scope.state.nodes.find((n) => n.id === id);
    changeNode(id, {
      x: diagramCoordinate(n.x + dx),
      y: diagramCoordinate(n.y + dy),
    });
  }
  return { commit, changeNode, selectedTask, addDevice, moveNode };
}
