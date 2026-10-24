// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramStorage(scope) {
  function save() {
    try {
      localStorage.setItem(
        scope.storagePrefix + scope.state.taskId,
        JSON.stringify(scope.state),
      );
      scope.$("save-state").textContent =
        "✓ บันทึกอัตโนมัติในเบราว์เซอร์นี้แล้ว";
    } catch {
      scope.$("save-state").textContent =
        "บันทึกในเบราว์เซอร์ไม่ได้ กรุณาดาวน์โหลด JSON เพื่อเก็บงาน";
    }
  }

  function loadTask(id) {
    try {
      const saved = localStorage.getItem(scope.storagePrefix + id);
      return saved
        ? scope.parseDiagram(JSON.parse(saved), scope.catalog)
        : scope.emptyDiagram(id);
    } catch {
      scope.notice(
        "เปิดฉบับเก่าไม่ได้ เริ่มผังว่างโดยไม่เขียนทับจนกว่าจะแก้ไข",
      );
      return scope.emptyDiagram(id);
    }
  }
  return { save, loadTask };
}
