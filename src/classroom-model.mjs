import { initialScenario, evaluateScenario } from './scenario-engine.mjs';

export function wiringSignature(state) {
  return JSON.stringify(state.links.map(l => [l.sourcePortId, l.sinkPortId, l.cableId, l.connected]));
}
export function initialClassroom(task) {
  return { ...initialScenario(task), requestedSource: task.sequence[0].source,
    classroom: { proofs: [], wiring: null } };
}
export function prepareClassroom(task, state) {
  const before = state.classroom || { proofs: [], wiring: null };
  const changed = !!before.wiring && before.wiring !== wiringSignature(state);
  const classroom = changed ? { proofs: [], wiring: null, resetByWiring: true } : before;
  return { ...state, classroom,
    requestedSource: task.sequence[Math.min(classroom.proofs.length, task.sequence.length - 1)].source,
    observedSources: [...new Set(classroom.proofs.map(p => p.source))] };
}
export function reviewClassroom(task, state, catalog) {
  const next = prepareClassroom(task, state);
  const live = evaluateScenario(task, next, catalog);
  return { state: next, result: { ...live,
    complete: live.status === 'ready' && next.classroom.proofs.length === task.sequence.length } };
}
export function confirmClassroomStage(task, state, catalog, timestamp = new Date().toISOString()) {
  const checked = reviewClassroom(task, state, catalog), s = checked.state;
  if (checked.result.status !== 'ready' || s.classroom.proofs.length >= task.sequence.length)
    return { ...checked, accepted: false };
  const stage = s.classroom.proofs.length;
  const proof = { stage: stage + 1, title: task.sequence[stage].title,
    source: checked.result.actualSource, displayInput: s.displayInput,
    vertexSource: s.vertexSource, timestamp };
  const next = { ...s, classroom: { wiring: wiringSignature(s), proofs: [...s.classroom.proofs, proof] } };
  return { ...reviewClassroom(task, next, catalog), accepted: true };
}
export function classroomReport(task, state, catalog, reason = '') {
  const checked = reviewClassroom(task, state, catalog);
  return { schema: 'av-port-lab.classroom-report', version: 1, taskId: task.id,
    title: task.title, displayId: task.displayId,
    complete: checked.result.complete, completedStages: checked.state.classroom.proofs.length,
    totalStages: task.sequence.length, proofs: checked.state.classroom.proofs,
    links: checked.state.links.map(l => ({ ...l })),
    settings: { power: { ...state.power }, sourceEnabled: { ...state.sourceEnabled },
      displayInput: state.displayInput, vertexSource: state.vertexSource },
    reason: reason.slice(0, 2000), currentResult: checked.result,
    note: 'ผลจำลองเพื่อฝึกสลับแหล่งภาพ ไม่มีคะแนน ไม่ใช่ผลทดสอบสัญญาณของเครื่องจริง' };
}
