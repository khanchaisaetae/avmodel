// Dependencies are injected by the entry controller; importing this module has no UI side effects.
export function createDiagramDownload(scope) {
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type })),
      a = scope.el("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return { download };
}
