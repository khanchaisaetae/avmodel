# หลักฐานกฎสายยูสเคส 3
ตรวจเมื่อ 30 ตุลาคม 2026 — เอกสารนี้เป็นสรุปการตรวจและลิงก์ต้นทาง ไม่ใช่สำเนาคู่มือผู้ผลิต

## แหล่งข้อมูลภายนอกที่ตรวจเพิ่ม

1. StarTech HD2VGAE2 — https://www.startech.com/en-us/display-video-adapters/hd2vgae2
   ผู้ผลิตระบุ Active HDMI input → VGA output ทิศทางเดียว ไม่ส่งเสียง ใช้เป็นหลักฐานว่าต้องมีวงจรแปลง ไม่ขยายคุณสมบัติความละเอียดหรือไฟเลี้ยงของรุ่นนี้ไปยังอะแดปเตอร์ทุกรุ่น
2. StarTech HD2VGAA — https://www.startech.com/en-gb/audio-video-products/hd2vgaa
   FAQ ผู้ผลิตระบุว่าเนื้อหาที่ใช้ HDCP ไม่รองรับการแปลงไปภาพแอนะล็อก จึงไม่รับรองเส้นทาง Blu-ray → VGA โดยไม่ทราบสื่อและสถานะ HDCP
3. Epson คู่มือ EB-2165W และรุ่นร่วม — https://download.epson.com.sg/manuals/EB-2140W_2040_User%20Guide.pdf
   หน้า 23–24: USB-A ของคอมพิวเตอร์ → USB-B โปรเจกเตอร์ ต้องมี Epson USB Display และระบบปฏิบัติการที่รองรับ; หน้า 28: Composite; หน้า 30: HDBaseT ต้องมีตัวส่งเฉพาะ; หน้า 24 และ 31: เสียงแอนะล็อก 3.5 มม. ไม่ใช่สายส่งภาพ ใช้ตรวจเพิ่มเติมคู่มือใน ref โดยไม่แทนไฟล์เดิม
4. VESA DisplayPort FAQ — https://www.displayport.org/faq/
   หมวด DisplayPort over USB-C อธิบายความสามารถ Alt Mode และสาย/อะแดปเตอร์ไป DisplayPort หรือ HDMI ต้องตรวจคู่มืออุปกรณ์เฉพาะรุ่น ไม่อนุมานว่าพอร์ต Type-C ทุกช่องส่งหรือรับภาพได้

## หลักฐานเดิมใน ref
- Dell_G7_7588_Official_Port_Confirmation.md: Dell USB-C video/adapter
- Vertex_Visualizer_D-1420HW.pdf หน้า 6 และ 11: V-Out, RGB และ Source PC1/PC2; ข้อมูล S-Video บางส่วนยืนยันจากภาพ จึงไม่เติมกฎส่งผ่านภายในที่เอกสารไม่ชัด
- EB-2165W_Epson_Projector_User Guide.pdf: พอร์ต Video/Audio/USB/HDBaseT และ Computer2/Monitor Out
- Sony_Ultra_HD_Blueray_UBP-X700.pdf และ Sony_Smart_TV_KDL-40W650D.pdf: HDMI, พอร์ตเสียง และทิศทางตาม port-catalog.json

## สรุปความครอบคลุม
| สาย | กฎที่เพิ่ม/มีแล้ว | ข้อจำกัดและข้อมูลที่ต้องมีเพิ่ม |
|---|---|---|
| HDMI / VGA | ตรวจพอร์ต สัญญาณ ทิศทางและเส้นทาง | Computer2 ต้องมีการตั้งโหมด; ไม่รับรอง EDID/ความละเอียดจริง |
| USB-C → HDMI | ตรวจแบบมีเงื่อนไข | รุ่นอะแดปเตอร์ ความละเอียดและ HDCP หากต้องจำลองฮาร์ดแวร์จริง |
| HDMI → VGA | ตรวจ Active converter ทิศทางเดียว รองรับเส้นทาง Dell ตามเงื่อนไข | รุ่นตัวแปลง ไฟเลี้ยง timing และสถานะ HDCP; Blu-ray ยังไม่ยืนยันภาพ |
| Composite | ตรวจภาพ RCA OUT → IN แยกจาก RCA audio/coax | ต้องมีหลักฐานโหมดส่งภาพ Vertex / มาตรฐาน PAL/NTSC จึงยืนยันภาพทั้งเส้นทาง |
| S-Video | ตรวจ mini-DIN และสัญญาณ OUT → IN | ไม่มีจอรับ S-Video ในชุดนี้; ต้องมีคู่มือจอและกฎส่งออก Vertex |
| USB-A → USB-B | ตรวจ Dell → Epson; อธิบายทิศทางกล้อง Vertex → คอมพิวเตอร์ | ต้องเพิ่มสถานะติดตั้ง/เปิดซอฟต์แวร์และ OS ก่อนยืนยันภาพ |
| RCA Audio / 3.5 mm | ตรวจหัวต่อ สัญญาณ และ OUT → IN; ไม่ส่งภาพ | ต้องเพิ่มช่อง L/R, การจับคู่ Input เสียง, ระดับเสียง เพื่อจำลองเสียงจริง |
| Phone 6.35 mm | ตรวจหัวต่อและไม่ใช่สายภาพ | ต้องมีแหล่งเสียงพร้อมข้อมูล TS/TRS, Mic/Line; หัวต่อ Vertex Audio OUT ยังไม่ยืนยันขนาด |
| Coaxial / Optical Audio | ตรวจชนิดเสียงดิจิทัลและทิศทาง | ไม่มีตัวรับเสียงตรงชนิดในชุดนี้; ต้องมีคู่มือ receiver และรูปแบบเสียง |
| LAN | ตรวจ Ethernet แยกจาก HDBaseT | ต้องมี topology เครือข่าย, IP, ซอฟต์แวร์และสถานะการเชื่อมต่อ |
| HDBaseT | ปฏิเสธ LAN ทั่วไปแทนตัวส่ง | คู่มือหลักยืนยันว่าต้องมี transmitter แต่ยังไม่มีรุ่นในแอป; ต้องเพิ่มรุ่น พอร์ต สาย ระยะทางและ timing |
| DisplayPort / USB-C video / USB-C → DP | ตรวจหัวต่อและข้อจำกัดปลายทาง | ไม่มีจอรับ DP หรือ USB-C ในชุดนี้; ต้องเพิ่มรุ่นจอพร้อมคู่มือ DP/Alt Mode |

กฎจำกัดเฉพาะยูสเคส 3 ไม่เปลี่ยนกฎของยูสเคสอื่น และแยก “หัวต่อถูกต้อง” จาก “ภาพออกจริง” ไม่มีการเพิ่มพอร์ตที่อุปกรณ์ไม่มี
