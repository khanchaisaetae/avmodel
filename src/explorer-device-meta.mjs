export const META = {
  dell: {
    title: "Dell G7 7588",
    sub: "โน้ตบุ๊ก / แหล่งภาพ",
    category: "COMPUTER / SOURCE",
    icon: "laptop",
  },
  epson: {
    title: "Epson EB-2165W",
    sub: "โปรเจกเตอร์ / แสดงภาพ",
    category: "PROJECTOR / DISPLAY",
    icon: "projector",
  },
  bluray: {
    title: "Sony UBP-X700",
    sub: "เครื่องเล่น Blu-ray / แหล่งภาพ",
    category: "BLU-RAY / SOURCE",
    icon: "player",
  },
  tv: {
    title: "Sony KDL-40W650D",
    sub: "สมาร์ททีวี / แสดงภาพ",
    category: "TELEVISION / DISPLAY",
    icon: "tv",
  },
  vertex: {
    title: "Vertex D-1420HW",
    sub: "Visualizer / สาธิตเอกสาร",
    category: "VISUALIZER / DOCUMENT CAMERA",
    icon: "visualizer",
  },
};
export const DRAW = {
  laptop: "M5 5h22v16H5z M2 25h28l-3-4H5z",
  projector:
    "M3 12h26v13H3z M18 12V8 M8 8h15 M21 19a4 4 0 1 0 0-.01 M6 17h7 M6 21h7",
  player: "M3 12h26v12H3z M6 16h13v4H6z M24 18h2",
  tv: "M3 5h26v19H3z M16 24v5 M10 29h12",
  visualizer: "M4 25h24v4H4z M24 25V9L15 5H9v5h8 M13 10v4 M5 25l8-11",
};
export const icon = (kind) =>
  `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${DRAW[kind]}"></path></svg>`;
