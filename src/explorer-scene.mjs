// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createExplorerScene(scope) {
  function setup3D() {
    const T = window.THREE;
    if (!T) throw new Error("โหลดเครื่องมือ 3 มิติไม่สำเร็จ");
    scope.scene = new T.Scene();
    scope.camera = new T.PerspectiveCamera(38, 1, 0.003, 100);
    try {
      scope.renderer = new T.WebGLRenderer({
        canvas: scope.$("scene"),
        antialias: true,
        alpha: true,
      });
    } catch {
      scope.renderer = new scope.SoftwareRenderer(scope.$("scene"));
      scope.$("viewport-hint").title =
        "โหมดแสดงผลสำรอง · ใช้การควบคุมเมาส์แบบเดียวกัน";
    }
    scope.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    scope.renderer.outputEncoding = T.sRGBEncoding;
    scope.renderer.setClearColor(0xf3f6f8, 0);
    scope.scene.add(new T.HemisphereLight(0xffffff, 0x70818c, 1.1));
    const a = new T.DirectionalLight(0xffffff, 1.1);
    a.position.set(4, 7, 5);
    scope.scene.add(a);
    const b = new T.DirectionalLight(0xe4f4ff, 0.65);
    b.position.set(-5, 3, -4);
    scope.scene.add(b);
    const grid = new T.GridHelper(12, 50, 0xc6d3dc, 0xe1e7ec);
    grid.position.y = -1.55;
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scope.scene.add(grid);
    scope.controls = new T.OrbitControls(scope.camera, scope.$("scene"));
    scope.controls.enableDamping = !scope.renderer.isSoftware;
    scope.controls.dampingFactor = 0.1;
    scope.controls.minDistance = 0.07;
    scope.controls.maxDistance = 18;
    scope.controls.maxPolarAngle = Math.PI * 0.96;
    scope.controls.screenSpacePanning = true;
    scope.marker = new T.Mesh(
      new T.SphereGeometry(0.016, 16, 12),
      new T.MeshBasicMaterial({
        color: 0x07968f,
        depthTest: false,
        transparent: true,
        opacity: 0.9,
      }),
    );
    scope.marker.renderOrder = 999;
    scope.marker.visible = false;
    scope.scene.add(scope.marker);
    new ResizeObserver(resize).observe(scope.$("viewport"));
    const ray = new T.Raycaster();
    scope
      .$("scene")
      .addEventListener(
        "pointerdown",
        (e) =>
          (scope.downPoint = e.button === 0 ? [e.clientX, e.clientY] : null),
      );
    scope.$("scene").addEventListener("pointerup", (e) => {
      if (
        e.button !== 0 ||
        !scope.root ||
        !scope.downPoint ||
        Math.hypot(
          e.clientX - scope.downPoint[0],
          e.clientY - scope.downPoint[1],
        ) > 5
      )
        return;
      const rect = scope.$("scene").getBoundingClientRect();
      ray.setFromCamera(
        new T.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        scope.camera,
      );
      const hit = ray.intersectObjects(scope.modelMeshes, false)[0];
      if (hit) scope.pickSurface(hit);
    });
    function animate() {
      requestAnimationFrame(animate);
      if (scope.$("viewport").offsetParent !== null) {
        scope.controls.update();
        scope.renderer.render(scope.scene, scope.camera);
      }
    }
    resize();
    animate();
  }

  function resize() {
    if (!scope.renderer) return;
    const rect = scope.$("viewport").getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    scope.renderer.setSize(rect.width, rect.height, false);
    scope.camera.aspect = rect.width / rect.height;
    scope.camera.updateProjectionMatrix();
  }

  function setView(view) {
    if (!scope.controls) return;
    const views = {
      overview: [4.4, 3.3, 5.1],
      front: [0, 1.2, 5.8],
      back: [0, 1.1, -5.8],
      left: [-5.8, 1.1, 0],
      right: [5.8, 1.1, 0],
    };
    scope.camera.position.set(...(views[view] || views.overview));
    scope.controls.target.set(0, 0, 0);
    scope.controls.update();
    document
      .querySelectorAll("[data-view]")
      .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  }

  function updateSelection() {
    if (scope.selectionBox) {
      scope.scene.remove(scope.selectionBox);
      scope.selectionBox.geometry.dispose();
      scope.selectionBox.material.dispose();
      scope.selectionBox = null;
    }
    scope.marker.visible = false;
    if (!scope.selected || !scope.root) return;
    const m = scope.getMapping(scope.selected.id);
    if (!m) return;
    const obj = scope.nodeObjects[m.node_index];
    if (!obj) return;
    if (m.bounds_scene) {
      const b = new THREE.Box3(
        new THREE.Vector3(...m.bounds_scene.min),
        new THREE.Vector3(...m.bounds_scene.max),
      ).applyMatrix4(scope.wrapper.matrixWorld);
      scope.selectionBox = new THREE.Box3Helper(
        b,
        m.status.includes("reviewed") ? 0x0e9690 : 0xc99d46,
      );
    } else
      scope.selectionBox = new THREE.BoxHelper(
        obj,
        m.status.includes("reviewed") ? 0x0e9690 : 0xc99d46,
      );
    scope.selectionBox.material.depthTest = false;
    scope.selectionBox.material.transparent = true;
    scope.selectionBox.material.opacity = 0.6;
    scope.selectionBox.renderOrder = 998;
    scope.scene.add(scope.selectionBox);
    const anchor = scope.wrapper.localToWorld(new THREE.Vector3(...m.anchor));
    scope.marker.position.copy(anchor);
    scope.marker.visible = true;
  }

  function focusPort(id, distance = 0.68) {
    const m = scope.getMapping(id);
    if (!m || !scope.wrapper) return;
    updateSelection();
    const point = scope.wrapper.localToWorld(new THREE.Vector3(...m.anchor)),
      normal = new THREE.Vector3(...m.normal).transformDirection(
        scope.wrapper.matrixWorld,
      );
    scope.controls.target.copy(point);
    scope.camera.position
      .copy(point)
      .addScaledVector(normal, distance)
      .add(new THREE.Vector3(0, 0.16, 0));
    scope.controls.update();
    document
      .querySelectorAll("[data-view]")
      .forEach((b) => b.classList.remove("active"));
  }
  return { setup3D, resize, setView, updateSelection, focusPort };
}
