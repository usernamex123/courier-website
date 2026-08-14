// Print a DOM node by cloning it into a fresh window (browser handles PDF export).
export function printNode(node, title = "Print") {
    if (!node) return;
    const w = window.open("", "_blank", "width=820,height=640");
    if (!w) {
      alert("Please allow pop-ups to print this document.");
      return;
    }
    w.document.write(`<!doctype html><html><head><title>${title}</title><style>body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif}</style></head><body>${node.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 350);
  }