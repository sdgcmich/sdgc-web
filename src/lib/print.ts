/**
 * Safely prints an isolated DOM element (e.g. membership card or ticket pass)
 * by rendering it in a hidden temporary iframe with cloned document styles.
 *
 * This guarantees:
 * 1. Only the target card or receipt is sent to the printer.
 * 2. Surrounding navigation, headers, footers, and other dashboard forms are excluded.
 * 3. The print output fits cleanly on a single page.
 * 4. Colors, borders, and background graphics are preserved.
 */
export function printElement(elementId: string, pageTitle?: string): void {
  if (typeof window === "undefined") return;

  const target = document.getElementById(elementId);
  if (!target) {
    window.print();
    return;
  }

  // Create an off-screen, borderless iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Gather all style and link tags from the parent document
  const styleTags = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
    .map((el) => el.outerHTML)
    .join("\n");

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en" class="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${pageTitle || "SDGC Document"}</title>
    ${styleTags}
    <style>
      @page {
        size: auto;
        margin: 12mm;
      }
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        background-color: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        min-height: auto !important;
      }
      body {
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;
        padding: 24px 0 !important;
      }
      .print\\:hidden, .no-print {
        display: none !important;
      }
      #sdgc-printable-member-card {
        width: 3.375in !important;
        height: 2.125in !important;
        min-width: 3.375in !important;
        min-height: 2.125in !important;
        max-width: 3.375in !important;
        max-height: 2.125in !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #ticket-receipt {
        width: 100% !important;
        max-width: 640px !important;
        margin: 0 auto !important;
        box-shadow: none !important;
      }
    </style>
  </head>
  <body>
    <div style="width: 100%; display: flex; justify-content: center;">
      ${target.outerHTML}
    </div>
  </body>
</html>`);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    }
  };

  const images = Array.from(doc.images);
  if (images.length === 0) {
    setTimeout(triggerPrint, 150);
  } else {
    let pending = images.length;
    let printed = false;
    const checkImage = () => {
      pending--;
      if (pending <= 0 && !printed) {
        printed = true;
        setTimeout(triggerPrint, 150);
      }
    };
    for (const img of images) {
      if (img.complete) {
        checkImage();
      } else {
        img.onload = checkImage;
        img.onerror = checkImage;
      }
    }
    // Fallback timer in case an image network request hangs
    setTimeout(() => {
      if (!printed) {
        printed = true;
        triggerPrint();
      }
    }, 800);
  }
}
