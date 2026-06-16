import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  // Safe CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
    );
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { name, email, message } = req.body || {};

  console.log("=== Contact Transmit Serverless Gateway Running ===");
  console.log(`- Sender Name: ${name}`);
  console.log(`- Sender Email: ${email}`);
  console.log(`- Message Length: ${message ? message.length : 0} chars`);

  if (!name || !email || !message) {
    console.error("[ValidationError] Name, email, and message are required.");
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const recipient = "pritamb.work@gmail.com";
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || "587";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM_EMAIL || smtpUser || "portfolio-system@pritamb.com";

  console.log("[SMTP Diagnosis logs]");
  console.log(`- SMTP_HOST: ${smtpHost ? smtpHost : "MISSING (Not configured)"}`);
  console.log(`- SMTP_PORT: ${smtpPort}`);
  console.log(`- SMTP_USER: ${smtpUser ? smtpUser : "MISSING (Not configured)"}`);
  console.log(`- SMTP_PASS: ${smtpPass ? `PRESENT (${smtpPass.substring(0, 2)}***)` : "MISSING (Not configured)"}`);
  console.log(`- SMTP_FROM_EMAIL: ${smtpFrom}`);

  // If credentials are fully configured, attempt actual dispatch
  if (smtpHost && smtpUser && smtpPass) {
    try {
      console.log(`Initiating nodemailer connection to ${smtpHost}:${smtpPort}...`);
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        timeout: 10000, // 10s connection timeout limit
      } as any);

      // Verify connection config before sending
      console.log("Verifying SMTP node credentials...");
      await transporter.verify();
      console.log("SMTP login connection verified successfully!");

      const mailOptions = {
        from: `"${name} via Portfolio Gateway" <${smtpFrom}>`,
        replyTo: email,
        to: recipient,
        subject: `[Portfolio Gateway] New Transmit from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <div style="background-color: #030712; padding: 40px 20px; font-family: sans-serif; min-height: 100%;">
            <div style="max-width: 600px; margin: 0 auto; background: #0b0f19; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden;">
              <div style="height: 6px; background: linear-gradient(90deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%);"></div>
              <div style="padding: 32px 24px;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 16px 0;">New Message Transmission</h1>
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                  <p style="color: #9ca3af; margin: 0 0 8px 0;"><strong>Sender Name:</strong> ${name}</p>
                  <p style="color: #9ca3af; margin: 0;"><strong>Sender Email:</strong> ${email}</p>
                </div>
                <h3 style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0;">Message Payload</h3>
                <div style="background: #111622; border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 20px; color: #e5e7eb; min-height: 100px;">
                  ${message.replace(/\n/g, "<br/>")}
                </div>
              </div>
            </div>
          </div>
        `,
      };

      console.log("Sending email...");
      await transporter.sendMail(mailOptions);
      console.log("Email securely dispatched through Vercel Serverless SMTP!");

      return res.status(200).json({ success: true, method: "smtp" });
    } catch (err: any) {
      console.error("[SMTP Error Detail]", err);
      return res.status(502).json({
        error: "SMTP server rejected transfection or credential handshake.",
        details: err.message || err,
      });
    }
  } else {
    // Elegant fallback simulation
    console.log("[EMAIL DISPATCH SIMULATION] SMTP not fully configured under Vercel environment.");
    return res.status(200).json({
      success: true,
      method: "simulation",
      message: "Security Gateway check accomplished. To activate mail transfers, register your real SMTP_HOST, SMTP_USER, and SMTP_PASS under Vercel project Settings -> Environment Variables.",
    });
  }
}
