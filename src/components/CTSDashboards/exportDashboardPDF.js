/**
 * exportDashboardPDF.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Captures the full (scrollable) content of .mdash-shell and exports it as a
 * compact A4 PDF. Page breaks are nudged to avoid slicing panel elements.
 *
 * Dependencies:
 *   npm install html2canvas jspdf
 *
 * Usage:
 *   import { exportDashboardPDF } from "./exportDashboardPDF";
 *   <button onClick={() => exportDashboardPDF(dash.dataAsAt)}>Export Report</button>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * @param {string} dataAsAt  — date label shown in the PDF footer (e.g. "2025-06-01")
 */
export async function exportDashboardPDF(dataAsAt = "", type = "") {
    // ── 1. Locate the shell ──────────────────────────────────────────────────
    const shell = document.querySelector(".mdash-shell") || document.querySelector(".mddsdash-shell");
    if (!shell) {
        console.error("exportDashboardPDF: .mdash-shell not found");
        return;
    }

    // ── 2. Temporarily expand the shell so html2canvas sees all content ──────
    const prevOverflow = shell.style.overflow;
    const prevMaxHeight = shell.style.maxHeight;
    const prevHeight = shell.style.height;
    const prevPaddingB = shell.style.paddingBottom;

    shell.style.overflow = "visible";
    shell.style.maxHeight = "none";
    shell.style.height = "auto";
    shell.style.paddingBottom = "24px";

    // Hide the Export Report button so it doesn't appear in the PDF
    const exportBtn = shell.querySelector(".mdash-btn--primary");
    if (exportBtn) exportBtn.style.display = "none";


    // Blur any focused native control before capture.
    // This prevents browser UI state from leaking into the canvas.
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    // Let the expanded layout settle before html2canvas clones it.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    // Hide the date button too so it sits alone — nothing to hide here,
    // the button-nc is kept (it's the "Data as at" pill, useful in the PDF)

    try {
        // ── 3. Render to canvas ──────────────────────────────────────────────
        const canvas = await html2canvas(shell, {
            scale: 1.6,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: shell.scrollWidth,
            windowHeight: shell.scrollHeight,

            onclone: (clonedDoc) => {
                const clonedShell = clonedDoc.querySelector(".mdash-shell");
                if (!clonedShell) return;

                clonedShell.querySelectorAll("select.mdash-trend-select").forEach((select) => {
                    const selectedText =
                        select.options?.[select.selectedIndex]?.textContent ||
                        select.value ||
                        "";

                    const pill = clonedDoc.createElement("span");
                    pill.textContent = selectedText;

                    pill.style.display = "inline-flex";
                    pill.style.alignItems = "center";
                    pill.style.justifyContent = "center";
                    pill.style.boxSizing = "border-box";
                    pill.style.minHeight = "34px";
                    pill.style.height = "34px";
                    pill.style.padding = "0 13px";
                    pill.style.border = "1px solid #dbe3f0";
                    pill.style.borderRadius = "8px";
                    pill.style.background = "#ffffff";
                    pill.style.color = "#002060";
                    pill.style.fontFamily = "Arial, sans-serif";
                    pill.style.fontSize = "12px";
                    pill.style.fontWeight = "600";
                    pill.style.lineHeight = "34px";
                    pill.style.whiteSpace = "nowrap";

                    select.replaceWith(pill);
                });
            },
        });

        // ── 4. Measure panels so we can avoid splitting them ─────────────────
        //    We collect the top/bottom of every .mdash-panel and .mdash-trend-svg
        //    relative to the shell, scaled to canvas px.
        const shellRect = shell.getBoundingClientRect();
        const scaleFactor = canvas.width / shell.scrollWidth; // ≈ devicePixelRatio * 1.6 / zoom

        // Elements we don't want to split across pages
        const protectedEls = shell.querySelectorAll(
            ".mdash-panel, .mdash-trend-svg, .mdash-summary-grid, .mdash-stacked-wrap"
        );

        // Build array of { top, bottom } in canvas-px coordinates
        const blocks = Array.from(protectedEls).map((el) => {
            const r = el.getBoundingClientRect();
            // position relative to the shell's scrolled top
            const topRel = r.top - shellRect.top + shell.scrollTop;
            const bottomRel = r.bottom - shellRect.top + shell.scrollTop;
            return {
                top: topRel * scaleFactor,
                bottom: bottomRel * scaleFactor,
            };
        });

        // ── 5. Build PDF ─────────────────────────────────────────────────────
        const A4_W_MM = 210;
        const A4_H_MM = 297;
        const MARGIN = 10;   // mm — uniform margin

        const usableW = A4_W_MM - MARGIN * 2;   // 190 mm
        const usableH = A4_H_MM - MARGIN * 2;   // 277 mm  (no footer reserved)

        const imgW = canvas.width;
        const imgH = canvas.height;
        const ratio = usableW / imgW;             // mm per canvas-px

        const pageH_px = usableH / ratio;         // how many canvas-px fit per page

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        let yOffset = 0; // canvas-px consumed so far
        let page = 0;

        while (yOffset < imgH) {
            if (page > 0) pdf.addPage();

            // Ideal cut point for this page
            let cutAt = yOffset + pageH_px;

            if (cutAt < imgH) {
                // Check if the cut would slice through any protected block.
                // If so, move the cut to just before that block starts.
                for (const b of blocks) {
                    if (b.top < cutAt && b.bottom > cutAt) {
                        // Cut would bisect this block — move cut up to block top
                        // (but only if moving up still gives us meaningful content)
                        const newCut = b.top - 4; // 4px breathing room
                        if (newCut > yOffset + pageH_px * 0.3) {
                            cutAt = newCut;
                        }
                        // If moving up would give <30% of a page, leave the cut as-is
                        // (block is too tall to fit on one page anyway)
                        break;
                    }
                }
            }

            const sliceH = Math.min(cutAt - yOffset, imgH - yOffset);

            // Render this slice to a temporary canvas
            const slice = document.createElement("canvas");
            slice.width = imgW;
            slice.height = Math.ceil(sliceH);
            const ctx = slice.getContext("2d");
            ctx.drawImage(canvas, 0, yOffset, imgW, slice.height, 0, 0, imgW, slice.height);

            const sliceDataUrl = slice.toDataURL("image/jpeg", 0.88);
            const sliceH_mm = slice.height * ratio;

            pdf.addImage(sliceDataUrl, "JPEG", MARGIN, MARGIN, usableW, sliceH_mm);

            // ── Footer: "Data as at" only, no page numbers ───────────────────
            pdf.setFontSize(7);
            pdf.setTextColor(150);
            // thin rule above footer
            pdf.setDrawColor(200);
            pdf.setLineWidth(0.2);
            pdf.line(MARGIN, A4_H_MM - MARGIN, A4_W_MM - MARGIN, A4_H_MM - MARGIN);

            yOffset += sliceH;
            page++;
        }

        // ── 6. Save ──────────────────────────────────────────────────────────
        const dateStr = dataAsAt.replace(/\//g, "-") || new Date().toISOString().slice(0, 10);
        pdf.save(`${type} Dashboard Report ${dateStr}.pdf`);

    } finally {
        // ── 7. Restore the shell exactly as it was ───────────────────────────
        shell.style.overflow = prevOverflow;
        shell.style.maxHeight = prevMaxHeight;
        shell.style.height = prevHeight;
        shell.style.paddingBottom = prevPaddingB;
        if (exportBtn) exportBtn.style.display = "";
    }
}
