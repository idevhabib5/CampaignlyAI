import PptxGenJS from "pptxgenjs";

const TEAL = "0F766E";
const TEAL_DEEP = "0A5C56";
const TEAL_DARK = "042F2E";
const ORANGE = "EA580C";
const INK = "0C1A1A";
const MUTED = "2E3B3D";
const SURFACE = "F4F7F6";
const LINE = "D7E0DE";
const MINT = "ECFDF5";
const WHITE = "FFFFFF";
// Verdana is hinted for screen rendering and has the largest x-height of the system
// fonts, so it stays sharp on low-contrast projectors. It is also ~15% wider than
// Segoe UI, which is why the layouts below run tighter point sizes for the same
// apparent letter height.
const FONT = "Verdana";
const FONT_HEAD = "Verdana";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Majid Farooq Qureshi & Habib Ur Rehman";
pptx.company = "COMSATS University Islamabad";
pptx.title = "Campaignly.AI - Final Year Project Proposal";

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
    x: 0.55, y: 0.17, w: 8, h: 0.32,
    fontFace: FONT_HEAD, fontSize: 11.5, bold: true, color: "5EEAD4", charSpacing: 2,
  });
  slide.addText(title, {
    x: 0.52, y: 0.52, w: 10.6, h: 0.78,
    fontFace: FONT_HEAD, fontSize: 27, bold: true, color: WHITE,
  });

  logoMark(slide, W - 1.4, 0.34, 0.72);

  slide.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.46, w: W, h: 0.46, fill: { color: WHITE }, line: NO_LINE() });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.46, w: W, h: 0.02, fill: { color: LINE }, line: NO_LINE() });
  slide.addText("Campaignly.AI  |  FYP Proposal 2025-26", {
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

const bullets = (items, size) =>
  items.map((t) => ({ text: t, options: { bullet: { code: "25AA", indent: 14 }, color: MUTED, fontSize: size, breakLine: true } }));

// addText anchors vertically centred by default, which leaves a gap under list headings.
const LIST = { fontFace: FONT, valign: "top" };

/* ------------------------------------------------------------------ */
/* Slide 1 - Cover                                                     */
/* ------------------------------------------------------------------ */
{
  const s = pptx.addSlide();
  s.background = { color: TEAL_DARK };
  s.addShape(pptx.ShapeType.ellipse, { x: -2.2, y: -2.4, w: 6.5, h: 6.5, fill: { color: TEAL_DEEP }, line: NO_LINE() });
  s.addShape(pptx.ShapeType.ellipse, { x: W - 3.1, y: H - 3.0, w: 5.4, h: 5.4, fill: { color: TEAL_DEEP }, line: NO_LINE() });
  s.addShape(pptx.ShapeType.ellipse, { x: W - 1.9, y: -1.1, w: 2.6, h: 2.6, fill: { color: TEAL }, line: NO_LINE() });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.18, w: W, h: 0.18, fill: { color: ORANGE }, line: NO_LINE() });

  logoMark(s, 0.95, 0.72, 1.1);

  s.addText("FINAL YEAR PROJECT PROPOSAL  |  2025-26", {
    x: 0.95, y: 2.05, w: 9, h: 0.34, fontFace: FONT, fontSize: 14, bold: true, color: "5EEAD4", charSpacing: 2.5,
  });
  s.addText("Campaignly.AI", {
    x: 0.9, y: 2.42, w: 10, h: 1.15, fontFace: FONT, fontSize: 60, bold: true, color: WHITE,
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.95, y: 3.6, w: 1.6, h: 0.08, fill: { color: ORANGE }, line: NO_LINE() });
  s.addText("AI that writes, launches and nurtures your Meta ad campaigns.", {
    x: 0.9, y: 3.85, w: 9.5, h: 0.5, fontFace: FONT, fontSize: 20, color: "C3E6E1",
  });

  const people = [
    ["Presented By", "Majid Farooq Qureshi   FA23-BCS-045\nHabib Ur Rehman   FA23-BCS-116"],
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
/* Slide 2 - Project Title & Aim                                       */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 01", "Project Title & Aim");

  card(s, { x: 0.55, y: 1.78, w: 12.2, h: 1.7 });
  s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 1.78, w: 0.1, h: 1.7, fill: { color: TEAL }, line: NO_LINE() });
  s.addText("PROJECT TITLE", { x: 0.92, y: 1.98, w: 5, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: TEAL, charSpacing: 1.5 });
  s.addText("Campaignly.AI - AI-Powered Meta Advertising & Lead Automation", {
    x: 0.9, y: 2.28, w: 11.7, h: 0.52, fontFace: FONT, fontSize: 20, bold: true, color: INK, valign: "middle",
  });
  s.addText("Category C: Problem Solving & Artificial Intelligence   |   Multi-tenant Web SaaS", {
    x: 0.9, y: 2.86, w: 11.7, h: 0.42, fontFace: FONT, fontSize: 12.5, color: MUTED,
  });

  const blocks = [
    ["The Problem", "Meta Ads Manager demands marketing expertise. SMEs juggle disconnected tools for ads, campaigns and leads."],
    ["The Aim", "Turn a short onboarding form into compliant Meta ads, deployed automatically and nurtured by AI."],
    ["The Outcome", "A full lead-generation campaign in minutes. No agency, no Ads Manager, no marketing background."],
  ];
  blocks.forEach(([t, b], i) => {
    const x = 0.55 + i * 4.13;
    card(s, { x, y: 3.75, w: 3.85, h: 2.85 });
    chip(s, { x: x + 0.3, y: 4.0, label: String(i + 1), fill: i === 1 ? ORANGE : TEAL });
    s.addText(t, { x: x + 0.92, y: 4.0, w: 2.8, h: 0.48, fontFace: FONT, fontSize: 18, bold: true, color: INK, valign: "middle" });
    s.addText(b, { x: x + 0.3, y: 4.68, w: 3.3, h: 1.7, fontFace: FONT, fontSize: 15, color: MUTED, lineSpacing: 24 });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 3 - Existing Solutions                                        */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 02", "Existing Solutions & Gap");

  const head = ["Existing System", "Shortcoming", "Campaignly.AI"];
  const rows = [
    ["Meta Ads Manager", "Steep learning curve, no lead management", "Automates campaigns, centralises leads"],
    ["AdEspresso", "Weak AI, no onboarding personalisation", "Industry-aware AI with guided onboarding"],
    ["Revealbot", "Post-launch optimisation only", "Full lifecycle, onboarding to conversion"],
    ["Jasper / Copy.ai", "No Meta integration or compliance", "Compliant, Meta-ready ads auto-deployed"],
    ["HighLevel", "Complex setup, weak AI generation", "AI-first, simplified end-to-end system"],
  ];

  const tableRows = [
    head.map((h) => ({
      text: h,
      options: { fill: TEAL_DARK, color: WHITE, bold: true, fontSize: 15, align: "left", valign: "middle" },
    })),
    ...rows.map((r, i) =>
      r.map((cell, c) => ({
        text: cell,
        options: {
          fill: i % 2 === 0 ? WHITE : "EEF4F3",
          color: c === 2 ? TEAL_DEEP : c === 0 ? INK : MUTED,
          bold: c === 0,
          fontSize: 13.5,
          valign: "middle",
        },
      })),
    ),
  ];

  s.addTable(tableRows, {
    x: 0.55, y: 1.85, w: 12.2,
    colW: [3.2, 4.5, 4.5],
    rowH: [0.5, 0.72, 0.72, 0.72, 0.72, 0.72],
    border: { type: "solid", color: LINE, pt: 1 },
    fontFace: FONT,
    margin: 0.12,
  });

  card(s, { x: 0.55, y: 6.1, w: 12.2, h: 0.82, fill: "FFF7ED", border: "FDBA74" });
  s.addText("The gap: nobody combines guided onboarding, compliant AI ad generation, Meta deployment and WhatsApp nurturing.", {
    x: 0.82, y: 6.12, w: 11.7, h: 0.78, fontFace: FONT, fontSize: 15, color: "9A3412", valign: "middle",
  });
}

/* ------------------------------------------------------------------ */
/* Slide 4 - Objectives                                                */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 03", "Objectives");

  const objectives = [
    ["BO-1", "Guided, non-technical campaign creation"],
    ["BO-2", "AI ad copy tailored to each industry"],
    ["BO-3", "Automated deployment via Meta Graph API"],
    ["BO-4", "Integrated, encrypted lead management"],
    ["BO-5", "Stripe subscriptions with free trials"],
    ["BO-6", "Automated performance and lead sync"],
    ["BO-7", "Admin dashboard for users and analytics"],
    ["BO-8", "RAG-based Bradley Filter for compliance"],
    ["BO-9", "Autonomous WhatsApp nurturing agent"],
  ];

  objectives.forEach(([code, text], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.55 + col * 4.13;
    const y = 1.82 + row * 1.68;
    card(s, { x, y, w: 3.85, h: 1.48 });
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.28, y: y + 0.22, w: 0.92, h: 0.38, rectRadius: 0.08,
      fill: { color: i % 3 === 1 ? "FFF1E7" : MINT }, line: NO_LINE(),
    });
    s.addText(code, {
      x: x + 0.28, y: y + 0.22, w: 0.92, h: 0.38,
      fontFace: FONT, fontSize: 13, bold: true, color: i % 3 === 1 ? ORANGE : TEAL_DEEP, align: "center", valign: "middle",
    });
    s.addText(text, { x: x + 0.28, y: y + 0.68, w: 3.35, h: 0.7, fontFace: FONT, fontSize: 15, color: INK, lineSpacing: 22 });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 5 - Complexity of Problem                                     */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 04", "Complexity of the Problem");

  const items = [
    ["RAG + Bradley Filter", "Retrieval grounds every ad in past campaigns and Meta policy; compliance rewrites violations."],
    ["Multi-Industry Personalisation", "One engine adapts tone, offer and targeting across seven very different industries."],
    ["Autonomous Lead Agent", "Scores intent from sentiment and behaviour, times follow-ups, escalates when a lead is ready."],
    ["Distributed Async Processing", "Redis and BullMQ jobs must retry without duplicating Meta spend or messages."],
    ["Third-Party Orchestration", "Meta, Stripe, OAuth, WhatsApp and S3 stay consistent under token expiry, rate limits and out-of-order webhooks."],
  ];

  items.forEach(([t, b], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.22;
    const y = 1.85 + row * 1.42;
    const w = i === 4 ? 12.2 : 5.98;
    card(s, { x, y, w, h: 1.26 });
    chip(s, { x: x + 0.26, y: y + 0.22, w: 0.44, h: 0.44, label: String(i + 1), fill: i % 2 === 0 ? TEAL : ORANGE, size: 13 });
    s.addText(t, { x: x + 0.84, y: y + 0.2, w: w - 1.1, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: INK, valign: "middle" });
    s.addText(b, { x: x + 0.84, y: y + 0.63, w: w - 1.1, h: 0.56, fontFace: FONT, fontSize: 13, color: MUTED, lineSpacing: 18 });
  });

  card(s, { x: 0.55, y: 6.12, w: 12.2, h: 0.8, fill: "ECFDF5", border: "5EEAD4" });
  s.addText("Why it is an FYP: applied LLM engineering, vector retrieval, compliance modelling and distributed systems.", {
    x: 0.82, y: 6.14, w: 11.7, h: 0.76, fontFace: FONT, fontSize: 15, color: TEAL_DEEP, valign: "middle",
  });
}

/* ------------------------------------------------------------------ */
/* Slide 6 - Methodology                                               */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 05", "Methodology");

  const steps = [
    ["Requirements", "Interviews, competitor analysis, SRS."],
    ["System Design", "Architecture, schema, Figma prototypes."],
    ["Knowledge Base", "Embed top ads and Meta policy as vectors."],
    ["AI Layer", "Prompts, RAG pipeline, Bradley Filter."],
    ["Integration", "Meta, Stripe, WhatsApp, S3, BullMQ."],
    ["Testing", "Compliance rate, latency, scoring accuracy."],
    ["Deployment", "Docker on AWS, GitHub Actions CI/CD."],
  ];

  const stepW = 1.66;
  const gap = 0.12;
  steps.forEach(([t, b], i) => {
    const x = 0.55 + i * (stepW + gap);
    const accent = i === 6 ? ORANGE : i % 2 === 0 ? TEAL : TEAL_DEEP;
    card(s, { x, y: 1.95, w: stepW, h: 3.35 });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.95, w: stepW, h: 0.09, fill: { color: accent }, line: NO_LINE() });
    chip(s, { x: x + 0.58, y: 2.22, w: 0.5, h: 0.5, label: `0${i + 1}`, fill: accent, size: 13 });
    s.addText(t, { x: x + 0.06, y: 2.86, w: stepW - 0.12, h: 0.7, fontFace: FONT, fontSize: 12, bold: true, color: INK, align: "center", valign: "top", lineSpacing: 16 });
    s.addText(b, { x: x + 0.08, y: 3.6, w: stepW - 0.16, h: 1.6, fontFace: FONT, fontSize: 10.5, color: MUTED, align: "center", valign: "top", lineSpacing: 15 });
  });

  for (let i = 0; i < steps.length - 1; i += 1) {
    const x = 0.55 + (i + 1) * (stepW + gap) - gap - 0.02;
    s.addShape(pptx.ShapeType.triangle, { x, y: 3.55, w: 0.16, h: 0.14, fill: { color: "B7C9C6" }, line: NO_LINE(), rotate: 90 });
  }

  card(s, { x: 0.55, y: 5.58, w: 12.2, h: 1.3 });
  s.addText("Pipeline", { x: 0.85, y: 5.74, w: 2.0, h: 0.34, fontFace: FONT, fontSize: 13, bold: true, color: TEAL });
  s.addText("Onboarding  >  Retrieval  >  Generation  >  Compliance  >  Media  >  Meta Deployment  >  Leads  >  WhatsApp Agent", {
    x: 0.85, y: 6.1, w: 11.7, h: 0.68, fontFace: FONT, fontSize: 13.5, color: INK, valign: "top", lineSpacing: 22,
  });
}

/* ------------------------------------------------------------------ */
/* Slide 7 - System Modules                                            */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 06", "System Modules");

  const modules = [
    ["01", "Business Onboarding & Brand Setup", "Wizard, brand tone, industry, AI tips", "MFQ"],
    ["02", "AI Advertisement & Content Generation", "Ad copy, templates, RAG, policy checks", "HUR"],
    ["03", "AI Media Editing & Creative Automation", "Video edits, captions, resizing, branding", "MFQ"],
    ["04", "Meta Campaign Automation", "OAuth, campaign creation, targeting, control", "HUR"],
    ["05", "Lead Management System", "Lead sync, encryption, filters, analytics", "MFQ"],
    ["06", "AI WhatsApp Lead Nurturing", "Follow-ups, intent scoring, escalation", "HUR"],
    ["07", "Subscription & Billing", "Stripe checkout, trials, webhooks, gating", "MFQ"],
    ["08", "Admin Dashboard & Operations", "Users, analytics, API health, queues", "HUR"],
    ["09", "Marketing Website", "Landing pages, diagnostics, SEO blog", "MFQ"],
    ["10", "Authentication & User Management", "Email, Google OAuth, JWT, role access", "HUR"],
  ];

  modules.forEach(([num, title, body, owner], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.55 + col * 6.22;
    const y = 1.82 + row * 0.94;
    card(s, { x, y, w: 5.98, h: 0.84 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 0.84, fill: { color: owner === "HUR" ? ORANGE : TEAL }, line: NO_LINE() });
    s.addText(num, { x: x + 0.14, y: y + 0.1, w: 0.72, h: 0.64, fontFace: FONT, fontSize: 21, bold: true, color: owner === "HUR" ? "FDBA74" : "99DDD5", align: "center", valign: "middle" });
    s.addText(title, { x: x + 0.92, y: y + 0.08, w: 4.95, h: 0.34, fontFace: FONT, fontSize: 14, bold: true, color: INK, valign: "middle" });
    s.addText(body, { x: x + 0.92, y: y + 0.42, w: 4.95, h: 0.34, fontFace: FONT, fontSize: 11.5, color: MUTED, valign: "middle" });
  });

  s.addText("Work division", { x: 0.55, y: 6.55, w: 2.2, h: 0.34, fontFace: FONT, fontSize: 12, bold: true, color: INK, valign: "middle" });
  s.addShape(pptx.ShapeType.rect, { x: 6.8, y: 6.64, w: 0.18, h: 0.18, fill: { color: TEAL }, line: NO_LINE() });
  s.addText("Majid Farooq Qureshi (045)", { x: 7.05, y: 6.55, w: 3.0, h: 0.34, fontFace: FONT, fontSize: 12, color: MUTED, valign: "middle" });
  s.addShape(pptx.ShapeType.rect, { x: 10.2, y: 6.64, w: 0.18, h: 0.18, fill: { color: ORANGE }, line: NO_LINE() });
  s.addText("Habib Ur Rehman (116)", { x: 10.45, y: 6.55, w: 2.85, h: 0.34, fontFace: FONT, fontSize: 12, color: MUTED, valign: "middle" });
}

/* ------------------------------------------------------------------ */
/* Slide 8 - Tools & Technologies                                      */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 07", "Tools & Technologies");

  const groups = [
    ["Backend & Data", TEAL, ["Node.js 18 + Express 4.18", "MongoDB 6.x", "Redis 7.x + BullMQ"]],
    ["AI & Intelligence", ORANGE, ["LLM APIs for ad copy", "Vector embeddings (RAG)", "Bradley Filter pipeline"]],
    ["Frontend", TEAL, ["Next.js 15 App Router", "React 19", "Tailwind CSS 4.x"]],
    ["Integrations", ORANGE, ["Meta Graph API v18+", "Stripe billing", "Google OAuth + AWS S3"]],
    ["DevOps & Cloud", TEAL, ["Docker", "AWS EC2 + S3", "GitHub Actions CI/CD"]],
    ["Tooling", ORANGE, ["VS Code", "Figma", "Postman"]],
  ];

  groups.forEach(([title, accent, items], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.55 + col * 4.13;
    const y = 1.82 + row * 2.42;
    card(s, { x, y, w: 3.85, h: 2.2 });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 3.85, h: 0.09, fill: { color: accent }, line: NO_LINE() });
    s.addText(title, { x: x + 0.28, y: y + 0.26, w: 3.3, h: 0.36, fontFace: FONT, fontSize: 17, bold: true, color: INK, valign: "middle" });
    s.addText(bullets(items, 14), { x: x + 0.32, y: y + 0.76, w: 3.3, h: 1.3, ...LIST, lineSpacing: 26 });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 9 - Expected Outcomes & Relevance                             */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 08", "Outcomes & Relevance");

  card(s, { x: 0.55, y: 1.82, w: 6.0, h: 4.85 });
  s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 1.82, w: 6.0, h: 0.09, fill: { color: TEAL }, line: NO_LINE() });
  s.addText("Deliverables", { x: 0.88, y: 2.04, w: 5.4, h: 0.4, fontFace: FONT, fontSize: 19, bold: true, color: INK });
  s.addText(
    bullets([
      "Multi-tenant SaaS platform on AWS",
      "AI ad engine with RAG and compliance",
      "Meta Graph API automation engine",
      "Encrypted leads with conversion analytics",
      "WhatsApp agent with lead scoring",
      "Admin console and marketing site",
      "SRS, design docs, test reports, report",
    ], 14.5),
    { x: 0.92, y: 2.6, w: 5.35, h: 3.9, ...LIST, lineSpacing: 27 },
  );

  card(s, { x: 6.75, y: 1.82, w: 6.0, h: 4.85 });
  s.addShape(pptx.ShapeType.rect, { x: 6.75, y: 1.82, w: 6.0, h: 0.09, fill: { color: ORANGE }, line: NO_LINE() });
  s.addText("Relevance & Impact", { x: 7.08, y: 2.04, w: 5.4, h: 0.4, fontFace: FONT, fontSize: 19, bold: true, color: INK });

  const impact = [
    ["Business", "SMEs run agency-grade campaigns without agency cost, in minutes instead of days."],
    ["Academic", "Applies Software Engineering, Databases, Web, Networks, Cloud, AI and Distributed Systems."],
    ["Technical", "AI advertising layer, RAG content enhancement and an autonomous lead agent."],
  ];
  impact.forEach(([t, b], i) => {
    const y = 2.62 + i * 1.38;
    s.addShape(pptx.ShapeType.rect, { x: 7.08, y, w: 0.06, h: 1.18, fill: { color: i === 1 ? TEAL : ORANGE }, line: NO_LINE() });
    s.addText(t, { x: 7.3, y, w: 5.2, h: 0.34, fontFace: FONT, fontSize: 16, bold: true, color: INK });
    s.addText(b, { x: 7.3, y: y + 0.38, w: 5.2, h: 0.82, fontFace: FONT, fontSize: 14, color: MUTED, lineSpacing: 21 });
  });
}

/* ------------------------------------------------------------------ */
/* Slide 10 - Conclusion & Future Work                                 */
/* ------------------------------------------------------------------ */
{
  const s = contentSlide("Section 09", "Conclusion & Future Work");

  card(s, { x: 0.55, y: 1.82, w: 12.2, h: 1.3, fill: TEAL_DARK, border: TEAL_DARK });
  s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 1.82, w: 0.1, h: 1.3, fill: { color: ORANGE }, line: NO_LINE() });
  s.addText("Campaignly.AI removes the expertise barrier from Meta advertising - AI ad generation, compliance, deployment and lead nurturing in one workflow.", {
    x: 0.92, y: 1.9, w: 11.6, h: 1.14, fontFace: FONT, fontSize: 18, color: WHITE, lineSpacing: 28, valign: "middle",
  });

  s.addText("Constraints", { x: 0.55, y: 3.35, w: 6, h: 0.36, fontFace: FONT, fontSize: 18, bold: true, color: INK });
  card(s, { x: 0.55, y: 3.8, w: 6.0, h: 2.85 });
  s.addText(
    bullets([
      "Meta only - no Google or TikTok Ads",
      "Final ad approval rests with Meta's review",
      "Targeting depends on third-party geocoding",
      "No A/B testing or budget optimisation yet",
      "Meta OAuth tokens need periodic reconnection",
    ], 14.5),
    { x: 0.92, y: 4.04, w: 5.4, h: 2.4, ...LIST, lineSpacing: 28 },
  );

  s.addText("Future Work", { x: 6.75, y: 3.35, w: 6, h: 0.36, fontFace: FONT, fontSize: 18, bold: true, color: INK });
  card(s, { x: 6.75, y: 3.8, w: 6.0, h: 2.85 });
  s.addText(
    bullets([
      "Extend to Google, TikTok and LinkedIn Ads",
      "Automated A/B testing and budget optimisation",
      "Fine-tune a model on performance data",
      "Nurturing via Instagram DM, email and voice",
      "Multilingual ads and regional compliance",
    ], 14.5),
    { x: 7.12, y: 4.04, w: 5.4, h: 2.4, ...LIST, lineSpacing: 28 },
  );
}

/* ------------------------------------------------------------------ */
/* Slide 11 - Thank You                                                */
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

const out = process.env.DECK_OUT || "D:/Campaignly/Campaignly.AI - FYP Proposal Presentation.pptx";
await pptx.writeFile({ fileName: out });
console.log("Written:", out);
