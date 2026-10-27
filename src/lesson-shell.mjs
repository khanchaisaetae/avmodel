export function createLessonShell({ table, pane, create, SCENARIOS, $ }) {
  table.innerHTML = `<header class="table-toolbar"><div><span class="tiny-title">โต๊ะทดลอง · ควบคุมจากอุปกรณ์บนผัง</span><h2 id="scenario-title"></h2><p id="scenario-goal"></p></div><div class="table-tools"><label class="mode-label" for="learning-mode">รูปแบบกิจกรรม</label><select id="learning-mode"><option value="practice">ฝึก · มีคำแนะนำ</option><option value="assessment">ประเมิน · วิเคราะห์เอง</option></select><button id="open-tasks" type="button" class="quiet-button">เปลี่ยนโจทย์ ⌄</button><button id="undo-lesson" type="button" class="tool-button">↶ ย้อนกลับ</button><button id="reset-lesson" type="button" class="tool-button">เริ่มใหม่</button></div></header><div class="board-heading"><strong>กดปุ่มบนเครื่องเพื่อตั้งค่า · คลิกเส้นหรือหมายเลขสายเพื่อเชื่อมต่อ</strong><span id="wire-count"></span></div><p id="mode-guidance" class="mode-guidance"></p><p class="pan-hint">↔ เลื่อนผังซ้าย–ขวาเพื่อดูอุปกรณ์และปลายสายทั้งหมด</p><div class="board-scroll" tabindex="0" aria-label="ผังการเชื่อมต่อ เลื่อนแนวนอนเพื่อดูทุกอุปกรณ์"><div class="connection-board direct-board" id="connection-board"><svg id="system-wires" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"></svg><div id="board-nodes"></div><div id="wire-labels"></div></div></div><div class="board-legend"><span><i class="legend-wire live"></i> ▶ มีสัญญาณภาพ</span><span><i class="legend-wire connected"></i> ✓ ต่อสายแล้ว</span><span><i class="legend-wire pending"></i> ＋ ยังไม่ต่อ</span><span class="simulation-note">ภาพประกอบจำลอง · ดูพอร์ตจริงได้ในโมเดล 3 มิติ</span></div><ol class="table-checkpoints" aria-label="ความคืบหน้า"><li><b>① ต่อสาย</b><span id="wiring-progress"></span></li><li><b>② เตรียมเครื่อง</b><span id="power-progress"></span></li><li><b>③ ทดลองภาพ</b><span id="image-progress"></span></li></ol><button id="jump-results" type="button" class="quiet-button mobile-only">ดูเป้าหมาย / ทดลองภาพ ↓</button>`;
  pane.innerHTML = `<button id="back-to-system" type="button" class="context-text-button mobile-only">↑ กลับไปที่อุปกรณ์บนผัง</button><div class="result-heading"><span class="tiny-title">เป้าหมายการทดลอง</span><h2 id="target-source" tabindex="-1"></h2><p>ให้จอแสดงภาพจากแหล่งที่กำหนด</p><div id="source-coverage" aria-label="แหล่งภาพที่ตรวจสำเร็จ"></div></div><div id="lesson-screen" class="test-summary"><strong id="screen-status"></strong><p id="screen-detail"></p></div><div id="assessment-controls" hidden><label for="connection-reason">อธิบายเหตุผลการเลือกพอร์ต สาย และการตั้งค่า</label><textarea id="connection-reason" rows="3" placeholder="อธิบายทิศทาง OUT → IN และเหตุผลที่ระบบนี้ส่งภาพได้" minlength="10" maxlength="2000"></textarea><p id="reason-error" role="alert" hidden>โปรดอธิบายเหตุผลอย่างน้อย 10 ตัวอักษรก่อนส่งคำตอบ</p><button id="submit-assessment" type="button" class="primary">ส่งคำตอบและดูผล</button><small>ตรวจระบบเชื่อมต่ออัตโนมัติ · เก็บเหตุผลไว้ทบทวนในหน้านี้ ไม่ให้คะแนนข้อความ</small></div><button id="go-issue" type="button" class="quiet-button full-width" hidden>ไปตรวจจุดนี้ →</button><details id="why-feedback" class="feedback-why" hidden><summary>เพราะอะไร?</summary><p id="why-detail"></p></details><button id="next-source" type="button" class="primary" hidden></button><button id="next-scenario" type="button" class="quiet-button full-width" hidden>โจทย์ถัดไป →</button><div class="result-tip">ตั้งค่าจากปุ่มบนอุปกรณ์<br>เลือกพอร์ตได้ครบทุกช่อง<br>คลิกสายเพื่อเลือกชนิดสาย</div><details class="lesson-assumption"><summary>เงื่อนไขของโจทย์จำลอง</summary><p id="timing-assumption"></p><p>Vertex ใช้ CAMERA หรือ HDMI IN → HDMI OUT ไม่แปลง HDMI ↔ RGB/VGA ไม่มี Matrix และไม่แยกภาพไปสองจอพร้อมกัน</p><p>มีสายให้เลือกหลากหลาย แต่บางเส้นทางยังไม่จำลองหรือมีเงื่อนไขเฉพาะ จะแจ้งกำกับและไม่ใช้ตัดสินว่าผิดจากข้อมูลที่ไม่ครบ</p><p>ประวัติเก็บเฉพาะรหัสโจทย์สำเร็จในเบราว์เซอร์นี้ สถานะสายและเครื่องคงไว้เมื่อสลับโจทย์ในหน้าเดียวกัน รีโหลดแล้วเริ่มการต่อใหม่</p></details>`;
  const pop = create("aside", undefined, "context-popover");
  pop.id = "device-context";
  pop.hidden = true;
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-modal", "false");
  pop.setAttribute("aria-labelledby", "context-title");
  pop.innerHTML =
    '<header><div><span id="context-eyebrow" class="tiny-title"></span><h2 id="context-title"></h2></div><button id="close-context" type="button" class="context-close" aria-label="ปิดเมนู">×</button></header><div id="context-content"></div>';
  document.body.append(pop);
  const model = create("dialog", undefined, "model-dialog");
  model.id = "model-dialog";
  model.setAttribute("aria-labelledby", "model-dialog-title");
  model.innerHTML =
    '<header class="model-dialog-head"><div><span class="tiny-title">เลือกพอร์ตจากอุปกรณ์จริง</span><h2 id="model-dialog-title"></h2></div><button id="close-model" type="button" class="quiet-button" autofocus>กลับไปที่ผัง ×</button></header><div id="model-context" class="model-context"></div><div class="model-dialog-body"><div id="model-holder"></div><aside class="model-port-panel"><h3 id="model-ports-title"></h3><p>คลิกช่องในกลุ่มนี้บนโมเดล หรือเลือกชื่อพอร์ต</p><div id="model-port-list"></div><div id="model-selection" role="status" aria-live="polite"></div><button id="use-model-port" type="button" class="primary">กลับไปที่ผัง</button></aside></div>';
  document.body.append(model);
  const picker = create("dialog", undefined, "task-dialog");
  picker.id = "task-dialog";
  picker.setAttribute("aria-labelledby", "task-title");
  picker.innerHTML =
    '<header><div><span class="tiny-title">เลือกโจทย์กิจกรรม</span><h2 id="task-title">เลือกโจทย์ทดลอง</h2></div><button id="close-tasks" type="button" class="quiet-button" autofocus>ปิด ×</button></header><label for="scenario-select">โจทย์ที่ต้องการฝึก</label><select id="scenario-select" class="scenario-select"></select><p id="scenario-progress"></p><div id="task-preview"></div><button id="start-task" type="button" class="primary">เริ่มโจทย์นี้</button><details><summary>ประวัติโจทย์ที่สำเร็จ</summary><div id="completion-list"></div></details>';
  document.body.append(picker);
  for (const n of [2, 3, 4]) {
    const group = create("optgroup");
    group.label = n + " อุปกรณ์";
    for (const t of SCENARIOS.filter((t) => t.devices.length === n)) {
      const o = create("option", t.id + " · " + t.title);
      o.value = t.id;
      group.append(o);
    }
    $("scenario-select").append(group);
  }
  const reset = create("dialog", undefined, "reset-dialog");
  return { pop, model, picker, reset };
}
