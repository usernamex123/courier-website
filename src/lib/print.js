// Print a DOM node by cloning it into a fresh window with Tailwind styles included.
export function printNode(node, title = "Print") {
    if (!node) return;
    
    const w = window.open("", "_blank", "width=820,height=640");
    if (!w) {
      alert("Please allow pop-ups to print this document.");
      return;
    }
  
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <!-- Inject Tailwind CSS so classes like bg-white, font-black, grid render correctly -->
          <script src="https://cdn.jsdelivr.com/npm/@tailwindcss/browser@4"></script>
          <style>
            body {
              margin: 0;
              font-family: ui-sans-serif, system-ui, sans-serif;
              background: white;
              color: black;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${node.outerHTML}
        </body>
      </html>
    `);
    
    w.document.close();
    w.focus();
    
    // Give the browser a moment to load the CDN script before triggering print
    setTimeout(() => {
      w.print();
    }, 500);
  }