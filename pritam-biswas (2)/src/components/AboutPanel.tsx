import React, { useEffect, useState } from "react";
import { PRITAM_RESUME_DATA } from "../data/resumeData";
import { GraduationCap, Award, BookOpen, Star, FileText, Layout, Activity, Globe, Users, MapPin } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

const PROFICIENCY_DATA = [
  { subject: "AI Product Strategy", value: 95, fullMark: 100 },
  { subject: "Data Science", value: 90, fullMark: 100 },
  { subject: "Engineering", value: 85, fullMark: 100 },
  { subject: "Business Design", value: 80, fullMark: 100 },
  { subject: "Human-AI UX", value: 85, fullMark: 100 },
  { subject: "Growth Scaling", value: 75, fullMark: 100 },
];

interface AboutPanelProps {
  onClose: () => void;
  onOpenResume: () => void;
}

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  currentVisitor: {
    ip: string;
    count: number;
    country: string;
    city: string;
  } | null;
}

export default function AboutPanel({ onClose, onOpenResume }: AboutPanelProps) {
  const data = PRITAM_RESUME_DATA;
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [chartVisible, setChartVisible] = useState(false);

  useEffect(() => {
    fetch("/api/visitor-stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Could not fetch stats", err));

    // Wait for the panel entrance animation to settle so the container container is fully sized
    const timer = setTimeout(() => {
      setChartVisible(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Dynamic Header */}
      <div className="flex items-start justify-between border-b border-white/5 pb-6">
        <div>
          <span className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">Vision & Background</span>
          <h2 className="text-4xl text-foreground mt-1 font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
            The Intersection of Science & Strategy.
          </h2>
        </div>
        <button
          onClick={onOpenResume}
          className="flex items-center space-x-2 text-xs text-muted-foreground hover:text-white transition bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full cursor-pointer border border-white/5"
        >
          <FileText size={14} />
          <span>Full Resume</span>
        </button>
      </div>

      {/* Narrative Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <p className="text-muted-foreground leading-relaxed text-base">
            I am a Data Science and Artificial Intelligence undergraduate at the 
            <span className="text-white font-medium"> Indian Institute of Management Sambalpur</span>. My worldview 
            is anchored in first-principles engineering: I believe artificial intelligence is not just a tool to optimize existing software, but a fundamental paradigm shift to reconstruct systems from the grounds up.
          </p>
          <p className="text-muted-foreground leading-relaxed text-base">
            I build AI-native software (such as <span className="text-white font-medium">YUKON</span>) configured to unify personal productivity, context-aware indexing, and 3D environment exploration. My methodology merges strong statistical modeling with analytical product management workflows, establishing growth loops that scale.
          </p>
          <p className="text-muted-foreground leading-relaxed text-sm italic border-l-2 border-white/10 pl-4 py-1">
            "Amidst the cloud of AI noise, real builders focus on prompt architectures, spatial computer integration, and raw user-centric business strategy."
          </p>
        </div>

        {/* Quick Context Card */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10 space-y-4">
          <h4 className="text-sm font-semibold tracking-wider text-white uppercase flex items-center gap-2">
            <Star size={14} /> Brief Focus
          </h4>
          <ul className="text-xs text-muted-foreground space-y-3">
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="font-medium">Origin</span>
              <span className="text-white">Raipur, CG, India</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="font-medium">Academic Year</span>
              <span className="text-white">Undergraduate (2025-P)</span>
            </li>
            <li className="flex justify-between border-b border-white/5 pb-2">
              <span className="font-medium">Core Tech</span>
              <span className="text-white">Python, React, Three.js</span>
            </li>
            <li className="flex justify-between">
              <span className="font-medium">Interests</span>
              <span className="text-white text-right">Spatial OS, AI Agents</span>
            </li>
          </ul>
        </div>
      </div>



      {/* Skill Profile Radar Visualization */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <Star size={18} className="text-cyan-400" />
          <span>Core Domain Expertise</span>
        </h3>
        <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <h4 className="text-white font-medium text-base">Interdisciplinary Synergy</h4>
            <p className="text-sm text-white/70 leading-relaxed font-light">
              My technical proficiency lies at the convergence of model development, strategic product architecture, and human-computer interfaces. By designing around first-principles, I translate complex statistical capabilities into scalable, high-impact business products.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">01 // AI Product Strategy</span>
                <p className="text-xs text-white/80 font-medium mt-1">Multi-Agent Systems & LLM Workflows</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">02 // Data Science</span>
                <p className="text-xs text-white/80 font-medium mt-1">Statistical Modeling & Feature Engineering</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">03 // Software Engineering</span>
                <p className="text-xs text-white/80 font-medium mt-1">Interactive UI, React, & System Performance</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-semibold">04 // Growth Design</span>
                <p className="text-xs text-white/80 font-medium mt-1">Acquisition Loops & Analytical Strategy</p>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-[320px] h-[300px] flex items-center justify-center relative bg-white/[0.01] border border-white/5 rounded-2xl p-4 select-none">
            {chartVisible ? (
              <div className="w-full h-full min-w-0 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={PROFICIENCY_DATA}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: "rgba(255, 255, 255, 0.7)", fontSize: 10, fontFamily: "monospace", fontWeight: 500 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Proficiency"
                      dataKey="value"
                      stroke="#22d3ee"
                      fill="url(#radarGlow)"
                      fillOpacity={0.3}
                    />
                    <defs>
                      <linearGradient id="radarGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-white/20 text-xs font-mono animate-pulse">Initializing Telemetry...</div>
            )}
          </div>
        </div>
      </div>

      {/* Education Detail */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <GraduationCap size={18} className="text-muted-foreground" />
          <span>Academic Foundation</span>
        </h3>
        <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="text-white font-medium text-base">{data.education.institution}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.education.degree} in {data.education.major}
            </p>
          </div>
          <span className="text-xs text-muted-foreground/80 bg-white/5 px-3 py-1 rounded-full border border-white/5 font-mono">
            {data.education.period}
          </span>
        </div>
      </div>

      {/* Professional Programs */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <BookOpen size={18} className="text-muted-foreground" />
          <span>Selected Strategy & Job Simulations</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.programs.map((prog, i) => (
            <div key={i} className="liquid-glass rounded-2xl p-5 border border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-white text-sm font-medium">{prog.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{prog.provider}</p>
              </div>
              <span className="text-xs text-muted-foreground/40 font-mono">#{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Specializations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center space-x-2">
          <Award size={18} className="text-muted-foreground" />
          <span>Featured Certifications</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data.certifications.slice(0, 9).map((cert, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-start space-x-3 hover:bg-white/[0.04] transition-all duration-300">
              <span className="text-xs text-muted-foreground font-mono mt-0.5">0{idx + 1}</span>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">{cert}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
