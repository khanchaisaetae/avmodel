// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createExplorerModel(scope) {
  function disposeModel() {
    scope.clearLessonCable();
    if (scope.selectionBox) {
      scope.scene.remove(scope.selectionBox);
      scope.selectionBox.geometry.dispose();
      scope.selectionBox.material.dispose();
      scope.selectionBox = null;
    }
    if (scope.wrapper) {
      scope.scene.remove(scope.wrapper);
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set();
      scope.wrapper.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          if (m) {
            materials.add(m);
            for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
          }
      });
      geometries.forEach((x) => x.dispose());
      materials.forEach((x) => x.dispose());
      textures.forEach((x) => x.dispose());
    }
    scope.root = null;
    scope.wrapper = null;
    scope.modelMeshes = [];
    scope.nodeObjects = [];
    scope.marker.visible = false;
  }

  async function loadDevice(id) {
    const serial = ++scope.loadSerial;
    scope.device = scope.catalog.devices.find((d) => d.id === id);
    scope.$("viewport").dataset.device = id;
    scope.selected = null;
    scope.pendingPoint = null;
    scope.$("port-search").value = "";
    scope.filter = "all";
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) => b.classList.toggle("active", b.dataset.filter === "all"));
    scope.renderDevices();
    scope.renderPorts();
    scope.renderDetail();
    scope.$("device-title").textContent = scope.META[id].title;
    scope.$("device-category").textContent = scope.META[id].category;
    scope.$("stage-meta").textContent =
      scope.device.ports.length + " รายการช่องต่อ · หมุนสำรวจได้รอบเครื่อง";
    scope.$("selection-label").textContent =
      "เลือกพอร์ตจากรายการ หรือคลิกบนตัวเครื่อง";
    scope.$("loader").hidden = false;
    scope.$("retry").hidden = true;
    scope.$("load-message").textContent = "กำลังโหลด " + scope.META[id].title;
    disposeModel();
    try {
      const response = await fetch(scope.device.asset_path);
      if (!response.ok) throw new Error("ดาวน์โหลดโมเดลไม่สำเร็จ");
      const raw = await response.arrayBuffer();
      if (serial !== scope.loadSerial) return;
      const hash = await scope.assetHash(raw);
      if (hash !== scope.baseline.assets[id].sha256)
        throw new Error("ไฟล์โมเดลเปลี่ยน ต้องปรับเทียบตำแหน่งใหม่");
      const gltf = await new Promise((resolve, reject) =>
        new THREE.GLTFLoader().parse(
          new TextDecoder().decode(raw),
          "./",
          resolve,
          reject,
        ),
      );
      if (serial !== scope.loadSerial) {
        gltf.scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
        });
        return;
      }
      const loadedRoot = gltf.scene;
      loadedRoot.updateMatrixWorld(true);
      const loadedNodes = await Promise.all(
        Array.from({ length: gltf.parser.json.nodes.length }, (_, i) =>
          gltf.parser.getDependency("node", i),
        ),
      );
      if (serial !== scope.loadSerial) {
        loadedRoot.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
        });
        return;
      }
      scope.root = loadedRoot;
      scope.nodeObjects = loadedNodes;
      scope.nodeObjects.forEach((o, i) => {
        o.traverse((c) => {
          c.userData.auditAncestors ??= [];
          c.userData.auditAncestors.push(i);
        });
      });
      scope.root.traverse((o) => {
        if (o.isMesh) {
          o.material = Array.isArray(o.material)
            ? o.material.map((m) => m.clone())
            : o.material.clone();
          scope.modelMeshes.push(o);
        }
      });
      const bounds = new THREE.Box3().setFromObject(scope.root),
        center = bounds.getCenter(new THREE.Vector3()),
        size = bounds.getSize(new THREE.Vector3()),
        scale = 3.5 / Math.max(size.x, size.y, size.z);
      scope.wrapper = new THREE.Group();
      scope.wrapper.add(scope.root);
      scope.wrapper.scale.setScalar(scale);
      scope.wrapper.position.copy(center).multiplyScalar(-scale);
      scope.scene.add(scope.wrapper);
      scope.wrapper.updateMatrixWorld(true);
      scope.setView("overview");
      scope.$("loader").hidden = true;
      if (scope.selected) scope.focusPort(scope.selected.id);
      scope.renderReview();
      scope.lesson?.onDeviceChanged(id);
    } catch (error) {
      if (serial !== scope.loadSerial) return;
      scope.$("load-message").textContent = error.message;
      scope.$("retry").hidden = false;
      console.error(error);
    }
  }
  return { disposeModel, loadDevice };
}
