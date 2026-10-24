// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createExplorerCalibration(scope) {
  function getMapping(id) {
    return scope.localMappings[id] || scope.baseline?.mappings[id];
  }

  function saveLocal() {
    try {
      localStorage.setItem(
        scope.storageKey,
        JSON.stringify({
          schema_version: "1.0.0",
          mappings: scope.localMappings,
        }),
      );
    } catch {
      scope.toast("เบราว์เซอร์ไม่อนุญาตให้บันทึก กรุณาส่งออกผลตรวจเป็นไฟล์");
    }
  }

  function renderReview() {
    const m = scope.selected ? getMapping(scope.selected.id) : null,
      c = scope.selected ? scope.$("review-current") : null;
    scope.$("review-current").replaceChildren();
    if (c) {
      c.append(
        scope.text("strong", scope.selected.label),
        scope.text("div", scope.positionLabel(m)),
      );
      if (m)
        c.append(
          scope.text(
            "small",
            "ชิ้นส่วน " +
              m.node_index +
              " · จุด " +
              m.anchor.map((n) => n.toFixed(3)).join(", "),
          ),
        );
      if (scope.pendingPoint)
        c.append(
          scope.text(
            "div",
            "มีจุดที่คลิกใหม่ กด “ใช้จุดที่คลิก” เพื่อบันทึกเป็นร่าง",
          ),
        );
    } else
      scope.$("review-current").textContent =
        "เลือกพอร์ตก่อน จากแท็บพอร์ตและหน้าที่";
    scope.$("approve").disabled = !m || !scope.root;
    scope.$("discard-local").disabled =
      !scope.selected || !scope.localMappings[scope.selected.id];
    scope.$("save-point").disabled = !scope.selected || !scope.pendingPoint;
    const counts = scope.mappingCounts(scope.device.ports, getMapping);
    scope.$("review-summary").textContent =
      `มีตำแหน่ง ${counts.located} / ${counts.total} รายการ · ตรวจแล้ว ${counts.reviewed} รายการ`;
  }

  function pickSurface(hit) {
    const ancestors = hit.object.userData.auditAncestors || [];
    if (scope.$("calibration-mode").checked) {
      if (!scope.selected) {
        scope.toast("เลือกชื่อพอร์ตจากรายการก่อน แล้วกลับมาคลิกช่องต่อ");
        return;
      }
      const existing = getMapping(scope.selected.id);
      let index = ancestors.includes(existing?.node_index)
        ? existing.node_index
        : ancestors.at(-1);
      if (!Number.isInteger(index)) {
        scope.toast("ไม่พบชิ้นส่วนสำหรับจุดที่เลือก");
        return;
      }
      const worldNormal = hit.face.normal
        .clone()
        .applyNormalMatrix(
          new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld),
        );
      const normal = worldNormal
        .transformDirection(scope.wrapper.matrixWorld.clone().invert())
        .normalize();
      const point = scope.wrapper.worldToLocal(hit.point.clone());
      scope.pendingPoint = {
        node_index: index,
        anchor: point.toArray(),
        normal: normal.toArray(),
        asset_sha256: scope.baseline.assets[scope.device.id].sha256,
        status: "local_draft",
        ...(existing?.node_index === index && existing.bounds_scene
          ? {
              bounds_scene: existing.bounds_scene,
              shared_node: existing.shared_node,
            }
          : {}),
      };
      scope.marker.position.copy(hit.point);
      scope.marker.visible = true;
      scope.$("selection-label").textContent =
        "จุดใหม่ของ " + scope.selected.label + " · กดใช้จุดที่คลิกเพื่อบันทึก";
      renderReview();
      scope.toast("เลือกจุดแล้ว กด “ใช้จุดที่คลิก” เพื่อเก็บเป็นร่าง");
      return;
    }
    const matches = scope.device.ports.filter((p) => {
      const m = getMapping(p.id);
      return m && ancestors.includes(m.node_index);
    });
    if (matches.length) {
      const localPoint = scope.wrapper.worldToLocal(hit.point.clone());
      matches.sort(
        (a, b) =>
          new THREE.Vector3(...getMapping(a.id).anchor).distanceToSquared(
            localPoint,
          ) -
          new THREE.Vector3(...getMapping(b.id).anchor).distanceToSquared(
            localPoint,
          ),
      );
      scope.selectPort(matches[0].id, { focus: false });
      return;
    }
    scope.toast(
      "ส่วนนี้ยังไม่ได้จับคู่ชื่อพอร์ต ใช้แท็บ “ตรวจตำแหน่ง” เพื่อระบุจุด",
    );
  }
  return { getMapping, saveLocal, renderReview, pickSurface };
}
