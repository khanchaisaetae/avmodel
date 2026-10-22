# ผลตรวจยืนยันพอร์ตใหม่จาก ref เท่านั้น

วันที่ตรวจ: 23 ตุลาคม 2026 (Asia/Bangkok)

## สถานะข้อมูล

**ยกเลิกผลยืนยันพอร์ตชุดเดิมทั้งหมดแล้ว** ฐานข้อมูล schema 1.0.0 และข้อสรุปจากชื่อ node, สีขั้วต่อ, hotspot เดิม หรือคู่มือที่ค้นจากเว็บ ไม่ใช่ฐานยืนยันพอร์ตของงานนี้อีกต่อไป รายงานนี้และ data/port-catalog.json schema 2.0.0 ใช้แทนชุดเดิม โดยอ้างอิงเฉพาะไฟล์ที่ผู้ใช้จัดไว้ใน ref

การยืนยันครั้งนี้หมายถึงยืนยันสิ่งที่เอกสารหรือภาพที่แนบระบุ ไม่ใช่การตรวจเครื่องจริง และไม่ได้รับรองว่า geometry ของ glTF ตรงกับรุ่นในเอกสารทุกช่อง การจับคู่ชื่อรุ่นกับไฟล์โมเดลยึดตามชุด ref ที่ผู้ใช้จัดให้ ส่วน node และตำแหน่งคลิกของพอร์ตทั้งหมดถูกล้างกลับเป็นรอปรับเทียบใหม่ ไม่ใช้พิกัดจากงานเดิม

บันทึก 54 รายการอินเทอร์เฟซ: Dell 6, Epson 17, Blu-ray 6, TV 7 และ Vertex 18 รายการ ตัวเลขนี้เป็นจำนวนระเบียนในฐานข้อมูล ไม่ใช่การรับรองว่ามีหัวต่อรวม 54 ช่องจริง เพราะบางแหล่งยืนยันเพียงการมีอินเทอร์เฟซแต่ไม่ระบุจำนวน และภาพสเปกบางส่วนอ่านข้อมูลได้ไม่ครบ

## แหล่งอ้างอิงที่ใช้จริง

| รหัส | ไฟล์ใน ref | หลักฐานที่อ่านและตรวจภาพ | ข้อจำกัด |
|---|---|---|---|
| dell | Dell_G7_7588-gaming-w56791901th.png | ชื่อรุ่น Dell G7 15 7588/W56791901TH; ตาราง Ports and Connectivity | ภาพสเปกร้านค้า ไม่มีคำอธิบายทิศทาง HDMI/Alt Mode และไม่มีตารางรูปแบบภาพ |
| epson | EB-2165W_Epson_Projector_User Guide.pdf | หน้า 14-15, 23-25, 27-31, 204-208 | คู่มือหลายรุ่น ต้องอ่านเฉพาะเงื่อนไข EB-2165W |
| bluray | Sony_Ultra_HD_Blueray_UBP-X700.pdf | หน้า 1, 8, 11-12, 15, 19, 23, 30 | บางความสามารถ เช่น 4K ต้องเป็นไปตามเงื่อนไขจอ สาย และ HDCP |
| tv | Sony_Smart_TV_KDL-40W650D_specifications.png | ตารางอินเทอร์เฟซและความละเอียดจอของ KDL-40W650D | แถบลอยบังแถวบนของตาราง; ไม่ยืนยัน USB และไม่ยืนยันเลขช่อง ARC |
| vertex | Vertex_Visualizer_D-1420HW.pdf | หน้า 1, 6, 8-9, 11, 14-16 | ภาพหน้า 6 มีช่องต่อมากกว่ารายการบรรยาย ต้องแยกหลักฐานภาพกับข้อความ |

เลขหน้าที่ระบุเป็นลำดับหน้า PDF แบบเริ่มที่ 1 และตรงกับเลขหน้าพิมพ์ที่ใช้อ้างในคู่มือส่วนนี้ ภาพ PNG ใช้กรอบพิกเซลในพิกัดภาพต้นฉบับ (x0,y0,x1,y1) เป็นจุดอ้างอิง ทั้งเส้นทางไฟล์และ SHA-256 เก็บในฐานข้อมูลและตรวจซ้ำในชุดทดสอบ

## ข้อสรุปสำคัญแยกตามอุปกรณ์

### Dell G7 7588

- ตารางระบุ HDMI 1, USB 3.1 Type-A 3 และ USB 3.1 Type-C 1 ช่อง; Ethernet LAN ระบุ Yes แต่ไม่ได้ให้จำนวน
- แถว DisplayPort และ D-Sub/VGA ระบุ No จึงไม่สร้างช่อง DisplayPort/VGA แยกในโปรไฟล์นี้
- แถว Thunderbolt ระบุ Yes แต่ไม่ผูกกับตำแหน่งพอร์ต ไม่ระบุเวอร์ชัน และไม่ได้อธิบาย DisplayPort Alt Mode จึงไม่ใช้ยืนยันเส้นทาง USB-C ไปจอ
- HDMI OUT เป็นข้ออนุมานจากบทบาทโน้ตบุ๊ก ไม่ใช่ข้อความที่ระบุในภาพ จึงบันทึกเป็น inferred_function และยังไม่ใช้ตัดสินคะแนนการส่งภาพ
- ไม่มีการสืบทอดข้ออ้าง 4K60, HDMI 2.0, การชาร์จ หรือ USB-C video จากข้อมูลเดิม

### Epson EB-2165W

- HDMI1/MHL และ HDMI2 เป็นอินพุตภาพตามหน้า 15
- Computer1 รับ Analog RGB และ Component Video ผ่าน Mini D-Sub 15 ตามหน้า 15/207; Component ต้องใช้เส้นทางและสายที่เหมาะสม ไม่ตีความว่าสาย VGA ปกติแปลงสัญญาณให้ได้
- Computer2/Monitor Out เป็นช่องเดียวที่สลับหน้าที่ใน Extended > Operation > Monitor Out Port จึงไม่บันทึกเป็นสองช่องเสียบ
- เมื่อเป็น Monitor Out จะส่งออกได้เฉพาะ Analog RGB ที่เข้าทาง Computer1 ไม่ส่งออก HDMI, HDBaseT, USB, Composite หรือ Component โดยอัตโนมัติ (หน้า 15/31)
- Video รับ Composite; HDBaseT เป็นช่องรับจาก transmitter ที่รองรับ แม้หัวเป็น RJ-45 ก็ไม่ใช่ Ethernet LAN ธรรมดา (หน้า 15/30/208)
- USB-B รองรับ Epson USB Display เมื่อมีซอฟต์แวร์/คอมพิวเตอร์ตามข้อกำหนด (หน้า 23-24); USB-A สำหรับสื่อ/กล้องที่รองรับ ไม่ถือว่าเป็น HDMI IN
- มี USB Type-A สำหรับโมดูล Wireless LAN เพิ่มอีกอินเทอร์เฟซตามหน้า 208 แยกจาก USB-A ที่ใช้กับสื่อ
- แผงจอเป็น 1280x800 ตามหน้า 206 แต่รับ HDMI 1080p ได้ตามหน้า 204-205 ห้ามใช้ความละเอียดแผงเป็นความละเอียดอินพุตสูงสุด

### Sony UBP-X700

- **HDMI OUT 1 (VIDEO/AUDIO)** ส่งภาพและเสียง ส่วน **HDMI OUT 2 (AUDIO ONLY)** ไม่ส่งภาพ (หน้า 8/30)
- DIGITAL OUT (COAXIAL) เป็นเสียงดิจิทัล ไม่ใช่ Composite Video แม้เป็นขั้ว RCA
- USB ด้านหน้าเป็น Type-A สำหรับสื่อ/อุปกรณ์ที่คู่มือรองรับ ไม่ใช่อินพุตจอจาก Laptop และคู่มือระบุไม่ใช้ชาร์จไฟ (หน้า 15/30)
- มี LAN (100) และ DC IN 12V; ไม่สร้าง Optical OUT หรือ Analog Audio OUT จากข้อมูลเดิม
- การส่งภาพ 4K60 มีเงื่อนไขจอ 4K, HDMI/HDCP 2.2 และสายที่รองรับตามหน้า 11 ไม่ได้หมายความว่าทีวีหรือโปรเจกเตอร์ทุกตัวในชุดรับ 4K ได้

### Sony KDL-40W650D

- ยืนยัน HDMI IN 2 ช่อง: หลัง 1 และข้าง 1 ช่อง ไม่สมมติเลข HDMI1/HDMI2 บนเครื่องจากข้อมูลนี้
- Composite Video IN 1 และ RF IN 1 อยู่ด้านล่างตามตาราง; ชนิดหัว RCA สำหรับ Composite เป็นการอนุมานมาตรฐาน เนื่องจากภาพไม่มีรูปแผงพอร์ต จึงยังไม่ให้คะแนนการเลือกหัวต่อจากรายการนี้
- มี Digital Audio OUT 1 ด้านหลัง และ Audio/Headphone OUT 1 ด้านข้าง แต่ข้อความที่อ่านได้ไม่ระบุชนิดหัวต่อชัด จึงไม่เติม Optical หรือขนาดแจ็คเอง
- มี Ethernet 1 ด้านล่าง รองรับ ARC/CEC แต่ไม่ยืนยันว่าช่อง HDMI ใดมี ARC; ARC เป็นเสียงย้อนกลับ ไม่ทำให้ทีวีส่งภาพผ่าน HDMI OUT
- Component Video, MHL และ RS-232C ระบุว่าไม่มี
- แถบลอยบังแถวบนของตาราง จึงยังไม่ระบุจำนวน USB จากไฟล์นี้ และไม่ใช้จำนวน USB ในโมเดลมาเติม
- ความละเอียดแผง 1920x1080 ไม่ใช่รายการรูปแบบภาพ HDMI ที่รับได้ จึงไม่รับรอง 4K หรือ 120Hz

### Vertex D-1420HW

- HDMI IN รับภาพ และ HDMI OUT ส่งภาพ; ต้องเลือก SOURCE ให้ตรง เช่น HDMI IN หรือ CAMERA ตามหน้า 6/8/11
- RGB IN 1 อยู่ด้านหลัง (PC1), RGB IN 2 อยู่ด้านข้าง (PC2), RGB OUT 1 ยืนยันจากข้อความและภาพ
- **RGB OUT 2, S-VIDEO IN, S-VIDEO OUT, Video IN และ Audio OUT** มีฉลากอยู่ในภาพหน้า 6 แม้บางรายการไม่มีในคำบรรยาย จึงลงบัญชีพร้อม basis=diagram_only
- V-OUT และ Video IN มีหัว RCA/ฉลาก Video ในภาพ แต่ข้อความไม่ได้ระบุคำว่า Composite ชัด จึงแยกการยืนยันหัวต่อ/ฉลากออกจากการอนุมานชนิดสัญญาณ และยังไม่ใช้คู่นี้ตัดสินคะแนนความเข้ากันได้
- USB เป็น **Type-B** ตามหน้า 6 และรับภาพจากกล้องไปยังคอมพิวเตอร์ผ่านไดรเวอร์/โปรแกรม amcap903 และการเลือก UVC CAMERA ตามหน้า 14-16 ไม่ใช่ USB-C และไม่ใช่สายภาพตรงเข้าโปรเจกเตอร์
- ไม่สมมติว่า Visualizer แปลงสัญญาณข้าม HDMI/RGB/Composite/S-Video ได้ทุกคู่ และไม่ใช้ข้อความ “ออกพร้อมกัน 2 สัญญาณ” สร้าง routing matrix ที่คู่มือไม่ได้แจกแจง

## ความหมายของสถานะในฐานข้อมูล

- verified_reference: เอกสาร/ภาพระบุการมีพอร์ตหรือหน้าที่ที่ลงบันทึก แต่ค่าที่ยังไม่ทราบ เช่น supported_modes ยังคงเป็น null ได้ ไม่ได้หมายความว่าทุกคุณสมบัติยืนยันครบ
- inferred_function หรือ signal_status/connector_status ที่ขึ้นต้น inferred: ข้ออนุมานที่แยกไว้ชัด ไม่ใช้แทนหลักฐานยืนยัน
- model_mapping.pending_new_calibration: ยังไม่มี node/ตำแหน่งเสียบสายที่อนุมัติหลังการตรวจใหม่
- assessment_enabled: อนุญาตเฉพาะการตรวจความสัมพันธ์เชิงตรรกะของพอร์ต native ที่มีข้อมูลพอ ไม่ใช่การยืนยันตำแหน่งคลิกหรือการรับรองว่าภาพจริงจะขึ้น

ค่าที่ไม่ทราบคงเป็น null ไม่ตีความเป็นไม่รองรับ ไม่สร้างพอร์ต USB-C, HDMI ช่องเพิ่มเติม หรือความสามารถส่งผ่านจากข้อมูลเก่า

## กฎการเชื่อมต่อที่ปรับใหม่

1. ไม่ยอมรับ capability_status=verified ของชุดเก่าอีกต่อไป ต้องใช้ verified_reference พร้อมหลักฐานชุดใหม่
2. แยกการตรวจ topology (หัวต่อ/OUT-IN/ชนิดสัญญาณ) ออกจาก display (ต้องรู้ Input, สถานะเครื่อง, รูปแบบภาพ และสายด้วย) ผล compatible ไม่ใช่ผลภาพขึ้น
3. HDMI audio-only ของ UBP-X700 ต้องถูกปฏิเสธเมื่อใช้เป็นแหล่งภาพ
4. พอร์ตเปลี่ยนโหมด, USB video ผ่านซอฟต์แวร์, HDBaseT และอุปกรณ์แปลง ต้องใช้กฎเฉพาะเส้นทาง ไม่ให้ผ่านเพราะหัวต่อเหมือนกัน
5. รายการรูปแบบภาพของ Epson ที่ลงใน JSON เป็น progressive subset ไม่ใช่รายการครบ การไม่พบโหมดในรายการบางส่วนจึงคืน “ยังไม่ทราบ” ไม่ตัดสินว่าไม่รองรับ
6. ผล indeterminate ไม่ให้/หักคะแนนนักศึกษา ข้อมูลไม่พอเป็นข้อจำกัดของฐานข้อมูล ไม่ใช่ความผิดของผู้เรียน
7. ตัวตรวจระยะนี้ยังไม่จำลอง EDID/HDCP/เนื้อหาที่ป้องกันการคัดลอกหรือการแปลงสัญญาณทั้งระบบ ผล ready จึงเป็นผลตามเงื่อนไขจำลองที่ระบุ

## ไฟล์และวิธีตรวจซ้ำ

- data/port-catalog.json: ฐานข้อมูลใหม่ทั้งหมดพร้อมหลักฐานรายพอร์ตและรหัส SHA-256 ของ ref
- scripts/build_ref_catalog.py: สร้างฐานข้อมูลจากข้อเท็จจริงที่ตรวจทานใหม่ ไม่อ่าน/สืบทอดข้อมูล hotspot หรือ node เดิม และปฏิเสธหากไฟล์ ref เปลี่ยน SHA จนกว่าจะตรวจทานใหม่
- src/connection-rules.mjs: ตัวตรวจสายตรงแยก topology/display
- tests/connection-rules.test.mjs: ทดสอบกฎ หลักฐาน และข้อผิดพลาดเฉพาะรุ่น
- scripts/audit_models.py เดิมถูกนำออก เพื่อไม่ให้การสแกนชื่อ geometry กลับมาเขียนทับผลยืนยันใหม่

```sh
python scripts/build_ref_catalog.py
node --test tests/connection-rules.test.mjs
```

## บัญชีรายพอร์ตใหม่

จำนวนที่ไม่ทราบไม่เท่ากับศูนย์; ทิศทางของ Ethernet/USB เป็นทิศทางข้อมูล ไม่ใช่ OUT/IN ของภาพเสมอไป “ต้องใช้กฎเฉพาะ” หมายถึงยังใช้ตัวตรวจสายภาพตรงไม่ได้


### Dell G7 15 7588 / W56791901TH

| พอร์ต | หัวต่อ | ทิศทาง | เส้นทาง | หลักฐาน |
|---|---|---|---|---|
| HDMI | hdmi | out (อนุมาน) | native_video | dell ตารางในภาพ |
| USB 3.1 Type-A #1 | usb_a | bidirectional | usb_data | dell ตารางในภาพ |
| USB 3.1 Type-A #2 | usb_a | bidirectional | usb_data | dell ตารางในภาพ |
| USB 3.1 Type-A #3 | usb_a | bidirectional | usb_data | dell ตารางในภาพ |
| USB 3.1 Type-C | usb_c | bidirectional | usb_data | dell ตารางในภาพ |
| Ethernet LAN | rj45 | bidirectional | network | dell ตารางในภาพ |

### Epson EB-2165W

| พอร์ต | หัวต่อ | ทิศทาง | เส้นทาง | หลักฐาน |
|---|---|---|---|---|
| HDMI1/MHL | hdmi | in | native_video | epson หน้า 15,207 |
| HDMI2 | hdmi | in | native_video | epson หน้า 15,207 |
| Computer1 | vga | in | native_video | epson หน้า 15,207 |
| Computer2/Monitor Out | vga | ตามโหมด | configurable_video | epson หน้า 15,207 |
| Video | rca | in | native_video | epson หน้า 15,207 |
| Audio 1 | mini_jack_3_5 | in | audio | epson หน้า 15,207 |
| Audio 2 | mini_jack_3_5 | in | audio | epson หน้า 15,207 |
| Audio Out | mini_jack_3_5 | out | audio | epson หน้า 15,207 |
| L-Audio | rca | in | audio | epson หน้า 15,207 |
| R-Audio | rca | in | audio | epson หน้า 15,207 |
| USB-B | usb_b | bidirectional | software_video | epson หน้า 15,23,24,207 |
| USB-A | usb_a | bidirectional | usb_media | epson หน้า 15,28,29,207 |
| USB-A for wireless LAN module | usb_a | bidirectional | accessory | epson หน้า 208 |
| LAN | rj45 | bidirectional | network | epson หน้า 15,208 |
| HDBaseT | rj45 | in | hdbaset_video | epson หน้า 15,30,208 |
| RS-232C | dsub9 | bidirectional | control | epson หน้า 15,208 |
| Power inlet | ac_inlet | in | power | epson หน้า 15 |

### Sony UBP-X700

| พอร์ต | หัวต่อ | ทิศทาง | เส้นทาง | หลักฐาน |
|---|---|---|---|---|
| HDMI OUT 1 (VIDEO/AUDIO) | hdmi | out | native_video | bluray หน้า 8,30 |
| HDMI OUT 2 (AUDIO ONLY) | hdmi | out | native_video | bluray หน้า 8,30 |
| DIGITAL OUT (COAXIAL) | rca | out | audio | bluray หน้า 8,30 |
| USB (front) | usb_a | bidirectional | usb_media | bluray หน้า 8,15,30 |
| LAN (100) | rj45 | bidirectional | network | bluray หน้า 8,30 |
| DC IN 12 V | dc_barrel | in | power | bluray หน้า 8,30 |

### Sony KDL-40W650D

| พอร์ต | หัวต่อ | ทิศทาง | เส้นทาง | หลักฐาน |
|---|---|---|---|---|
| HDMI IN (rear) | hdmi | in | native_video | tv ตารางในภาพ |
| HDMI IN (side) | hdmi | in | native_video | tv ตารางในภาพ |
| Composite Video IN (bottom) | rca | in | native_video | tv ตารางในภาพ |
| RF IN (bottom) | rf_unknown | in | rf_video | tv ตารางในภาพ |
| Digital audio OUT (rear) | ไม่ระบุ | out | audio | tv ตารางในภาพ |
| Audio / Headphone OUT (side) | ไม่ระบุ | out | audio | tv ตารางในภาพ |
| Ethernet IN (bottom) | rj45 | bidirectional | network | tv ตารางในภาพ |

### Vertex D-1420HW

| พอร์ต | หัวต่อ | ทิศทาง | เส้นทาง | หลักฐาน |
|---|---|---|---|---|
| HDMI IN | hdmi | in | native_video | vertex หน้า 6,8,11 |
| HDMI OUT | hdmi | out | native_video | vertex หน้า 6,8,11 |
| RGB IN 1 | vga | in | native_video | vertex หน้า 6,11 |
| RGB IN 2 | vga | in | native_video | vertex หน้า 6,11 |
| RGB OUT 1 | vga | out | native_video | vertex หน้า 6 |
| RGB OUT 2 | vga | out | native_video | vertex หน้า 6 (ภาพแผงพอร์ต) |
| V-OUT | rca | out | native_video | vertex หน้า 6 |
| Video IN | rca | in | native_video | vertex หน้า 6 (ภาพแผงพอร์ต) |
| S-VIDEO IN | mini_din4 | in | native_video | vertex หน้า 6 (ภาพแผงพอร์ต) |
| S-VIDEO OUT | mini_din4 | out | native_video | vertex หน้า 6 (ภาพแผงพอร์ต) |
| USB B | usb_b | bidirectional | software_video | vertex หน้า 6,14,15,16 |
| Audio IN 1 (rear mini jack) | mini_jack_3_5 | in | audio | vertex หน้า 6 |
| Audio IN 2 (side) | mini_jack_3_5 | in | audio | vertex หน้า 6 |
| Audio IN (rear RCA) | rca | in | audio | vertex หน้า 6 (ภาพแผงพอร์ต) |
| Audio OUT (rear) | mini_jack_unknown | out | audio | vertex หน้า 6 (ภาพแผงพอร์ต) |
| MIC | jack_unknown | in | audio | vertex หน้า 6 |
| RS-232 | dsub9 | bidirectional | control | vertex หน้า 6 |
| POWER DC 12V 2A | dc_barrel | in | power | vertex หน้า 6 |
