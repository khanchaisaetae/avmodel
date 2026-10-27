import { getDiagramTask } from "./diagram-data.mjs?v=20261025-placement";
import { DEVICE_NAMES } from "./scenario-catalog.mjs";
import { WIRE_CHOICES } from "./lesson-cables.mjs";
const xml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );

export function wrapDiagramText(value, limit = 80) {
  const segmenter = new Intl.Segmenter("th", { granularity: "grapheme" }),
    lines = [];
  for (const paragraph of String(value).replace(/\r\n?/g, "\n").split("\n")) {
    const chars = [...segmenter.segment(paragraph)].map((s) => s.segment);
    if (!chars.length) lines.push("");
    for (let i = 0; i < chars.length; i += limit)
      lines.push(chars.slice(i, i + limit).join(""));
  }
  return lines;
}

export function exportDiagramSvg(d, catalog, { includeReason = true } = {}) {
  const task = getDiagramTask(d.taskId),
    ports = new Map(
      catalog.devices.flatMap((dev) => dev.ports.map((p) => [p.id, p])),
    ),
    nodeMap = new Map(),
    lines = [],
    width = Math.max(760, ...d.nodes.map((n) => n.x + 260)),
    titleLines = wrapDiagramText(
      "VIRTUAL AV LAB · " + task.id + " " + task.title,
      Math.floor((width - 60) / 13),
    ),
    headerHeight = 35 + titleLines.length * 27;
  for (const node of d.nodes) {
    const x = node.x + 30,
      y = node.y + headerHeight,
      rows = [],
      anchors = new Map();
    let offset = 25;
    const add = (text, bold = false) => {
      for (const line of wrapDiagramText(text, bold ? 24 : 30)) {
        rows.push({ text: line, y: offset, bold });
        offset += bold ? 20 : 17;
      }
    };
    add(DEVICE_NAMES[node.id], true);
    offset += 5;
    add(node.power ? "เปิดเครื่อง" : "ปิดเครื่อง");
    if (["dell", "bluray"].includes(node.id))
      add(node.enabled ? "ส่งภาพ: เปิด" : "ส่งภาพ: ปิด");
    if (node.id === "vertex") add("SOURCE: " + node.source);
    else if (["epson", "tv"].includes(node.id))
      add("Input: " + (ports.get(node.input)?.label || "ยังไม่เลือก"));
    offset += 7;
    d.links.forEach((link, i) => {
      if (link.from === node.id || link.to === node.id) {
        const out = link.from === node.id;
        anchors.set(link.id, y + offset - 4);
        add(
          i +
            1 +
            ". " +
            (out ? "OUT → " : "→ IN ") +
            (ports.get(out ? link.sourcePortId : link.sinkPortId)?.label ||
              "ยังไม่เลือก"),
        );
        offset += 3;
      }
    });
    nodeMap.set(node.id, {
      x,
      y,
      rows,
      anchors,
      height: Math.max(160, offset + 12),
    });
  }
  const bottom = Math.max(
      headerHeight + 190,
      ...[...nodeMap.values()].map((n) => n.y + n.height + 30),
    ),
    reasonLines = wrapDiagramText(
      d.reason || "ยังไม่ได้ระบุ",
      Math.floor((width - 60) / 8),
    ),
    conclusion =
      task.id === "analysis-01"
        ? "ข้อสรุป: " +
          ({
            possible: "ทำได้ตามเงื่อนไข",
            impossible: "ทำไม่ได้ตามเงื่อนไข",
            unsure: "ยังไม่สรุป",
          }[d.conclusion] || "ยังไม่สรุป")
        : null,
    reasonTop = bottom + 25,
    height = includeReason
      ? reasonTop + 45 + (reasonLines.length + (conclusion ? 2 : 0)) * 22
      : bottom + 15;
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${xml(task.title)}</title><rect width="${width}" height="${height}" fill="#f5f8f9"/><style>text{font-family:Tahoma,Arial,sans-serif;fill:#243f50;font-size:13px}</style><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#437c85"/></marker></defs>`,
  );
  titleLines.forEach((text, i) =>
    lines.push(
      `<text x="30" y="${32 + i * 27}" style="font-size:22px;font-weight:bold">${xml(text)}</text>`,
    ),
  );
  d.links.forEach((link, i) => {
    const a = nodeMap.get(link.from),
      b = nodeMap.get(link.to),
      x = a.x + 200,
      y = a.anchors.get(link.id),
      tx = b.x,
      ty = b.anchors.get(link.id),
      mx = (x + tx) / 2,
      my = (y + ty) / 2,
      label = wrapDiagramText(
        i +
          1 +
          ". " +
          (WIRE_CHOICES.find((c) => c.id === link.cableId)?.label ||
            "ยังไม่เลือกสาย"),
        22,
      ),
      labelHeight = label.length * 16 + 12;
    lines.push(
      `<path d="M${x} ${y} C${mx} ${y} ${mx} ${ty} ${tx} ${ty}" fill="none" stroke="#437c85" stroke-width="2" marker-end="url(#arr)"/><rect x="${mx - 88}" y="${my - labelHeight - 3}" width="176" height="${labelHeight}" rx="5" fill="#fff" stroke="#d5e3e7"/>`,
    );
    label.forEach((text, j) =>
      lines.push(
        `<text x="${mx}" y="${my - labelHeight + 14 + j * 16}" text-anchor="middle" style="font-size:11px">${xml(text)}</text>`,
      ),
    );
  });
  for (const n of nodeMap.values()) {
    lines.push(
      `<rect x="${n.x}" y="${n.y}" width="200" height="${n.height}" rx="12" fill="#fff" stroke="#abc4cb"/>`,
    );
    for (const row of n.rows)
      lines.push(
        `<text x="${n.x + 12}" y="${n.y + row.y}" style="font-size:${row.bold ? 14 : 11}px;${row.bold ? "font-weight:bold" : ""}">${xml(row.text)}</text>`,
      );
  }
  if (includeReason) {
    lines.push(
      `<text x="30" y="${reasonTop}" style="font-weight:bold">เหตุผลประกอบ (ฉบับผู้เรียน · ไม่มีคะแนน)</text>`,
    );
    let y = reasonTop + 26;
    if (conclusion) {
      lines.push(`<text x="30" y="${y}">${xml(conclusion)}</text>`);
      y += 35;
    }
    reasonLines.forEach((text, i) =>
      lines.push(
        `<text x="30" y="${y + i * 22}" xml:space="preserve">${xml(text)}</text>`,
      ),
    );
  }
  lines.push("</svg>");
  return lines.join("");
}
