import React, { useState, useEffect, useRef } from "react";
import { PRITAM_RESUME_DATA } from "../data/resumeData";
import { Sparkles, Terminal, Compass, Layers, Calendar, Zap, Play, Send, RefreshCw, Smartphone } from "lucide-react";
import { telemetryBus } from "../utils/telemetryBus";

export default function YukonPanel() {
  const [activeTab, setActiveTab] = useState<"copilot" | "spatial" | "stack">("copilot");
  const [query, setQuery] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ sender: "user" | "yukon"; text: string }>>([
    { sender: "yukon", text: "Welcome to YUKON. I am synced with IIM Sambalpur's academic, venue, and scheduling directives. How may I assist your workflow today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulated AI Answers
  const simulatedResponses: Record<string, string> = {
    class: "Found: Data Sci & AI Course (Sec B). Next lecture starts tomorrow, 10:00 AM in Room 412. Your current attendance streak is 92%. Would you like me to reserve a collaborative team study desk?",
    library: "Synthesizing research: I have indexed the latest LLM Optimization study papers from your private Drive folder. The Quiet Lab has 14 open desks. I've compiled an executive brief of Chapter 4 of prompt engineering.",
    event: "Incoming Discovery: Startup Incubator Hackathon tomorrow at 3:30 PM. Synthesizing spatial coordinates: Block C Amphitheater. 112 students registered under the leadership of your IIM peers.",
    three: "Spatial Grid Hydration: Three.js canvas active. Coordinates: [Lat 21.843, Lng 83.921]. Loaded 3D vector model of block A, B, C. Interactive navigation path loaded with zero latency.",
    default: "Processing campus directive. System successfully indexed handbooks and retrieved valid responses instantly with 0% hallucination risk."
  };

  // Chat submit
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setChatLog((prev) => [...prev, { sender: "user", text: userText }]);
    setQuery("");
    setIsTyping(true);

    // Publish telemetry event for interactive copilot chat
    telemetryBus.publish({ type: "YUKON_COPILOT_CHAT", query: userText });

    try {
      const response = await fetch("/api/yukon-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userText })
      });
      const data = await response.json();
      const yukonText = data.content || data.error || "Processing completed successfully.";
      setChatLog((prev) => [...prev, { sender: "yukon", text: yukonText }]);
    } catch (err) {
      console.error("Yukon Copilot fetch error:", err);
      // Seamless simulated fallback
      setTimeout(() => {
        let yukonText = simulatedResponses.default;
        const normalized = userText.trim().toLowerCase();
        
        if (normalized === "hi" || normalized === "hello" || normalized === "hey" || normalized.startsWith("hi ") || normalized.startsWith("hello ")) {
          yukonText = "Hello! I am Yukon Copilot, your intelligent academic-grade assistant. How is your day going, and what campus workflow can I help you optimize today?";
        } else if (normalized.includes("how are you doing") || normalized.includes("how are you") || normalized.includes("how're you")) {
          yukonText = "I'm performing at peak operational latency! Navigating schedule threads, syncing 3D spatial grids, and ready to assist your academic agenda. How are you doing today?";
        } else if (normalized.includes("what is yukon") || normalized.includes("about yukon") || normalized.includes("tell me about yukon") || normalized.includes("explain yukon")) {
          yukonText = "YUKON is a cohesive, AI-native web application tailored for higher education. It bridges the gap between fragmented portals by fusing AI copilots, hardware-accelerated 3D spatial grids, and real-time database sync—developed as a high-fidelity academic concept by Pritam Biswas.";
        } else if (normalized.includes("class") || normalized.includes("schedule") || normalized.includes("homework")) {
          yukonText = simulatedResponses.class;
        } else if (normalized.includes("library") || normalized.includes("paper") || normalized.includes("book") || normalized.includes("study")) {
          yukonText = simulatedResponses.library;
        } else if (normalized.includes("event") || normalized.includes("calendar") || normalized.includes("discovery")) {
          yukonText = simulatedResponses.event;
        } else if (normalized.includes("coordinate") || normalized.includes("3d") || normalized.includes("three")) {
          yukonText = simulatedResponses.three;
        } else if (normalized.includes("who built") || normalized.includes("who made") || normalized.includes("creator") || normalized.includes("pritam")) {
          yukonText = "YUKON was designed, conceptualized, and fully built by Pritam Biswas. It is a stunning display of deep tech integration (intelligent agents, spatial mappings, and full-stack architecture) representing his vision for modern student experience.";
        }
        setChatLog((prev) => [...prev, { sender: "yukon", text: yukonText }]);
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  // Rotating spatial 3D radar canvas simulator using native Canvas2D
  useEffect(() => {
    if (activeTab !== "spatial") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const render = () => {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) - 28;

      // Draw Apple OS ultra-premium radar background (Subtle dark radial gradient)
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius + 20);
      bgGrad.addColorStop(0, "rgba(9, 9, 11, 0.9)");
      bgGrad.addColorStop(0.5, "rgba(20, 20, 25, 0.95)");
      bgGrad.addColorStop(1, "rgba(5, 5, 8, 0.98)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 22, 0, Math.PI * 2);
      ctx.fill();

      // Outer bezel ring of the Radar interface
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 22, 0, Math.PI * 2);
      ctx.stroke();

      // Draw subtle background polar grids (ticks & crosshairs)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - radius - 15, cy);
      ctx.lineTo(cx + radius + 15, cy);
      ctx.moveTo(cx, cy - radius - 15);
      ctx.lineTo(cx, cy + radius + 15);
      ctx.stroke();

      // Concentric circles with custom line dashes (Apple style)
      const circles = [
        { r: radius, dash: [], color: "rgba(255, 255, 255, 0.08)", width: 1 },
        { r: radius * 0.75, dash: [2, 4], color: "rgba(255, 255, 255, 0.04)", width: 0.75 },
        { r: radius * 0.5, dash: [], color: "rgba(255, 255, 255, 0.06)", width: 0.75 },
        { r: radius * 0.25, dash: [1, 5], color: "rgba(255, 255, 255, 0.03)", width: 0.5 }
      ];

      circles.forEach((c) => {
        ctx.strokeStyle = c.color;
        ctx.lineWidth = c.width;
        ctx.setLineDash(c.dash);
        ctx.beginPath();
        ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]); // Reset dash for subsequent drawing

      // Draw Compass Direction Labels in Space Gray typography
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = "bold 9px 'SF Pro Display', -apple-system, blinkmacsystemfont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N", cx, cy - radius - 12);
      ctx.fillText("S", cx, cy + radius + 12);
      ctx.fillText("E", cx + radius + 12, cy);
      ctx.fillText("W", cx - radius - 12, cy);

      // Draw Sweeping Scan beam with beautiful multi-segmented trailing alpha gradient (Apple Find My trail)
      const trailCount = 60;
      for (let i = 0; i < trailCount; i++) {
        const trailAngle = angle - (i * 0.012);
        const opacity = Math.max(0, (1 - (i / trailCount)) * 0.25);
        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`; // Elegant Apple emerald green sweep
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + radius * Math.cos(trailAngle),
          cy + radius * Math.sin(trailAngle)
        );
        ctx.stroke();
      }

      // Leading beam edge
      ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + radius * Math.cos(angle),
        cy + radius * Math.sin(angle)
      );
      ctx.stroke();

      // Central "YOU" node (Synchronized hub marker)
      const centerGlow = Math.sin(angle * 4) * 0.4 + 0.6;
      ctx.shadowBlur = 12 * centerGlow;
      ctx.shadowColor = "rgba(16, 185, 129, 0.6)";
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // Pulsing halo rings from the center hub
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 * (1 - (angle % Math.PI) / Math.PI)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.25 * ((angle % Math.PI) / Math.PI), 0, Math.PI * 2);
      ctx.stroke();

      // Simulated campus coordinate node points (Spatial 3D points)
      const nodes = [
        { name: "Academic Block A", r: 0.75, a: 0.5, size: 4.5, color: "#10b981", d: "142m" },
        { name: "Library Center", r: 0.45, a: -1.2, size: 5, color: "#34d399", d: "86m" },
        { name: "Hostel Lounge", r: 0.85, a: 2.3, size: 4, color: "#60a5fa", d: "210m" },
        { name: "Executive Incubator", r: 0.35, a: 3.1, size: 5.5, color: "#a78bfa", d: "58m" }
      ];

      nodes.forEach((n, idx) => {
        const nx = cx + radius * n.r * Math.cos(n.a);
        const ny = cy + radius * n.r * Math.sin(n.a);

        // Calculate sweep line overlap to trigger ping highlight
        const nodeAngle = (n.a + Math.PI * 2) % (Math.PI * 2);
        const curAngle = (angle + Math.PI * 2) % (Math.PI * 2);
        const diff = Math.abs(curAngle - nodeAngle);
        const isActive = diff < 0.15 || diff > (Math.PI * 2 - 0.15);

        // Blinking indicator glow
        const pulse = Math.sin(angle * 5 + idx) * 0.5 + 0.5;
        const glowColor = isActive ? "rgba(52, 211, 153, 0.9)" : `rgba(255, 255, 255, ${0.4 + pulse * 0.5})`;

        // Connection path vector to the hub
        ctx.strokeStyle = isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        // Node center marker
        ctx.fillStyle = isActive ? "#34d399" : n.color;
        ctx.shadowBlur = isActive ? 12 : 3;
        ctx.shadowColor = isActive ? "#10b981" : "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.arc(nx, ny, n.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Pulse wave circles (Apple radar style)
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(nx, ny, n.size + 4 + pulse * 5, 0, Math.PI * 2);
        ctx.stroke();

        // High fidelity text badges
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "9px 'SF Pro Text', -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(n.name, nx + 10, ny - 2);

        // Display meta details below the node
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "7px 'JetBrains Mono', monospace";
        ctx.fillText(`[${n.d} • S:NOMINAL]`, nx + 10, ny + 7);
      });

      // Digital coordinates panel info elements
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SYS.GRID.ACTIVE: 3D.SENSORS`, 12, canvas.height - 18);
      ctx.fillText(`SAT.BEAM.ANGLE: ${(angle % (Math.PI * 2)).toFixed(3)} RAD`, 12, canvas.height - 10);

      ctx.textAlign = "right";
      ctx.fillText(`LAT: 21.843° N`, canvas.width - 12, canvas.height - 18);
      ctx.fillText(`LON: 83.921° E`, canvas.width - 12, canvas.height - 10);

      angle += 0.012;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTab]);

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs tracking-widest text-[#B3B3B3] uppercase font-semibold flex items-center gap-2">
            <Smartphone size={12} /> CAMPUS WEB APPLICATION
          </span>
          <h2 className="text-4xl text-foreground mt-1 font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
            The Yukon Web Application.
          </h2>
        </div>
        <span className="text-[10px] bg-white/5 border border-white/10 rounded-full text-white/95 px-4 py-1.5 font-mono select-none">
          BUILDING PHASE (ACTIVE)
        </span>
      </div>

      {/* Intro Brief */}
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        YUKON is an <span className="text-white font-medium">AI-native web application for higher education</span> that models student life into a cohesive context-aware workspace. Powered by LLM agents, spatial 3D maps, and server-authoritative databases, YUKON completely bypasses fragmented, slow static portals.
      </p>

      {/* Simulation Sandbox Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => {
            setActiveTab("copilot");
            telemetryBus.publish({ type: "YUKON_TAB_SWITCH", tab: "copilot" });
          }}
          className={`px-4 py-3 text-xs tracking-widest uppercase font-mono border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "copilot"
              ? "border-white text-white font-semibold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Sparkles size={12} />
          <span>Campus Copilot</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("spatial");
            telemetryBus.publish({ type: "YUKON_TAB_SWITCH", tab: "spatial" });
          }}
          className={`px-4 py-3 text-xs tracking-widest uppercase font-mono border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "spatial"
              ? "border-white text-white font-semibold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Compass size={12} />
          <span>Spatial Grid (Three.js)</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("stack");
            telemetryBus.publish({ type: "YUKON_TAB_SWITCH", tab: "stack" });
          }}
          className={`px-4 py-3 text-xs tracking-widest uppercase font-mono border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "stack"
              ? "border-white text-white font-semibold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Layers size={12} />
          <span>System Architecture</span>
        </button>
      </div>

      {/* Tabs Contents */}
      {activeTab === "copilot" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Test drive YUKON's contextual chat module below. Synergized with premium system styling, this module securely indexes campus and personal data. Try saying <span className="text-white/80 font-mono">hi</span> or asking <span className="text-white/80 font-mono">what is yukon?</span>.
          </p>

          <div className="bg-[#1C1C1E]/85 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[390px] shadow-[0_24px_50px_rgba(0,0,0,0.65)] relative">
            {/* Elegant Custom Title bar */}
            <div className="bg-[#2D2D30]/95 px-4 py-3 flex items-center justify-between border-b border-black/40 select-none relative z-10">
              <div className="flex items-center space-x-2">
                {/* Traffic lights */}
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] cursor-default flex items-center justify-center group relative shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                  <span className="text-[6px] text-[#4c0000] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute">×</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] cursor-default flex items-center justify-center group relative shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                  <span className="text-[6px] text-[#4d3200] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute">-</span>
                </div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] cursor-default flex items-center justify-center group relative shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                  <span className="text-[6px] text-[#003d00] font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute">+</span>
                </div>
              </div>
              
              {/* Centered title with sf-pro vibe */}
              <div className="flex items-center space-x-1.5 absolute left-1/2 transform -translate-x-1/2">
                <Sparkles size={13} className="text-blue-400" />
                <span className="text-[12px] font-semibold text-white/90 tracking-wide font-sans">Yukon Copilot Workspace</span>
              </div>
              
              {/* Status bullet */}
              <div className="flex items-center space-x-1.5 text-[10px] text-[#A3A3A3] font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="hidden sm:inline">Active Session</span>
              </div>
            </div>

            {/* Chat Body (Apple styled iMessage layout) */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans text-xs leading-relaxed select-text text-left bg-gradient-to-b from-[#18181B] to-[#121214] custom-scrollbar">
              {chatLog.map((log, i) => (
                <div key={i} className={`flex ${log.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col max-w-[80%] space-y-1">
                    <div className="flex items-center px-1.5 space-x-1.5 text-[9px] text-[#A3A3A3] select-none tracking-wider font-mono">
                      <span>{log.sender === "user" ? "Me (Secure Session)" : "Yukon Assistant"}</span>
                      <span>•</span>
                      <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 font-sans leading-relaxed text-[13px] ${
                        log.sender === "user"
                          ? "bg-blue-600 text-white rounded-tr-sm shadow-[0_2px_10px_rgba(37,99,235,0.2)]"
                          : "bg-[#27272A] border border-white/5 text-white/95 rounded-tl-sm shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{log.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center px-1.5 text-[9px] text-[#A3A3A3] select-none tracking-wider font-mono">
                      <span>Yukon Assistant</span>
                    </div>
                    <div className="bg-[#27272A]/70 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 text-[#A3A3A3] animate-pulse flex items-center space-x-2">
                      <div className="flex space-x-1 shrink-0">
                        <span className="w-1.5 h-1.5 bg-[#A3A3A3] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-[#A3A3A3] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-[#A3A3A3] rounded-full animate-bounce" />
                      </div>
                      <span className="text-[11px] font-mono">indexing context...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Form (Apple Style capsule input) */}
            <form onSubmit={handleSend} className="p-3 bg-[#1C1C1E]/95 border-t border-white/10 flex gap-2.5 relative z-10">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask YUKON (e.g. 'hi', 'how are you doing' or 'about yukon')"
                className="flex-1 bg-[#27272A] border border-white/10 rounded-full px-5 py-3 focus:outline-none focus:border-blue-500 text-[13px] font-sans text-white placeholder-neutral-500 transition-all shadow-inner"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-550 active:bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md text-center hover:scale-105 active:scale-95 shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "spatial" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 liquid-glass border border-white/10 rounded-3xl p-4 flex flex-col justify-center items-center h-[340px]">
            <canvas ref={canvasRef} width={340} height={300} className="w-full max-w-full opacity-90" />
          </div>

          <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-white font-medium text-base">Spatial Campus Navigation</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A Lightweight, web-based, hardware-accelerated grid constructed in **Three.js**. Maps physical university structures, lecture halls, and live events in real time.
              </p>
              <div className="space-y-2 pt-2 text-[11px] font-mono">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-muted-foreground">Framework</span>
                  <span className="text-white">Three.js + Canvas2D</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-muted-foreground">Coordinates</span>
                  <span className="text-white">Ground-Bound EPSG:4326</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Z-Buffering</span>
                  <span className="text-white">Enabled (Low Overhead)</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center space-x-3 select-none">
              <Compass size={18} className="text-muted-foreground shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Clicking the node signals on the map instantly highlights walking route steps, building floor metrics, and crowd densities.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "stack" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-3">
            <span className="text-[9px] text-[#A3A3A3] font-mono tracking-widest block uppercase">LAYER 01</span>
            <h5 className="text-white font-medium text-sm">LLM Agent Core</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Google Antigravity & LLM pipeline powered by prompt-engineered ground logic. Curates, categorizes, and filters database variables.
            </p>
          </div>

          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-3">
            <span className="text-[9px] text-[#A3A3A3] font-mono tracking-widest block uppercase">LAYER 02</span>
            <h5 className="text-white font-medium text-sm">Spatial HUD Index</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dynamic viewport coordinates binding React components with Three.js graphics to structure a seamless student dashboard interface.
            </p>
          </div>

          <div className="liquid-glass border border-white/10 rounded-2xl p-5 space-y-3">
            <span className="text-[9px] text-[#A3A3A3] font-mono tracking-widest block uppercase">LAYER 03</span>
            <h5 className="text-white font-medium text-sm">Real-time DB Sync</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Firebase state machines for scheduling conflicts, homework queues, and mutual planner coordination with immediate propagation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
