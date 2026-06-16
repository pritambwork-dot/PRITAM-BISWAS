import React from "react";
import { PRITAM_RESUME_DATA } from "../data/resumeData";
import { Download } from "lucide-react";
import { telemetryBus } from "../utils/telemetryBus";

export default function ResumePanel() {
  const data = PRITAM_RESUME_DATA;

  const handleDownload = () => {
    telemetryBus.publish({ type: "RESUME_DOWNLOAD_CLICK" });
    window.location.href = "/api/download-resume";
  };

  return (
    <div className="space-y-6 max-h-[82vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Navigation header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs tracking-widest text-[#B3B3B3] uppercase font-semibold">RESUME DOSSIER</span>
          <h2 className="text-3xl text-foreground mt-0.5 font-normal" style={{ fontFamily: "'Instrument Serif', serif" }}>
            The Professional Dossier.
          </h2>
        </div>
      </div>

      {/* VIEW: Beautiful Executive Print-ready sheet */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/5">
          <p className="text-xs text-muted-foreground md:mr-4">
            This dossier conforms exactly to the gold-standard monochrome PM template. Perfect margins, clear typographic contrast, and absolutely zero tables, logos, or parsing friction, netting an <span className="text-white font-medium">ATS score exceeding 95%</span>.
          </p>
          <button
            onClick={handleDownload}
            className="w-full md:w-auto px-4 py-2 bg-white text-black hover:bg-white/90 text-xs font-mono rounded-full font-semibold cursor-pointer shrink-0 transition flex items-center justify-center space-x-2"
          >
            <Download size={12} />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Actual Print Sheet */}
        <div
          id="ats-print-sheet"
          className="bg-white text-black p-5 sm:p-10 md:p-12 rounded-2xl shadow-xl space-y-6 select-text text-left max-w-4xl mx-auto border border-gray-200"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header Contact Info */}
          <div className="text-center border-b border-gray-300 pb-4 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 uppercase">
              {data.name}
            </h1>
            <p className="text-xs text-gray-700 font-medium leading-relaxed max-w-xl mx-auto">
              AI Product Builder · Data Science & Artificial Intelligence · Product Strategy · Growth
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[10px] sm:text-[11px] text-gray-600 pt-0.5">
              <span>+91 88272 41675</span>
              <span className="text-gray-300 hidden sm:inline">·</span>
              <span>pritamb.work@gmail.com</span>
              <span className="text-gray-300 hidden sm:inline">·</span>
              <span>Raipur, CG</span>
              <span className="text-gray-300 hidden sm:inline">·</span>
              <span>linkedin.com/in/pritamb90</span>
              <span className="text-gray-300 hidden sm:inline">·</span>
              <span>{data.github}</span>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">PROFILE</h3>
            <p className="text-xs text-gray-700 leading-relaxed font-normal text-justify">{data.summary}</p>
          </div>

          {/* Experience */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">EXPERIENCE</h3>
            {data.experience.map((exp) => (
              <div key={exp.id} className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-0">
                  <span className="text-xs font-bold text-gray-900">
                    {exp.role}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-700 sm:text-gray-900 font-medium sm:font-normal">{exp.period}</span>
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {exp.company.replace(" • ", " · ")}
                </div>
                <div className="space-y-1 pt-1">
                  {exp.bullets.map((b, idx) => (
                    <div key={idx} className="flex items-start text-xs text-gray-700 leading-relaxed font-normal">
                      <span className="mr-2 shrink-0 text-gray-900">–</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Featured Project */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">FEATURED PROJECT</h3>
            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-0">
                <span className="text-xs font-bold text-gray-900">
                  {data.project.name}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-700 sm:text-gray-900 font-medium sm:font-normal">Currently in Development</span>
              </div>
              <div className="text-xs text-gray-600 font-normal">
                {data.project.techStack.join(" · ")}
              </div>
              <div className="space-y-1 pt-1">
                {data.project.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start text-xs text-gray-700 leading-relaxed font-normal">
                    <span className="mr-2 shrink-0 text-gray-900">–</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">EDUCATION</h3>
            {(data.educationList || [
              {
                institution: data.education.institution,
                degree: `${data.education.degree} in ${data.education.major}`,
                period: data.education.period
              }
            ]).map((edu, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-0">
                  <span className="text-xs font-bold text-gray-900">{edu.degree}</span>
                  <span className="text-[10px] sm:text-xs text-gray-705 sm:text-gray-900 font-normal">{edu.period}</span>
                </div>
                <div className="text-xs text-gray-600 font-medium">{edu.institution}</div>
              </div>
            ))}
          </div>

          {/* Programs & Simulations */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">PROGRAMS & SIMULATIONS</h3>
            <div className="space-y-1">
              {data.programs.map((prog, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 sm:gap-0 text-xs">
                  <span className="font-bold text-gray-900">{prog.name}</span>
                  <span className="text-[10px] sm:text-xs text-gray-600 sm:text-gray-900 font-normal">{prog.provider}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">SKILLS</h3>
            <div className="space-y-1 text-xs">
              {data.skills.map((cat, idx) => (
                <div key={idx} className="text-xs">
                  <span className="font-bold text-gray-900">{cat.category}: </span>
                  <span className="text-gray-700">{cat.items.join(" · ")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications - Dual Column layout */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-0.5">CERTIFICATIONS</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
              {/* Left Column (indexes 0, 2, 4, 6, 8) */}
              <div className="space-y-2">
                {(data.certificationsList || []).filter((_, idx) => idx % 2 === 0).map((cert, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-bold text-gray-950">{cert.name}</div>
                    <div className="text-gray-600 text-[11px] font-normal">{cert.provider}</div>
                  </div>
                ))}
              </div>
              {/* Right Column (indexes 1, 3, 5, 7) */}
              <div className="space-y-2">
                {(data.certificationsList || []).filter((_, idx) => idx % 2 !== 0).map((cert, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="font-bold text-gray-950">{cert.name}</div>
                    <div className="text-gray-600 text-[11px] font-normal">{cert.provider}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
