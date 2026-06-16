import React, { useState } from "react";
import { PRITAM_RESUME_DATA } from "../data/resumeData";
import { Mail, Phone, MapPin, Linkedin, Github, Send, Sparkles, Check, Globe } from "lucide-react";
import { telemetryBus } from "../utils/telemetryBus";

export default function ContactPanel() {
  const data = PRITAM_RESUME_DATA;

  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderEmail || !message) {
      setErrorMsg("Please populate all credentials to communicate.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      setErrorMsg("Please state a valid digital address.");
      return;
    }

    setErrorMsg("");
    setIsSending(true);

    try {
      // Offline backup
      try {
        const stored = localStorage.getItem("pritam_portfolio_messages") || "[]";
        const list = JSON.parse(stored);
        list.push({
          senderName,
          senderEmail,
          message,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem("pritam_portfolio_messages", JSON.stringify(list));
      } catch (err) {
        console.error("Local storage storage logs backup error:", err);
      }

      // Secure dispatch channel
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: senderName,
          email: senderEmail,
          message: message,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Transit failed with code: ${response.status}`);
      }

      telemetryBus.publish({ type: "CONTACT_SUBMIT_SUCCESS", name: senderName });
      
      setIsSent(true);
      setSenderName("");
      setSenderEmail("");
      setMessage("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to establish a secure transit connection.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/5 pb-6">
        <div>
          <span className="text-xs tracking-widest text-[#B3B3B3] uppercase font-semibold">SECURE GATEWAY</span>
          <h2 className="text-4xl text-foreground mt-1 font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Establish Contact.
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Contact endpoints card */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-white font-medium text-base">Direct Channels</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Reach out regarding campus partnerships, advisory boards, generative AI projects or product management contracts. Operating from Raipur with high mobility.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            {/* Email */}
            <a
              href={`mailto:${data.email}`}
              className="flex items-center space-x-3 text-muted-foreground hover:text-white transition bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl cursor-pointer"
            >
              <Mail size={16} />
              <span>{data.email}</span>
            </a>

            {/* Phone */}
            <a
              href={`tel:${data.phone}`}
              className="flex items-center space-x-3 text-muted-foreground hover:text-white transition bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl cursor-pointer"
            >
              <Phone size={16} />
              <span>{data.phone}</span>
            </a>

            {/* Location */}
            <div className="flex items-center space-x-3 text-muted-foreground bg-white/5 border border-white/5 p-3 rounded-xl select-none">
              <MapPin size={16} />
              <span>{data.location}</span>
            </div>

            {/* Network Channels Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`https://${data.linkedin}`}
                target="_blank"
                referrerPolicy="no-referrer"
                onClick={() => {
                  fetch("/api/track-click", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ target: "linkedin" })
                  }).catch(err => console.error("Error tracking LinkedIn click", err));
                }}
                className="flex items-center justify-center space-x-2 text-muted-foreground hover:text-white transition bg-white/5 border border-white/5 hover:border-white/10 py-3 rounded-xl cursor-pointer text-center"
              >
                <Linkedin size={14} />
                <span>LinkedIn</span>
              </a>

              <a
                href={`https://${data.github}`}
                target="_blank"
                referrerPolicy="no-referrer"
                onClick={() => {
                  fetch("/api/track-click", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ target: "github" })
                  }).catch(err => console.error("Error tracking GitHub click", err));
                }}
                className="flex items-center justify-center space-x-2 text-muted-foreground hover:text-white transition bg-white/5 border border-white/5 hover:border-white/10 py-3 rounded-xl cursor-pointer text-center"
              >
                <Github size={14} />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Messaging Box */}
        <div className="md:col-span-3 bg-white/[0.01] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
          {isSent ? (
            <div className="text-center py-12 space-y-4 animate-fade-rise">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-green-300">
                <Check size={24} />
              </div>
              <h4 className="text-xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Transmission Synced.
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Your message has been logged securely in local database structures under Pritam’s portfolio network.
              </p>
              <button
                onClick={() => setIsSent(false)}
                className="text-[10px] uppercase tracking-wider font-mono px-4 py-2 border border-white/10 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleMessageSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 text-[#B3B3B3]">
                <Globe size={14} />
                <span className="text-[10px] tracking-widest font-mono uppercase">Instant Message Portal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    onFocus={() => telemetryBus.publish({ type: "CONTACT_INPUT_FOCUS", field: "name" })}
                    placeholder="Your Name"
                    className="w-full text-xs font-mono bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-white/30 text-white placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    onFocus={() => telemetryBus.publish({ type: "CONTACT_INPUT_FOCUS", field: "email" })}
                    placeholder="Email Address"
                    className="w-full text-xs font-mono bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-white/30 text-white placeholder-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => telemetryBus.publish({ type: "CONTACT_INPUT_FOCUS", field: "message" })}
                  placeholder="Draft your query regarding campus app automation, growth frameworks, or product consultations..."
                  className="w-full text-xs font-mono h-28 bg-black/40 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-white/30 text-white placeholder-muted-foreground"
                />
              </div>

              {errorMsg && <p className="text-xs text-red-400 font-mono select-none">{errorMsg}</p>}

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 bg-white text-black hover:bg-white/90 font-semibold rounded-xl text-xs font-mono cursor-pointer transition flex items-center justify-center space-x-2"
              >
                {isSending ? (
                  <>
                    <Globe size={12} className="animate-spin text-black" />
                    <span>Transmitting query securely...</span>
                  </>
                ) : (
                  <>
                    <Send size={12} className="text-black" />
                    <span>Transmit Query</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
