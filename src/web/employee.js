import express from "express";
import { get, run } from "../storage/db.js";
import PDFDocument from "pdfkit";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("employee_lookup");
});

router.post("/lookup", async (req, res) => {
  const { employee_code } = req.body;
  const offer = await get(
    "SELECT * FROM offers WHERE employee_code = ? AND status='published' ORDER BY id DESC",
    [employee_code]
  );
  if (!offer) return res.render("employee_lookup", { error: "No published offer found for this ID" });
  res.redirect(`/employee/offer/${offer.id}`);
});

router.get("/offer/:id", async (req, res) => {
  const { id } = req.params;
  const offer = await get("SELECT * FROM offers WHERE id=?", [id]);
  if (!offer || offer.status !== "published") return res.status(404).send("Offer not found");
  const employee = await get("SELECT * FROM employees WHERE employee_code=?", [offer.employee_code]);
  const terms = await get("SELECT content FROM terms WHERE id = 1");
  const hasHtml = (s) => /<\w+[\s\S]*?>/.test(s || "");
  const offerHtml = hasHtml(offer.content) ? offer.content : (offer.content || "").replace(/\n/g, "<br>");
  const termsHtml = hasHtml(terms?.content) ? terms.content : (terms?.content || "").replace(/\n/g, "<br>");
  res.render("offer_view", { offer, employee, termsHtml, offerHtml });
});

router.get("/offer/:id/sign", async (req, res) => {
  const { id } = req.params;
  const offer = await get("SELECT * FROM offers WHERE id=?", [id]);
  if (!offer || offer.status !== "published") return res.status(404).send("Offer not found");
  const employee = await get("SELECT * FROM employees WHERE employee_code=?", [offer.employee_code]);
  const prior = await get("SELECT id FROM signatures WHERE employee_code=?", [offer.employee_code]);
  if (prior) return res.render("success", { employee_code: offer.employee_code, already: true });
  res.render("sign_form", { offer, employee });
});

router.post("/offer/:id/sign", async (req, res) => {
  const { id } = req.params;
  const { signed_name, consent, signature_data } = req.body;
  const offer = await get("SELECT * FROM offers WHERE id=?", [id]);
  if (!offer || offer.status !== "published") return res.status(404).send("Offer not found");
  const prior = await get("SELECT id FROM signatures WHERE employee_code=?", [offer.employee_code]);
  if (prior) return res.render("success", { employee_code: offer.employee_code, already: true });
  if (!signed_name || consent !== "on" || !signature_data) return res.render("sign_form", { offer, error: "Please provide your name, consent, and signature." });

  await run(
    "INSERT INTO signatures (employee_code, signed_name, signed_at, signature_image) VALUES (?,?,datetime('now'),?)",
    [offer.employee_code, signed_name, signature_data]
  );

  // Ensure employee exists record
  const emp = await get("SELECT * FROM employees WHERE employee_code=?", [offer.employee_code]);
  if (!emp) {
    await run("INSERT INTO employees (employee_code, full_name) VALUES (?, ?)", [offer.employee_code, signed_name]);
  }

  res.render("success", { employee_code: offer.employee_code });
});

// Offer PDF with embedded signature
router.get("/offer/:id/pdf", async (req, res) => {
  const { id } = req.params;
  const offer = await get("SELECT * FROM offers WHERE id=?", [id]);
  if (!offer || offer.status !== "published") return res.status(404).send("Offer not found");
  const employee = await get("SELECT * FROM employees WHERE employee_code=?", [offer.employee_code]);
  const signature = await get("SELECT * FROM signatures WHERE employee_code=?", [offer.employee_code]);
  const terms = await get("SELECT content FROM terms WHERE id = 1");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=offer_${offer.id}.pdf`);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);
  doc.fontSize(20).text("Offer Letter", { align: "center" });
  doc.moveDown();
  if (employee?.full_name) doc.fontSize(12).text(`Employee: ${employee.full_name} (${offer.employee_code})`);
  else doc.fontSize(12).text(`Employee ID: ${offer.employee_code}`);
  doc.moveDown();
  doc.fontSize(12).text("Content:");
  doc.moveDown(0.5);
  doc.fontSize(11).text(offer.content, { align: "left" });
  doc.moveDown();
  if (terms?.content) {
    doc.addPage();
    doc.fontSize(14).text("Terms & Conditions", { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(terms.content);
  }
  if (signature) {
    doc.addPage();
    doc.fontSize(14).text("Signature", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Signed by: ${signature.signed_name}`);
    doc.fontSize(10).text(`Signed at: ${signature.signed_at}`);
    if (signature.signature_image?.startsWith("data:image")) {
      const data = signature.signature_image.split(",")[1];
      const img = Buffer.from(data, "base64");
      try {
        doc.image(img, { width: 300 });
      } catch {}
    }
  }
  doc.end();
});

// Employee ID PDF
router.get("/employee-id/:employee_code.pdf", async (req, res) => {
  const { employee_code } = req.params;
  const employee = await get("SELECT * FROM employees WHERE employee_code=?", [employee_code]);
  if (!employee) return res.status(404).send("Employee not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=${employee_code}_id.pdf`);
  const doc = new PDFDocument({ size: [300, 180], margin: 16 });
  doc.pipe(res);
  doc.roundedRect(8, 8, 284, 148, 12).stroke();
  doc.fontSize(14).text("Company ID Card", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Employee: ${employee.full_name || '-'}`);
  doc.text(`Employee ID: ${employee.employee_code}`);
  doc.text(`Company ID: ${employee.company_id || 'Pending'}`);
  doc.moveDown();
  doc.fontSize(9).text("This card is system-generated.", { align: "center" });
  doc.end();
});

export default router;


