import PptxGenJS from "pptxgenjs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const TEAL = "0F766E";
const TEAL_DEEP = "0A5C56";
const TEAL_DARK = "042F2E";
const ORANGE = "EA580C";
const INK = "0C1A1A";
const MUTED = "2E3B3D";
const SURFACE = "F4F7F6";
const LINE = "D7E0DE";
const MINT = "ECFDF5";
const PEACH = "FFF1E7";
const WHITE = "FFFFFF";
const FONT = "Verdana";

// Images extracted from word/media of Campaignly_AI_Phase1_SRS_Final.docx (scripts/extract-docx.ps1).
const MEDIA = process.env.SRS_MEDIA || join(tmpdir(), "srsdoc");
const img = (n) => {
  const p = join(MEDIA, `image${n}.png`);
  if (!existsSync(p)) throw new Error(`Missing ${p}; run scripts/extract-docx.ps1 first`);
  return p;
};

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Majid Farooq Qureshi & Habib Ur Rehman";
pptx.company = "COMSATS University Islamabad";
pptx.title = "Campaignly.AI - Software Requirements Specification";

const W = 13.33;
const H = 7.5;

// pptxgenjs mutates the shadow object in place while writing XML, so every shape needs its own copy.
const shadow = () => ({ type: "outer", color: "0C1A1A", blur: 10, offset: 2, angle: 90, opacity: 0.1 });
const NO_LINE = () => ({ type: "none" });

let slideNo = 0;

function logoMark(slide, x, y, s) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: s, h: s, rectRadius: 0.22,
    fill: { color: TEAL }, line: NO_LINE(),
  });
  const u = s / 64;
  slide.addShape(pptx.ShapeType.rect, { x: x + 12 * u, y: y + 34 * u, w: 5.5 * u, h: 12 * u, fill: { color: MINT }, line: NO_LINE() });
  slide.addShape(pptx.ShapeType.rect, { x: x + 21 * u, y: y + 26 * u, w: 5.5 * u, h: 20 * u, fill: { color: MINT }, line: NO_LINE() });
  slide.addShape(pptx.ShapeType.rect, { x: x + 30 * u, y: y + 18 * u, w: 5.5 * u, h: 28 * u, fill: { color: MINT }, line: NO_LINE() });
  slide.addShape(pptx.ShapeType.rect, { x: x + 39 * u, y: y + 10 * u, w: 5.5 * u, h: 36 * u, fill: { color: ORANGE }, line: NO_LINE() });
}

function contentSlide(kicker, title) {
  slideNo += 1;
  const slide = pptx.addSlide();
  slide.background = { color: SURFACE };

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 1.38, fill: { color: TEAL_DARK }, line: NO_LINE() });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.38, w: W, h: 0.07, fill: { color: ORANGE }, line: NO_LINE() });
  slide.addShape(pptx.ShapeType.ellipse, { x: W - 2.6, y: -1.5, w: 3.2, h: 3.2, fill: { color: TEAL_DEEP }, line: NO_LINE() });

  slide.addText(kicker.toUpperCase(), {
    x: 0.55, y: 0.17, w: 9, h: 0.32,
    fontFace: FONT, fontSize: 11.5, bold: true, color: "5EEAD4", charSpacing: 2,
  });
  slide.addText(title, {
    x: 0.52, y: 0.52, w: 10.6, h: 0.78,
    fontFace: FONT, fontSize: 27, bold: true, color: WHITE,
  });

  logoMark(slide, W - 1.4, 0.34, 0.72);

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.46, w: W, h: 0.46, fill: { color: WHITE }, line: NO_LINE() });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.46, w: W, h: 0.02, fill: { color: LINE }, line: NO_LINE() });
  slide.addText("Campaignly.AI  |  SRS Presentation 2026-27", {
    x: 0.5, y: H - 0.42, w: 9, h: 0.38, fontFace: FONT, fontSize: 11, color: MUTED, valign: "middle",
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: W - 1.05, y: H - 0.4, w: 0.58, h: 0.32, rectRadius: 0.06,
    fill: { color: TEAL }, line: NO_LINE(),
  });
  slide.addText(String(slideNo).padStart(2, "0"), {
    x: W - 1.05, y: H - 0.4, w: 0.58, h: 0.32,
    fontFace: FONT, fontSize: 12, bold: true, color: WHITE, align: "center", valign: "middle",
  });

  return slide;
}

function card(slide, { x, y, w, h, fill = WHITE, border = LINE }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: fill }, line: { color: border, width: 1 }, shadow: shadow(),
  });
}

function chip(slide, { x, y, w = 0.48, h = 0.48, label, fill = TEAL, color = WHITE, size = 14 }) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: NO_LINE() });
  slide.addText(label, { x, y, w, h, fontFace: FONT, fontSize: size, bold: true, color, align: "center", valign: "middle" });
}

function tag(slide, { x, y, w, h = 0.32, label, orange = false, size = 11 }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.07, fill: { color: orange ? PEACH : MINT }, line: NO_LINE(),
  });
  slide.addText(label, {
    x, y, w, h, fontFace: FONT, fontSize: size, bold: true, color: orange ? ORANGE : TEAL_DEEP, align: "center", valign: "middle",
  });
}

const bullets = (items, size) =>
  items.map((t) => ({ text: t, options: { bullet: { code: "25AA", indent: 14 }, color: MUTED, fontSize: size, breakLine: true } }));

// addText anchors vertically centred by default, which leaves a gap under list headings.
const LIST = { fontFace: FONT, valign: "top" };

// Places an image inside a white card, scaled to fit the box without distortion.
function framedImage(slide, { path, pw, ph, x, y, w, h, pad = 0.12 }) {
  card(slide, { x, y, w, h });
  const bw = w - pad * 2;
  const bh = h - pad * 2;
  const scale = Math.min(bw / pw, bh / ph);
  const iw = pw * scale;
  const ih = ph * scale;
  slide.addImage({ path, x: x + pad + (bw - iw) / 2, y: y + pad + (bh - ih) / 2, w: iw, h: ih });
}

/* ------------------------------------------------------------------ */
/* Slide 1 - Title                                                     */
/* ------------------------------------------------------------------ */
{
  const s = pptx.addSlide();
  s.background = { color: TEAL_DARK };
  s.addShape(pptx.ShapeType.ellipse, { x: -2.2, y: -2.4, w: 6.5, h: 6.5, fill: { color: TEAL_DEEP }, line: NO_LINE() });
  s.addShape(pptx.ShapeType.ellipse, { x: W - 3.1, y: H - 3.0, w: 5.4, h: 5.4, fill: { color: TEAL_DEEP }, line: NO_LINE() });
  s.addShape(pptx.ShapeType.ellipse, { x: W - 1.9, y: -1.1, w: 2.6, h: 2.6, fill: { color: TEAL }, line: NO_LINE() });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.18, w: W, h: 0.18, fill: { color: ORANGE }, line: NO_LINE() });

  logoMark(s, 0.95, 0.72, 1.1);

  s.addText("SOFTWARE REQUIREMENTS SPECIFICATION  |  PHASE 1", {
    x: 0.95, y: 2.05, w: 10, h: 0.34, fontFace: FONT, fontSize: 14, bold: true, color: "5EEAD4", charSpacing: 2.5,
  });
  s.addText("Campaignly.AI", {
    x: 0.9, y: 2.42, w: 10, h: 1.15, fontFace: FONT, fontSize: 60, bold: true, color: WHITE,
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.95, y: 3.6, w: 1.6, h: 0.08, fill: { color: ORANGE }, line: NO_LINE() });
  s.addText("From a business description to a ready lead, in one guided workflow.", {
    x: 0.9, y: 3.85, w: 10.5, h: 0.5, fontFace: FONT, fontSize: 20, color: "C3E6E1",
  });

  const people = [
    ["Team Members", "Majid Farooq Qureshi   FA23-BCS-045\nHabib Ur Rehman   FA23-BCS-116"],
    ["Supervisor", "Ms. Saadia Maqbool"],
    ["Programme", "BS Computer Science (2023-2027)\nCOMSATS University Islamabad"],
  ];
  people.forEach(([label, value], i) => {
    const x = 0.95 + i * 3.85;
    s.addShape(pptx.ShapeType.rect, { x, y: 5.2, w: 0.06, h: 1.3, fill: { color: ORANGE }, line: NO_LINE() });
    s.addText(label.toUpperCase(), { x: x + 0.2, y: 5.18, w: 3.4, h: 0.28, fontFace: FONT, fontSize: 11, bold: true, color: "5EEAD4", charSpacing: 1.5 });
    s.addText(value, { x: x + 0.2, y: 5.46, w: 3.5, h: 1.0, fontFace: FONT, fontSize: 11, color: WHITE, valign: "top", lineSpacing: 20 });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 2 - Problem Statement                                         */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 01", "Problem Statement");

  const blocks = [
    ["The Problem", "A Meta campaign needs an objective, audience, compliant copy, placement media, budget and monitoring.", TEAL],
    ["Impact", "Owners overspend on boosted posts, pay agencies or get ads rejected. Leads wait hours for a WhatsApp reply.", ORANGE],
    ["Target Users", "Small and medium business owners in any industry, with no marketing training or agency.", TEAL],
    ["Importance", "SMBs depend on social ads, but disconnected tools hide whether campaigns deliver and leads get answered.", ORANGE],
  ];
  blocks.forEach(([t, b, accent], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.22;
    const y = 1.82 + row * 2.05;
    card(s, { x, y, w: 5.98, h: 1.85 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.09, h: 1.85, fill: { color: accent }, line: NO_LINE() });
    chip(s, { x: x + 0.32, y: y + 0.24, label: String(i + 1), fill: accent });
    s.addText(t, { x: x + 0.95, y: y + 0.24, w: 4.8, h: 0.48, fontFace: FONT, fontSize: 18, bold: true, color: INK, valign: "middle" });
    s.addText(b, { x: x + 0.32, y: y + 0.85, w: 5.45, h: 0.9, ...LIST, fontSize: 14, color: MUTED, lineSpacing: 21 });
  });

  card(s, { x: 0.55, y: 6.0, w: 12.2, h: 0.9, fill: "FFF7ED", border: "FDBA74" });
  s.addText("Core gap: no single, understandable workflow links campaign creation, policy awareness, lead capture and timely follow-up.", {
    x: 0.82, y: 6.02, w: 11.7, h: 0.86, fontFace: FONT, fontSize: 15, color: "9A3412", valign: "middle",
  });
}

/* ------------------------------------------------------------------ */
/* Slide 3 - Proposed Solution & Effectiveness                         */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 02", "Proposed Solution & Effectiveness");

  const steps = [
    ["Onboard", "Reusable business profile"],
    ["Generate", "AI copy + media via RAG"],
    ["Check", "Bradley Filter policy check"],
    ["Deploy", "Owner confirms, Meta API"],
    ["Capture", "Leads synced and encrypted"],
    ["Nurture", "AI WhatsApp + takeover"],
  ];
  const stepW = 1.9;
  const gap = 0.16;
  steps.forEach(([t, b], i) => {
    const x = 0.55 + i * (stepW + gap);
    const accent = i % 2 === 0 ? TEAL : ORANGE;
    card(s, { x, y: 1.8, w: stepW, h: 1.85 });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.8, w: stepW, h: 0.09, fill: { color: accent }, line: NO_LINE() });
    chip(s, { x: x + (stepW - 0.5) / 2, y: 2.05, w: 0.5, h: 0.5, label: `0${i + 1}`, fill: accent, size: 13 });
    s.addText(t, { x: x + 0.05, y: 2.62, w: stepW - 0.1, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: INK, align: "center", valign: "middle" });
    s.addText(b, { x: x + 0.1, y: 3.02, w: stepW - 0.2, h: 0.56, fontFace: FONT, fontSize: 11, color: MUTED, align: "center", valign: "top", lineSpacing: 15 });
  });
  for (let i = 0; i < steps.length - 1; i += 1) {
    const x = 0.55 + (i + 1) * (stepW + gap) - gap + 0.01;
    s.addShape(pptx.ShapeType.triangle, { x, y: 2.65, w: 0.14, h: 0.14, fill: { color: "B7C9C6" }, line: NO_LINE(), rotate: 90 });
  }

  s.addText("Expected benefits", { x: 0.55, y: 3.88, w: 6, h: 0.4, fontFace: FONT, fontSize: 18, bold: true, color: INK, valign: "middle" });

  const benefits = [
    ["No expertise needed", "4 of 5 first-time users reach a reviewable ad within 15 minutes.", "NFR-USE-001"],
    ["Fewer rejections", "Policy risks flagged before submission; Meta still decides.", "FR-015"],
    ["Faster lead response", "AI replies within 60 s; owner alerted at intent score 70.", "NFR-PER-006"],
    ["One protected workspace", "Tenant-isolated data under one AUD Stripe subscription.", "FR-080"],
  ];
  benefits.forEach(([t, b, ref], i) => {
    const x = 0.55 + i * 3.08;
    card(s, { x, y: 4.4, w: 2.88, h: 2.5 });
    s.addText(t, { x: x + 0.24, y: 4.56, w: 2.45, h: 0.62, fontFace: FONT, fontSize: 14.5, bold: true, color: INK, valign: "top", lineSpacing: 19 });
    s.addText(b, { x: x + 0.24, y: 5.2, w: 2.45, h: 1.1, ...LIST, fontSize: 12.5, color: MUTED, lineSpacing: 18 });
    tag(s, { x: x + 0.24, y: 6.38, w: 1.6, label: ref, orange: i % 2 === 1, size: 10.5 });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 4 - Scope Evaluation Feedback & Improvements                  */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 03", "Scope Evaluation Feedback & Improvements");

  const head = ["Evaluation", "Committee feedback", "Action taken"];
  const rows = [
    ["FYP-0\nSpring 2026", "Accepted with minor revisions. Expand beyond campaign generation to a complete AI workflow.", "End-to-end flow: generate, evaluate, learn, recommend, deploy, observe, optimise."],
    ["FYP-0\nSpring 2026", "Incorporate human oversight throughout the AI pipeline.", "Owner review and approval checkpoints before deployment and optimisation."],
    ["FYP-1\nFall 2026", "Define AI evaluation, personalisation and optimisation beyond basic API calls.", "Measurable checks, history-based recommendations and performance-driven tuning."],
  ];
  const tableRows = [
    head.map((h) => ({ text: h, options: { fill: TEAL_DARK, color: WHITE, bold: true, fontSize: 14, valign: "middle" } })),
    ...rows.map((r, i) =>
      r.map((cell, c) => ({
        text: cell,
        options: {
          fill: i % 2 === 0 ? WHITE : "EEF4F3",
          color: c === 2 ? TEAL_DEEP : c === 0 ? INK : MUTED,
          bold: c === 0,
          fontSize: c === 0 ? 12.5 : 12.5,
          valign: "middle",
        },
      })),
    ),
  ];
  s.addTable(tableRows, {
    x: 0.55, y: 1.78, w: 12.2, colW: [1.9, 5.15, 5.15], rowH: [0.46, 0.86, 0.86, 0.86],
    border: { type: "solid", color: LINE, pt: 1 }, fontFace: FONT, margin: 0.1,
  });

  s.addText("Resulting changes in the SRS", { x: 0.55, y: 5.0, w: 8, h: 0.4, fontFace: FONT, fontSize: 17, bold: true, color: INK, valign: "middle" });
  const changes = [
    ["Readability + policy scores", "FR-011"],
    ["RAG on versioned dataset", "FR-014"],
    ["Owner confirms every deploy", "FR-028"],
    ["Advisory recommendations", "FR-016"],
    ["Intent score, ready at 70", "FR-085"],
    ["Manual WhatsApp takeover", "FR-052"],
  ];
  changes.forEach(([t, ref], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.55 + col * 4.13;
    const y = 5.5 + row * 0.72;
    card(s, { x, y, w: 3.95, h: 0.6 });
    tag(s, { x: x + 0.14, y: y + 0.14, w: 0.98, label: ref, orange: col === 1, size: 10.5 });
    s.addText(t, { x: x + 1.22, y, w: 2.68, h: 0.6, fontFace: FONT, fontSize: 11.5, color: INK, valign: "middle" });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 5 - Key Modules & Features                                    */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 04", "Key Modules & Features");

  const modules = [
    ["01", "Business Onboarding & Brand", "Wizard, tone, industry, resume, AI tips", "BO-1"],
    ["02", "AI Ad & Content Generation", "Copy variations, templates, RAG, policy check", "BO-2  BO-8"],
    ["03", "AI Media Editing & Creative", "Upload, resize, brand, captions, snippets", "BO-2"],
    ["04", "Meta Campaign Automation", "OAuth, 6 objectives, targeting, sync, control", "BO-3  BO-6"],
    ["05", "Lead Management", "Lead-form sync, encryption, filters, analytics", "BO-4  BO-6"],
    ["06", "AI WhatsApp Lead Nurturing", "Replies, follow-ups, intent score, takeover", "BO-9"],
    ["07", "Subscription & Billing", "Stripe Checkout, 14-day trial, AUD plans", "BO-5"],
    ["08", "Admin Dashboard & Operations", "Users, AI usage, Meta health, jobs, dataset", "BO-7  BO-8"],
    ["09", "Marketing Website", "Landing, pricing, diagnostic, enquiries, blog", "Acquisition"],
    ["10", "Authentication & Users", "Email, Google, sessions, roles, tenancy", "BO-4  BO-6"],
  ];
  modules.forEach(([num, title, body, obj], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.22;
    const y = 1.76 + row * 0.92;
    const accent = row % 2 === col % 2 ? TEAL : ORANGE;
    card(s, { x, y, w: 5.98, h: 0.82 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 0.82, fill: { color: accent }, line: NO_LINE() });
    s.addText(num, { x: x + 0.14, y: y + 0.09, w: 0.7, h: 0.64, fontFace: FONT, fontSize: 20, bold: true, color: accent === ORANGE ? "FDBA74" : "99DDD5", align: "center", valign: "middle" });
    s.addText(title, { x: x + 0.9, y: y + 0.07, w: 3.6, h: 0.36, fontFace: FONT, fontSize: 13.5, bold: true, color: INK, valign: "middle" });
    s.addText(body, { x: x + 0.9, y: y + 0.42, w: 3.75, h: 0.34, fontFace: FONT, fontSize: 11, color: MUTED, valign: "middle" });
    tag(s, { x: x + 4.62, y: y + 0.25, w: 1.24, label: obj, orange: accent === ORANGE, size: 10 });
  });

  s.addText("10 modules  |  78 scope features + 11 baseline additions = FR-001 to FR-089  |  Tags show the business objective served", {
    x: 0.55, y: 6.4, w: 12.2, h: 0.5, fontFace: FONT, fontSize: 12, color: MUTED, align: "center", valign: "middle",
  });
}

/* ------------------------------------------------------------------ */
/* Slide 6 - Actors                                                    */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 05", "System Actors");

  const actors = [
    ["Business User", "Owner of an SMB in any industry. Creates ads, runs campaigns and answers leads. Sees only own business data.", TEAL],
    ["Administrator", "Operates the platform: users, AI usage, Meta health, jobs, referrals and dataset. No lead PII.", ORANGE],
    ["Public Visitor", "Browses the website, pricing and free diagnostic, enquires or registers. No dashboard access.", TEAL],
    ["WhatsApp Prospect", "Lead from a Meta form or the business number. Chats on WhatsApp only and can opt out anytime.", ORANGE],
  ];
  actors.forEach(([t, b, accent], i) => {
    const x = 0.55 + i * 3.08;
    card(s, { x, y: 1.8, w: 2.88, h: 3.25 });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.8, w: 2.88, h: 0.09, fill: { color: accent }, line: NO_LINE() });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 1.12, y: 2.08, w: 0.64, h: 0.64, fill: { color: accent === TEAL ? MINT : PEACH }, line: NO_LINE() });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 1.32, y: 2.2, w: 0.24, h: 0.24, fill: { color: accent }, line: NO_LINE() });
    s.addShape(pptx.ShapeType.roundRect, { x: x + 1.24, y: 2.47, w: 0.4, h: 0.18, rectRadius: 0.08, fill: { color: accent }, line: NO_LINE() });
    s.addText(t, { x: x + 0.1, y: 2.84, w: 2.68, h: 0.42, fontFace: FONT, fontSize: 15, bold: true, color: INK, align: "center", valign: "middle" });
    s.addText(b, { x: x + 0.22, y: 3.32, w: 2.44, h: 1.65, ...LIST, fontSize: 12, color: MUTED, align: "center", lineSpacing: 18 });
  });

  card(s, { x: 0.55, y: 5.3, w: 12.2, h: 1.6 });
  s.addText("EXTERNAL SYSTEM ACTORS", { x: 0.85, y: 5.42, w: 6, h: 0.32, fontFace: FONT, fontSize: 12, bold: true, color: TEAL, charSpacing: 1.5 });
  const systems = ["Meta Platform", "WhatsApp Cloud API", "Stripe", "Google Identity", "AI Service (Gemini / Groq)", "Geocoding", "Email Service", "Job Scheduler"];
  const widths = [1.95, 2.55, 1.2, 2.1, 3.25];
  const widths2 = [1.65, 1.95, 1.95];
  let x = 0.85;
  systems.slice(0, 5).forEach((label, i) => {
    tag(s, { x, y: 5.85, w: widths[i], h: 0.4, label, orange: i % 2 === 1, size: 11.5 });
    x += widths[i] + 0.15;
  });
  x = 0.85;
  systems.slice(5).forEach((label, i) => {
    tag(s, { x, y: 6.35, w: widths2[i], h: 0.4, label, orange: i % 2 === 0, size: 11.5 });
    x += widths2[i] + 0.15;
  });
  s.addText("Non-human actors: authenticated API calls and verified webhooks.", {
    x: 6.95, y: 6.35, w: 5.7, h: 0.4, fontFace: FONT, fontSize: 11, color: MUTED, valign: "middle",
  });
}

/* ------------------------------------------------------------------ */
/* Slide 7 - System Use Case Diagram                                   */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 05", "Use Case Diagram: System Level");

  framedImage(s, { path: img(3), pw: 3200, ph: 2740, x: 0.55, y: 1.68, w: 6.25, h: 5.25, pad: 0.1 });

  card(s, { x: 7.0, y: 1.68, w: 5.75, h: 5.25 });
  s.addText("14 use cases  |  4 human actors", { x: 7.28, y: 1.82, w: 5.3, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: INK, valign: "middle" });
  const groups = [
    ["Business user", "11 use cases: set up, generate, media, deploy, monitor, leads, takeover, billing", TEAL],
    ["Public visitor", "UC01 register, UC13 explore and enquire", ORANGE],
    ["WhatsApp prospect", "UC08 nurture and qualify a prospect", TEAL],
    ["Administrator", "UC11 operate platform, UC12 referrals and knowledge", ORANGE],
  ];
  groups.forEach(([t, b, accent], i) => {
    const y = 2.34 + i * 1.02;
    s.addShape(pptx.ShapeType.rect, { x: 7.28, y, w: 0.06, h: 0.88, fill: { color: accent }, line: NO_LINE() });
    s.addText(t, { x: 7.48, y, w: 5.1, h: 0.32, fontFace: FONT, fontSize: 13.5, bold: true, color: INK, valign: "middle" });
    s.addText(b, { x: 7.48, y: y + 0.34, w: 5.1, h: 0.54, ...LIST, fontSize: 11.5, color: MUTED, lineSpacing: 16 });
  });
  s.addText("External systems appear in the detailed diagrams (SRS Fig. 2.2-2.7).", {
    x: 7.28, y: 6.42, w: 5.3, h: 0.36, fontFace: FONT, fontSize: 10.5, italic: true, color: MUTED, valign: "middle",
  });
}

/* ------------------------------------------------------------------ */
/* Slide 8 - Use Case Relationships                                    */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 05", "Use Case Relationships: include & extend");

  framedImage(s, { path: img(5), pw: 2990, ph: 1680, x: 0.55, y: 1.68, w: 7.4, h: 4.35, pad: 0.1 });
  s.addText("Detailed view: ad generation and creative media (UC03, UC04)", {
    x: 0.55, y: 6.12, w: 7.4, h: 0.4, fontFace: FONT, fontSize: 11.5, italic: true, color: MUTED, align: "center", valign: "middle",
  });

  card(s, { x: 8.15, y: 1.68, w: 4.6, h: 2.35 });
  s.addShape(pptx.ShapeType.rect, { x: 8.15, y: 1.68, w: 4.6, h: 0.09, fill: { color: TEAL }, line: NO_LINE() });
  s.addText("«include»  always performed", { x: 8.4, y: 1.86, w: 4.2, h: 0.36, fontFace: FONT, fontSize: 13.5, bold: true, color: TEAL_DEEP, valign: "middle" });
  s.addText(bullets([
    "Generate ad runs the Bradley Filter",
    "Deploy rechecks filter + location",
    "Onboarding resolves the location",
    "Nurturing always scores intent",
  ], 12), { x: 8.42, y: 2.28, w: 4.2, h: 1.7, ...LIST, lineSpacing: 21 });

  card(s, { x: 8.15, y: 4.2, w: 4.6, h: 2.72 });
  s.addShape(pptx.ShapeType.rect, { x: 8.15, y: 4.2, w: 4.6, h: 0.09, fill: { color: ORANGE }, line: NO_LINE() });
  s.addText("«extend»  only on a condition", { x: 8.4, y: 4.38, w: 4.2, h: 0.36, fontFace: FONT, fontSize: 13.5, bold: true, color: ORANGE, valign: "middle" });
  s.addText(bullets([
    "Google sign-in or forgot password",
    "Owner asks for onboarding tips",
    "Owner picks an industry template",
    "Plan allows image or video",
    "Owner edits a media asset",
    "Lead score first reaches 70",
  ], 12), { x: 8.42, y: 4.8, w: 4.2, h: 2.05, ...LIST, lineSpacing: 21 });
}

/* ------------------------------------------------------------------ */
/* Slides 9-15 - Mockups with FRs, business rules and event-response   */
/* ------------------------------------------------------------------ */
const workflows = [
  {
    title: "Workflow 1: Business Onboarding",
    screen: "M01-S01  Business Onboarding Wizard",
    image: [10, 1015, 836],
    frs: [
      ["FR-001", "Guided steps with validation and progress"],
      ["FR-005", "Resume the latest incomplete step"],
      ["FR-087", "Name, industry, offer, audience, tone, location required"],
    ],
    brs: [["BR-003", "Location must be resolved"], ["BR-012", "Profile grounds generation"]],
    ev: ["Owner submits a step", "Validate, save step, geocode location", "Invalid step keeps entries, shows errors"],
  },
  {
    title: "Workflow 2: AI Ad Generation",
    screen: "M02-S01  AI Ad Generator",
    image: [11, 1061, 786],
    frs: [
      ["FR-008", "Editable draft from brief + profile"],
      ["FR-011", "Readability and compliance scores"],
      ["FR-012", "Variations bounded by credits"],
    ],
    brs: [["BR-002", "Filter is not Meta approval"], ["BR-006", "Plan limits control credits"]],
    ev: ["EV-01 Generation requested", "Reserve credit, retrieve RAG context, call AI, check, save", "Timeout releases credit; never publishes"],
  },
  {
    title: "Workflow 3: Media Studio",
    screen: "M03-S01  Media Studio and Editor",
    image: [13, 2160, 1350],
    frs: [
      ["FR-017", "JPG/PNG 30 MB, MP4/MOV 250 MB validated"],
      ["FR-019", "Editable captions with timing preview"],
      ["FR-020", "Resize per Meta placement, source kept"],
    ],
    brs: [["BR-010", "Every file has one tenant"], ["BR-001", "Facebook + Instagram sizes"]],
    ev: ["EV-02 Upload or edit done", "Verify type and signature, store privately, new version", "Invalid file rejected; failure keeps source"],
  },
  {
    title: "Workflow 4: Meta Campaign Deployment",
    screen: "M04-S01  Meta Connection and Campaign Review",
    image: [14, 2160, 1821],
    frs: [
      ["FR-026", "Meta OAuth with validated state"],
      ["FR-028", "6 objectives, budget, schedule, review"],
      ["FR-030", "Geocoded location confirmed by owner"],
    ],
    brs: [["BR-005", "Bad token blocks Meta writes"], ["BR-009", "Owner action publishes"]],
    ev: ["EV-04 Campaign submit", "Recheck entitlement and token, create Meta objects, store IDs", "Keep last state; reconcile before retry"],
  },
  {
    title: "Workflow 5: Lead Management",
    screen: "M05-S01  Leads Workspace",
    image: [18, 2160, 1350],
    frs: [
      ["FR-037", "Upsert leads by tenant + Meta lead ID"],
      ["FR-038", "Manual refresh with last sync time"],
      ["FR-041", "Search, filter, status incl. Do not contact"],
    ],
    brs: [["BR-008", "Leads visible to owner only"], ["BR-011", "DNC stops automation"]],
    ev: ["EV-06 Lead sync or Refresh", "Fetch pages, upsert, encrypt PII, keep owner notes", "Partial failure keeps cursor and records"],
  },
  {
    title: "Workflow 6: AI WhatsApp Nurturing",
    screen: "M06-S01  WhatsApp AI Agent and Takeover",
    image: [21, 1309, 799],
    frs: [
      ["FR-044", "Send only with opt-in and entitlement"],
      ["FR-046", "Intent score 0-100 with reason"],
      ["FR-052", "Owner takeover pauses the AI"],
    ],
    brs: [["BR-011", "Takeover / STOP halts replies"], ["BR-008", "Transcripts stay private"]],
    ev: ["EV-08 Nurturing job due", "Recheck opt-in, use template outside 24 h, send, store ID", "Retry after 1, 5, 15 min; hold if no template"],
  },
  {
    title: "Workflow 7: Subscription & Billing",
    screen: "M07-S01  Billing and Subscription",
    image: [22, 2160, 1350],
    frs: [
      ["FR-053", "Stripe Checkout from server-side price"],
      ["FR-054", "14-day card-backed free trial"],
      ["FR-057", "Access matrix enforced on API + jobs"],
    ],
    brs: [["BR-006", "Status controls actions"], ["BR-007", "AUD incl. GST pricing"]],
    ev: ["EV-12 Stripe webhook", "Verify signature, dedupe, fetch subscription, update credits", "Invalid signature changes nothing"],
  },
];

workflows.forEach((wf) => {
  const s = contentSlide("Section 06  |  Mockups, FRs, Rules & Events", wf.title);
  const [n, pw, ph] = wf.image;

  framedImage(s, { path: img(n), pw, ph, x: 0.55, y: 1.68, w: 6.95, h: 3.88, pad: 0.1 });
  tag(s, { x: 0.55, y: 5.64, w: 6.95, h: 0.34, label: wf.screen, size: 11.5 });

  card(s, { x: 7.7, y: 1.68, w: 5.05, h: 2.6 });
  s.addShape(pptx.ShapeType.rect, { x: 7.7, y: 1.68, w: 5.05, h: 0.09, fill: { color: TEAL }, line: NO_LINE() });
  s.addText("Functional requirements", { x: 7.95, y: 1.84, w: 4.6, h: 0.36, fontFace: FONT, fontSize: 14, bold: true, color: INK, valign: "middle" });
  wf.frs.forEach(([id, text], i) => {
    const y = 2.26 + i * 0.66;
    tag(s, { x: 7.95, y: y + 0.1, w: 0.98, label: id, size: 10.5 });
    s.addText(text, { x: 9.04, y, w: 3.58, h: 0.58, fontFace: FONT, fontSize: 11.5, color: MUTED, valign: "middle", lineSpacing: 15 });
  });

  card(s, { x: 7.7, y: 4.42, w: 5.05, h: 1.56 });
  s.addShape(pptx.ShapeType.rect, { x: 7.7, y: 4.42, w: 5.05, h: 0.09, fill: { color: ORANGE }, line: NO_LINE() });
  s.addText("Business rules", { x: 7.95, y: 4.56, w: 4.6, h: 0.36, fontFace: FONT, fontSize: 14, bold: true, color: INK, valign: "middle" });
  wf.brs.forEach(([id, text], i) => {
    const y = 4.98 + i * 0.48;
    tag(s, { x: 7.95, y: y + 0.05, w: 0.98, label: id, orange: true, size: 10.5 });
    s.addText(text, { x: 9.04, y, w: 3.58, h: 0.42, fontFace: FONT, fontSize: 11.5, color: MUTED, valign: "middle" });
  });

  const [event, response, exception] = wf.ev;
  s.addTable(
    [
      [
        { text: "Event / trigger", options: { fill: TEAL_DARK, color: WHITE, bold: true, fontSize: 10.5 } },
        { text: "System response", options: { fill: TEAL_DARK, color: WHITE, bold: true, fontSize: 10.5 } },
        { text: "Exception handling", options: { fill: TEAL_DARK, color: WHITE, bold: true, fontSize: 10.5 } },
      ],
      [
        { text: event, options: { fill: WHITE, color: INK, bold: true, fontSize: 11 } },
        { text: response, options: { fill: WHITE, color: MUTED, fontSize: 11 } },
        { text: exception, options: { fill: WHITE, color: "9A3412", fontSize: 11 } },
      ],
    ],
    {
      x: 0.55, y: 6.12, w: 12.2, colW: [2.9, 5.3, 4.0], rowH: [0.3, 0.42],
      border: { type: "solid", color: LINE, pt: 1 }, fontFace: FONT, margin: [0.03, 0.1, 0.03, 0.1], valign: "middle",
    },
  );
});

/* ------------------------------------------------------------------ */
/* Slide 16 - Non-Functional Requirements: quality attributes          */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 07", "Non-Functional Requirements");

  const groups = [
    ["Performance", TEAL, [
      "95% of pages usable within 4 s",
      "95% of API reads under 500 ms",
      "Ad draft or failure within 30 s",
      "Webhooks acknowledged in 2 s",
    ]],
    ["Security", ORANGE, [
      "Lead PII encrypted at rest",
      "HTTPS with TLS 1.2+ everywhere",
      "Zero cross-tenant access",
      "Signed webhooks; no leaked secrets",
    ]],
    ["Usability", TEAL, [
      "4 of 5 novices draft an ad in 15 min",
      "WCAG 2.2 AA, 4.5:1 text contrast",
      "Pending state shown within 1 s",
      "Errors name the field, keep input",
    ]],
    ["Reliability", ORANGE, [
      "99.5% monthly availability",
      "MTBF of at least 720 hours",
      "Replays create zero duplicates",
      "Last good data kept on failure",
    ]],
  ];
  groups.forEach(([title, accent, items], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.22;
    const y = 1.76 + row * 2.6;
    card(s, { x, y, w: 5.98, h: 2.42 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 5.98, h: 0.09, fill: { color: accent }, line: NO_LINE() });
    s.addText(title, { x: x + 0.3, y: y + 0.22, w: 3.5, h: 0.4, fontFace: FONT, fontSize: 17, bold: true, color: INK, valign: "middle" });
    const code = { Performance: "NFR-PER", Security: "NFR-SEC", Usability: "NFR-USE", Reliability: "NFR-REL" }[title];
    tag(s, { x: x + 4.3, y: y + 0.26, w: 1.42, label: code, orange: accent === ORANGE, size: 10.5 });
    s.addText(bullets(items, 13.5), { x: x + 0.34, y: y + 0.76, w: 5.4, h: 1.56, ...LIST, lineSpacing: 23 });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 17 - External Interfaces & Constraints                        */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 07", "External Interfaces & Constraints");

  const ifaces = [
    ["User Interfaces", "Campaignly design system, sidebar navigation, labelled status badges, confirmations on risky actions, keyboard support.", TEAL],
    ["Software Interfaces", "Meta Marketing API + Lead Ads, WhatsApp Cloud API, Stripe, Google OIDC, Gemini and Groq, geocoder, email, AWS S3.", ORANGE],
    ["Hardware Interfaces", "No direct hardware. Any computer, tablet or phone with a modern browser; hosting sized to the performance targets.", TEAL],
    ["Communications", "HTTPS + JSON, email and in-app alerts, WhatsApp via the business number only, verify-then-acknowledge webhooks.", ORANGE],
  ];
  ifaces.forEach(([t, b, accent], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.22;
    const y = 1.76 + row * 1.66;
    card(s, { x, y, w: 5.98, h: 1.5 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.09, h: 1.5, fill: { color: accent }, line: NO_LINE() });
    s.addText(t, { x: x + 0.32, y: y + 0.14, w: 5.4, h: 0.38, fontFace: FONT, fontSize: 15, bold: true, color: INK, valign: "middle" });
    s.addText(b, { x: x + 0.32, y: y + 0.56, w: 5.45, h: 0.88, ...LIST, fontSize: 12, color: MUTED, lineSpacing: 17 });
  });

  card(s, { x: 0.55, y: 5.18, w: 12.2, h: 1.72 });
  s.addText("CONSTRAINTS & OPERATING ENVIRONMENT", { x: 0.85, y: 5.3, w: 8, h: 0.32, fontFace: FONT, fontSize: 12, bold: true, color: TEAL, charSpacing: 1.5 });
  const cons = [
    "Next.js, logic on server only",
    "Prisma: SQLite, then PostgreSQL",
    "Meta APIs after app review",
    "Stripe only; no card storage",
    "4 major browsers, 360-1920 px",
    "Secrets only in server config",
  ];
  cons.forEach((t, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    s.addText(bullets([t], 12), { x: 0.85 + col * 4.0, y: 5.72 + row * 0.5, w: 3.95, h: 0.44, ...LIST, valign: "middle" });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 18 - Thank You                                                */
/* ------------------------------------------------------------------ */
{
  const s = pptx.addSlide();
  s.background = { color: TEAL_DARK };
  s.addShape(pptx.ShapeType.ellipse, { x: -2.0, y: H - 3.2, w: 6.0, h: 6.0, fill: { color: TEAL_DEEP }, line: NO_LINE() });
  s.addShape(pptx.ShapeType.ellipse, { x: W - 3.4, y: -2.2, w: 6.0, h: 6.0, fill: { color: TEAL_DEEP }, line: NO_LINE() });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.18, w: W, h: 0.18, fill: { color: ORANGE }, line: NO_LINE() });

  logoMark(s, W / 2 - 0.5, 1.95, 1.0);
  s.addText("Thank You", { x: 0, y: 3.15, w: W, h: 1.0, fontFace: FONT, fontSize: 52, bold: true, color: WHITE, align: "center" });
  s.addShape(pptx.ShapeType.rect, { x: W / 2 - 0.8, y: 4.18, w: 1.6, h: 0.08, fill: { color: ORANGE }, line: NO_LINE() });
  s.addText("Questions & Discussion", { x: 0, y: 4.4, w: W, h: 0.44, fontFace: FONT, fontSize: 18, color: "C3E6E1", align: "center" });
  s.addText("Majid Farooq Qureshi (FA23-BCS-045)     |     Habib Ur Rehman (FA23-BCS-116)\nSupervisor: Ms. Saadia Maqbool     |     COMSATS University Islamabad", {
    x: 0, y: 5.45, w: W, h: 0.9, fontFace: FONT, fontSize: 14, color: "8FC9C2", align: "center", lineSpacing: 24,
  });
}

const out = process.env.DECK_OUT || "D:/Campaignly/Campaignly.AI - SRS Presentation.pptx";
await pptx.writeFile({ fileName: out });
console.log("Written:", out);
