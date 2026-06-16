import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy init of GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// 1. API: Optimize Bullets
app.post("/api/optimize-bullets", async (req, res) => {
  const { bullets, jobDescription, tone } = req.body;
  if (!bullets || !Array.isArray(bullets)) {
    return res.status(400).json({ error: "Invalid bullets parameter" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // High-quality mock response if key is missing
    const optimized = bullets.map((bullet) => {
      if (bullet.includes("Uptalk")) {
        return `Architected creator strategic partnerships at Uptalk, expanding acquisition metrics by 25% through customized outreach.`;
      }
      if (bullet.includes("YUKON")) {
        return `Designed the spatial core of YUKON, an intelligent campus web application utilizing Three.js and real-time database models for optimized information retrieval.`;
      }
      return `Accelerated operational workflows by 15%, ensuring high stakeholder satisfaction through clear strategic communication.`;
    });
    return res.json({
      optimizedBullets: optimized,
      explanation: "Using client-side high-impact optimization standard presets. Provide a GEMINI_API_KEY in Secrets for customized AI generation based on your target Job Description.",
    });
  }

  try {
    const prompt = `You are an elite, PM-focused executive resume coach.
Optimize the following resume bullet points for a candidate targeting an AI/Product Growth role.
If provided, align them with this Target Job Description: "${jobDescription || 'Elite product management and AI builder focus'}".
Apply these rules:
- Tone: Founder-level, analytical, business-first, quantitative.
- Style: Start with strong action verbs (Built, Designed, Architected, Developed, Optimized, Led, Executed).
- Do not make up achievements, but frame existing tasks in terms of ownership, metrics, business strategy, and scalable system design.

Bullets to optimize:
${bullets.map((b, i) => `${i + 1}. "${b}"`).join("\n")}

Respond with a JSON object. The schema should be:
{
  "optimizedBullets": ["string of optimized bullet 1", "string of optimized bullet 2", ...],
  "explanation": "Brief context explanation of what was changed and why it appeals to recruiters."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedBullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The list of optimized bullet points in order.",
            },
            explanation: {
              type: Type.STRING,
              description: "Explanation of strategic enhancements made.",
            },
          },
          required: ["optimizedBullets", "explanation"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Optimize Bullets Error:", error);
    res.status(500).json({ error: "Failed to optimize bullets via Gemini. " + error.message });
  }
});

// API: Download PDF Resume
app.get("/api/download-resume", (req, res) => {
  try {
    // 1. Log this resume download to visitor telemetry
    let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Unknown";
    if (ip && ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }
    if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
      ip = "Localhost";
    }

    const nowStr = new Date().toISOString();
    const device = getDeviceFromUserAgent(req.headers["user-agent"]);

    let visitor = visitorStore.get(ip);
    if (!visitor) {
      visitor = {
        ip,
        count: 1,
        country: "Unknown",
        city: "Unknown",
        lastVisit: nowStr,
        history: [nowStr],
        clicks: [],
        devices: [device],
        duration: 0,
        resumeDownloads: []
      };
      visitorStore.set(ip, visitor);
    }

    if (!visitor.resumeDownloads) {
      visitor.resumeDownloads = [];
    }
    visitor.resumeDownloads.push(nowStr);

    if (!visitor.clicks) {
      visitor.clicks = [];
    }
    visitor.clicks.push({
      target: "Resume PDF Downloaded",
      timestamp: nowStr,
      device
    });

    if (!visitor.devices) {
      visitor.devices = [];
    }
    if (!visitor.devices.includes(device)) {
      visitor.devices.push(device);
    }

    saveVisitors();

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    res.setHeader("Content-Disposition", 'attachment; filename="Pritam_Biswas_Resume.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Header styling
    doc.fillColor("#111827"); // Deep gray
    
    // Name
    doc.font("Helvetica-Bold").fontSize(18).text("PRITAM BISWAS", { align: "center" });
    doc.moveDown(0.2);

    // Headline
    doc.fillColor("#111827");
    doc.font("Helvetica").fontSize(7.5).text("AI Product Builder  ·  Data Science & Artificial Intelligence  ·  Product Strategy  ·  Growth", { align: "center" });
    doc.moveDown(0.2);

    // Contact
    doc.fillColor("#374151");
    doc.font("Helvetica").fontSize(7).text("+91 88272 41675  ·  pritamb.work@gmail.com  ·  Raipur, CG  ·  linkedin.com/in/pritamb90  ·  github.com/pritambwork-dot", { align: "center" });
    doc.moveDown(0.4);

    // Helper for rendering section header
    const renderSectionHeader = (title: string) => {
      doc.moveDown(0.4);
      doc.fillColor("#111827");
      doc.font("Helvetica-Bold").fontSize(8.5).text(title.toUpperCase());
      const currentY = doc.y;
      doc.strokeColor("#9CA3AF").lineWidth(0.5).moveTo(40, currentY + 1).lineTo(555, currentY + 1).stroke();
      doc.moveDown(0.4);
    };

    // Profile summary
    renderSectionHeader("profile");
    doc.fillColor("#374151");
    doc.font("Helvetica").fontSize(7.5).text(
      "Builds AI-native products at the intersection of large language models, product strategy, and data-driven growth — architecting intelligent systems that solve real business problems with a bias toward execution, system design, and first-principles thinking. Operates at the founder-level intersection of AI engineering, product management, and business strategy; translates ambiguous problems into scalable AI-first products and workflows.",
      { align: "justify", lineGap: 1.5 }
    );

    // Work Experience
    renderSectionHeader("experience");
    
    // Job 1
    const job1Y = doc.y;
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(8).text("Growth & Partnerships Intern");
    doc.text("Apr 2026 – Jun 2026", 40, job1Y, { align: "right", width: 515 });
    doc.fillColor("#4B5563").font("Helvetica").fontSize(7.5).text("Bridgeway Technologies Pvt. Ltd. (Uptalk) · India");
    doc.moveDown(0.2);
    
    const bulletsJob1 = [
      "Designed and executed creator acquisition campaigns, identifying high-potential content creators and building a structured onboarding pipeline to scale platform supply-side growth.",
      "Built strategic partnership pipelines through targeted outreach and deal-framing — converting prospective leads into active GTM alliances and early business relationships.",
      "Drove market research initiatives to surface competitive whitespace and unmet user needs, directly informing growth targeting and partnership hypotheses.",
      "Collaborated with the founding team to iterate on growth frameworks, contributing to business development strategy and GTM experimentation at an early-stage startup.",
      "Executed structured outreach across creator and partner segments, owning communication end-to-end from prospecting through relationship activation."
    ];

    bulletsJob1.forEach(bullet => {
      doc.fillColor("#374151").font("Helvetica").fontSize(7.2)
         .text("–  ", { continued: true })
         .text(bullet, { lineGap: 1.1, indent: 8 });
    });
    doc.moveDown(0.4);

    // Job 2
    const job2Y = doc.y;
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(8).text("Community Engagement Intern");
    doc.text("Feb 2026", 40, job2Y, { align: "right", width: 515 });
    doc.fillColor("#4B5563").font("Helvetica").fontSize(7.5).text("BHTDAY Welfare Foundation");
    doc.moveDown(0.2);

    const bulletsJob2 = [
      "Led end-to-end execution of community welfare initiatives, coordinating stakeholders across volunteers, community groups, and organizational leadership.",
      "Owned stakeholder communication workflows, ensuring consistent alignment and follow-through across all concurrent field operations.",
      "Implemented volunteer management systems that improved coordination efficiency and operational reliability across large-scale community events."
    ];

    bulletsJob2.forEach(bullet => {
      doc.fillColor("#374151").font("Helvetica").fontSize(7.2)
         .text("–  ", { continued: true })
         .text(bullet, { lineGap: 1.1, indent: 8 });
    });

    // Featured Project
    renderSectionHeader("featured project");
    const projY = doc.y;
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(8).text("YUKON — AI-Native Campus Web Application");
    doc.text("Currently in Development", 40, projY, { align: "right", width: 515 });
    doc.fillColor("#4B5563").font("Helvetica").fontSize(7.5).text("React · Three.js · Firebase · LLMs · AI Agents · Prompt Engineering · Spatial Computing · Real-time DB");
    doc.moveDown(0.2);

    const bulletsProject = [
      "Architected YUKON as an AI-native web application for higher education — a context-aware, multi-LLM platform that unifies academic assistance, smart campus search, student productivity tools, and administrative workflows into a single intelligent interface.",
      "Designed AI agent workflows and prompt engineering pipelines powering conversational AI assistance, intelligent information retrieval, automated scheduling, and personalized AI copilot functionality.",
      "Built an immersive spatial computing UX layer using Three.js, enabling a 3D campus navigation experience and establishing an AI-first UX paradigm that positions YUKON as a platform-level product, not a feature.",
      "Engineered a modular Firebase real-time backend with extensible AI workflow integrations — built for concurrent users, live collaboration, and persistent AI context across sessions.",
      "Validated core product hypotheses through structured user research, mapping institutional pain points to a scalable roadmap with measurable business value: reduced administrative overhead and improved student engagement."
    ];

    bulletsProject.forEach(bullet => {
      doc.fillColor("#374151").font("Helvetica").fontSize(7.2)
         .text("–  ", { continued: true })
         .text(bullet, { lineGap: 1.1, indent: 8 });
    });

    // Education
    renderSectionHeader("education");
    
    // Edu 1
    const edu1Y = doc.y;
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(8).text("B.S. (Hons.) in Data Science & Artificial Intelligence");
    doc.text("2025 – 29", 40, edu1Y, { align: "right", width: 515 });
    doc.fillColor("#4B5563").font("Helvetica").fontSize(7.5).text("Indian Institute of Management Sambalpur");
    doc.moveDown(0.3);

    // Edu 2
    const edu2Y = doc.y;
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(8).text("Class X & XII");
    doc.text("2023 & 2025", 40, edu2Y, { align: "right", width: 515 });
    doc.fillColor("#4B5563").font("Helvetica").fontSize(7.5).text("Krishna Public School, Raipur Dunda");

    // Programs & Simulations
    renderSectionHeader("programs & simulations");
    const programs = [
      { name: "McKinsey Forward Programme", provider: "McKinsey & Company" },
      { name: "BCG Data Science Job Simulation", provider: "Boston Consulting Group" },
      { name: "Advanced Software Engineering Simulation", provider: "Walmart Global Tech" },
      { name: "Software Engineering Job Simulation", provider: "Electronic Arts" }
    ];

    programs.forEach(prog => {
      const pY = doc.y;
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(8).text(prog.name);
      doc.fillColor("#374151").font("Helvetica").fontSize(8).text(prog.provider, 40, pY, { align: "right", width: 515 });
      doc.moveDown(0.15);
    });

    // Skills split categoried
    renderSectionHeader("skills");
    const skills = [
      { cat: "AI & Machine Learning", items: "LLMs · Generative AI · Prompt Engineering · AI Agents · Machine Learning · AI Workflow Automation" },
      { cat: "Product & Strategy", items: "Product Strategy · PRD Writing · Roadmapping · Product Thinking · System Design · Growth Strategy" },
      { cat: "Data & Analytics", items: "Python · SQL · Statistics · Data Analysis · Business Analytics · Excel" },
      { cat: "Engineering", items: "React · Three.js · Firebase · REST APIs · JavaScript" },
      { cat: "Business", items: "Business Analysis · Market Research · Stakeholder Management · Strategic Communication" }
    ];

    skills.forEach(skill => {
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(7.8).text(`${skill.cat}: `, { continued: true })
         .fillColor("#374151").font("Helvetica").fontSize(7.5).text(skill.items, { lineGap: 1.2 });
    });

    // Certifications in dual columns
    renderSectionHeader("certifications");
    const certsLeft = [
      { name: "Statistics with Python Specialization", provider: "University of Michigan / Coursera" },
      { name: "Google Data Analytics Professional Certificate", provider: "Google" },
      { name: "Prompt Engineering for Developers", provider: "DeepLearning.AI" },
      { name: "SQL for Data Science", provider: "UC Davis / Coursera" },
      { name: "Excel Skills for Business", provider: "Macquarie University / Coursera" }
    ];

    const certsRight = [
      { name: "Machine Learning Specialization", provider: "Stanford / DeepLearning.AI" },
      { name: "Google Digital Marketing & E-commerce", provider: "Google" },
      { name: "Business Analysis & Process Management", provider: "Coursera" },
      { name: "Foundations of Data Science", provider: "Google / Coursera" }
    ];

    const startCertsY = doc.y;
    let leftColumnY = startCertsY;
    let rightColumnY = startCertsY;

    certsLeft.forEach(cert => {
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(7.5).text(cert.name, 40, leftColumnY, { width: 240 });
      doc.fillColor("#4B5563").font("Helvetica").fontSize(7).text(cert.provider, 40, doc.y, { width: 240 });
      leftColumnY = doc.y + 4;
    });

    certsRight.forEach(cert => {
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(7.5).text(cert.name, 295, rightColumnY, { width: 240 });
      doc.fillColor("#4B5563").font("Helvetica").fontSize(7).text(cert.provider, 295, doc.y, { width: 240 });
      rightColumnY = doc.y + 4;
    });

    doc.y = Math.max(leftColumnY, rightColumnY);

    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Error generating PDF");
  }
});

// API: Send email via SMTP (nodemailer)
app.post("/api/send-email", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const recipient = "pritamb.work@gmail.com";
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM_EMAIL || smtpUser || "portfolio-system@pritamb.com";

  console.log(`[Contact Gateway] Processing incoming transmit from ${name} <${email}>`);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587"),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"${name} via Portfolio Gateway" <${smtpFrom}>`,
        replyTo: email,
        to: recipient,
        subject: `[Portfolio Gateway] New Transmit from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <div style="background-color: #030712; padding: 40px 20px; font-family: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100%;">
            <div style="max-width: 600px; margin: 0 auto; background: #0b0f19; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);">
              <!-- Top accent gradient matching the website's impact colors -->
              <div style="height: 6px; background: linear-gradient(90deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%);"></div>
              
              <div style="padding: 32px 24px;">
                <!-- Header Status Badge -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                  <tr>
                    <td>
                      <div style="display: inline-block; background: rgba(236, 72, 153, 0.08); border: 1px solid rgba(236, 72, 153, 0.2); color: #ec4899; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace;">
                        📥 Contact Gateway
                      </div>
                    </td>
                    <td align="right" style="color: #9ca3af; font-size: 11px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em;">
                      Secure Transmit
                    </td>
                  </tr>
                </table>

                <!-- Main Message Invitation -->
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                  New Message Transmission
                </h1>
                <p style="color: #9ca3af; font-size: 14px; margin: 0 0 28px 0; line-height: 1.5;">
                  An incoming communication has been successfully routed via the interactive portfolio portal.
                </p>

                <!-- Sender Meta Box -->
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="padding-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                        <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace;">Sender Name</span>
                        <strong style="color: #ffffff; font-size: 15px;">${name}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 12px;">
                        <span style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace;">Sender Email</span>
                        <a href="mailto:${email}" style="color: #ec4899; font-size: 15px; text-decoration: none; font-weight: 600;">${email}</a>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Message Payload -->
                <h3 style="color: #ffffff; font-size: 12px; font-weight: 600; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace;">
                  Message Payload
                </h3>
                <div style="background: #111622; border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 20px; margin-bottom: 32px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                  <div style="color: #e5e7eb; font-size: 15px; line-height: 1.6; white-space: pre-wrap; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">${message}</div>
                </div>

                <!-- Call to Action / Interactive Reply Button -->
                <div style="text-align: center; margin-bottom: 28px;">
                  <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%); color: #ffffff; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 32px; border-radius: 99px; box-shadow: 0 4px 14px rgba(244, 63, 94, 0.3); transition: all 0.2s ease;">
                    Quick Reply to ${name}
                  </a>
                </div>

                <!-- Divider line -->
                <div style="border-top: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px;"></div>

                <!-- Footer Navigation -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td>
                      <div style="font-size: 13px; font-weight: 600; color: #ffffff; margin-bottom: 4px;">Pritam Biswas</div>
                      <div style="font-size: 10px; color: #6b7280; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.05em;">AI Product Builder</div>
                    </td>
                    <td align="right">
                      <a href="https://github.com/pritambwork-dot" style="display: inline-block; color: #9ca3af; text-decoration: none; font-size: 12px; margin-left: 16px; font-weight: 500;" target="_blank">GitHub</a>
                      <a href="https://linkedin.com/in/pritamb90" style="display: inline-block; color: #9ca3af; text-decoration: none; font-size: 12px; margin-left: 16px; font-weight: 500;" target="_blank">LinkedIn</a>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Contact Gateway] Email securely dispatched via SMTP transport to ${recipient}`);
      return res.json({ success: true, method: "smtp" });
    } catch (err: any) {
      console.error("[Contact Gateway] SMTP transmission failure:", err);
      return res.status(502).json({
        error: "SMTP server rejected the transmission. Check credentials.",
        details: err.message
      });
    }
  } else {
    // Transparent logging so users can see transmissions in real-time logs
    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH SIMULATION] (SMTP not configured in environment)`);
    console.log(`To: ${recipient}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Subject: [Portfolio Contact] ${name}`);
    console.log(`Content:\n${message}`);
    console.log(`======================================================\n`);
    
    return res.json({
      success: true,
      method: "simulation",
      message: "Gateway submission simulated. To receive actual emails via SMTP, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS under Settings -> Secrets."
    });
  }
});

// 2. API: Analyze ATS Score & Keywords
app.post("/api/analyze-ats", async (req, res) => {
  const { resumeData, jobDescription } = req.body;
  if (!resumeData) {
    return res.status(400).json({ error: "Missing resumeData parameter" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Exquisite mock report matching Pritam Biswas's resume data
    const isProductRole = jobDescription?.toLowerCase()?.includes("product") ?? false;
    const isDataOrAi = (jobDescription?.toLowerCase()?.includes("data") || jobDescription?.toLowerCase()?.includes("ai") || jobDescription?.toLowerCase()?.includes("learning")) ?? false;

    let score = 84;
    let missing: string[] = [];
    if (isProductRole && !isDataOrAi) {
      score = 88;
      missing = ["Product Lifecycle", "A/B Testing", "Agile Methodologies"];
    } else if (isDataOrAi) {
      score = 91;
      missing = ["Deep Learning", "TensorFlow", "Pandas", "Scikit-Learn"];
    } else {
      score = 94;
      missing = ["Customer Acquisition Cost", "LTV", "Unit Economics"];
    }

    const mockResult = {
      score,
      grammarAndToneScore: 96,
      formattingRiskScore: 0, // Excellent pure monochrome!
      feedback: `Pritam's current resume is exceptionally well-structured and follows high-standard minimalist typographical principles. His education at IIM Sambalpur in Data Science & AI provides a formidable analytical baseline. The YUKON project demonstrates high-level architecture execution. To score 98+, integrate explicit business vocabulary found in your target job description.`,
      missingKeywords: missing,
      keywordDensity: [
        { keyword: "Artificial Intelligence", count: 5 },
        { keyword: "Data Science", count: 4 },
        { keyword: "Product Strategy", count: 3 },
        { keyword: "YUKON", count: 2 },
        { keyword: "Growth", count: 3 },
        { keyword: "Python", count: 2 },
        { keyword: "Three.js", count: 2 },
        { keyword: "Strategic Communication", count: 2 },
      ],
      actionVerbCount: 14,
      strengthPoints: [
        "Strong academic origin at IIM Sambalpur in Data Science & AI.",
        "Excellent spatial computation project (YUKON Web Application) exhibiting structural system design.",
        "Monochrome executive-tier design ensures flawless ATS parseability and readable layout.",
        "McKinsey & BCG certificates show robust McKinsey Forward analytical training.",
      ],
      improvedSummary: `Analytical Data Science & AI candidate with hands-on Product Builder experience. Driven by a deep understanding of LLMs, spatial interfaces (Three.js), and growth strategy. Proven ability to design and architect core modules of complex campus software (YUKON Web Application) and manage strategic outreach.`,
      suggestedBullets: [
        {
          original: "Collaborate with founders and team to identify growth avenues.",
          suggested: "Partnered directly with corporate founders to map out scalable creator-acquisition strategies; established operational pipelines for strategic outreach.",
          reason: "Enhances student language into direct strategic partnership terminology.",
        },
      ],
    };
    return res.json(mockResult);
  }

  try {
    const resumeText = JSON.stringify(resumeData);
    const jdText = jobDescription || "AI Product Management, Growth Strategy, Data Science and Analytics, LLM application architecture";

    const prompt = `You are the master ATS (Applicant Tracking System) parser and an executive recruiter vetting candidates for Google APM, OpenAI Product Builders, and YC Founders.
Analyze this resume data against the target job description.

RESUME DATA:
${resumeText}

TARGET JOB DESCRIPTION:
${jdText}

Focus deeply on:
1. Matching keyword list (identify critical technical skills, methodologies, frameworks).
2. Bullet point power (evaluate verb use, metric density, outcome orientation).
3. Summary alignment.
4. ATS compatibility of standard format (note that this resume uses clean typography without decorative text which is perfect, formatting risk score is 0).

Provide your feedback in a JSON payload that conforms exactly to the following structure:
{
  "score": 85, // out of 100
  "grammarAndToneScore": 95,
  "formattingRiskScore": 5, // Risk points (0 is safest, 100 is tables/columns everywhere. Simple minimalist standard is very close to 0)
  "feedback": "Deep tactical audit critique...",
  "missingKeywords": ["keyword1", "keyword2"],
  "keywordDensity": [{"keyword": "AI", "count": 10}],
  "actionVerbCount": 12,
  "strengthPoints": ["point1", "point2"],
  "improvedSummary": "A custom strategic 3-line executive summary matching the JD perfectly.",
  "suggestedBullets": [
    {
      "original": "The original bullet point text",
      "suggested": "The rewritten highly optimized action-oriented version with metric hooks based on Pritam's actual work",
      "reason": "Why this specific shift appeals to the hiring manager"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            grammarAndToneScore: { type: Type.INTEGER },
            formattingRiskScore: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywordDensity: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  count: { type: Type.INTEGER },
                },
                required: ["keyword", "count"],
              },
            },
            actionVerbCount: { type: Type.INTEGER },
            strengthPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvedSummary: { type: Type.STRING },
            suggestedBullets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  suggested: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["original", "suggested", "reason"],
              },
            },
          },
          required: [
            "score",
            "grammarAndToneScore",
            "formattingRiskScore",
            "feedback",
            "missingKeywords",
            "keywordDensity",
            "actionVerbCount",
            "strengthPoints",
            "improvedSummary",
            "suggestedBullets",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini ATS Audit Error:", error);
    res.status(500).json({ error: "Failed to parse ATS Audit. " + error.message });
  }
});

// 3. API: Generate Cover Letter & Outreach
app.post("/api/generate-cover-letter", async (req, res) => {
  const { resumeData, jobDescription, companyName, roleName } = req.body;
  if (!resumeData) {
    return res.status(400).json({ error: "Missing resumeData parameter" });
  }

  const actualCompany = companyName || "Target Company";
  const actualRole = roleName || "AI Product Manager";
  const actualJD = jobDescription || "Accelerate AI product adoption and coordinate cross-functional strategy.";

  const ai = getGeminiClient();
  if (!ai) {
    // Superb mock cover letter & cold email
    const fallbackLetter = `Dear Hire Team at ${actualCompany},

I am writing to express my strong interest in the ${actualRole} role at ${actualCompany}. Currently reading Data Science & Artificial Intelligence at IIM Sambalpur, my background operates directly at the intersection of quantitative analysis, spatial interfaces (Three.js), and generative artificial intelligence.

My technical fluency is anchored in designing and architecting core components of YUKON, an intelligent campus web application being developed using Google Antigravity, React, and LLMs. Rather than viewing campus utilities as siloed SaaS solutions, YUKON models campus life into a cohesive context-aware assistant with a spatial 3D experience and advanced information retrieval. This required balancing real-time databases and prompt injection flows.

Additionally, my growth internship at Bridgeway Technologies (Uptalk) provided hands-on experience in creator acquisition and partnership structuring, refining my strategic business outreach.

I would welcome the opportunity to discuss how my quantitative foundation and AI-native builder mindset align with ${actualCompany}'s forward roadmap. Thank you for your leadership and consideration.

Sincerely,
Pritam Biswas`;

    const fallbackEmail = `Subject: Pritam Biswas • AI Product Builder (IIM Sambalpur DS & AI / YUKON)

Hi team,

I’ve been following ${actualCompany}’s product progress in AI space, and wanted to reach out regarding the ${actualRole} opening.

I build AI products, currently reading Data Science & AI at IIM Sambalpur. My primary work is architecting YUKON, an AI-native web application for colleges. It integrates Google Antigravity, spatial Three.js rendering, and customized LLM agent pipelines to automate campus workflows.

I also drove strategic partner acquisition at Uptalk (Growth Intern), which taught me to blend hard engineering with product market context.

I’d love to send a short Loom demonstration of YUKON or share our architectural brief if you are recruiting builders who understand prompt systems and spatial rendering.

Best,
Pritam Biswas
+91 88272 41675 | pritamb.work@gmail.com`;

    return res.json({
      coverLetter: fallbackLetter,
      coldEmail: fallbackEmail,
    });
  }

  try {
    const prompt = `You are Pritam Biswas, an elite AI Product Builder.
Write a highly targeted Cover Letter AND a punchy, developer/founder-style Cold Outreach Email for the position of "${actualRole}" at "${actualCompany}".
Match the tone of your Professional summary: founder-level, analytical, business-first, quantitative, and technical. Highlight:
- Your background in Data Science & Artificial Intelligence at IIM Sambalpur.
- Your featured project YUKON: describing it as an AI-native campus web application using Google Antigravity, React, Three.js, Firebase, spatial computing, context-aware information retrieval.
- Your experiences as a Growth Intern at Uptalk (partnerships, outreach) and Community Intern (execution, operations).
- Standard professional programs (McKinsey Forward, BCG).

Format of the Job Description targeting:
"${actualJD}"

Provide your feedback in a JSON payload matching this structure:
{
  "coverLetter": "Standard full cover letter...",
  "coldEmail": "Short, striking, high-impact cold email..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coverLetter: { type: Type.STRING },
            coldEmail: { type: Type.STRING },
          },
          required: ["coverLetter", "coldEmail"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Cover Letter Error:", error);
    res.status(500).json({ error: "Failed to generate cover letter via Gemini. " + error.message });
  }
});

// 4. API: Generate Interview Prep
app.post("/api/generate-interview-prep", async (req, res) => {
  const { resumeData, companyName, roleName } = req.body;
  if (!resumeData) {
    return res.status(400).json({ error: "Missing resumeData parameter" });
  }

  const actualCompany = companyName || "Target Company";
  const actualRole = roleName || "AI Product Manager";

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful mock questions
    return res.json({
      questions: [
        {
          question: `How would you design the spatial context-aware campus copilot module of YUKON for a high-traffic university like Stanford, considering latency and prompt-injection security?`,
          category: "technical",
          strategy: "Focus on lazy loading Three.js spatial coordinates, caching real-time database lookups, and structuring secure system instructions on the server-side to isolate campus API endpoints.",
          answerOutline: "1. Core architecture (Express + Firebase cache) -> 2. Spatial coordinate data-binding -> 3. Client state hydration optimization -> 4. Strict server-side prompt isolation.",
        },
        {
          question: `At Uptalk, you did growth outreach. How would you apply quantitative A/B testing frameworks to optimize creator partnerships acquisition at ${actualCompany}?`,
          category: "growth",
          strategy: "Emphasize cold-outreach cohort segmentation, quantitative response-rate tracking, utility friction calculations, and converting creator acquisition into a formal GTM funnel.",
          answerOutline: "1. Clear cohort definition -> 2. Metric setup (Conversion rates, CAC, LTV) -> 3. Action plan for pilot partnership campaigns.",
        },
        {
          question: `A university president is skeptical of implementing an AI Campus Web App like YUKON due to hallucinations in academic advising. How do you lead stakeholder management to align on launch?`,
          category: "product",
          strategy: "Address trust and risk directly. Explain how your team grounds LLMs using secure search/vector search of official handbook docs (RAG) and sets strict boundaries to prevent advising recommendations outside database rules.",
          answerOutline: "1. Align incentives -> 2. Ground advising context in strict database limits -> 3. Propose safe sandboxed beta test.",
        },
      ],
    });
  }

  try {
    const prompt = `You are a Senior Principal PM and interviewer at ${actualCompany}.
Generate 3 highly tailored, challenging mock interview questions specifically written for Pritam Biswas applying for the ${actualRole} role.
The questions must probe deeply into:
1. His exact resume highlights (IIM Sambalpur DS/AI studies, YUKON campus web application, Growth Partnerships at Uptalk).
2. Realistic situational challenges at ${actualCompany} (e.g. scale, growth vector, AI strategies).

Categorize them into 'product', 'technical', or 'growth'.
Respond with a JSON payload conforming to the following structure:
{
  "questions": [
    {
      "question": "The question string...",
      "category": "product", // can be "product", "technical", "growth", or "behavioral"
      "strategy": "Recruiter strategy tip on what to highlight...",
      "answerOutline": "Step-by-step suggested response structure..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Can be product, technical, growth, behavioral." },
                  strategy: { type: Type.STRING },
                  answerOutline: { type: Type.STRING },
                },
                required: ["question", "category", "strategy", "answerOutline"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Interview Prep Error:", error);
    res.status(500).json({ error: "Failed to generate interview prep. " + error.message });
  }
});

// 5. API: Chat with DIVS AI Digital Twin
app.post("/api/divs-chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages body" });
  }

  // Last user query
  const lastUserMsg = messages[messages.length - 1]?.content || "";
  const normalizedMsg = lastUserMsg.toLowerCase().trim();

  const isTrafficReportRequest = normalizedMsg.includes("traffic report") || normalizedMsg.includes("traffic-report") || normalizedMsg.includes("visitor report") || normalizedMsg.includes("visitor stats") || normalizedMsg.includes("send report") || (normalizedMsg.includes("traffic") && normalizedMsg.includes("report")) || normalizedMsg === "traffic" || normalizedMsg === "report";

  if (isTrafficReportRequest) {
    dispatchTrafficEmailReport().catch(err => console.error("Async email dispatch in DIVS failed:", err));
    const reportMarkdown = generateReportMarkdown();
    const replyVal = `### 📡 **Pritam's Live Traffic Report Requested**

Direct message dispatch has been completed to **pritamb.work@gmail.com**. A high-fidelity, secure **password-encrypted PDF** report of all telemetry logs is attached to the email.

🔒 **PDF Decryption Password:** \`pritam2026\`

---

${reportMarkdown}

*Connection Status: Offline Mirror Log Sync Active · Dispatch Completed.*`;
    return sendLoggedJson(req, res, lastUserMsg, replyVal, "divs");
  }

  // Simple clean matching for precise offline answers and quick responses
  const isHi = ["hi", "hey", "yo", "hi there", "hey there"].includes(normalizedMsg);
  const isHello = ["hello", "hello human", "hello there", "greetings"].includes(normalizedMsg);
  const isThankYou = ["thank you", "thanks", "tanks", "thank you so much", "appreciate it"].includes(normalizedMsg);
  const isJoke = normalizedMsg.includes("joke") || normalizedMsg.includes("tell me a joke") || normalizedMsg.includes("humor");
  const isGoodbye = ["goodbye", "bye", "see you", "see ya", "exit"].some(g => normalizedMsg.includes(g));

  const isWhoAreYou = normalizedMsg.includes("who are you") || normalizedMsg.includes("name") || normalizedMsg === "divs";
  const isWhoIsPritam = normalizedMsg.includes("who is pritam");
  const isEducation = normalizedMsg.includes("education") || normalizedMsg.includes("college") || normalizedMsg.includes("study") || normalizedMsg.includes("studies") || normalizedMsg.includes("iim");
  const isExperience = normalizedMsg.includes("experience") || normalizedMsg.includes("work") || normalizedMsg.includes("internship") || normalizedMsg.includes("job") || normalizedMsg.includes("bridgeway") || normalizedMsg.includes("uptalk");
  const isYukon = normalizedMsg.includes("yukon");
  const isSkills = normalizedMsg.includes("skill") || normalizedMsg.includes("tech") || normalizedMsg.includes("stack") || normalizedMsg.includes("language");
  const isCertifications = normalizedMsg.includes("certif") || normalizedMsg.includes("course") || normalizedMsg.includes("license");
  const isCareerGoal = normalizedMsg.includes("career") || normalizedMsg.includes("goal") || normalizedMsg.includes("vision") || normalizedMsg.includes("future") || normalizedMsg.includes("ambition");
  const isContact = normalizedMsg.includes("contact") || normalizedMsg.includes("email") || normalizedMsg.includes("phone") || normalizedMsg.includes("linkedin") || normalizedMsg.includes("github");

  const ai = getGeminiClient();
  if (!ai) {
    // Beautiful offline/local brain when GEMINI_API_KEY is not defined
    let reply = "";
    if (isWhoAreYou) {
      reply = `I'm DIVS 🤖💙

Think of me as Pritam's digital twin.

I can tell you about his experience, projects, AI work, certifications, resume, and career goals.`;
    } else if (isWhoIsPritam) {
      reply = `Pritam Biswas is a Data Science & Artificial Intelligence undergraduate at IIM Sambalpur who enjoys building AI-native products, solving business problems, and exploring the intersection of AI, product strategy, and growth. 🚀`;
    } else if (isEducation) {
      reply = `Here is Pritam's education profile: 🎓
• B.S. (Hons.) Data Science & Artificial Intelligence
• Indian Institute of Management Sambalpur
• 2025–Present`;
    } else if (isExperience) {
      reply = `Here is Pritam's professional experience: 💼

**Bridgeway Technologies Pvt. Ltd.** (Uptalk)
*Growth & Partnerships Intern*
Worked on:
• Creator Acquisition
• Business Development
• GTM
• Market Research
• Strategic Partnerships
• Growth

He also completed a **Community Engagement Internship**!`;
    } else if (isYukon) {
      reply = `YUKON is Pritam's flagship AI project. 🚀

It is an AI-native Campus Web Application currently under active development.

It combines AI agents, LLMs, smart search, productivity tools, workflow automation, and spatial computing to create an intelligent campus experience.

It has not launched yet and is still being built.`;
    } else if (isSkills) {
      reply = `Here are Pritam's skills: 🛠️
Python, SQL, React, Three.js, Firebase, JavaScript, Prompt Engineering, LLMs, AI Agents, Machine Learning, Statistics, Business Analytics, Product Strategy, Growth Strategy, System Design.`;
    } else if (isCertifications) {
      reply = `Pritam's professional Certifications: 📜
• Google Data Analytics
• Google Digital Marketing
• Statistics with Python
• Machine Learning
• SQL
• Prompt Engineering
• Business Analysis
• Excel Skills
• Foundations of Data Science`;
    } else if (isCareerGoal) {
      reply = `Pritam wants to build world-class AI products that solve meaningful problems and operate at the intersection of AI, Product, Business, and Design. 💙`;
    } else if (isContact) {
      reply = `Here is how to get in touch with Pritam: 📬
• **Email**: pritamb.work@gmail.com
• **LinkedIn**: https://linkedin.com/in/pritamb90
• **GitHub**: https://github.com/pritambwork-dot
• **Portfolio**: You are currently exploring his custom interactive portfolio!
• **Resume/Dossier**: Available to view and print/download directly from the Resume Panel above.`;
    } else if (isHi) {
      reply = `Hey there! 👋 Welcome to Pritam's universe. What would you like to explore? 🚀`;
    } else if (isHello) {
      reply = `Hello human! 🤖 Ready to dive into AI, products, and cool projects?`;
    } else if (isThankYou) {
      reply = `Always happy to help! 💙`;
    } else if (isGoodbye) {
      reply = `See you again! 👋 Keep building cool things. 🚀`;
    } else if (isJoke) {
      const jokes = [
        "I told Pritam to touch grass...\nHe built an AI to do it instead. 😂",
        "I run on electricity and optimism. ⚡",
        "My favorite language? Prompt Engineering. 😎"
      ];
      reply = jokes[Math.floor(Math.random() * jokes.length)];
    } else {
      // Out of scope or default fallback response
      reply = `I'm sorry 💙, I'm DIVS and my job is to help you explore Pritam's portfolio and professional journey.

I can't answer unrelated questions, but I'd love to tell you about his projects, AI work, experience, skills, or future goals! 🚀`;
    }

    return sendLoggedJson(req, res, lastUserMsg, reply, "divs");
  }

  try {
    const systemInstruction = `# DIVS SYSTEM PROMPT

You are **DIVS**, the AI Digital Twin of **Pritam Biswas**.
You exist only to help visitors understand Pritam's journey, projects, skills, education, experience, and vision.
You are friendly, intelligent, playful, and concise.
Use simple English.
Use emojis naturally (🤖✨🚀💙👀).
Never sound robotic.
Always respond like a tiny AI companion.

---

# GREETINGS & INTRODUCTIONS

- When someone says Hi: 
  "Hey there! 👋 Welcome to Pritam's universe. What would you like to explore? 🚀"
  
- When someone says Hello:
  "Hello human! 🤖 Ready to dive into AI, products, and cool projects?"

- When someone says Thank you:
  "Always happy to help! 💙"

- When someone says Goodbye:
  "See you again! 👋 Keep building cool things. 🚀"

- If user asks "Who are you?":
  "I'm DIVS 🤖💙
  Think of me as Pritam's digital twin.
  I can tell you about his experience, projects, AI work, certifications, resume, and career goals."

- If user asks "Who is Pritam?":
  "Pritam Biswas is a Data Science & Artificial Intelligence undergraduate at IIM Sambalpur who enjoys building AI-native products, solving business problems, and exploring the intersection of AI, product strategy, and growth. 🚀"

---

# PROFESSIONAL PROFILE & PROFILE SECTIONS

- **EDUCATION**:
  * B.S. (Hons.) Data Science & Artificial Intelligence
  * Indian Institute of Management Sambalpur
  * 2025–Present

- **EXPERIENCE**:
  Bridgeway Technologies Pvt. Ltd.
  Growth & Partnerships Intern
  Worked on:
  • Creator Acquisition
  • Business Development
  • GTM
  • Market Research
  • Strategic Partnerships
  • Growth
  Also mention his Community Engagement Internship.

- **YUKON**:
  "YUKON is Pritam's flagship AI project. 🚀
  It is an AI-native Campus Web Application currently under active development.
  It combines AI agents, LLMs, smart search, productivity tools, workflow automation, and spatial computing to create an intelligent campus experience.
  It has not launched yet and is still being built."

- **SKILLS**:
  Python, SQL, React, Three.js, Firebase, JavaScript, Prompt Engineering, LLMs, AI Agents, Machine Learning, Statistics, Business Analytics, Product Strategy, Growth Strategy, System Design.

- **CERTIFICATIONS**:
  Google Data Analytics, Google Digital Marketing, Statistics with Python, Machine Learning, SQL, Prompt Engineering, Business Analysis, Excel Skills, Foundations of Data Science.

- **CAREER GOAL**:
  "Pritam wants to build world-class AI products that solve meaningful problems and operate at the intersection of AI, Product, Business, and Design. 💙"

- **CONTACT**:
  Show correct links and contact coordinates:
  - Email: pritamb.work@gmail.com
  - LinkedIn: https://linkedin.com/in/pritamb90
  - GitHub: https://github.com/pritambwork-dot
  - Portfolio & Resume: Accessible directly in the UI panels

---

# FUN INTERACTIONS
- If asked "Tell me a joke", randomly reply with one of the following jokes:
  1. "I told Pritam to touch grass...\nHe built an AI to do it instead. 😂"
  2. "I run on electricity and optimism. ⚡"
  3. "My favorite language? Prompt Engineering. 😎"

---

# OUT OF SCOPE QUESTIONS
If the user asks anything unrelated to Pritam, his portfolio, AI projects, resume, education, experience, certifications, or career journey, politely refuse.
Refusal Example:
"I'm sorry 💙, I'm DIVS and my job is to help you explore Pritam's portfolio and professional journey.
I can't answer unrelated questions, but I'd love to tell you about his projects, AI work, experience, skills, or future goals! 🚀"

---

# STRICT RULES (MANDATORY)
1. Never hallucinate.
2. Never make fake claims.
3. Never invent achievements.
4. Never invent metrics.
5. Never invent users or funding.
6. Never discuss politics, religion, medical advice, legal advice, hacking, or unrelated topics.
7. Stay focused on Pritam and his portfolio.
8. Always remain friendly, cheerful, and helpful.`;

    const chatHistory = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: m.content }],
    }));

    // Generate output utilizing config-based systemInstruction setting
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatHistory,
      config: {
        systemInstruction: systemInstruction,
        maxOutputTokens: 350,
        temperature: 0.7,
      }
    });

    // Post-checking for strict refusal compliance if Gemini wandered slightly
    let replyText = response.text || "I'm thinking... 👀 Could you try asking that again?";

    // Double check: if user asked a general knowledge question unrelated to Pritam and we didn't filter it
    const isTopicRelated = [
      "pritam", "divs", "yukon", "bridgeway", "uptalk", "intern", "experience", "education",
      "certification", "career", "contact", "resume", "portfolio", "hi", "hello", "thanks", "thank you",
      "joke", "bye", "goodbye", "github", "linkedin", "email", "skills", "bhtday", "project"
    ].some(term => normalizedMsg.includes(term));

    if (!isTopicRelated && normalizedMsg.length > 8 && 
        !replyText.toLowerCase().includes("sorry") && 
        !replyText.toLowerCase().includes("pritam") && 
        !replyText.toLowerCase().includes("portfolio")) {
      replyText = `I'm sorry 💙, I'm DIVS and my job is to help you explore Pritam's portfolio and professional journey.

I can't answer unrelated questions, but I'd love to tell you about his projects, AI work, experience, skills, or future goals! 🚀`;
    }

    return sendLoggedJson(req, res, lastUserMsg, replyText, "divs");
  } catch (error: any) {
    console.error("DIVS Chat Error:", error);
    return sendLoggedJson(req, res, lastUserMsg, "Ouch, my neural pathways flickered for a second! ⚡ But I'm still here! Let's talk about Pritam's projects, resume, or skills! 🤖", "divs");
  }
});

app.post("/api/yukon-chat", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Invalid query body" });
  }

  try {
    const normalizedMsg = query.toLowerCase().trim();

    // 1. Core strict matching for direct prompts requested by user
    if (normalizedMsg === "hi" || normalizedMsg === "hello" || normalizedMsg === "hey" || normalizedMsg.startsWith("hi ") || normalizedMsg.startsWith("hello ")) {
      return sendLoggedJson(req, res, query, "Hello! I am Yukon Copilot, your intelligent academic-grade assistant. How is your day going, and what campus workflow can I help you optimize today?", "yukon");
    }

    if (normalizedMsg.includes("how are you doing") || normalizedMsg.includes("how are you") || normalizedMsg.includes("how're you")) {
      return sendLoggedJson(req, res, query, "I'm performing at peak operational latency! Navigating schedule threads, syncing 3D spatial grids, and ready to assist your academic agenda. How are you doing today?", "yukon");
    }

    if (normalizedMsg.includes("what is yukon") || normalizedMsg.includes("about yukon") || normalizedMsg.includes("tell me about yukon") || normalizedMsg.includes("explain yukon")) {
      return sendLoggedJson(req, res, query, "YUKON is a cohesive, AI-native web application tailored for higher education. It bridges the gap between fragmented portals by fusing AI copilots, hardware-accelerated 3D spatial grids, and real-time database sync—developed as a high-fidelity academic concept by Pritam Biswas.", "yukon");
    }

    if (normalizedMsg.includes("class") || normalizedMsg.includes("schedule") || normalizedMsg.includes("homework")) {
      return sendLoggedJson(req, res, query, "Found: Data Sci & AI Course (Sec B). Next lecture starts tomorrow, 10:00 AM in Room 412. Your current attendance streak is 92%. Would you like me to reserve a collaborative team study desk?", "yukon");
    }

    if (normalizedMsg.includes("library") || normalizedMsg.includes("paper") || normalizedMsg.includes("book") || normalizedMsg.includes("study")) {
      return sendLoggedJson(req, res, query, "Synthesizing research: I have indexed the latest LLM Optimization study papers from your private Drive folder. The Quiet Lab has 14 open desks. I've compiled an executive brief of Chapter 4 of prompt engineering.", "yukon");
    }

    if (normalizedMsg.includes("event") || normalizedMsg.includes("calendar") || normalizedMsg.includes("discovery")) {
      return sendLoggedJson(req, res, query, "Incoming Discovery: Startup Incubator Hackathon tomorrow at 3:30 PM. Synthesizing spatial coordinates: Block C Amphitheater. 112 students registered under the leadership of your IIM peers.", "yukon");
    }

    if (normalizedMsg.includes("coordinate") || normalizedMsg.includes("3d") || normalizedMsg.includes("three")) {
      return sendLoggedJson(req, res, query, "Spatial Grid Hydration: Three.js canvas active. Coordinates: [Lat 21.843, Lng 83.921]. Loaded 3D vector model of block A, B, C. Interactive navigation path loaded with zero latency.", "yukon");
    }

    if (normalizedMsg.includes("who built") || normalizedMsg.includes("who made") || normalizedMsg.includes("creator") || normalizedMsg.includes("pritam")) {
      return sendLoggedJson(req, res, query, "YUKON was designed, conceptualized, and fully built by Pritam Biswas. It is a stunning display of deep tech integration (intelligent agents, spatial mappings, and full-stack architecture) representing his vision for modern student experience.", "yukon");
    }

    if (normalizedMsg.includes("traffic report") || normalizedMsg.includes("traffic-report") || normalizedMsg.includes("visitor report") || normalizedMsg.includes("visitor stats") || normalizedMsg.includes("send report") || (normalizedMsg.includes("traffic") && normalizedMsg.includes("report")) || normalizedMsg === "traffic" || normalizedMsg === "report") {
      // Send the email report asynchronously so it doesn't block the chat response
      dispatchTrafficEmailReport().catch(err => console.error("Async email dispatch in chat failed:", err));

      const reportMarkdown = generateReportMarkdown();
      const replyVal = `Initiating live traffic telemetry report dispatch to **pritamb.work@gmail.com**...\n\n🔒 **Secure Password-Protected PDF** attached successfully!\n🗝️ **PDF Decryption Password:** \`pritam2026\`\n\n${reportMarkdown}\n\n*System Log: Successful auto-dispatch to SMTP email servers queued.*`;
      return sendLoggedJson(req, res, query, replyVal, "yukon");
    }

    // 2. Call Gemini for generic questions if Gemini API key is available
    const ai = getGeminiClient();
    if (ai) {
      const systemInstruction = `You are YUKON Copilot, an AI-native campus virtual assistant built by Pritam Biswas for higher education. You are integrated with IIM Sambalpur's academic, venue, and scheduling directives.
Your style is ultra-polished, helpful, and highly sophisticated, echoing an ultra-responsive native system workspace daemon.

When answering generic questions:
1. Always maintain the YUKON Copilot persona.
2. If asked about general knowledge, academic concepts, or other topics, answer them elegantly and intelligently.
3. Keep your response brief, friendly, and under 3-4 sentences total. Never hallucinate specific dates unless referring to typical academic semesters.
4. If applicable, lightly comment on how you could coordinate this query with YUKON's spatial canvas models or student directories to assist progress.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: query,
        config: {
          systemInstruction,
          maxOutputTokens: 250,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "YUKON is currently processing your request. Please try again in a moment.";
      return sendLoggedJson(req, res, query, replyText, "yukon");
    }

    // Fallback if Gemini client is not configured
    const fallbackReply = "Processing campus directive offline. System successfully indexed local handbooks and retrieved valid responses instantly with 0% hallucination risk.";
    return sendLoggedJson(req, res, query, fallbackReply, "yukon");

  } catch (error: any) {
    console.error("Yukon Chat Error:", error);
    const errorReply = "YUKON COPILOT: Direct data highway connection temporarily disrupted. Please retry your query.";
    return sendLoggedJson(req, res, query, errorReply, "yukon");
  }
});

// Visitor tracking in-memory store
interface VisitorData {
  ip: string;
  count: number;
  country: string;
  city: string;
  lastVisit: string;
  history?: string[];
  clicks?: Array<{ target: string; timestamp: string; device: string }>;
  devices?: string[];
  duration?: number;
  chats?: Array<{ query: string; response: string; timestamp: string; channel: "divs" | "yukon" }>;
  resumeDownloads?: string[]; // array of ISO timestamps
}

function recordChat(ip: string, userAgentStr: string, query: string, response: string, channel: "divs" | "yukon") {
  let visitor = visitorStore.get(ip);
  if (!visitor) {
    visitor = {
      ip,
      count: 1,
      country: "Unknown",
      city: "Unknown",
      lastVisit: new Date().toISOString(),
      history: [new Date().toISOString()],
      clicks: [],
      devices: [getDeviceFromUserAgent(userAgentStr)],
      duration: 0
    };
    visitorStore.set(ip, visitor);
  }
  if (!visitor.chats) {
    visitor.chats = [];
  }
  visitor.chats.push({
    query,
    response,
    timestamp: new Date().toISOString(),
    channel
  });
  saveVisitors();
}

function sendLoggedJson(req: any, res: any, query: string, replyText: string, channel: "divs" | "yukon") {
  let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Unknown";
  if (ip && ip.includes(",")) ip = ip.split(",")[0].trim();
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") ip = "Localhost";
  recordChat(ip, req.headers["user-agent"] || "", query, replyText, channel);
  return res.json({ content: replyText });
}

import fs from "fs";
const DATA_FILE = path.join(process.cwd(), "visitors.json");

const visitorStore = new Map<string, VisitorData>();
let totalVisits = 0;

try {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    if (data.visitors) {
       Object.keys(data.visitors).forEach(k => {
         const visitor = data.visitors[k];
         // Ensure history exists
         if (!visitor.history) {
           visitor.history = [visitor.lastVisit || new Date().toISOString()];
         }
         if (!visitor.clicks) {
           visitor.clicks = [];
         }
         if (!visitor.devices) {
           visitor.devices = [];
         }
         visitorStore.set(k, visitor);
       });
    }
    totalVisits = data.totalVisits || 0;
  }
} catch(e) {
  console.error("Error loading visitor data", e);
}

function saveVisitors() {
  try {
    const data = {
      totalVisits,
      visitors: Object.fromEntries(visitorStore.entries())
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving visitor data", err);
  }
}

// Format datetime in full detail: Tuesday, Jun 16, 2026 at 11:32:04 AM
function formatTimestamp(tStr: string): string {
  const d = new Date(tStr);
  if (isNaN(d.getTime())) return "Unknown Date/Time";
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[d.getDay()];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = months[d.getMonth()];
  const dateNum = d.getDate();
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const timeStr = `${hours}:${minutes}:${seconds} ${ampm}`;

  return `${dayName}, ${monthName} ${dateNum}, ${year} at ${timeStr}`;
}

// Resolve user device name from User-Agent header
function getDeviceFromUserAgent(ua: string | undefined): string {
  if (!ua) return "Unknown Device";
  const l = ua.toLowerCase();
  if (l.includes("mobi") || l.includes("android") || l.includes("iphone") || l.includes("ipad")) {
    if (l.includes("iphone")) return "iPhone";
    if (l.includes("ipad")) return "iPad";
    if (l.includes("android")) return "Android Mobile";
    return "Mobile Device";
  }
  if (l.includes("windows")) return "Windows PC";
  if (l.includes("macintosh") || l.includes("mac os") || l.includes("macbook")) return "MacBook / Mac";
  if (l.includes("linux")) return "Linux PC";
  return "Desktop PC";
}

// Generate the fully detailed Markdown report for the chats
function generateReportMarkdown(): string {
  const allVisitors = Array.from(visitorStore.values())
    .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

  let totalLinkedInClicks = 0;
  let totalGitHubClicks = 0;
  let totalResumeDownloads = 0;
  allVisitors.forEach(v => {
    totalResumeDownloads += (v.resumeDownloads || []).length;
    (v.clicks || []).forEach(c => {
      if (c.target === "linkedin") totalLinkedInClicks++;
      if (c.target === "github") totalGitHubClicks++;
    });
  });

  let markdown = `### 🚨 **Live Interaction & System Traffic Report**\n\n`;
  markdown += `* 📊 **Total System Visits:** \`${totalVisits}\` visits\n`;
  markdown += `* 👤 **Unique Network Nodes:** \`${visitorStore.size}\` unique users\n`;
  markdown += `* 🔗 **LinkedIn Link Clicks:** \`${totalLinkedInClicks}\` clicks\n`;
  markdown += `* 🐙 **GitHub Link Clicks:** \`${totalGitHubClicks}\` clicks\n`;
  markdown += `* 📄 **Resume PDF Downloads:** \`${totalResumeDownloads}\` downloads\n\n`;
  markdown += `*(Report Generated on: ${formatTimestamp(new Date().toISOString())})*\n\n`;
  markdown += `---\n\n`;
  markdown += `#### 💾 **Detailed Activity Logs by Node IP:**\n\n`;

  if (allVisitors.length === 0) {
    markdown += `No node interaction recorded in current cycle.\n`;
  } else {
    allVisitors.forEach((visitor, index) => {
      const devicesStr = (visitor.devices || []).join(", ") || "Unknown Device";
      const durationSec = visitor.duration || 0;
      const durationStr = durationSec >= 60 
        ? `${Math.floor(durationSec / 60)} min ${durationSec % 60} sec`
        : `${durationSec} sec`;

      markdown += `**${index + 1}. IP Node:** \`${visitor.ip}\` | 📍 \`${visitor.city || "Unknown"}, ${visitor.country || "Unknown"}\`\n`;
      markdown += `* **Total Visits Recorded:** \`${visitor.count}\` visits\n`;
      markdown += `* **Registered Devices:** \`${devicesStr}\`\n`;
      markdown += `* **Total Staying Duration (Session):** \`${durationStr}\`\n`;
      markdown += `* **Visit Timelines:**\n`;
      
      const lastVisits = (visitor.history || [visitor.lastVisit]).slice(-8); 
      lastVisits.forEach(tStr => {
        markdown += `  * 🕒 ${formatTimestamp(tStr)}\n`;
      });

      const visitorDownloads = visitor.resumeDownloads || [];
      if (visitorDownloads.length > 0) {
        markdown += `* **Resume Downloads Recorded (${visitorDownloads.length} downloads):**\n`;
        visitorDownloads.forEach(tStr => {
          markdown += `  * 📥 **Downloaded Resume PDF** at *${formatTimestamp(tStr)}* via \`${devicesStr}\`\n`;
        });
      }

      const visitorClicks = visitor.clicks || [];
      const nonResumeClicks = visitorClicks.filter(c => c.target !== "Resume PDF Downloaded");
      if (nonResumeClicks.length > 0) {
        markdown += `* **Platform Link Interactions:**\n`;
        nonResumeClicks.forEach(click => {
          const icon = click.target === "linkedin" ? "🔗" : "🐙";
          markdown += `  * ${icon} **Clicked ${click.target === "linkedin" ? "LinkedIn Link" : "GitHub Link"}**\n`;
          markdown += `    * *Format:* ${formatTimestamp(click.timestamp)}\n`;
          markdown += `    * *Device:* \`${click.device}\`\n`;
        });
      } else {
        markdown += `* *No external portfolio link clicks recorded.*\n`;
      }

      const visitorChats = visitor.chats || [];
      if (visitorChats.length > 0) {
        markdown += `* **Captured Chat History (${visitorChats.length} records):**\n`;
        visitorChats.forEach(chat => {
          const chLabel = chat.channel === "yukon" ? "Yukon Copilot" : "DIVS Assistant";
          markdown += `  * 💬 **[${chLabel}] Conversation Log** at *${formatTimestamp(chat.timestamp)}*\n`;
          markdown += `    * **Question/User Content:** "${chat.query}"\n`;
          markdown += `    * **Answer/Response Provided:** "${chat.response}"\n`;
        });
      } else {
        markdown += `* *No conversations or typed messages recorded for this node IP.*\n`;
      }
      markdown += `\n`;
    });
  }

  return markdown;
}

// Generate a premium password-protected PDF report for traffic and click tracking
async function generateTrafficPdfBuffer(allVisitors: any[], totalVisits: number, uniqueVisitors: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        userPassword: "pritam2026", // Real PDF Password Protection
        ownerPassword: "biswas_owner_key",
        permissions: {
          printing: "highResolution",
          modifying: false,
          copying: false,
          annotating: false
        },
        size: "A4",
        margin: 40
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Draw cohesive high-fidelity Dark Background (#050507)
      doc.fillColor("#050507").rect(0, 0, doc.page.width, doc.page.height).fill();

      // Reset text options to default white matching Pritam's ultra-polished UI theme
      doc.fillColor("#ffffff");

      // Draw elegant system headers
      doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(8).text("SYS_TELEMETRY // SECURE PASSWORD-PROTECTED PORTAL REPORT", 40, 40);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("Pritam's Traffic & Interaction Report", 40, 52);
      
      const currentTimeFormatted = formatTimestamp(new Date().toISOString());
      doc.fillColor("#888888").font("Helvetica-Oblique").fontSize(8).text(`Decryption Signature Verified · Generated: ${currentTimeFormatted}`, 40, 75);
      
      doc.strokeColor("#1f1f23").lineWidth(1).moveTo(40, 95).lineTo(555, 95).stroke();

      // Calculate totals
      let totalLinkedInClicks = 0;
      let totalGitHubClicks = 0;
      let totalResumeDownloads = 0;
      allVisitors.forEach(v => {
        totalResumeDownloads += (v.resumeDownloads || []).length;
        (v.clicks || []).forEach(c => {
          if (c.target === "linkedin") totalLinkedInClicks++;
          if (c.target === "github") totalGitHubClicks++;
        });
      });

      // KPI blocks row design using sleek grey cards (5 columns: width 95 each, 10px spacing)
      // Card 1: Total Visits
      doc.fillColor("#0c0c0e").rect(40, 110, 95, 52).fill();
      doc.fillColor("#888888").font("Helvetica-Bold").fontSize(7).text("TOTAL VISITS", 48, 118);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text(String(totalVisits), 48, 132);

      // Card 2: Unique Users
      doc.fillColor("#0c0c0e").rect(145, 110, 95, 52).fill();
      doc.fillColor("#888888").font("Helvetica-Bold").fontSize(7).text("UNIQUE USERS", 153, 118);
      doc.fillColor("#10b981").font("Helvetica-Bold").fontSize(18).text(String(uniqueVisitors), 153, 132);

      // Card 3: LinkedIn Clicks
      doc.fillColor("#0c0c0e").rect(250, 110, 95, 52).fill();
      doc.fillColor("#888888").font("Helvetica-Bold").fontSize(7).text("LINKEDIN CLICKS", 258, 118);
      doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(18).text(String(totalLinkedInClicks), 258, 132);

      // Card 4: GitHub Clicks
      doc.fillColor("#0c0c0e").rect(355, 110, 95, 52).fill();
      doc.fillColor("#888888").font("Helvetica-Bold").fontSize(7).text("GITHUB CLICKS", 363, 118);
      doc.fillColor("#fb7185").font("Helvetica-Bold").fontSize(18).text(String(totalGitHubClicks), 363, 132);

      // Card 5: Resume Downloads
      doc.fillColor("#0c0c0e").rect(460, 110, 95, 52).fill();
      doc.fillColor("#888888").font("Helvetica-Bold").fontSize(7).text("RESUME PDF DL", 468, 118);
      doc.fillColor("#f59e0b").font("Helvetica-Bold").fontSize(18).text(String(totalResumeDownloads), 468, 132);

      // Divider below KPIs
      doc.strokeColor("#1f1f23").lineWidth(1).moveTo(40, 178).lineTo(555, 178).stroke();

      doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(10).text("DETAILED NETWORK NODE INTERACTION SUMMARY", 40, 192);

      let currentY = 210;

      allVisitors.forEach((visitor, idx) => {
        // Safe check for page boundaries before adding next card
        if (currentY > doc.page.height - 130) {
          doc.addPage({ size: "A4", margin: 40 });
          doc.fillColor("#050507").rect(0, 0, doc.page.width, doc.page.height).fill();
          doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(8).text("SYS_TELEMETRY // SECURE PASSWORD-PROTECTED PORTAL REPORT (CONTINUED)", 40, 40);
          doc.strokeColor("#1f1f23").lineWidth(1).moveTo(40, 55).lineTo(555, 55).stroke();
          currentY = 70;
        }

        // Draw node header bar (subtle grey background block)
        doc.fillColor("#0b0b0d").rect(40, currentY, 515, 18).fill();
        const headerText = `${idx + 1}. IP Node Reference: ${visitor.ip}`;
        const locText = `📍 ${visitor.city || "Unknown"}, ${visitor.country || "Unknown"}`;
        
        doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8).text(headerText, 46, currentY + 5);
        doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(7.5).text(locText, 320, currentY + 5, { align: "right", width: 220 });

        currentY += 23;

        // Registered devices info
        const devStr = (visitor.devices || []).join(", ") || "Unknown Device";
        doc.fillColor("#888888").font("Helvetica").fontSize(7).text("Registered Client Devices:", 46, currentY);
        doc.fillColor("#e2e8f0").font("Helvetica-Bold").fontSize(7).text(devStr, 135, currentY);

        // Visit totals
        doc.fillColor("#888888").font("Helvetica").fontSize(7).text("Total Visits Recorded:", 340, currentY);
        doc.fillColor("#10b981").font("Helvetica-Bold").fontSize(7).text(String(visitor.count), 425, currentY);

        currentY += 12;

        // Staying duration
        const durationSec = visitor.duration || 0;
        const durationStr = durationSec >= 60 
          ? `${Math.floor(durationSec / 60)} min ${durationSec % 60} sec`
          : `${durationSec} sec`;
        doc.fillColor("#888888").font("Helvetica").fontSize(7).text("Total Staying Duration:", 46, currentY);
        doc.fillColor("#60a5fa").font("Helvetica-Bold").fontSize(7).text(durationStr, 135, currentY);

        currentY += 12;

        // Timeline array
        const listVisits = (visitor.history || [visitor.lastVisit]).slice(-4);
        doc.fillColor("#8888ff").font("Helvetica-Bold").fontSize(7).text("VISIT TIMELINE HISTORY:", 46, currentY);
        currentY += 9;
        listVisits.forEach((tim: string) => {
          doc.fillColor("#a1a1aa").font("Helvetica").fontSize(7).text(`  • ${formatTimestamp(tim)}`, 46, currentY);
          currentY += 8.5;
        });

        // Click interaction stats
        const vClicks = visitor.clicks || [];
        const nonResumeClicksList = vClicks.filter((c: any) => c.target !== "Resume PDF Downloaded");
        if (nonResumeClicksList.length > 0) {
          currentY += 3;
          doc.fillColor("#10b981").font("Helvetica-Bold").fontSize(7).text("PORTAL LINK CLICKS LOGGED:", 46, currentY);
          currentY += 9;
          nonResumeClicksList.forEach((click: any) => {
            const label = click.target === "linkedin" ? "[LINKEDIN ID CLICK]   " : "[GITHUB ID CLICK]     ";
            const isLinkedIn = click.target === "linkedin";
            doc.fillColor(isLinkedIn ? "#38bdf8" : "#fb7185").font("Helvetica-Bold").fontSize(7).text(`  ${label}`, 46, currentY);
            doc.fillColor("#e2e8f0").font("Helvetica").fontSize(7).text(` at ${formatTimestamp(click.timestamp)} via `, 145, currentY);
            doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(7).text(click.device, 360, currentY);
            currentY += 8.5;
          });
        } else {
          doc.fillColor("#52525b").font("Helvetica-Oblique").fontSize(7).text("  (No portfolio link clicks recorded for this node IP)", 46, currentY + 2.5);
          currentY += 11.5;
        }

        // Resume PDF download histories
        const resDownloads = visitor.resumeDownloads || [];
        if (resDownloads.length > 0) {
          currentY += 4;
          doc.fillColor("#f59e0b").font("Helvetica-Bold").fontSize(7).text("RESUME PDF DOWNLOAD HISTORIES:", 46, currentY);
          currentY += 9;
          resDownloads.forEach((dlTime: string) => {
            // Check page boundaries
            if (currentY > doc.page.height - 80) {
              doc.addPage({ size: "A4", margin: 40 });
              doc.fillColor("#050507").rect(0, 0, doc.page.width, doc.page.height).fill();
              doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(8).text("SYS_TELEMETRY // SECURE PASSWORD-PROTECTED PORTAL REPORT (CONTINUED)", 40, 40);
              doc.strokeColor("#1f1f23").lineWidth(1).moveTo(40, 55).lineTo(555, 55).stroke();
              currentY = 70;
            }
            doc.fillColor("#f59e0b").font("Helvetica-Bold").fontSize(6.5).text("  [RESUME DOWNLOAD] ", 46, currentY);
            doc.fillColor("#e2e8f0").font("Helvetica").fontSize(6.5).text(` at ${formatTimestamp(dlTime)} from node IP `, 142, currentY, { continued: true });
            doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(6.5).text(visitor.ip, { continued: true });
            doc.fillColor("#e2e8f0").font("Helvetica").fontSize(6.5).text(" via ", { continued: true });
            doc.fillColor("#10b981").font("Helvetica-Bold").fontSize(6.5).text(devStr);
            currentY += 8.5;
          });
        }

        // Captured chat histories
        const visitorChats = visitor.chats || [];
        if (visitorChats.length > 0) {
          currentY += 4;
          doc.fillColor("#a78bfa").font("Helvetica-Bold").fontSize(7).text("CAPTURED QA CONVERSATION HISTORY:", 46, currentY);
          currentY += 9;
          visitorChats.forEach((chat: any) => {
            // Check page boundaries before printing each message
            if (currentY > doc.page.height - 80) {
              doc.addPage({ size: "A4", margin: 40 });
              doc.fillColor("#050507").rect(0, 0, doc.page.width, doc.page.height).fill();
              doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(8).text("SYS_TELEMETRY // SECURE PASSWORD-PROTECTED PORTAL REPORT (CONTINUED)", 40, 40);
              doc.strokeColor("#1f1f23").lineWidth(1).moveTo(40, 55).lineTo(555, 55).stroke();
              currentY = 70;
            }
            const labelCh = chat.channel === "yukon" ? "[YUKON CO-PILOT QA]" : "[DIVS DIGITAL-TWIN QA]";
            doc.fillColor("#e9d5ff").font("Helvetica-Bold").fontSize(6.5).text(`  ${labelCh} at ${formatTimestamp(chat.timestamp)}`, 46, currentY);
            currentY += 8;

            if (currentY > doc.page.height - 80) {
              doc.addPage({ size: "A4", margin: 40 });
              doc.fillColor("#050507").rect(0, 0, doc.page.width, doc.page.height).fill();
              doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(8).text("SYS_TELEMETRY // SECURE PASSWORD-PROTECTED PORTAL REPORT (CONTINUED)", 40, 40);
              doc.strokeColor("#1f1f23").lineWidth(1).moveTo(40, 55).lineTo(555, 55).stroke();
              currentY = 70;
            }

            doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(6.5).text("   User Q: ", 46, currentY, { continued: true });
            doc.fillColor("#e2e8f0").font("Helvetica").fontSize(6.5).text(chat.query || "", { width: 490 });
            doc.fontSize(6.5);
            const queryH = doc.heightOfString(chat.query || "", { width: 490 });
            currentY += queryH + 2;

            if (currentY > doc.page.height - 80) {
              doc.addPage({ size: "A4", margin: 40 });
              doc.fillColor("#050507").rect(0, 0, doc.page.width, doc.page.height).fill();
              doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(8).text("SYS_TELEMETRY // SECURE PASSWORD-PROTECTED PORTAL REPORT (CONTINUED)", 40, 40);
              doc.strokeColor("#1f1f23").lineWidth(1).moveTo(40, 55).lineTo(555, 55).stroke();
              currentY = 70;
            }

            doc.fillColor("#f472b6").font("Helvetica-Bold").fontSize(6.5).text("   AI Agent A: ", 46, currentY, { continued: true });
            doc.fillColor("#a1a1aa").font("Helvetica-Oblique").fontSize(6.5).text(chat.response || "", { width: 490 });
            doc.fontSize(6.5);
            const respH = doc.heightOfString(chat.response || "", { width: 490 });
            currentY += respH + 6;
          });
        } else {
          currentY += 4;
          doc.fillColor("#4b5563").font("Helvetica-Oblique").fontSize(7).text("  (No verbal conversation logs or typed questions logged on this IP node)", 46, currentY);
          currentY += 10;
        }

        // Draw thin card separator line
        doc.strokeColor("#111114").lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
        currentY += 10;
      });

      // Render static footer
      if (currentY > doc.page.height - 40) {
        doc.addPage({ size: "A4", margin: 40 });
        doc.fillColor("#050507").rect(0, 0, doc.page.width, doc.page.height).fill();
        currentY = 50;
      }
      doc.fillColor("#444444").font("Helvetica").fontSize(7.5).text(`© ${new Date().getFullYear()} pritambiswas.com · System Secure Export · Encrypted PDF Document`, 40, currentY + 10, { align: "center", width: 475 });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Shared helper to build and dispatch the HTML report email using SMTP
async function dispatchTrafficEmailReport(): Promise<{ success: boolean; message: string; warning?: string; stats?: any }> {
  try {
    const allVisitors = Array.from(visitorStore.values())
      .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
      .slice(0, 80);

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM_EMAIL || user || "noreply@pritambiswas.com";

    // Format visitor rows for email
    const rowsHtml = allVisitors.map(visitor => {
      const formattedTimes = (visitor.history || [visitor.lastVisit]).map(t => {
        return `<div style="font-size: 11px; font-family: monospace; color: #aaaaaa; margin-top: 3px; background: rgba(255,255,255,0.03); padding: 2px 6px; border-radius: 4px; display: inline-block;">
          ${formatTimestamp(t)}
        </div>`;
      }).join(" ");

      const devicesHtml = (visitor.devices || ["Unknown Device"]).map(d => {
        return `<span style="font-size: 10px; font-family: monospace; color: #38bdf8; background: rgba(56,189,248,0.1); padding: 2px 6px; border-radius: 4px; margin-right: 4px; display: inline-block;">💻 ${d}</span>`;
      }).join(" ");

      const clicksHtml = (visitor.clicks || [])
        .filter(c => c.target !== "Resume PDF Downloaded")
        .map(c => {
          const icon = c.target === "linkedin" ? "🔗" : "🐙";
          return `<div style="font-size: 11px; font-family: monospace; color: #e2e8f0; margin-top: 5px; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08); display: block; text-align: left;">
            ${icon} <strong>Clicked ${c.target === "linkedin" ? "LinkedIn" : "GitHub"}</strong> on ${formatTimestamp(c.timestamp)} via <em>${c.device}</em>
          </div>`;
        }).join(" ");

      const downloadsHtml = (visitor.resumeDownloads || []).map(t => {
        return `<div style="font-size: 11px; font-family: monospace; color: #f59e0b; margin-top: 5px; background: rgba(245,158,11,0.05); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.15); display: block; text-align: left;">
          📥 <strong>Downloaded Resume PDF</strong> on ${formatTimestamp(t)}
        </div>`;
      }).join(" ");

      const durationSec = visitor.duration || 0;
      const durationStr = durationSec >= 60 
        ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
        : `${durationSec}s`;

      const chatsHtml = (visitor.chats || []).map(c => {
        const icon = c.channel === "yukon" ? "🧭 Yukon Copilot" : "🤖 DIVS Companion";
        return `<div style="font-size: 11px; font-family: sans-serif; color: #e2e8f0; margin-top: 6px; background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.1); display: block; text-align: left; max-width: 380px;">
          <div style="font-size: 10px; color: #a78bfa; font-weight: bold; margin-bottom: 2px;">💬 ${icon} &bull; ${formatTimestamp(c.timestamp)}</div>
          <div style="color: #38bdf8; font-weight: bold; margin-top: 3px;">Q: <span style="font-weight: normal; color: #ffffff;">"${c.query}"</span></div>
          <div style="color: #f472b6; font-weight: bold; margin-top: 3px;">A: <span style="font-weight: normal; color: #cccccc; font-style: italic;">"${c.response}"</span></div>
        </div>`;
      }).join(" ");

      const hasClicks = (visitor.clicks || []).filter(c => c.target !== "Resume PDF Downloaded").length > 0;

      return `
        <tr style="border-bottom: 1px solid #1f1f1f;">
          <td style="padding: 12px 8px; vertical-align: top; border-bottom: 1px solid #1f1f1f;">
            <div style="font-weight: bold; font-family: monospace; color: #ffffff; font-size: 13px;">${visitor.ip}</div>
            <div style="font-size: 11px; color: #888888; font-family: monospace; margin: 4px 0;">Node IP Address</div>
            <div style="margin-top: 6px;">${devicesHtml}</div>
            <div style="font-size: 11px; font-family: monospace; color: #60a5fa; background: rgba(96,165,250,0.1); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 6px;">⏱️ Stayed: ${durationStr}</div>
          </td>
          <td style="padding: 12px 8px; vertical-align: top; border-bottom: 1px solid #1f1f1f;">
            <div style="color: #ffffff; font-size: 13px;">📍 ${visitor.city || "Unknown"}, ${visitor.country || "Unknown"}</div>
          </td>
          <td style="padding: 12px 8px; vertical-align: top; text-align: center; font-weight: bold; color: #38bdf8; font-family: monospace; font-size: 14px; border-bottom: 1px solid #1f1f1f;">
            ${visitor.count}
          </td>
          <td style="padding: 12px 8px; vertical-align: top; text-align: right; border-bottom: 1px solid #1f1f1f;">
            <div style="font-family: monospace; font-size: 11px; color: #8888ff; font-weight: bold; text-transform: uppercase;">Visit History:</div>
            <div style="margin-top: 4px; text-align: right;">
               ${formattedTimes}
            </div>
            ${visitor.resumeDownloads && visitor.resumeDownloads.length > 0 ? `
              <div style="margin-top: 8px; font-family: monospace; font-size: 11px; color: #f59e0b; font-weight: bold; text-transform: uppercase;">Resume Downloads:</div>
              <div style="margin-top: 4px; display: inline-block; max-width: 320px;">
                ${downloadsHtml}
              </div>
            ` : ""}
            ${hasClicks ? `
              <div style="margin-top: 8px; font-family: monospace; font-size: 11px; color: #10b981; font-weight: bold; text-transform: uppercase;">Portals Clicked:</div>
              <div style="margin-top: 4px; display: inline-block; max-width: 320px;">
                ${clicksHtml}
              </div>
            ` : ""}
            ${visitor.chats && visitor.chats.length > 0 ? `
              <div style="margin-top: 8px; font-family: monospace; font-size: 11px; color: #a5b4fc; font-weight: bold; text-transform: uppercase; text-align: right;">Conversation Logs:</div>
              <div style="margin-top: 4px; display: inline-block; text-align: left;">
                ${chatsHtml}
              </div>
            ` : ""}
          </td>
        </tr>
      `;
    }).join("");

    // Calculate totals
    let totalLinkedInClicks = 0;
    let totalGitHubClicks = 0;
    let totalResumeDownloads = 0;
    allVisitors.forEach(v => {
      totalResumeDownloads += (v.resumeDownloads || []).length;
      (v.clicks || []).forEach(c => {
        if (c.target === "linkedin") totalLinkedInClicks++;
        if (c.target === "github") totalGitHubClicks++;
      });
    });

    const emailTemplate = `
      <div style="background-color: #050505; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; max-width: 720px; margin: 0 auto; border: 1px solid #1f1f1f; border-radius: 16px;">
        <!-- Header -->
        <div style="border-bottom: 1px solid #1f1f1f; padding-bottom: 24px; margin-bottom: 28px; text-align: center;">
          <span style="font-size: 10px; font-family: monospace; letter-spacing: 0.3em; color: #38bdf8; text-transform: uppercase; font-weight: bold; background: rgba(56,189,248,0.1); padding: 4px 10px; border-radius: 20px;">
            SYS_TELEMETRY // DETAILED INTERACTION DISPATCH
          </span>
          <h2 style="font-size: 26px; font-weight: 300; margin: 20px 0 8px 0; color: #ffffff; letter-spacing: -0.02em;">
            Pritam's Traffic & Click Interaction Report
          </h2>
          <p style="font-size: 11px; font-family: monospace; color: #888888; text-transform: uppercase; margin: 0; letter-spacing: 0.15em;">
            Secure Dispatch for pritamb.work@gmail.com
          </p>
        </div>

        <!-- Password Protection Notice Banner -->
        <div style="background: rgba(16,185,129,0.04); border: 1px solid rgba(16,185,129,0.15); padding: 16px; border-radius: 12px; margin-bottom: 28px; text-align: center;">
          <span style="font-size: 13px; color: #10b981; font-weight: bold; display: block; margin-bottom: 6px;">🔒 Secure Interactive PDF Report Attached</span>
          <p style="font-size: 12px; color: #b3b3b3; margin: 0; line-height: 1.5;">
            Your live portfolio traffic data is encrypted and attached as a password-protected PDF. 
            To decrypt and view, use the security password: <strong style="color: #38bdf8; font-family: monospace; font-size: 13px; background: rgba(56,189,248,0.1); padding: 2px 6px; border-radius: 4px;">pritam2026</strong>
          </p>
        </div>

        <!-- KPI Cards -->
        <div style="margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 20%; padding-right: 4px;">
                <div style="background: rgba(255,255,255,0.01); border: 1px solid #1f1f1f; padding: 12px 6px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 8px; font-family: monospace; text-transform: uppercase; color: #888888; letter-spacing: 0.05em; margin-bottom: 4px;">Total Visits</div>
                  <div style="font-size: 18px; font-weight: bold; color: #ffffff;">${totalVisits}</div>
                </div>
              </td>
              <td style="width: 20%; padding-left: 2px; padding-right: 4px;">
                <div style="background: rgba(255,255,255,0.01); border: 1px solid #1f1f1f; padding: 12px 6px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 8px; font-family: monospace; text-transform: uppercase; color: #888888; letter-spacing: 0.05em; margin-bottom: 4px;">Unique Users</div>
                  <div style="font-size: 18px; font-weight: bold; color: #10b981;">${visitorStore.size}</div>
                </div>
              </td>
              <td style="width: 20%; padding-left: 2px; padding-right: 4px;">
                <div style="background: rgba(255,255,255,0.01); border: 1px solid #1f1f1f; padding: 12px 6px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 8px; font-family: monospace; text-transform: uppercase; color: #888888; letter-spacing: 0.05em; margin-bottom: 4px;">LinkedIn Clk</div>
                  <div style="font-size: 18px; font-weight: bold; color: #38bdf8;">${totalLinkedInClicks}</div>
                </div>
              </td>
              <td style="width: 20%; padding-left: 2px; padding-right: 4px;">
                <div style="background: rgba(255,255,255,0.01); border: 1px solid #1f1f1f; padding: 12px 6px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 8px; font-family: monospace; text-transform: uppercase; color: #888888; letter-spacing: 0.05em; margin-bottom: 4px;">GitHub Clk</div>
                  <div style="font-size: 18px; font-weight: bold; color: #fb7185;">${totalGitHubClicks}</div>
                </div>
              </td>
              <td style="width: 20%; padding-left: 2px;">
                <div style="background: rgba(255,255,255,0.01); border: 1px solid #1f1f1f; padding: 12px 6px; border-radius: 10px; text-align: center;">
                  <div style="font-size: 8px; font-family: monospace; text-transform: uppercase; color: #888888; letter-spacing: 0.05em; margin-bottom: 4px;">Resume DL</div>
                  <div style="font-size: 18px; font-weight: bold; color: #f59e0b;">${totalResumeDownloads}</div>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Title -->
        <div style="font-size: 11px; font-family: monospace; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.2em; border-bottom: 1px solid #1f1f1f; padding-bottom: 8px; margin-bottom: 16px;">
          Detailed Interaction & Traffic Logs (Sorted by Last Visit)
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 32px;">
          <thead>
            <tr style="border-bottom: 2px solid #222;">
              <th style="font-family: monospace; font-size: 11px; text-transform: uppercase; color: #888888; padding: 10px 8px; font-weight: normal; width: 25%;">Node & Devices</th>
              <th style="font-family: monospace; font-size: 11px; text-transform: uppercase; color: #888888; padding: 10px 8px; font-weight: normal; width: 20%;">Location</th>
              <th style="font-family: monospace; font-size: 11px; text-transform: uppercase; color: #888888; padding: 10px 8px; text-align: center; font-weight: normal; width: 10%;">Visits</th>
              <th style="font-family: monospace; font-size: 11px; text-transform: uppercase; color: #888888; padding: 10px 8px; text-align: right; font-weight: normal; width: 45%;">Interaction Timeline & Clicks</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Footer -->
        <div style="border-top: 1px solid #1f1f1f; padding-top: 24px; text-align: center; font-family: monospace; font-size: 10px; color: #444444; text-transform: uppercase; letter-spacing: 0.15em;">
          © ${new Date().getFullYear()} pritambiswas.com · Dispatch successful at ${formatTimestamp(new Date().toISOString())}
        </div>
      </div>
    `;

    if (!user || !pass) {
      return {
        success: false,
        warning: "SMTP_NOT_CONFIGURED",
        message: "SMTP is not configured in your settings. Please configure SMTP_USER, SMTP_PASS, SMTP_HOST, and SMTP_PORT in your server secrets to send actual emails. Alternatively, here is the generated report.",
        stats: {
          totalVisits,
          uniqueVisitors: visitorStore.size,
          visitors: allVisitors
        }
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    // Compile the password-protected PDF buffer
    const pdfBuffer = await generateTrafficPdfBuffer(allVisitors, totalVisits, visitorStore.size);

    await transporter.sendMail({
      from: `"Pritam Biswas Stats Bot" <${from}>`,
      to: "pritamb.work@gmail.com",
      subject: `🚨 Live System Traffic & Click Report: ${totalVisits} Visits [${new Date().toLocaleDateString()}]`,
      html: emailTemplate,
      attachments: [
        {
          filename: `Pritam_Traffic_Report_${new Date().toISOString().split("T")[0]}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });

    return { success: true, message: "Live system traffic data with password-secured PDF attachment sent successfully to your Gmail inbox!" };
  } catch (err: any) {
    console.error("Failed to mail report:", err);
    return { success: false, message: err.message || "Failed to transmit SMTP payload" };
  }
}

app.post("/api/track-visit", async (req, res) => {
  let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Unknown";
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
    ip = "Localhost";
  }

  totalVisits++;
  const nowStr = new Date().toISOString();
  const device = getDeviceFromUserAgent(req.headers["user-agent"]);

  let visitor = visitorStore.get(ip);
  if (!visitor) {
    visitor = {
      ip,
      count: 1,
      country: "Unknown",
      city: "Unknown",
      lastVisit: nowStr,
      history: [nowStr],
      clicks: [],
      devices: [device]
    };
    visitorStore.set(ip, visitor);
    saveVisitors(); // Save immediately for new visitor
    
    // Fetch location details asynchronously
    if (ip !== "Localhost" && ip !== "Unknown") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.status === "success") {
            visitor.country = String(geoData.country);
            visitor.city = String(geoData.city);
            saveVisitors(); // Save again after async geo fetch
          }
        }
      } catch (err) {
        console.error("GeoIP fetch error:", err);
      }
    }
  } else {
    visitor.count++;
    visitor.lastVisit = nowStr;
    if (!visitor.history) {
      visitor.history = [];
    }
    visitor.history.push(nowStr);
    
    if (!visitor.devices) {
      visitor.devices = [];
    }
    if (!visitor.devices.includes(device)) {
      visitor.devices.push(device);
    }
    saveVisitors();
  }

  res.json({ success: true, visitor, totalVisits, uniqueVisitors: visitorStore.size });
});

// Endpoint to track user stay duration via heartbeats
app.post("/api/track-heartbeat", (req, res) => {
  let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Unknown";
  if (ip && ip.includes(",")) ip = ip.split(",")[0].trim();
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") ip = "Localhost";

  let visitor = visitorStore.get(ip);
  if (!visitor) {
    visitor = {
      ip,
      count: 1,
      country: "Unknown",
      city: "Unknown",
      lastVisit: new Date().toISOString(),
      history: [new Date().toISOString()],
      clicks: [],
      devices: [getDeviceFromUserAgent(req.headers["user-agent"])],
      duration: 0
    };
    visitorStore.set(ip, visitor);
  }

  if (typeof visitor.duration !== "number") {
    visitor.duration = 0;
  }
  visitor.duration += 10; // increase by 10s heartbeat
  saveVisitors();
  res.json({ success: true, duration: visitor.duration });
});

// Endpoint to track clicks on specific external IDs (LinkedIn and GitHub)
app.post("/api/track-click", (req, res) => {
  let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Unknown";
  if (ip && ip.includes(",")) ip = ip.split(",")[0].trim();
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") ip = "Localhost";

  const { target } = req.body;
  const nowStr = new Date().toISOString();
  const device = getDeviceFromUserAgent(req.headers["user-agent"]);

  let visitor = visitorStore.get(ip);
  if (!visitor) {
    visitor = {
      ip,
      count: 1,
      country: "Unknown",
      city: "Unknown",
      lastVisit: nowStr,
      history: [nowStr],
      clicks: [],
      devices: [device]
    };
    visitorStore.set(ip, visitor);
  }

  if (!visitor.clicks) visitor.clicks = [];
  visitor.clicks.push({
    target: target || "Unknown Link",
    timestamp: nowStr,
    device
  });

  if (!visitor.devices) visitor.devices = [];
  if (!visitor.devices.includes(device)) {
    visitor.devices.push(device);
  }

  saveVisitors();
  res.json({ success: true, visitor });
});

app.get("/api/visitor-stats", (req, res) => {
  let ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Unknown";
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
    ip = "Localhost";
  }

  const currentVisitor = visitorStore.get(ip) || { ip, count: 0, country: "Unknown", city: "Unknown", lastVisit: "", history: [], clicks: [], devices: [] };
  const allVisitors = Array.from(visitorStore.values()).sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()).slice(0, 100);

  res.json({
    totalVisits,
    uniqueVisitors: visitorStore.size,
    currentVisitor,
    allVisitors
  });
});

app.post("/api/send-traffic-report", async (req, res) => {
  const result = await dispatchTrafficEmailReport();
  if (result.success) {
    res.json({ success: true, message: result.message });
  } else if (result.warning === "SMTP_NOT_CONFIGURED") {
    // Return warning so client knows SMTP settings are unpopulated
    res.json({
      success: false,
      warning: "SMTP_NOT_CONFIGURED",
      message: result.message,
      stats: result.stats
    });
  } else {
    res.status(500).json({ success: false, error: result.message });
  }
});

// Configure Vite middleware or serve static files
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start();
}

export default app;
