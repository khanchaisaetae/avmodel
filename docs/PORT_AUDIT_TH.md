# รายงานตรวจสอบโมเดลและฐานข้อมูลพอร์ต ระยะที่ 1

วันที่ 22 ตุลาคม 2026 (Asia/Bangkok)
Repository: https://github.com/khanchaisaetae/avmodel
โมเดลต้นทาง ณ commit e07fe56ba406fb70c058def70b794b24d4b204e8

## ผลที่ทำได้แล้ว

อ่านไฟล์ glTF ทั้ง 5 ไฟล์จริง ตรวจชื่อกลุ่มและโครงสร้าง geometry รวมถึงภาพพื้นผิวที่ฝังในไฟล์ และเปรียบเทียบกับข้อความพอร์ตใน index_qwen.html และ indexqwen38.html พบผู้สมัครชิ้นส่วนช่องต่อ 35 รายการ (ไม่ได้หมายความว่าทุกชิ้นเป็นพอร์ตภาพ และไม่รับรองว่าครบทุกช่องของเครื่องจริง) ทั้งหมดมี node index และค่าขอบเขต geometry สำหรับใช้ตรวจสอบตำแหน่งต่อไป

พบกลุ่มที่ใช้ชื่อ HDMI Port รวม 9 กลุ่ม: Laptop 1, Projector 2, Blu-ray 2, TV 2, Visualizer 2 กลุ่ม จำนวนนี้เป็นหลักฐานโครงสร้างโมเดล ไม่ใช่การยืนยันจำนวนช่องหรือหน้าที่ของรุ่นสินค้า

ยังระบุหมายเลขรุ่นย่อยของอุปกรณ์ทั้ง 5 ไม่ได้จากข้อมูลใน repository ภาพพื้นผิวไม่มีป้ายรุ่นอุปกรณ์ที่ยืนยันได้ ป้าย XPort ใน Laptop เป็นป้ายชิ้นส่วนช่องต่อ ไม่ใช่หมายเลขรุ่นโน้ตบุ๊ก จึงยังไม่จับคู่คู่มือใดเป็นคู่มือเฉพาะโมเดลเหล่านี้

## ข้อขัดแย้งที่ต้องแก้ก่อนใช้เป็นเฉลย

| อุปกรณ์ | หลักฐานจากโมเดล | ข้อความเดิมในเว็บ | การจัดการในฐานข้อมูล |
|---|---|---|---|
| Dell G7 | กลุ่ม HDMI 1, USB Type C 1 และ USB 3 กลุ่ม | ระบุเวอร์ชัน HDMI/USB, Thunderbolt, ความละเอียด และการชาร์จ | ไม่รับรองเวอร์ชัน ความละเอียด หรือความสามารถ USB-C จนกว่าจะยืนยันรุ่น |
| Epson | กลุ่ม HDMI 2 กลุ่ม, USB และ Phono Jack | ระบุ HDMI1/MHL, HDMI2, VGA และความละเอียด | เก็บ HDMI เป็น a/b ตาม node ไม่กำหนดลำดับฉลากหรือ MHL; VGA ยังไม่ยืนยัน |
| Sony Blu-ray | กลุ่ม HDMI 2 กลุ่ม และ Phono Jack | เว็บอธิบาย HDMI Out จุดเดียว พร้อม Optical/Analog Audio | ตรวจหน้าที่ HDMI แต่ละจุดจากรุ่นจริง; ไม่แปลง Phono Jack เป็นวิดีโอหรือเสียงโดยเดา |
| Sony TV | กลุ่ม HDMI 2 กลุ่ม | ระบุ HDMI 4 ช่อง, eARC และ 4K/120Hz | ไม่สร้างพอร์ต HDMI ช่อง 3/4 จากข้อความเดิม และไม่รับรอง eARC/รูปแบบภาพ |
| Vertex | กลุ่ม HDMI 2 กลุ่ม และชิ้นส่วนชื่อ USB Type B | ระบุ USB Type-C และ HDMI loop-through | บันทึก Type-B ตามชื่อชิ้นส่วนเป็นหลักฐาน; ทิศทาง HDMI/การส่งผ่าน/หน้าที่ USB ยังไม่ยืนยัน |

ชื่อ Phono_Jack_Yellow ไม่เพียงพอจะตัดสินว่าเป็น Composite Video: บาง geometry ใช้ซ้ำกับขั้ว RCA ที่มีหน้าที่อื่นได้ เช่น Digital Coaxial Audio ต้องตรวจฉลากและคู่มือ

## แหล่งผู้ผลิตที่ตรวจประกอบ

เอกสารต่อไปนี้ใช้ยืนยันว่าความสามารถขึ้นกับรุ่นและหน้าที่ช่องต่อเท่านั้น **ยังไม่มีรายการใดได้รับการจับคู่เป็นคู่มือของไฟล์โมเดลใน repository**

1. Dell G7 15 7588, Right: ระบุ HDMI ส่งภาพ/เสียง และ USB-C/Thunderbolt/DisplayPort สำหรับรุ่นนี้
   https://www.dell.com/support/manuals/en-us/g-series-15-7588-laptop/g7-7588-setupandspecs/right?guid=guid-ebc6a569-b280-494d-a638-06234dcc596d&lang=en-us
2. Sony คู่มือเลข 50458701M หน้า PDF 8 (หน้าพิมพ์ 8): แยก HDMI OUT 1 VIDEO/AUDIO และ HDMI OUT 2 AUDIO ONLY แสดงว่าพอร์ตหน้าตาเหมือนกันไม่จำเป็นต้องส่งภาพได้ทั้งคู่
   https://www.sony.com/electronics/support/res/manuals/5045/489debf396781025061ca564f0f4a649/50458701M.pdf
3. Epson PowerLite 1284 Quick Setup หน้า PDF 1: แยก HDMI, VGA, USB-B Display ผ่านซอฟต์แวร์ และ USB-A สำหรับอุปกรณ์จัดเก็บ/กล้องบางชนิด จึงไม่ใช้กฎว่า USB ทุกช่องส่งภาพเหมือนกัน หรือ USB ส่งภาพไม่ได้ทั้งหมด
   https://files.support.epson.com/docid/cpd4/cpd42655.pdf
4. Vertex หน้า Download เป็นจุดเริ่มค้นคู่มือเมื่อทราบรุ่น; ยังไม่ยืนยันรุ่น Visualizer และยังไม่ใช้สเปก D-1408TH เป็นเฉลยของโมเดลนี้
   https://www.vertex.co.th/download/

## ไฟล์สำหรับพัฒนาต่อ

- data/port-catalog.json: รายการอุปกรณ์ 5 รายการ ผู้สมัครช่องต่อ 35 รายการ หลักฐาน node, SHA-256 ของไฟล์, geometry bounds/center และสถานะการยืนยันแต่ละรายการ
- scripts/audit_models.py: สร้างบัญชีจากโมเดลซ้ำได้ด้วย Python 3 โดยไม่ติดตั้ง dependency
- src/connection-rules.mjs: กฎตรวจเส้นทางภาพแบบสายตรง native signal หนึ่งเส้น
- tests/connection-rules.test.mjs: ทดสอบสถานการณ์สำคัญด้วย Node built-in test runner; fixture เป็นอุปกรณ์สมมติ ไม่ใช่สเปกที่รับรองแล้วของโมเดล

ข้อมูล geometry_center_scene เป็นจุดกึ่งกลางขอบเขตชิ้นส่วนในพิกัด scene ดั้งเดิม **ไม่ใช่ตำแหน่งเสียบสายบนพื้นผิว และไม่ใช่พิกัดหลังจัดโมเดลให้อยู่กลางจอ** ต้องปรับเทียบ socket_anchor_scene และ socket_normal_scene ด้วยภาพโมเดลก่อนใช้ลากสาย

glTF ชุดนี้ใช้ POSITION accessor ร่วมทั้งโมเดล ดังนั้นการอ่าน accessor.min/max ของแต่ละ mesh จะได้ขอบเขตทั้งเครื่องซ้ำกัน สคริปต์จึงอ่าน indices ของ primitive แล้วคำนวณจาก vertex ที่ชิ้นส่วนนั้นใช้จริง รวม transform ของบรรพบุรุษก่อนบันทึกตำแหน่ง

## กฎการใช้ข้อมูลและการตรวจคำตอบ

1. ข้อมูลไม่ทราบต้องเป็น null ไม่ตีความว่าไม่รองรับ
2. รูปร่างหัวต่อไม่ยืนยันทิศทาง สัญญาณ ความละเอียด หรือความสามารถเฉพาะรุ่น
3. เก็บพอร์ตแต่ละจุดแยกกัน: HDMI-a/HDMI-b เป็นรหัสภายใน ไม่ใช่ฉลาก HDMI1/HDMI2 บนอุปกรณ์
4. เปิดใช้ตัดสินคะแนนได้เมื่อมี capability_status=verified และ assessment_enabled=true พร้อมหลักฐานครบ ขณะนี้ทั้ง 35 รายการยังปิดการตัดสินคะแนน
5. ตรวจทิศทาง OUT→IN, ความสามารถส่งภาพ, หัวต่อ/ชนิดสัญญาณและสาย, การใช้พอร์ตซ้ำ, สถานะเปิดเครื่อง, การเปิดส่งภาพ, Input ที่เลือก, รูปแบบภาพร่วมกัน และสภาพสาย
6. คืนผล ready / invalid / no_image / indeterminate แยกกัน ข้อมูลไม่พอเป็น indeterminate และ gradable=false เสมอ ไม่หักคะแนนจากความไม่สมบูรณ์ของฐานข้อมูล
7. ตัวแปลง สวิตช์ ตัวกระจายสัญญาณ USB video ซอฟต์แวร์ USB Display, EDID, HDCP และการเลือกเส้นทางภายใน Visualizer ยังอยู่นอกขอบเขตกฎระยะนี้ ให้คืน indeterminate จนมีกฎเส้นทางเฉพาะ ไม่สมมติว่าเชื่อมต่อได้
8. ผล ready หมายถึงผ่านเงื่อนไขจำลองที่ระบุ ไม่ใช่ผลทดสอบฮาร์ดแวร์จริง

ก่อนนำพอร์ตเข้าประเมิน ให้เพิ่มข้อมูล connector (ชนิดหัวต่อที่ยืนยันแล้ว), direction (in/out), video_capable, signal, supported_modes (รหัสรูปแบบภาพ เช่น 1920x1080@60) และ evidence_refs ที่อ้างคู่มือพร้อมหน้า/ภาพฉลาก และยืนยันรุ่นอุปกรณ์ ค่าความสามารถเหล่านี้ต้องตรวจทีละพอร์ต การตั้ง assessment_enabled=true เพียงอย่างเดียวไม่เพียงพอ

## สิ่งที่ต้องยืนยันเพื่อปิดงานตรวจสเปก

- หมายเลขรุ่นย่อย: Dell G7 รุ่นใด, Epson รุ่นใด, Sony Blu-ray รุ่นใด, Sony TV รุ่นใด และ Vertex รุ่นใด
- ภาพแผงช่องต่อและฉลากของเครื่องจริง หรือคู่มือรุ่นที่ตรงกับต้นแบบ
- จุด HDMI สองจุดของ Blu-ray ส่งภาพทั้งคู่หรือมีจุด audio-only
- ลำดับ IN/OUT ของ HDMI ที่ Visualizer และความสามารถส่งผ่านสัญญาณ
- ชิ้นส่วนที่ไม่มีชื่อในโมเดลว่ามี VGA/USB/พอร์ตภาพอื่นหรือไม่ และช่อง RCA แต่ละจุดทำหน้าที่อะไร
- ปรับเทียบจุดเสียบสายและทิศทางผิวหน้าในโมเดล รวมการแปลงพิกัดที่หน้าเว็บใช้

## การตรวจซ้ำ

รันจากราก repository:

```sh
python scripts/audit_models.py
node --test tests/connection-rules.test.mjs
```

สคริปต์ audit จะสร้างบัญชีหลักฐานดิบใหม่และคงสถานะยังไม่ยืนยัน จึงไม่ควรใช้ทับข้อมูลที่ผ่านการปรับเทียบ/ยืนยันด้วยมือแล้วโดยไม่แยกโปรไฟล์ไว้ ขั้นพัฒนาเว็บถัดไปควรแยกโปรไฟล์ที่อนุมัติออกจากผล audit ดิบ และแสดงสถานะข้อมูลให้อาจารย์ตรวจได้

## บัญชีผู้สมัครช่องต่อจากโครงสร้างโมเดล

ลำดับ node เป็นหลักฐานอ้างอิง ต้องยืนยันหัวต่อและหน้าที่จากภาพ/คู่มืออีกครั้ง ขอบเขตบัญชีนี้คือกลุ่มหรือชิ้นส่วนที่ระบุชื่อได้ ไม่รวมการเดาหน้าที่ของ geometry ที่ไม่มีชื่อ

| โมเดล | node index | ชื่อใน glTF | ชนิดผู้สมัคร |
|---|---:|---|---|
| DellG7-Laptop | 101 | HDMI Port | hdmi |
| DellG7-Laptop | 50 | USB Type C Port | usb_c |
| DellG7-Laptop | 10 | USB | usb_a_candidate |
| DellG7-Laptop | 37 | USB | usb_a_candidate |
| DellG7-Laptop | 123 | USB | usb_a_candidate |
| DellG7-Laptop | 23 | Xport | rj45_candidate |
| Epson-Projector | 23 | HDMI Port | hdmi |
| Epson-Projector | 24 | HDMI Port | hdmi |
| Epson-Projector | 33 | USB | usb_unknown |
| Epson-Projector | 25 | Phono_Jack_Yellow#1 | rca_candidate |
| Epson-Projector | 34 | Phono_Jack_Yellow#3 | rca_candidate |
| Epson-Projector | 35 | Phono_Jack_Yellow#2 | rca_candidate |
| Epson-Projector | 28 | 1734354-1 | unknown |
| Sony-Blu-ray | 4 | HDMI Port | hdmi |
| Sony-Blu-ray | 26 | HDMI Port | hdmi |
| Sony-Blu-ray | 49 | RJ45 Connections | rj45_candidate |
| Sony-Blu-ray | 77 | USB | usb_a_candidate |
| Sony-Blu-ray | 72 | Phono_Jack_Yellow#3 | rca_candidate |
| Sony-SmartTV | 109 | HDMI Port | hdmi |
| Sony-SmartTV | 131 | HDMI Port | hdmi |
| Sony-SmartTV | 96 | USB | usb_a_candidate |
| Sony-SmartTV | 163 | USB | usb_a_candidate |
| Sony-SmartTV | 7 | RJ45 Connections | rj45_candidate |
| Sony-SmartTV | 30 | Phono_Jack_Yellow#3 | rca_candidate |
| Sony-SmartTV | 32 | Phono_Jack_Yellow#2 | rca_candidate |
| Sony-SmartTV | 34 | Phono_Jack_Yellow#1 | rca_candidate |
| Sony-SmartTV | 36 | Coax Connection threaded | coax_candidate |
| Sony-SmartTV | 56 | Fiber port | optical_candidate |
| Vertex-Visualizer | 6 | HDMI Port | hdmi |
| Vertex-Visualizer | 45 | HDMI Port | hdmi |
| Vertex-Visualizer | 72 | USB Type B | usb_b |
| Vertex-Visualizer | 100 | Phono_Jack_White | rca_candidate |
| Vertex-Visualizer | 102 | Phono_Jack_Yellow | rca_candidate |
| Vertex-Visualizer | 105 | Phono_Jack_Yellow | rca_candidate |
| Vertex-Visualizer | 104 | 1734354-1 | unknown |
