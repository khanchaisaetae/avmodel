// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createExplorerCables(scope) {
  function clearLessonCable() {
    if (!scope.lessonWire) return;
    scope.scene.remove(scope.lessonWire);
    scope.lessonWire.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
    scope.lessonWire = null;
  }

  function drawLessonCable(connections) {
    clearLessonCable();
    if (
      !connections?.length ||
      !scope.wrapper ||
      !scope.root ||
      scope.$("loader").hidden === false
    )
      return;
    scope.lessonWire = new THREE.Group();
    for (const connection of connections) {
      for (const id of [connection.sourcePortId, connection.sinkPortId]) {
        if (!id.startsWith(scope.device.id + ":")) continue;
        const m = scope.getMapping(id);
        if (!m) continue;
        const point = scope.wrapper.localToWorld(
            new THREE.Vector3(...m.anchor),
          ),
          normal = new THREE.Vector3(...m.normal).transformDirection(
            scope.wrapper.matrixWorld,
          );
        const path = new THREE.CatmullRomCurve3([
          point,
          point.clone().addScaledVector(normal, 0.1),
          point
            .clone()
            .addScaledVector(normal, 0.26)
            .add(new THREE.Vector3(0, -0.15, 0)),
          point
            .clone()
            .addScaledVector(normal, 0.4)
            .add(new THREE.Vector3(0, -0.4, 0)),
        ]);
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(path, 24, 0.009, 8, false),
          new THREE.MeshStandardMaterial({
            color: connection.color,
            roughness: 0.8,
          }),
        );
        scope.lessonWire.add(tube);
        const plug = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.045, 12),
          new THREE.MeshStandardMaterial({ color: 0x334454, roughness: 0.8 }),
        );
        plug.position.copy(point).addScaledVector(normal, 0.022);
        plug.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        scope.lessonWire.add(plug);
      }
    }
    scope.scene.add(scope.lessonWire);
  }
  return { clearLessonCable, drawLessonCable };
}
