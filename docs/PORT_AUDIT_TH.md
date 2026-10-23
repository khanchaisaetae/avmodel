# ผลตรวจยืนยันพอร์ตใหม่จาก ref เท่านั้น

วันที่ตรวจ: 23 ตุลาคม 2026 (Asia/Bangkok)

## สถานะข้อมูล

**ยกเลิกผลยืนยันพอร์ตชุดเดิมทั้งหมดแล้ว** ฐานข้อมูล schema 1.0.0 และข้อสรุปจากชื่อ node, สีขั้วต่อ และ hotspot เดิมไม่ใช่ฐานยืนยันพอร์ตของงานนี้อีกต่อไป ส่วนแหล่งเว็บใช้เฉพาะหลักฐาน Dell ที่ตรวจใหม่และผู้ใช้อนุญาตเพิ่มเติม รายงานนี้และ data/port-catalog.json schema 2.3.0 ใช้แทนชุดเดิม โดยใช้ไฟล์ใน ref เป็นฐาน และเพิ่มหลักฐาน Dell อย่างเป็นทางการตามข้อมูลใหม่ที่ผู้ใช้ส่งมา บันทึกสรุปพร้อม URL ใน ref/Dell_G7_7588_Official_Port_Confirmation.md การเพิ่มเติมนี้ไม่ฟื้นข้อสรุปจาก hotspot/geometry ชุดเดิม

การยืนยันครั้งนี้หมายถึงยืนยันสิ่งที่เอกสารหรือภาพที่แนบระบุ ไม่ใช่การตรวจเครื่องจริง และไม่ได้รับรองว่า geometry ของ glTF ตรงกับรุ่นในเอกสารทุกช่อง การจับคู่ชื่อรุ่นกับไฟล์โมเดลยึดตามชุด ref ที่ผู้ใช้จัดให้ ตำแหน่งคลิกชุดเดิมถูกยกเลิกแล้ว ปัจจุบันมีทะเบียนตำแหน่งใหม่แยกใน data/model-mappings.json และหน้าตรวจพอร์ตใน index.html ดูผลและข้อจำกัดใน docs/PORT_LAB_REVIEW_TH.md


## แหล่งอ้างอิงที่ใช้จริง

| รหัส | ไฟล์ใน ref | หลักฐานที่อ่านและตรวจภาพ | ข้อจำกัด |
|---|---|---|---|
| dell | Dell_G7_7588-gaming-w56791901th.png | ชื่อรุ่น Dell G7 15 7588/W56791901TH; ตาราง Ports and Connectivity | ภาพสเปกร้านค้า ไม่มีคำอธิบายทิศทาง HDMI/Alt Mode และไม่มีตารางรูปแบบภาพ |
| dell_official | Dell_G7_7588_Official_Port_Confirmation.md | คู่มือ G7 7588 > Right ข้อ 3/4 และบทความ Dell ที่ผู้ใช้ให้ | ยืนยัน USB-C video/HDMI OUT; ยังไม่กำหนดโหมดภาพหรือความสามารถชาร์จ |
| epson | EB-2165W_Epson_Projector_User Guide.pdf | หน้า 14-15, 23-25, 27-31, 204-208 | คู่มือหลายรุ่น ต้องอ่านเฉพาะเงื่อนไข EB-2165W |
| bluray | Sony_Ultra_HD_Blueray_UBP-X700.pdf | หน้า 1, 8, 11-12, 15, 19, 23, 30 | บางความสามารถ เช่น 4K ต้องเป็นไปตามเงื่อนไขจอ สาย และ HDCP |
| tv | Sony_Smart_TV_KDL-40W650D.pdf | ภาพแผงหน้า 28; ข้อมูลเฉพาะหน้า 38; USB media หน้า 16-17 | คู่มือหลายรุ่น/ภูมิภาค; ไม่เพิ่ม HDD REC สำหรับประเทศไทย |
| tv_spec | Sony_Smart_TV_KDL-40W650D_specifications.png | ตำแหน่ง RF และรายการอินเทอร์เฟซที่ไม่มี | ใช้ PDF ใหม่แทนส่วน USB/ARC |
| user_review | PORT_CORRECTIONS_2026-10-23.md | ตรวจรับ Dell/Blu-ray; MIC; ตัดรายการ Epson accessory | บันทึกคำสั่งผู้ใช้ ไม่ใช่คู่มือผู้ผลิต |
| vertex | Vertex_Visualizer_D-1420HW.pdf | หน้า 1, 6, 8-9, 11, 14-16 | ภาพหน้า 6 มีช่องต่อมากกว่ารายการบรรยาย ต้องแยกหลักฐานภาพกับข้อความ |

เลขหน้าที่ระบุเป็นลำดับหน้า PDF แบบเริ่มที่ 1 และตรงกับเลขหน้าพิมพ์ที่ใช้อ้างในคู่มือส่วนนี้ ภาพ PNG ใช้กรอบพิกเซลในพิกัดภาพต้นฉบับ (x0,y0,x1,y1) เป็นจุดอ้างอิง ทั้งเส้นทางไฟล์และ SHA-256 เก็บในฐานข้อมูลและตรวจซ้ำในชุดทดสอบ

## ข้อสรุปสำคัญแยกตามอุปกรณ์

### Dell G7 7588

- ยืนยันพอร์ตด้านขวาเป็น Thunderbolt 3 (USB 3.1 Gen 2 Type-C) / DisplayPort 1.2 จากคู่มือเฉพาะรุ่นหัวข้อ Right ข้อ 3 ไม่ใช้ภาพร้านค้าเพียงอย่างเดียว
- USB-C ส่งภาพและเสียงผ่าน DisplayPort over USB-C ได้: วิดีโอเป็น OUT ส่วนข้อมูล USB รับ/ส่งสองทิศทาง จึงเก็บ direction และ video_direction แยกกัน
- ต่อ USB-C ไปจอ USB-C ได้เมื่อจอและสายรองรับ DisplayPort video; ต่อ DisplayPort ผ่านสาย/อะแดปเตอร์ที่เหมาะสม; ต่อ HDMI ผ่านสาย/อะแดปเตอร์ USB-C DisplayPort-to-HDMI ที่รองรับและใช้ถูกทิศทาง
- ไม่ถือว่าสาย USB-C สำหรับชาร์จหรือข้อมูลทุกเส้นส่งภาพได้ และไม่ใช้ค่าความละเอียด/กำลังไฟสูงสุดจากบทความทั่วไปเป็นสเปกของ G7 7588
- HDMI ยืนยันเป็น OUT ส่งภาพ/เสียงจากคู่มือ Right ข้อ 4 เช่นกัน จึงเปลี่ยนสถานะจาก inferred_function เป็น verified_reference
- “DisplayPort No” ในภาพร้านค้าหมายถึงไม่มีช่อง DisplayPort แยก ไม่ใช้ลบล้าง DisplayPort ผ่าน Type-C ที่คู่มือยืนยัน
- การรับชาร์จผ่าน USB-C และรายการความละเอียด/ความถี่ของสายหรืออะแดปเตอร์แต่ละรุ่นยังไม่ยืนยัน ตัวตรวจสายตรงจึงส่งเส้นทาง USB-C ไปใช้กฎเฉพาะ ไม่จำลองเป็น HDMI OUT โดยตรง

แหล่งเฉพาะรุ่น: https://www.dell.com/support/manuals/en-us/g-series-15-7588-laptop/g7-7588-setupandspecs/right?guid=guid-ebc6a569-b280-494d-a638-06234dcc596d&lang=en-us

แหล่งประกอบที่ผู้ใช้ส่ง:
https://www.dell.com/support/kbdoc/en-th/000141328/displayport-over-usb-type-c
https://www.dell.com/support/contents/en-th/article/product-support/self-support-knowledgebase/monitor-screen-video/connect-laptop-to-display

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

ทบทวนใหม่จาก ref/Sony_Smart_TV_KDL-40W650D.pdf หน้า 16-17, 28-29, 38-39 โดยภาพสเปกเดิมใช้เสริมตำแหน่ง RF และรายการที่ระบุว่าไม่มีเท่านั้น

- HDMI IN 1 (ARC) ด้านหลัง และ HDMI IN 2 ด้านข้าง; ARC เป็นเสียงย้อนกลับ ไม่ใช่ VIDEO OUT
- Composite VIDEO IN แบบ RCA พร้อม Audio IN L (MONO) และ R แยกหัวที่แผงล่าง
- DIGITAL AUDIO OUT (OPTICAL) ด้านหลัง และ Audio/Headphone/Subwoofer OUT แบบ mini stereo ด้านข้าง
- USB-A 1/2 ด้านข้าง เล่นไฟล์ภาพถ่าย/เพลง/วิดีโอ ไม่ใช่ HDMI IN และไม่รับรอง HDD REC สำหรับประเทศไทย
- LAN 10BASE-T/100BASE-TX, RF 75 โอห์ม และ DC IN 19.5 V; รูปแบบหัว RF ยังไม่ระบุชัด
- บันทึก HDMI/PC progressive modes เป็น subset จากหน้า 38 ไม่เติม 4K หรือ 120Hz
- รวม 12 ช่องรวมไฟเลี้ยง ตรวจจับคู่บนโมเดลครบแล้ว รายละเอียด node ใน PORT_LAB_REVIEW_TH.md และยังรอผู้ใช้ตรวจรับ TV

### Vertex D-1420HW

**ยืนยันจำนวนช่องต่อจากภาพคู่มือหน้า 6: ด้านหลัง 10 ช่อง + ด้านข้าง 8 ช่อง = 18 ช่อง รวมช่องไฟเลี้ยง 1 ช่อง** หากนับเฉพาะช่องสัญญาณ/ควบคุม ไม่รวมไฟเลี้ยง จะเป็น 17 ช่อง นับช่อง Audio IN แบบ mini jack และ Audio IN แบบ RCA แยกกันตามภาพ ไม่รวมเป็นช่องเดียว รายการบรรยายใต้ภาพเป็นรายการย่อ จึงไม่ใช้จำนวนบรรทัดในข้อความแทนจำนวนหัวต่อ

| แผงพอร์ต | จำนวน | ฉลากที่นับจากภาพ |
|---|---:|---|
| ด้านหลัง | 10 | POWER DC 12V 2A; Audio IN (mini jack); Audio OUT; Audio IN (RCA); Video IN; V-OUT; RS-232; RGB IN 1; RGB OUT 1; RGB OUT 2 |
| ด้านข้าง | 8 | HDMI IN; HDMI OUT; USB B; S-VIDEO IN; S-VIDEO OUT; MIC; RGB IN 2; Audio IN 2 |

สถานะการยืนยันจำนวนพอร์ตแยกจากการยืนยันรูปแบบภาพ การแปลงสัญญาณ และตำแหน่งคลิกบน glTF จึงไม่เปลี่ยนความสามารถส่วนที่คู่มือไม่ได้ระบุ

- HDMI IN รับภาพ และ HDMI OUT ส่งภาพ; ต้องเลือก SOURCE ให้ตรง เช่น HDMI IN หรือ CAMERA ตามหน้า 6/8/11
- RGB IN 1 อยู่ด้านหลัง (PC1), RGB IN 2 อยู่ด้านข้าง (PC2), RGB OUT 1 ยืนยันจากข้อความและภาพ
- **RGB OUT 2, S-VIDEO IN, S-VIDEO OUT, Video IN และ Audio OUT** มีฉลากอยู่ในภาพหน้า 6 แม้บางรายการไม่มีในคำบรรยาย จึงลงบัญชีพร้อม basis=diagram_only
- V-OUT และ Video IN มีหัว RCA/ฉลาก Video ในภาพ แต่ข้อความไม่ได้ระบุคำว่า Composite ชัด จึงแยกการยืนยันหัวต่อ/ฉลากออกจากการอนุมานชนิดสัญญาณ และยังไม่ใช้คู่นี้ตัดสินคะแนนความเข้ากันได้
- USB เป็น **Type-B** ตามหน้า 6 และรับภาพจากกล้องไปยังคอมพิวเตอร์ผ่านไดรเวอร์/โปรแกรม amcap903 และการเลือก UVC CAMERA ตามหน้า 14-16 ไม่ใช่ USB-C และไม่ใช่สายภาพตรงเข้าโปรเจกเตอร์
- ไม่สมมติว่า Visualizer แปลงสัญญาณข้าม HDMI/RGB/Composite/S-Video ได้ทุกคู่ และไม่ใช้ข้อความ “ออกพร้อมกัน 2 สัญญาณ” สร้าง routing matrix ที่คู่มือไม่ได้แจกแจง

## ความหมายของสถานะในฐานข้อมูล

- verified_reference: เอกสาร/ภาพระบุการมีพอร์ตหรือหน้าที่ที่ลงบันทึก แต่ค่าที่ยังไม่ทราบ เช่น supported_modes ยังคงเป็น null ได้ ไม่ได้หมายความว่าทุกคุณสมบัติยืนยันครบ
- inferred_function หรือ signal_status/connector_status ที่ขึ้นต้น inferred: ข้ออนุมานที่แยกไว้ชัด ไม่ใช้แทนหลักฐานยืนยัน
- model_mapping.registry_reference: อ้างถึงทะเบียนตำแหน่ง data/model-mappings.json โดย mapping_id ไม่ทำสำเนาพิกัดซ้ำในฐานข้อมูลสเปก
- assessment_enabled: อนุญาตเฉพาะการตรวจความสัมพันธ์เชิงตรรกะของพอร์ต native ที่มีข้อมูลพอ ไม่ใช่การยืนยันตำแหน่งคลิกหรือการรับรองว่าภาพจริงจะขึ้น

ค่าที่ไม่ทราบคงเป็น null ไม่ตีความเป็นไม่รองรับ ไม่สร้างพอร์ตเพิ่มเติมหรือความสามารถส่งผ่านจากข้อมูลเก่า USB-C ของ Dell ยืนยันด้วยหลักฐานใหม่ข้างต้นโดยเฉพาะ

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

## บัญชีรายพอร์ตปัจจุบัน

### Dell G7 15 7588 / W56791901TH

| พอร์ต | หัวต่อ | ทิศทาง | เส้นทาง | หลักฐาน |
|---|---|---|---|---|
| HDMI | hdmi | out | native_video | dell_official Model-specific manual: Right |
| USB 3.1 Type-A #1 | usb_a | bidirectional | usb_data | dell ตารางในภาพ |
| USB 3.1 Type-A #2 | usb_a | bidirectional | usb_data | dell ตารางในภาพ |
| USB 3.1 Type-A #3 | usb_a | bidirectional | usb_data | dell ตารางในภาพ |
| Thunderbolt 3 / USB 3.1 Gen 2 Type-C / DisplayPort 1.2 | usb_c | bidirectional | dp_alt_mode_video | dell_official Model-specific manual: Right |
| Ethernet LAN | rj45 | bidirectional | network | dell ตารางในภาพ |

### Epson EB-2165W

| พอร์ต | หัวต่อ | ทิศทาง | เส้นทาง | หลักฐาน |
|---|---|---|---|---|
| HDMI1/MHL | hdmi | in | native_video | epson หน้า 15,207 |
| HDMI2 | hdmi | in | native_video | epson หน้า 15,207 |
| Computer1 | vga | in | native_video | epson หน้า 15,207 |
| Computer2/Monitor Out | vga | None | configurable_video | epson หน้า 15,207 |
| Video | rca | in | native_video | epson หน้า 15,207 |
| Audio 1 | mini_jack_3_5 | in | audio | epson หน้า 15,207 |
| Audio 2 | mini_jack_3_5 | in | audio | epson หน้า 15,207 |
| Audio Out | mini_jack_3_5 | out | audio | epson หน้า 15,207 |
| L-Audio | rca | in | audio | epson หน้า 15,207 |
| R-Audio | rca | in | audio | epson หน้า 15,207 |
| USB-B | usb_b | bidirectional | software_video | epson หน้า 15,23,24,207 |
| USB-A | usb_a | bidirectional | usb_media | epson หน้า 15,28,29,207 |
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
| HDMI IN 1 (ARC) · ด้านหลัง | hdmi | in | native_video | tv หน้า 28,38 |
| HDMI IN 2 · ด้านข้าง | hdmi | in | native_video | tv หน้า 28,38 |
| VIDEO IN · Composite · แผงล่าง | rca | in | native_video | tv หน้า 28,38 |
| RF / Antenna IN · แผงล่าง | rf_unknown | in | rf_video | tv หน้า 38 |
| DIGITAL AUDIO OUT (OPTICAL) · ด้านหลัง | toslink | out | audio | tv หน้า 28,38 |
| AUDIO OUT / Headphone / Subwoofer · ด้านข้าง | mini_jack_3_5 | out | audio | tv หน้า 28,38 |
| LAN · แผงล่าง | rj45 | bidirectional | network | tv หน้า 28,38 |
| AUDIO IN L (MONO) · แผงล่าง | rca | in | audio | tv หน้า 28,38 |
| AUDIO IN R · แผงล่าง | rca | in | audio | tv หน้า 28,38 |
| USB 1 · ด้านข้าง | usb_a | bidirectional | usb_media | tv หน้า 16,17,28,38 |
| USB 2 · ด้านข้าง | usb_a | bidirectional | usb_media | tv หน้า 16,17,28,38 |
| DC IN 19.5 V · แผงล่าง | dc_barrel | in | power | tv หน้า 38 |

### Vertex D-1420HW

| พอร์ต | หัวต่อ | ทิศทาง | เส้นทาง | หลักฐาน |
|---|---|---|---|---|
| HDMI IN | hdmi | in | native_video | vertex หน้า 6,8,11 |
| HDMI OUT | hdmi | out | native_video | vertex หน้า 6,8,11 |
| RGB IN 1 | vga | in | native_video | vertex หน้า 6,11 |
| RGB IN 2 | vga | in | native_video | vertex หน้า 6,11 |
| RGB OUT 1 | vga | out | native_video | vertex หน้า 6 |
| RGB OUT 2 | vga | out | native_video | vertex หน้า 6 |
| V-OUT | rca | out | native_video | vertex หน้า 6 |
| Video IN | rca | in | native_video | vertex หน้า 6 |
| S-VIDEO IN | mini_din4 | in | native_video | vertex หน้า 6 |
| S-VIDEO OUT | mini_din4 | out | native_video | vertex หน้า 6 |
| USB B | usb_b | bidirectional | software_video | vertex หน้า 6,14,15,16 |
| Audio IN 1 (rear mini jack) | mini_jack_3_5 | in | audio | vertex หน้า 6 |
| Audio IN 2 (side) | mini_jack_3_5 | in | audio | vertex หน้า 6 |
| Audio IN (rear RCA) | rca | in | audio | vertex หน้า 6 |
| Audio OUT (rear) | mini_jack_unknown | out | audio | vertex หน้า 6 |
| MIC · Phone 1/4 นิ้ว (6.35 มม.) | phone_jack_6_35 | in | audio | user_review ข้อมูลแก้ไข |
| RS-232 | dsub9 | bidirectional | control | vertex หน้า 6 |
| POWER DC 12V 2A | dc_barrel | in | power | vertex หน้า 6 |

## การตรวจรับและข้อแก้ไขผู้ใช้

Dell และ Sony UBP-X700 ตรวจรับตำแหน่งแล้ว รวม 12 จุด ตามคำยืนยันผู้ใช้ 23 ตุลาคม 2026; TV ยังรอการตรวจรับใหม่

MIC ของ Vertex: Phone 1/4 นิ้ว (6.35 มม.) ตามผู้ใช้ยืนยัน ไม่ระบุ TS/TRS

Epson: ไม่ลงบัญชี usb-wlan แยกต่างหาก; Wireless LAN module เป็นอุปกรณ์เสริมที่ต่อ USB-A ตามข้อแก้ไขผู้ใช้ ที่มาใน ref/PORT_CORRECTIONS_2026-10-23.md
