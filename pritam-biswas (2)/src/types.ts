/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WorkExperience {
  id: string;
  role: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface ProjectData {
  name: string;
  status: string;
  techStack: string[];
  bullets: string[];
}

export interface EducationData {
  institution: string;
  degree: string;
  major: string;
  period: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  major?: string;
  period: string;
}

export interface ProgramData {
  name: string;
  provider: string;
}

export interface CertificationEntry {
  name: string;
  provider: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  github: string;
  headline: string;
  summary: string;
  experience: WorkExperience[];
  project: ProjectData;
  education: EducationData;
  educationList?: EducationEntry[];
  programs: ProgramData[];
  skills: SkillCategory[];
  certifications: string[];
  certificationsList?: CertificationEntry[];
}

export interface ATSAnalysisResult {
  score: number;
  grammarAndToneScore: number;
  formattingRiskScore: number;
  feedback: string;
  missingKeywords: string[];
  keywordDensity: { keyword: string; count: number }[];
  actionVerbCount: number;
  strengthPoints: string[];
  improvedSummary: string;
  suggestedBullets: { original: string; suggested: string; reason: string }[];
}

export interface CoverLetterResult {
  coverLetter: string;
  coldEmail: string;
}

export interface MockInterviewQuestion {
  question: string;
  category: "product" | "technical" | "behavioral" | "growth";
  strategy: string;
  answerOutline: string;
}
