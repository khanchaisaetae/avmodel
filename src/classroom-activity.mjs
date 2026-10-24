import { initialClassroom, reviewClassroom, confirmClassroomStage, classroomReport } from './classroom-model.mjs';

export function createClassroomActivity() {
  let timeline, title, instruction, confirm, reason, storage, download, savedDownload;
  let savedReport = null;
  const reportKey = 'av-port-lab.classroom-report.v1';
  function report(scope) {
    return classroomReport(scope.task, scope.getState(), scope.catalog, scope.reasons.get(scope.stateKey()) || '');
  }
  function saveReport(scope) {
    const current = report(scope);
    const hasWork = current.links.some(l => l.sourcePortId || l.sinkPortId || l.cableId) ||
      Object.values(current.settings.power).some(Boolean) || !!current.reason.trim();
    savedDownload.hidden = hasWork || !savedReport;
    savedDownload.textContent = '↓ ดาวน์โหลดรายงานที่บันทึกล่าสุด (' + (savedReport?.taskId || '') + ')';
    if (!hasWork) {
      storage.textContent = savedReport ? 'รายงานจากครั้งก่อนยังอยู่ เริ่มฝึกเพื่อบันทึกรายงานใหม่' : 'รายงานจะบันทึกเมื่อเริ่มตั้งค่าหรือเชื่อมต่อ';
      return;
    }
    try {
      localStorage.setItem(reportKey, JSON.stringify(current));
      savedReport = current;
      storage.textContent = 'บันทึกรายงานล่าสุดในเบราว์เซอร์นี้แล้ว · ดาวน์โหลด JSON เพื่อเก็บหรือส่งต่อ';
    } catch {
      storage.textContent = 'เบราว์เซอร์บันทึกไม่ได้ · ดาวน์โหลด JSON เพื่อเก็บผลฝึก';
    }
  }
  return {
    initial: initialClassroom,
    review: reviewClassroom,
    mount(scope) {
      const { create, $ } = scope;
      try {
        const raw = localStorage.getItem(reportKey);
        if (raw && raw.length < 1000000) {
          const candidate = JSON.parse(raw);
          if (candidate?.schema === 'av-port-lab.classroom-report' && candidate.version === 1) savedReport = candidate;
        }
      } catch {}
      const panel = create('section', undefined, 'classroom-sequence');
      panel.setAttribute('aria-label', 'ลำดับการสอน');
      panel.append(create('span', 'ยูสเคส 4 · ฝึกสลับภาพระหว่างสอน', 'tiny-title'));
      title = create('h2'); title.id = 'classroom-step-title';
      timeline = create('ol'); timeline.id = 'classroom-sequence';
      instruction = create('p'); instruction.id = 'classroom-instruction';
      confirm = create('button', 'ยืนยันภาพช่วงนี้ →', 'primary full-width');
      confirm.id = 'classroom-confirm'; confirm.type = 'button';
      confirm.addEventListener('click', () => {
        const checked = confirmClassroomStage(scope.task, scope.getState(), scope.catalog);
        if (checked.accepted) { scope.closeContext(); scope.mutate(checked.state); }
      });
      panel.append(title, timeline, instruction, confirm);
      scope.pane.prepend(panel);
      const details = create('details', undefined, 'classroom-report');
      details.append(create('summary', 'เหตุผลและรายงานการฝึก'));
      const label = create('label', 'อธิบายวิธีสลับภาพและเหตุผล (ไม่บังคับ)');
      label.htmlFor = 'classroom-reason';
      reason = create('textarea'); reason.id = 'classroom-reason'; reason.rows = 3; reason.maxLength = 2000;
      reason.placeholder = 'ช่วงใดเปลี่ยน SOURCE ของ Vertex ช่วงใดเปลี่ยน Input ของจอ เพราะอะไร…';
      reason.addEventListener('input', () => { scope.reasons.set(scope.stateKey(), reason.value); saveReport(scope); });
      download = create('button', '↓ ดาวน์โหลดรายงาน JSON', 'quiet-button full-width');
      download.type = 'button'; download.id = 'classroom-download';
      function downloadReport(value) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
        const link = create('a'); link.href = url; link.download = 'AV-classroom-' + (scope.SCENARIOS.some(t => t.id === value.taskId) ? value.taskId : scope.task.id) + '.json';
        document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      download.addEventListener('click', () => downloadReport(report(scope)));
      savedDownload = create('button', '↓ ดาวน์โหลดรายงานที่บันทึกล่าสุด', 'quiet-button full-width');
      savedDownload.type = 'button'; savedDownload.id = 'classroom-saved-report'; savedDownload.hidden = true;
      savedDownload.addEventListener('click', () => { if (savedReport) downloadReport(savedReport); });
      storage = create('p', '', 'small'); storage.id = 'classroom-save-state'; storage.setAttribute('role', 'status');
      details.append(label, reason, download, savedDownload, storage,
        create('p', 'ประวัติเก็บรหัสโจทย์สำเร็จและรายงานล่าสุดในเครื่องนี้ สายและลำดับที่กำลังฝึกเริ่มใหม่เมื่อโหลดหน้า ไม่มีคะแนนหรือการส่งผลอัตโนมัติ', 'small'));
      scope.pane.append(details);
      $('task-title').textContent = 'เลือกห้องเรียนจำลอง';
      scope.picker.querySelector('.tiny-title').textContent = 'ยูสเคส 4 · ห้องเรียนหลายแหล่งภาพ';
      $('learning-mode').disabled = true;
      $('learning-mode').closest('.table-tools').querySelector('.mode-label').hidden = true;
      scope.pane.querySelector('.result-heading > p').textContent = 'ภาพจริงในระบบจำลองต้องตรงกับช่วงการสอน';
    },
    render(scope, live) {
      const s = scope.getState(), count = s.classroom.proofs.length, total = scope.task.sequence.length;
      const complete = count === total;
      title.textContent = complete ? '✓ ผ่านครบ 4 ช่วงการสอน' : 'ช่วง ' + (count + 1) + '/' + total + ' · ' + scope.task.sequence[count].title;
      timeline.replaceChildren();
      scope.task.sequence.forEach((step, i) => {
        const item = scope.create('li', (i < count ? '✓ ' : (i + 1) + '. ') + step.title);
        item.dataset.state = i < count ? 'done' : i === count ? 'current' : 'pending';
        if (i === count) item.setAttribute('aria-current', 'step');
        timeline.append(item);
      });
      instruction.textContent = complete
        ? 'สลับครบทั้ง 3 แหล่งและกลับสไลด์แล้ว โดยใช้สายชุดเดิม ดาวน์โหลดรายงานหรือเลือกโจทย์ถัดไปได้'
        : (s.classroom.resetByWiring ? 'เปลี่ยนสายแล้ว: เริ่มลำดับใหม่ · ' : '') + scope.task.sequence[count].detail + ' · ปรับปุ่มบนเครื่องจนภาพตรง แล้วกดยืนยัน';
      confirm.disabled = complete || live.status !== 'ready';
      confirm.textContent = complete ? '✓ ยืนยันครบแล้ว' : live.status === 'ready' ? 'ยืนยันภาพช่วงนี้ →' : 'รอภาพตรงตามช่วงการสอน';
      scope.$('mode-guidance').textContent = 'เตรียมสายครบ 3 เส้นก่อนเริ่ม · สลับภาพด้วย SOURCE และ Input บนอุปกรณ์ · เปลี่ยนสายหลังยืนยันจะเริ่มลำดับใหม่';
      scope.$('image-progress').textContent = count + '/' + total + ' ช่วง';
      scope.$('next-source').hidden = true;
      if (document.activeElement !== reason) reason.value = scope.reasons.get(scope.stateKey()) || '';
      saveReport(scope);
    },
  };
}
