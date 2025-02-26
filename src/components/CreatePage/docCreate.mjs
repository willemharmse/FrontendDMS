import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import PizZip from "pizzip";
import puppeteer from "puppeteer";
import mammoth from "mammoth";
import Docxtemplater from "docxtemplater";
import libre from "libreoffice-convert";
import { fileURLToPath } from "url";
import docxConverter from "docx-pdf";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the template
const templatePath = path.join(__dirname, "TAU5 - Procedure - Compliance Hub Procedure Template V1.1 (14.02.2025).docm");
const templateContent = fs.readFileSync(templatePath, "binary");

const capitalizeWords = (text) =>
  text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function capitalizeAllExceptSpaces(input) {
  return input
    .split("")
    .map((char) => (char === " " ? char : char.toUpperCase()))
    .join("");
}
function abbreviateAndUppercase(value) {
  const words = value.trim().split(" "); // Split the input into words
  return words.map(word => word[0].toUpperCase()).join(""); // Take the first letter of each word and uppercase it
}

// 📌 API to Generate Word Document with Dynamic Table
router.post("/generate-docx", async (req, res) => {
  try {
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip);
    const { title, documentType, aim, procedureRows, rows, abbrRows, termRows, chapters, references, version, PPEItems, HandTools, Equipment, MobileMachine, Materials, reviewDate } = req.body;
    const ensureNotEmptyPPEItems = (array) => (array.length === 0 ? [{ PPE: "N/A" }] : array.map(item => ({ PPE: item.ppe })));
    const ensureNotEmptyHandTools = (array) => (array.length === 0 ? [{ tool: "N/A" }] : array.map(item => ({ tool: item.tool })));
    const ensureNotEmptyEquipment = (array) => (array.length === 0 ? [{ eqp: "N/A" }] : array.map(item => ({ eqp: item.eqp })));
    const ensureNotEmptyMobileMachine = (array) => (array.length === 0 ? [{ mac: "N/A" }] : array.map(item => ({ mac: item.mac })));
    const ensureNotEmptyMaterials = (array) => (array.length === 0 ? [{ mat: "N/A" }] : array.map(item => ({ mat: item.mat })));

    const reviewMonths = parseInt(reviewDate, 10);
    if (isNaN(reviewMonths) || reviewMonths <= 0) {
      return res.status(400).json({ error: "Invalid review date value" });
    }

    const updatedChapters = chapters.map(chapter => ({
      ...chapter,
      chapterTitle: chapter.chapterTitle.toUpperCase(),
      subheadings: chapter.subheadings.map(sub => ({
        ...sub,
        subheadingTitle: sub.subheadingTitle.toUpperCase(), // Keep subheading title unchanged
        body: sub.body
      }))
    }));

    // Get current date
    const currentDate = new Date();

    // Add the number of months
    currentDate.setMonth(currentDate.getMonth() + reviewMonths);

    // Format to YYYY-MM-DD (optional, depending on how you store it)
    const nextReviewDate = currentDate.toISOString().split("T")[0];

    const sortedRows = rows.sort((a, b) => a.num - b.num);
    const documentName = capitalizeWords(title) + ' ' + documentType;
    const docNum = `T5-${abbreviateAndUppercase(documentType)}-0001`

    const updatedProcedureRows = procedureRows.map(row => ({
      ...row,
      mainStep: row.mainStep
        ? row.mainStep.split("\n").map(line => ({ mainStepName: line }))
        : [],
      SubStep: row.SubStep
        ? row.SubStep.split("\n").map(line => ({ subStepName: line }))
        : [],
    }));


    // 🔹 Data to fill in the document
    const data = {
      title: capitalizeAllExceptSpaces(title),
      documentType: documentType,
      version: version,
      aim: aim,
      rows: sortedRows, // Inject the dynamic table
      datecreated: new Date().toISOString().split("T")[0],
      abbrRows: abbrRows, // Inject the dynamic table
      termRows: termRows,
      chapters: updatedChapters,
      tools: abbrRows,
      references: references,
      procedureRows: updatedProcedureRows,
      docNum: docNum,
      reviewDate: nextReviewDate,

      PPEItems: ensureNotEmptyPPEItems(PPEItems),
      HandTools: ensureNotEmptyHandTools(HandTools),
      Equipment: ensureNotEmptyEquipment(Equipment),
      MobileMachine: ensureNotEmptyMobileMachine(MobileMachine),
      Materials: ensureNotEmptyMaterials(Materials),
    };

    doc.render(data);

    const outputPath = path.join(__dirname, `${documentName}.docm`);
    const pdfPath = path.join(__dirname, "output.pdf");
    fs.writeFileSync(outputPath, doc.getZip().generate({ type: "nodebuffer" }));
    res.setHeader("X-Document-Name", documentName);

    /*
    // Convert DOCX to PDF
    docxConverter(outputPath, pdfPath, (err, result) => {
      if (err) {
        console.error("Error converting to PDF:", err);
        return res.status(500).send("Error converting document to PDF");
      }

      // Send the generated PDF
      res.download(pdfPath, (err) => {
        if (err) console.error("Error downloading PDF:", err);

        // Cleanup files
        fs.unlinkSync(outputPath);
        fs.unlinkSync(pdfPath);
      });
    });

    */
    res.download(outputPath, (err) => {
      if (err) {
        console.error("Error during file download:", err);
        return res.status(500).send("Error downloading file");
      }

      // File has been downloaded, now delete it
      fs.unlinkSync(outputPath);  // Remove the file after download
    });
  } catch (error) {
    console.error("Error generating Word document:", error);
    res.status(500).send("Error generating document");
  }
});

// Correct the upload directory path using absolute path
const uploadsDir = path.join(__dirname, '..', 'uploads'); // Go one level up from routes folder

const preview = multer({ dest: uploadsDir });

router.post("/upload-docx", preview.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const docxPath = req.file.path;
  const pdfPath = path.join("uploads", req.file.filename + ".pdf");

  try {
    // Convert DOCX to HTML
    const docxBuffer = fs.readFileSync(docxPath);
    const { value: htmlContent } = await mammoth.convertToHtml({ buffer: docxBuffer });

    // Wrap content in HTML template
    const fullHTML = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          header { position: fixed; top: 10px; left: 0; right: 0; text-align: center; font-size: 14px; }
          footer { position: fixed; bottom: 10px; left: 0; right: 0; text-align: center; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <header>Generated PDF from DOCX</header>
        ${htmlContent}
        <footer>Page <span class="pageNumber"></span> of <span class="totalPages"></span></footer>
      </body>
      </html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(fullHTML);
    await page.pdf({ path: pdfPath, format: "A4" });
    await browser.close();

    // Send the generated PDF
    res.download(pdfPath, (err) => {
      if (err) console.error("Error downloading PDF:", err);
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(docxPath); // Cleanup uploaded file
    });

  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send("Error converting document");
  }
});

router.post("/upload", preview.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const filePath = path.join(uploadsDir, req.file.filename);

  // Check if the file is a valid .docx file by verifying the extension
  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  if (fileExtension !== ".docx") {
    return res.status(400).send("Uploaded file is not a valid .docx file");
  }

  try {
    const content = fs.readFileSync(filePath, "binary");

    // Create PizZip object from the binary content of the file
    const zip = new PizZip(content); // Use PizZip to load the binary content

    // Initialize Docxtemplater with the PizZip instance
    const doc = new Docxtemplater(zip);

    // Extract text content (you can customize this)
    const extractedText = doc.getFullText();

    // Send extracted text back to frontend
    res.json({ text: extractedText });
  } catch (err) {
    console.error("Error processing file:", err);
    res.status(500).send("Error reading the file");
  }
});

export default router;