import React from "react";
import { PRITAM_RESUME_DATA } from "../data/resumeData";
import { Briefcase, ArrowUpRight, TrendingUp, Users, Calendar } from "lucide-react";
import { telemetryBus } from "../utils/telemetryBus";

interface ExperiencePanelProps {
  onClose: () => void;
  onOpenResume: () => void;
}

export default function ExperiencePanel({ onClose, onOpenResume }: ExperiencePanelProps) {
  const data = PRITAM_RESUME_DATA;

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/5 pb-6">
        <div>
          <span className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">Leadership & Growth</span>
          <h2 className="text-4xl text-foreground mt-1 font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Professional Trajectory.
          </h2>
        </div>
      </div>

      {/* Trajectory Breakdown */}
      <div className="space-y-6">
        {data.experience.map((exp) => (
          <div
            key={exp.id}
            onMouseEnter={() => telemetryBus.publish({ type: "EXPERIENCE_HOVER", company: exp.company })}
            className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 transition-all duration-300 hover:border-white/20 hover:scale-[1.01] relative overflow-hidden group"
          >
            {/* Background Hint */}
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-white/[0.01] rounded-full group-hover:bg-white/[0.02] transition-colors duration-500 blur-2xl" />

            {/* Title & Dates */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-5">
              <div className="space-y-1">
                <span className="text-xs tracking-wider text-muted-foreground/80 font-mono capitalize">
                  {exp.id === "exp-1" ? "Growth Engine" : "Operational Coordination"}
                </span>
                <h3 className="text-xl font-medium text-white group-hover:text-foreground transition-colors">
                  {exp.role}
                </h3>
                <p className="text-sm text-foreground/80 font-medium">
                  {exp.company}
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-white/5 border border-white/5 rounded-full px-4 py-1.5 self-start sm:self-auto select-none">
                <Calendar size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">{exp.period}</span>
              </div>
            </div>

            {/* Bullet Points */}
            <ul className="space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground list-none ml-1">
              {exp.bullets.map((bullet, idx) => {
                // Highlight important PM metrics/terms
                const wordsToHighlight = [
                  "creator-acquisition strategies",
                  "high-impact growth pipelines",
                  "strategic communication",
                  "GTM entry strategies",
                  "25%",
                  "50+",
                  "20%",
                  "operational coordination"
                ];

                let highlightedText = bullet;
                wordsToHighlight.forEach((word) => {
                  const regex = new RegExp(`(${word})`, "gi");
                  highlightedText = highlightedText.replace(regex, `<span class="text-white font-medium">$1</span>`);
                });

                return (
                  <li key={idx} className="flex items-start space-x-3">
                    <span className="text-xs text-muted-foreground/60 font-mono mt-1.5 select-none">
                      [0{idx + 1}]
                    </span>
                    <p
                      className="text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: highlightedText }}
                    />
                  </li>
                );
              })}
            </ul>

            {/* Summary Tag */}
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4">
              <span className="text-xs text-muted-foreground select-none">Focus Keywords:</span>
              {(exp.id === "exp-1"
                ? ["Partnerships", "GTM Strategy", "Founder-Collaboration", "Analytics"]
                : ["Operations", "Stakeholder Management", "Volunteer Coordination", "Execution"]
              ).map((tag, tIdx) => (
                <span
                  key={tIdx}
                  onClick={() => telemetryBus.publish({ type: "EXPERIENCE_METRIC_CLICK", company: exp.company, metric: tag })}
                  className="text-xs text-white/70 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 transition-all rounded-md px-2.5 py-1 font-mono cursor-pointer"
                  title={`Broadcasting ${tag} metric telemetry 📡`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Core Philosophies / Methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        {/* Growth Card */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-white/80">
              <TrendingUp size={18} />
            </div>
            <h4 className="text-white font-medium text-base mt-2">Partner & Outreach Funnels</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Applying quantitative growth systems to lower friction, restructure partnership agreements, and scale digital outreach conversion scores.
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#B3B3B3] mt-4 block">Methodology 01</span>
        </div>

        {/* Stakeholder Card */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-white/80">
              <Users size={18} />
            </div>
            <h4 className="text-white font-medium text-base mt-2">Dynamic Team Orchestration</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Commanding operational pipelines and alignment charts for volunteers and cross-functional taskforces to quicken product delivery.
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#B3B3B3] mt-4 block">Methodology 02</span>
        </div>
      </div>
    </div>
  );
}
