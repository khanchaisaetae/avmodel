/** Phase 1: native, direct, single-link VIDEO validation.
 * Does not simulate adapters, switches, splitters, USB video, EDID or HDCP.
 * Unknown facts return indeterminate; never award/deduct points for guesses.
 */
const result = (status, code, message) => ({status, code, message,
  gradable: status !== 'indeterminate', imageVisible: status === 'ready'});
const unknown = (code, message) => result('indeterminate', code, message);
const bad = (code, message) => result('invalid', code, message);
const noImage = (code, message) => result('no_image', code, message);
export function validateDirectVideoLink({source, sink, cable, state = {}, scope = 'display'} = {}) {
  if (!['topology','display'].includes(scope)) return unknown('SCOPE_UNKNOWN','ต้องระบุขอบเขตการตรวจเป็น topology หรือ display');
  if (!source || !sink || !cable) return unknown('MISSING_DATA','ข้อมูลการเชื่อมต่อไม่ครบ');
  for (const p of [source,sink]) {
    if (p.connection_kind && p.connection_kind !== 'native_video')
      return unknown('SPECIAL_ROUTE_REQUIRED','พอร์ตนี้ต้องใช้กฎเส้นทางเฉพาะตามคู่มือ เช่น การเลือกโหมดหรือซอฟต์แวร์ USB');
    if (p.capability_status !== 'verified_reference' || p.assessment_enabled !== true)
      return unknown('UNVERIFIED_PORT','ยังไม่มีหลักฐานยืนยันหน้าที่พอร์ต จึงยังไม่ตัดสินคะแนน');
    if (!['out','in'].includes(p.direction) || typeof p.video_capable !== 'boolean' || !p.connector)
      return unknown('INCOMPLETE_PORT','ข้อมูลพอร์ตที่ยืนยันแล้วยังไม่ครบ');
  }
  if (source.direction !== 'out' || sink.direction !== 'in')
    return bad('DIRECTION','ต้องต่อจากพอร์ตส่งภาพ OUT ไปยังพอร์ตรับภาพ IN');
  if (!source.video_capable || !sink.video_capable)
    return bad('NO_VIDEO','พอร์ตอย่างน้อยหนึ่งจุดไม่รองรับภาพ เช่น HDMI ที่ส่งเฉพาะเสียง');
  if (cable.verification_status !== 'verified') return unknown('UNVERIFIED_CABLE','ต้องยืนยันชนิดและความสามารถของสาย');
  if (cable.kind !== 'direct') return unknown('CONVERTER_ROUTE_REQUIRED','เส้นทางผ่านตัวแปลงหรืออุปกรณ์กลางต้องใช้กฎเฉพาะ');
  if (source.connector !== sink.connector) return bad('CONVERSION_REQUIRED','การเชื่อมต่อนี้ต้องแปลงชนิดสัญญาณหรือหัวต่อ ไม่ใช่สายตรง');
  if (!Array.isArray(cable.connectors) || cable.connectors.length !== 2) return unknown('INCOMPLETE_CABLE','ข้อมูลหัวต่อสายไม่ครบ');
  if (!cable.connectors.every(c => c === source.connector)) return bad('CABLE_CONNECTOR','หัวต่อสายไม่ตรงกับพอร์ต');
  if (!source.signal || !sink.signal || !Array.isArray(cable.signals)) return unknown('SIGNAL_UNKNOWN','ยังไม่ยืนยันชนิดสัญญาณ');
  if (source.signal !== sink.signal || !cable.signals.includes(source.signal)) return bad('SIGNAL_MISMATCH','ชนิดสัญญาณของพอร์ตและสายไม่เข้ากัน');
  if (!source.id || !sink.id || !Array.isArray(state.occupiedPortIds)) return unknown('TOPOLOGY_UNKNOWN','ต้องตรวจรายการพอร์ตที่ถูกใช้งานก่อน');
  if (source.id === sink.id) return bad('SELF_LINK','ไม่สามารถต่อพอร์ตเดียวกันเข้าหาตัวเอง');
  if ([source.id,sink.id].some(id=>state.occupiedPortIds.includes(id))) return bad('PORT_OCCUPIED','พอร์ตนี้มีสายเชื่อมต่ออยู่แล้ว ต้องใช้อุปกรณ์กลางที่เหมาะสม');
  if (scope === 'topology') return result('compatible','NATIVE_TOPOLOGY_COMPATIBLE','พอร์ตและชนิดสัญญาณต่อกันได้ตามข้อมูลอ้างอิง ยังไม่ยืนยันว่าภาพจะแสดง');
  if (typeof state.sourcePowered !== 'boolean' || typeof state.sinkPowered !== 'boolean') return unknown('POWER_UNKNOWN','ยังไม่มีข้อมูลสถานะเปิดเครื่อง');
  if (!state.sourcePowered || !state.sinkPowered) return noImage('POWER_OFF','ตรวจการเปิดเครื่องต้นทางและปลายทาง');
  if (typeof state.sourceVideoEnabled !== 'boolean') return unknown('OUTPUT_UNKNOWN','ยังไม่มีข้อมูลการเปิดส่งภาพ');
  if (!state.sourceVideoEnabled) return noImage('OUTPUT_DISABLED','ต้นทางยังไม่ได้เปิดส่งภาพ');
  if (typeof state.selectedInputPortId !== 'string') return unknown('INPUT_UNKNOWN','ยังไม่มีข้อมูลแหล่งสัญญาณที่เลือก');
  if (state.selectedInputPortId !== sink.id) return noImage('WRONG_INPUT','เลือก Input ของจอไม่ตรงกับพอร์ตที่ต่อ');
  if (!state.mode || ![source.supported_modes,sink.supported_modes,cable.supported_modes].every(Array.isArray)) return unknown('MODE_UNKNOWN','ยังไม่ยืนยันรูปแบบภาพที่ต้นทาง ปลายทาง และสายรองรับ');
  for (const endpoint of [source,sink,cable]) {
    if (!endpoint.supported_modes.includes(state.mode)) {
      if (endpoint.supported_modes_complete !== true) return unknown('MODE_NOT_DOCUMENTED','ไม่พบรูปแบบภาพนี้ในรายการบางส่วนที่บันทึกไว้ จึงยังไม่ตัดสินว่าไม่รองรับ');
      return noImage('MODE_UNSUPPORTED','รูปแบบภาพที่เลือกไม่อยู่ในรายการครบถ้วนที่ยืนยันแล้ว');
    }
  }
  if (typeof state.linkHealthy !== 'boolean') return unknown('LINK_UNKNOWN','ยังไม่มีผลตรวจสภาพสายและการเสียบต่อ');
  if (!state.linkHealthy) return noImage('LINK_FAULT','ตรวจสภาพสายและความแน่นของการเชื่อมต่อ');
  return result('ready','DIRECT_VIDEO_READY','การเชื่อมต่อตรงพร้อมแสดงภาพตามเงื่อนไขจำลองที่ตรวจแล้ว');
}
