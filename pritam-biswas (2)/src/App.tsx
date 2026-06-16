/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Menu, X, ArrowLeft, Terminal, ShieldAlert, Sparkles, Lock, Activity, Globe, RefreshCw } from "lucide-react";
import AboutPanel from "./components/AboutPanel";
import ExperiencePanel from "./components/ExperiencePanel";
import YukonPanel from "./components/YukonPanel";
import ContactPanel from "./components/ContactPanel";
import ResumePanel from "./components/ResumePanel";
import { telemetryBus } from "./utils/telemetryBus";
import { motion, AnimatePresence } from "motion/react";

type ActivePanel = "Home" | "About" | "Experience" | "Yukon" | "Contact" | "Resume";

const LOADER_STEPS = [
  "Initializing System...",
  "Loading Achievements...",
  "Loading Projects...",
  "Loading AI Agents...",
  "Connecting to YUKON...",
  "Ready."
];

export default function App() {
  const [activeLink, setActiveLink] = useState<ActivePanel>("Home");
  const [isMuted, setIsMuted] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exitLoader, setExitLoader] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [loaderLogIndex, setLoaderLogIndex] = useState(0);
  const [aboutClickCount, setAboutClickCount] = useState(0);
  const [yukonClickCount, setYukonClickCount] = useState(0);

  // States for traffic encryption authorization
  const [showTrafficAuthModal, setShowTrafficAuthModal] = useState(false);
  const [trafficAuthPasscode, setTrafficAuthPasscode] = useState("");
  const [trafficAuthError, setTrafficAuthError] = useState("");
  const [showTrafficReport, setShowTrafficReport] = useState(false);
  const [trafficReportData, setTrafficReportData] = useState<{
    totalVisits: number;
    uniqueVisitors: number;
    currentVisitor: any;
    allVisitors: any[];
  } | null>(null);
  const [isFetchingTrafficStats, setIsFetchingTrafficStats] = useState(false);

  const fetchVisitorStats = async () => {
    setIsFetchingTrafficStats(true);
    try {
      const res = await fetch("/api/visitor-stats");
      const data = await res.json();
      setTrafficReportData(data);
    } catch (err) {
      console.error("Failed to fetch visitor statistics:", err);
    } finally {
      setIsFetchingTrafficStats(false);
    }
  };
  const [emailStatus, setEmailStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
    warning?: string;
  } | null>(null);

  // Trigger Live Traffic dispatch to Gmail Inbox
  const triggerTrafficEmailDispatch = async () => {
    setEmailStatus({
      show: true,
      success: true,
      message: "Initiating live system log dispatch to pritamb.work@gmail.com..."
    });

    try {
      const res = await fetch("/api/send-traffic-report", { method: "POST" });
      const data = await res.json();
      
      if (data.success) {
        setEmailStatus({
          show: true,
          success: true,
          message: data.message || "Live traffic telemetry dispatched successfully to pritamb.work@gmail.com!"
        });
      } else if (data.warning === "SMTP_NOT_CONFIGURED") {
        setEmailStatus({
          show: true,
          success: false,
          warning: "SMTP_NOT_CONFIGURED",
          message: "Mail dispatch failed: SMTP is not configured! Please configure SMTP_USER, SMTP_PASS, SMTP_HOST, and SMTP_PORT in Settings."
        });
      } else {
        setEmailStatus({
          show: true,
          success: false,
          message: data.error || "An error occurred while dispatching the email."
        });
      }
    } catch (e: any) {
      console.error(e);
      setEmailStatus({
        show: true,
        success: false,
        message: "Failed to establish mail route connection."
      });
    }
  };

  // Real-time UTC Ticking stream to match cyber HUD telemetry concept
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getUTCHours()).padStart(2, "0");
      const mins = String(now.getUTCMinutes()).padStart(2, "0");
      const secs = String(now.getUTCSeconds()).padStart(2, "0");
      setCurrentTime(`${hrs}:${mins}:${secs} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Send a periodic heartbeat to record user stays duration (every 10 seconds)
    const sendStayHeartbeat = () => {
      fetch("/api/track-heartbeat", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
      })
      .catch((err) => {
        // Intercept standard Abort or transient network drops to keep logs completely pristine
        if (err?.name === "AbortError" || err?.message?.includes("Failed to fetch")) {
          return;
        }
        console.warn("Stay duration tracking heartbeat deferred:", err);
      });
    };

    // First heartbeat after 5 seconds to register arrival, then every 10 seconds
    const startupTimer = setTimeout(sendStayHeartbeat, 5000);
    const intervalTimer = setInterval(sendStayHeartbeat, 10000);

    return () => {
      clearTimeout(startupTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const targetPercentRef = useRef(0);
  const currentPercentRef = useRef(0);
  const targetScrollYRef = useRef(0);
  const currentScrollYRef = useRef(0);

  const heroLeftRef = useRef<HTMLDivElement>(null);
  const heroRightRef = useRef<HTMLDivElement>(null);

  // Toggle mute state of background video
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Ensure autoplay can be initialized
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("Autoplay was blocked by browser policies. Scrubbing on scroll active", err);
      });
    }
  }, []);

  // Monitor layout-blocking fonts loading
  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready
        .then(() => {
          setFontsLoaded(true);
        })
        .catch((err) => {
          console.log("Error checking fonts", err);
          setFontsLoaded(true);
        });
    } else {
      setFontsLoaded(true);
    }
  }, []);

  // Safe timeout to disable loader on bad connections
  useEffect(() => {
    const backupTimer = setTimeout(() => {
      setFontsLoaded(true);
      setVideoLoaded(true);
    }, 4500);
    return () => clearTimeout(backupTimer);
  }, []);

  // Cycle loader steps
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoaderLogIndex((prev) => {
        if (prev < LOADER_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 650);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Synchronize layout transition
  useEffect(() => {
    if (fontsLoaded && videoLoaded && loaderLogIndex === LOADER_STEPS.length - 1) {
      const exitTimer = setTimeout(() => {
        setExitLoader(true);
        const hideTimer = setTimeout(() => {
          setIsLoading(false);
        }, 800); // matches transition-opacity duration
        return () => clearTimeout(hideTimer);
      }, 500); // structural micro-buffer for design consistency
      return () => clearTimeout(exitTimer);
    }
  }, [fontsLoaded, videoLoaded, loaderLogIndex]);

  // Trigger visitor tracking on mount
  useEffect(() => {
    fetch("/api/track-visit", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true
    })
    .catch((err) => {
      if (err?.name === "AbortError" || err?.message?.includes("Failed to fetch")) {
        return;
      }
      console.warn("Visitor tracking deferred", err);
    });
  }, []);

  // Track window scroll percentage and scroll position
  useEffect(() => {
    let lastY = window.scrollY;
    let lastTime = 0;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      targetScrollYRef.current = scrollY;
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      targetPercentRef.current = scrollY / maxScroll;

      const direction = scrollY >= lastY ? "down" : "up";
      lastY = scrollY;

      const now = Date.now();
      if (now - lastTime > 600) { // Throttle at 600ms to stay super-responsive
        lastTime = now;
        telemetryBus.publish({
          type: "SECTION_SCROLL",
          section: activeLink,
          percentage: Number((scrollY / maxScroll).toFixed(3)),
          direction
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeLink]);

  // High performance lerping loop to scrub background video frame and apply parallax perfectly on scroll
  useEffect(() => {
    let animFrameId: number;
    const updateVideoFrame = () => {
      // Smooth lerp easing
      currentPercentRef.current += (targetPercentRef.current - currentPercentRef.current) * 0.085;
      currentScrollYRef.current += (targetScrollYRef.current - currentScrollYRef.current) * 0.085;

      // Bound safety
      if (currentPercentRef.current < 0) currentPercentRef.current = 0;
      if (currentPercentRef.current > 0.999) currentPercentRef.current = 0.999;

      if (videoRef.current) {
        // Apply smooth cinematic zoom-in and subtle translation parallax to the video itself
        videoRef.current.style.transform = `scale(${1 + currentPercentRef.current * 0.12}) translateY(${currentPercentRef.current * -30}px) translateZ(0)`;
        
        // Dynamically fade & blur the background video as they leave the Home section (making text in lower sections perfectly legible)
        videoRef.current.style.opacity = `${videoLoaded ? Math.max(0.25, 0.92 - currentPercentRef.current * 0.7) : 0.15}`;
        videoRef.current.style.filter = `blur(${currentPercentRef.current * 6}px)`;
        
        // Custom interactive physics: accelerate brain pulse logic as scroll activity spikes
        const scrollDelta = Math.abs(targetPercentRef.current - currentPercentRef.current);
        const dynamicSpeed = 1.0 + Math.min(2.0, scrollDelta * 12.0);
        if (Math.abs(videoRef.current.playbackRate - dynamicSpeed) > 0.05) {
          videoRef.current.playbackRate = dynamicSpeed;
        }
      }

      // Apply subtle translateY parallax with premium fading out as scroll increases
      if (heroLeftRef.current) {
        heroLeftRef.current.style.transform = `translateY(${currentScrollYRef.current * 0.24}px)`;
        heroLeftRef.current.style.opacity = `${Math.max(0, 1 - currentScrollYRef.current / 700)}`;
      }
      if (heroRightRef.current) {
        heroRightRef.current.style.transform = `translateY(${currentScrollYRef.current * 0.38}px)`;
        heroRightRef.current.style.opacity = `${Math.max(0, 1 - currentScrollYRef.current / 600)}`;
      }

      // Update interactive progress bar
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${currentPercentRef.current})`;
      }

      animFrameId = requestAnimationFrame(updateVideoFrame);
    };

    animFrameId = requestAnimationFrame(updateVideoFrame);
    return () => cancelAnimationFrame(animFrameId);
  }, [videoLoaded]);

  // Intersection Observer to highlight active link based on scroll section
  useEffect(() => {
    if (isLoading) return;

    const sections = ["home", "about", "experience", "yukon", "resume", "contact"];
    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -45% 0px", // Snaps when section occupies focal center
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const mapped: ActivePanel = (id.charAt(0).toUpperCase() + id.slice(1)) as ActivePanel;
          setActiveLink(mapped);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isLoading]);

  const openPanel = (target: ActivePanel) => {
    setActiveLink(target);
    setIsMobileMenuOpen(false);

    if (target === "About") {
      setAboutClickCount((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setShowTrafficAuthModal(true);
          setTrafficAuthPasscode("");
          setTrafficAuthError("");
          return 0; // reset
        }
        return next;
      });
    } else {
      setAboutClickCount(0);
    }

    if (target === "Yukon") {
      setYukonClickCount((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setShowTrafficAuthModal(true);
          setTrafficAuthPasscode("");
          setTrafficAuthError("");
          return 0; // reset
        }
        return next;
      });
    } else {
      setYukonClickCount(0);
    }

    const id = target.toLowerCase();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Also publish navigation highlight event
    telemetryBus.publish({
      type: "SECTION_SCROLL",
      section: target,
      percentage: 0,
      direction: "down"
    });
  };

  return (
    <div
      id="pritam-portfolio-root"
      className="min-h-screen relative overflow-hidden flex flex-col justify-between text-foreground select-text"
    >
      {/* Subtle & Elegant Full-Viewport Loader Screen */}
      {isLoading && (
        <div
          id="global-elegant-loader"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 select-none pointer-events-none"
        >
          {/* Panoramic Split Shutters parting like widescreen cinema */}
          <div 
            className="absolute inset-x-0 top-0 h-1/2 bg-black origin-top"
            style={{
              transform: exitLoader ? "translateY(-100%)" : "translateY(0%)",
              transition: "transform 1400ms cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
          <div 
            className="absolute inset-x-0 bottom-0 h-1/2 bg-black origin-bottom"
            style={{
              transform: exitLoader ? "translateY(100%)" : "translateY(0%)",
              transition: "transform 1400ms cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />

          {/* Centered Apple OS Bootloader Design with high-contrast scale & blur dissolve */}
          <div 
            className="relative z-10 flex flex-col items-center justify-center max-w-xs w-full mb-12 text-center"
            style={{
              opacity: exitLoader ? 0 : 1,
              transform: exitLoader ? "scale(0.92) translateY(-10px)" : "scale(1)",
              filter: exitLoader ? "blur(8px)" : "none",
              transition: "opacity 800ms ease-out, transform 900ms cubic-bezier(0.16, 1, 0.3, 1), filter 800ms ease-out"
            }}
          >
            
            {/* Iconic Website Vector Logo (Favicon) */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-16 h-16 text-white mb-20 animate-fade-in" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="5.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 16px rgba(255, 255, 255, 0.2))" }}
            >
              {/* Semi-transparent guiding hex container */}
              <path d="M 18,34 L 18,66 L 50,84 L 82,66 L 82,34 L 50,16 Z" opacity="0.12" strokeWidth="4.5" />
              {/* Bold front edge lines formatting */}
              <path d="M 18,34 L 50,16 L 82,34 L 50,52 Z" />
              <path d="M 18,34 L 18,66 L 50,84" />
              <path d="M 50,52 L 50,84" />
              <path d="M 50,52 L 82,66 L 82,34" />
              <path d="M 18,50 L 50,34" />
              <path d="M 50,68 L 82,50" />
            </svg>

            {/* Apple-style ultra-thin minimalist progress bar and track */}
            <div className="w-48 h-[4px] bg-[#222222] overflow-hidden rounded-full relative">
              <div 
                className="absolute h-full bg-[#ffffff] rounded-full transition-all duration-300"
                style={{ width: `${((loaderLogIndex + 1) / LOADER_STEPS.length) * 100}%` }}
              />
            </div>

            {/* Ultra-subtle Apple Verbose-mode Log (adds premium portfolio personalization) */}
            <p className="mt-4 text-[9px] font-mono tracking-wider text-zinc-600/70 uppercase">
              {LOADER_STEPS[loaderLogIndex]}
            </p>
          </div>
        </div>
      )}

      {/* FIXED BACKGROUND VIDEO WITH HIGH-CONTRAST AMBIENT VIGNETTES */}
      <div className="fixed inset-0 w-full h-full object-cover z-0 overflow-hidden pointer-events-none bg-black">
        <video
          id="portfolio-video"
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => setVideoLoaded(true)}
          className="w-full h-full object-cover will-change-transform transform-gpu"
          style={{ 
            opacity: videoLoaded ? 0.92 : 0.2,
            transform: isLoading ? "scale(1.08)" : "scale(1.0)",
            transition: "opacity 1000ms ease, transform 2400ms cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
        />
        {/* Cinematic CRT Scanlines and swept laser sweeps */}
        <div className="cinema-scanlines" />
        <div className="cinema-laser-line" />
        {/* Deep, highly professional cinema vignetting layer for flawless typography contrast */}
        <div id="video-contrast-overlay" className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/85 pointer-events-none" />
      </div>

      {/* Floating Active Page Dot Coordinates Track (Left Margins) */}
      <motion.div 
        className="hidden xl:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-40 select-none"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: isLoading ? -20 : 0, opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {(["Home", "About", "Experience", "Yukon", "Resume", "Contact"] as ActivePanel[]).map((section) => (
          <button
            key={section}
            onClick={() => openPanel(section)}
            className="group flex items-center gap-3 text-[9px] font-mono tracking-widest text-white/20 hover:text-white transition-all cursor-pointer text-left"
          >
            <span className={`w-2 h-2 rounded-full border transition-all duration-300 ${
              activeLink === section 
                ? "bg-white border-white scale-125 dot-glow" 
                : "bg-transparent border-white/20 group-hover:border-white/60"
            }`} />
            <span className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase ${
              activeLink === section ? "!opacity-100 text-white font-medium" : ""
            }`}>{section}</span>
          </button>
        ))}
      </motion.div>

      {/* Thin interactive top-edge progress bar */}
      <div 
        ref={progressBarRef} 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 via-[#ec4899] to-violet-500 z-50 origin-left scale-x-0 will-change-transform shadow-[0_0_8px_rgba(236,72,153,0.4)]"
      />

      {/* Sticky Top Header Navigation */}
      <motion.header 
        id="portfolio-header" 
        className="fixed top-0 left-0 right-0 z-40 w-full"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: isLoading ? -40 : 0, opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav className="flex justify-between items-center px-6 py-2.5 max-w-5xl mx-auto mt-4 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] transition-all duration-300 w-[calc(100%-2rem)]">
          {/* Logo */}
          <button
            id="portfolio-logo"
            onClick={() => {
              openPanel("Home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3.5 pl-3 transition-all duration-300 hover:opacity-90 cursor-pointer focus:outline-none select-none"
          >
            <svg 
              viewBox="0 0 100 100" 
              className="w-7 h-7 text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="5.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Semi-transparent guiding hex container */}
              <path d="M 18,34 L 18,66 L 50,84 L 82,66 L 82,34 L 50,16 Z" opacity="0.12" strokeWidth="4.5" />
              {/* Bold front edge lines formatting */}
              <path d="M 18,34 L 50,16 L 82,34 L 50,52 Z" />
              <path d="M 18,34 L 18,66 L 50,84" />
              <path d="M 50,52 L 50,84" />
              <path d="M 50,52 L 82,66 L 82,34" />
              <path d="M 18,50 L 50,34" />
              <path d="M 50,68 L 82,50" />
            </svg>
            <span className="text-[11px] font-sans font-medium tracking-[0.24em] text-white/95 uppercase mt-0.5">
              Pritam Biswas
            </span>
          </button>

          {/* Navigation Links Desktop only */}
          <div id="portfolio-desktop-nav" className="hidden md:flex items-center space-x-1">
            {(["Home", "About", "Experience", "Yukon", "Contact"] as ActivePanel[]).map((link) => (
              <button
                key={link}
                id={`nav-${link.toLowerCase()}`}
                onClick={() => openPanel(link)}
                className={`text-[10px] tracking-widest uppercase font-mono px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  activeLink === link
                    ? "bg-white/10 text-white font-semibold border border-white/10 shadow-sm"
                    : "text-[#B3B3B3] hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Right Action CTA */}
          <div className="flex items-center space-x-2">
            <button
              id="portfolio-header-cta"
              onClick={() => openPanel("Resume")}
              className={`text-[10px] font-mono uppercase tracking-widest px-4 py-2 rounded-full transition-all duration-200 cursor-pointer active:scale-95 border ${
                activeLink === "Resume"
                  ? "bg-white text-black font-semibold border-white"
                  : "bg-white/10 text-white border-white/10 hover:bg-white/20"
              }`}
            >
              Resume
            </button>

            {/* Mobile Menu Trigger */}
            <button
              id="portfolio-mobile-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-foreground p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div
            id="portfolio-mobile-menu"
            className="md:hidden absolute top-full left-0 right-0 py-6 px-8 mx-4 mt-2 z-50 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/10 flex flex-col space-y-4 animate-fade-rise shadow-2xl"
          >
            {(["Home", "About", "Experience", "Yukon", "Contact", "Resume"] as ActivePanel[]).map((link) => (
              <button
                key={link}
                onClick={() => openPanel(link)}
                className={`text-left text-xs uppercase tracking-widest font-mono py-1.5 transition-colors ${
                  activeLink === link ? "text-white font-semibold" : "text-muted-foreground hover:text-white"
                }`}
              >
                {link}
              </button>
            ))}
          </div>
        )}
      </motion.header>

      {/* Main Content Scrollable Storyline */}
      <main id="portfolio-stage" className="relative z-10 flex-grow flex flex-col w-full">
        
        {/* CHAPTER 1: IMMERSIVE HERO VIEW (Matches 1:1 the style uploaded) */}
        <section
          id="home"
          className="min-h-screen max-w-7xl mx-auto px-6 sm:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pt-32 pb-16 items-center snap-start"
        >
          {/* Left Column (Main Typography Card) */}
          <div ref={heroLeftRef} className="lg:col-span-8 flex flex-col items-start text-left space-y-6 will-change-transform">
            
            {/* Tag metadata indicator */}
            <motion.div 
              className="flex items-center gap-2.5 text-[10px] font-mono tracking-[0.25em] text-white/50 select-none uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 15 : 0 }}
              transition={{ duration: 1.0, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <span>AI Product Builder</span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span>Data Scientist</span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span>Strategist</span>
            </motion.div>

            {/* Gorgeous Cinema Title */}
            <motion.h1
              id="portfolio-heading"
              className="text-3xl sm:text-5xl lg:text-[60px] leading-[1.12] tracking-[-0.035em] font-normal text-white"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 25 : 0 }}
              transition={{ duration: 1.2, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              Exploring the <span className="font-light text-white/75 italic">intersection of</span> <br />
              <span className="font-semibold text-white">Artificial Intelligence,</span> <br />
              Data Science, & <span className="impact-gradient font-semibold">Business Strategy</span> <br />
              to solve <span className="font-light text-white/80 italic">real world problems.</span>
            </motion.h1>

            {/* Subtext description with custom highlights */}
            <motion.p
              id="portfolio-description"
              className="text-white/60 text-sm sm:text-base max-w-xl mt-4 leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 20 : 0 }}
              transition={{ duration: 1.2, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              Data Science & AI undergraduate at <span className="text-white font-normal underline decoration-white/20 underline-offset-4">IIM Sambalpur</span>.
              I design and build AI-native products through product thinking, first-principles engineering, and business strategy.
            </motion.p>

            {/* Centered CTA Action pair */}
            <motion.div 
              className="pt-6 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: isLoading ? 0 : 1, y: isLoading ? 15 : 0 }}
              transition={{ duration: 1.2, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                id="explore-yukon-cta"
                onClick={() => openPanel("Yukon")}
                className="bg-white text-black rounded-full px-8 py-3.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-white/95 scale-100 hover:scale-[1.03] transition-all duration-300 cursor-pointer active:scale-95 shadow-lg shadow-white/5"
              >
                Explore My Work
              </button>
              <button
                id="view-resume-cta"
                onClick={() => openPanel("Contact")}
                className="rounded-full px-8 py-3.5 text-xs font-mono uppercase tracking-wider text-white bg-white/10 border border-white/10 hover:bg-white/15 scale-100 hover:scale-[1.03] transition-all duration-300 cursor-pointer active:scale-95"
              >
                Let’s Connect
              </button>
            </motion.div>
          </div>

          {/* Right Column (Floating tech-HUD gadgets matching video screenshots) */}
          <div ref={heroRightRef} className="hidden lg:flex flex-col gap-8 lg:col-span-4 pl-12 border-l border-white/5 h-full justify-center will-change-transform">
            
            {/* HUD 1: System philosophy */}
            <motion.div 
              className="space-y-2 select-none"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isLoading ? 0 : 1, x: isLoading ? 20 : 0 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">PHILOSOPHY PROTOCOL</span>
              <p className="text-xs font-mono tracking-wide text-white/70 leading-relaxed uppercase border-l-2 border-white/20 pl-3">
                Thinking in systems, solving with intelligence, designing for impact.
              </p>
            </motion.div>

            {/* HUD 2: Interactive Focus Tracker */}
            <motion.div 
              className="space-y-4 py-5 border-t border-b border-white/5 select-none"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isLoading ? 0 : 1, x: isLoading ? 20 : 0 }}
              transition={{ duration: 1.2, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-white/40 uppercase">
                <span>FOCUS_MODE</span>
                <span className="text-green-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  ACTIVE
                </span>
              </div>
              
              <div className="flex flex-col gap-1.5 font-mono text-[9px] tracking-wider text-white/30">
                {[
                  { name: "LEARN_STRATEGY", ratio: "01", active: true },
                  { name: "BUILD_ENGINEERING", ratio: "02", active: true },
                  { name: "CREATE_EXPERIENCE", ratio: "03", active: true },
                  { name: "IMPACT_ORCHESTRA", ratio: "04", active: false }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`w-1 h-3 rounded-sm ${item.active ? "bg-white" : "bg-white/10"}`} />
                    <span className={item.active ? "text-white/85 font-medium" : "text-white/20"}>
                      {item.name} // [{item.ratio}]
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* HUD 3: Operational highlight */}
            <motion.div 
              className="space-y-1 select-none"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isLoading ? 0 : 1, x: isLoading ? 20 : 0 }}
              transition={{ duration: 1.2, delay: 0.84, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-[9px] font-mono tracking-widest text-white/30 uppercase">CAMPUS VENTURE</span>
              <h4 className="text-[11px] font-mono text-white/90 tracking-wider uppercase font-semibold">
                YUKON — APP-LEVEL INTEGRATION
              </h4>
              <p className="text-[10px] font-mono text-white/40 leading-relaxed">
                An AI-native campus web application with context-aware indexing and spatial navigation.
              </p>
            </motion.div>

            {/* HUD 4: Telemetries */}
            <motion.div 
              className="pt-2 text-[9px] font-mono tracking-widest text-white/25 select-none"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isLoading ? 0 : 1, x: isLoading ? 20 : 0 }}
              transition={{ duration: 1.2, delay: 0.96, ease: [0.16, 1, 0.3, 1] }}
            >
              LATITUDE: 21.843° N  /  LONGITUDE: 83.921° E
            </motion.div>
          </div>
        </section>

        {/* CHAPTER 2: ABOUT SECTION */}
        <section id="about" className="py-20 max-w-5xl mx-auto px-4 sm:px-8 w-full scroll-mt-24 relative">
          <div className="absolute left-1/3 top-1/4 -translate-x-1/2 -translate-y-1/2 cinema-spotlight opacity-50" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
            className="w-full text-left p-6 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden"
          >
            <AboutPanel onClose={() => {}} onOpenResume={() => openPanel("Resume")} />
          </motion.div>
        </section>

        {/* CHAPTER 3: FEATURED WORK - YUKON */}
        <section id="yukon" className="py-20 max-w-5xl mx-auto px-4 sm:px-8 w-full scroll-mt-24 relative">
          <div className="absolute right-1/4 bottom-1/4 -translate-y-1/2 cinema-spotlight opacity-40" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
            className="w-full text-left p-6 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden"
          >
            <YukonPanel />
          </motion.div>
        </section>

        {/* CHAPTER 4: PROFESSIONAL TRAJECTORY */}
        <section id="experience" className="py-20 max-w-5xl mx-auto px-4 sm:px-8 w-full scroll-mt-24 relative">
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 cinema-spotlight opacity-50" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }}
            className="w-full text-left p-6 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden"
          >
            <ExperiencePanel onClose={() => {}} onOpenResume={() => openPanel("Resume")} />
          </motion.div>
        </section>

        {/* CHAPTER 5: COGNITIVE CAREER SUITE (Resume & AI tools) */}
        <section id="resume" className="py-20 max-w-5xl mx-auto px-4 sm:px-8 w-full scroll-mt-24 relative">
          <div className="absolute right-1/3 top-1/3 -translate-y-1/2 cinema-spotlight opacity-45" />
          <div className="w-full text-left p-6 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden">
            <ResumePanel />
          </div>
        </section>

        {/* CHAPTER 6: SECURE GATEWAY CONTACT TRANSIT */}
        <section id="contact" className="py-20 max-w-5xl mx-auto px-4 sm:px-8 w-full scroll-mt-24 relative">
          <div className="absolute left-1/2 bottom-1/4 -translate-x-1/2 cinema-spotlight opacity-40" />
          <div className="w-full text-left p-6 sm:p-10 rounded-3xl bg-black/35 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden">
            <ContactPanel />
          </div>
        </section>

      </main>

      {/* Footer controls: Copyright & Ambient audio toggler */}
      <footer id="portfolio-footer" className="relative z-10 w-full px-8 py-6 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4 border-t border-white/5 bg-black/10 backdrop-blur-sm mt-12">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <span id="portfolio-credits" className="text-[10px] font-mono tracking-widest text-[#B3B3B3]/80 select-none uppercase">
            © {new Date().getFullYear()} Pritam Biswas. System online & pristine.
          </span>
        </div>

        {/* Dynamic coordinate status indicator on mobile */}
        <span className="sm:hidden text-[9px] font-mono text-[#B3B3B3]/40">
          SYS_OK // LAT: 21.843° N // {currentTime}
        </span>

        {/* Ambient controls */}
        <button
          onClick={toggleMute}
          className="flex items-center space-x-2.5 text-[10px] font-mono tracking-widest text-[#B3B3B3] hover:text-white transition-all bg-white/5 hover:bg-white/12 px-5 py-2.5 rounded-full cursor-pointer select-none border border-white/5 uppercase"
          title={isMuted ? "Unmute atmospheric audio stream" : "Mute audio stream"}
        >
          {isMuted ? (
            <>
              <VolumeX size={12} className="animate-pulse text-rose-400" />
              <span>Atmosphere Off</span>
            </>
          ) : (
            <>
              <div className="flex items-end gap-[2px] h-[12px] w-[14px] mr-1 overflow-hidden select-none">
                <div className="w-[2.5px] bg-cyan-400 rounded-full visualizer-bar-1" />
                <div className="w-[2.5px] bg-indigo-400 rounded-full visualizer-bar-2" />
                <div className="w-[2.5px] bg-rose-400 rounded-full visualizer-bar-3" />
                <div className="w-[2.5px] bg-violet-400 rounded-full visualizer-bar-4" />
              </div>
              <span className="text-white font-semibold">Soundscape Active</span>
            </>
          )}
        </button>
      </footer>

      {/* SECURED TRAFFIC PASSWORD VERIFICATION MODAL */}
      <AnimatePresence>
        {showTrafficAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md p-6 sm:p-8 bg-zinc-950/95 border border-white/10 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-left select-none overflow-hidden"
            >
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 cursor-pointer block" onClick={() => setShowTrafficAuthModal(false)} />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 block" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-[#B3B3B3]/40 uppercase select-none">
                  SYS_TELEMETRY // SIGN IN
                </span>
              </div>

              {/* Icon / Welcome description */}
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Lock size={18} className="text-cyan-400 animate-pulse" />
                </div>



                {/* Form Pin box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (trafficAuthPasscode === "170209") {
                      setShowTrafficAuthModal(false);
                      triggerTrafficEmailDispatch();
                      fetchVisitorStats();
                      setShowTrafficReport(true);
                    } else {
                      setTrafficAuthError("Incorrect passcode. Validation rejected.");
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <input
                      type="password"
                      maxLength={6}
                      autoFocus
                      required
                      placeholder="••••••"
                      value={trafficAuthPasscode}
                      onChange={(e) => {
                        setTrafficAuthPasscode(e.target.value.replace(/\D/g, ""));
                        setTrafficAuthError("");
                      }}
                      className="w-full text-center tracking-[0.8em] font-mono font-bold text-2xl text-white bg-white/5 border border-white/10 rounded-xl py-3 focus:border-cyan-400 focus:bg-white/[0.08] outline-none transition-all"
                    />
                    {trafficAuthError && (
                      <p className="text-[11px] text-rose-400 font-mono tracking-wide text-center">
                        ⚠️ {trafficAuthError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTrafficAuthModal(false)}
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl py-2.5 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl py-2.5 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Verify PIN
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED INTERACTIVE LIVE TRAFFIC REPORT SCREEN */}
      <AnimatePresence>
        {showTrafficReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950/95 border border-white/10 rounded-2xl shadow-[0_24px_72px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden"
            >
              {/* Custom Window Title Bar */}
              <div className="flex items-center justify-between bg-zinc-900/60 border-b border-white/5 px-4.5 py-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setShowTrafficReport(false)}
                    className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 border border-rose-600/50 flex items-center justify-center transition-colors group animate-pulse"
                  >
                    <span className="text-[7.5px] text-zinc-950 font-bold opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
                  </button>
                  <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600/50" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600/50" />
                </div>

                <div className="flex items-center gap-2">
                  <Activity size={12} className="text-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest text-[#B3B3B3]/60 uppercase">
                    YUKON // SYSTEM_DIAGNOSTICS_PORTAL
                  </span>
                </div>

                <span className="w-8" />
              </div>

              {/* Data Table Content Container */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar text-left">
                {/* Stats cards header */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-white/40 flex items-center gap-2">
                      <Activity size={10} /> Total Host Serves
                    </span>
                    <span className="text-3xl font-bold text-white mt-1.5 font-mono">
                      {isFetchingTrafficStats ? "..." : trafficReportData?.totalVisits || 0}
                    </span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-white/40 flex items-center gap-2">
                      <Globe size={10} /> Unique Node Visitors
                    </span>
                    <span className="text-3xl font-bold text-emerald-400 mt-1.5 font-mono">
                      {isFetchingTrafficStats ? "..." : trafficReportData?.uniqueVisitors || 0}
                    </span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-white/40 flex items-center gap-2">
                      <Lock size={10} /> Sync Target Email
                    </span>
                    <span className="text-xs font-semibold text-cyan-400 mt-2.5 font-mono truncate">
                      pritamb.work@gmail.com
                    </span>
                  </div>
                </div>

                {/* Secure Log Table Panel */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-white/40 uppercase">
                    <span>Telemetric Logs (Latest Visitors)</span>
                    <span>Secure TLS Route</span>
                  </div>

                  <div className="bg-white/[0.01]/40 border border-white/5 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/[0.02]/30 text-[9px] text-white/40 uppercase tracking-widest">
                            <th className="py-2.5 px-4">IP / Node ID</th>
                            <th className="py-2.5 px-4">Geolocation</th>
                            <th className="py-2.5 px-4 text-center">Hits</th>
                            <th className="py-2.5 px-4 text-right">Last Synchronized timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-white/[0.03]">
                          {isFetchingTrafficStats ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-white/40 font-mono tracking-wide">
                                <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-cyan-400" />
                                Synchronizing spatial logging database...
                              </td>
                            </tr>
                          ) : !trafficReportData || !trafficReportData.allVisitors || trafficReportData.allVisitors.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-white/30 italic">No connections in cache database.</td>
                            </tr>
                          ) : (
                            trafficReportData.allVisitors.map((v, i) => (
                              <tr key={i} className="hover:bg-white/[0.02]">
                                <td className="py-3 px-4 font-semibold text-white tracking-wide">{v.ip}</td>
                                <td className="py-3 px-4 text-white/70">
                                  🌐 {v.city || "Unknown"}, {v.country || "Unknown"}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-cyan-400">{v.count}</td>
                                <td className="py-3 px-4 text-right text-white/50 text-[11px]">
                                  {new Date(v.lastVisit).toLocaleString("en-US", { hour12: true })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action operations drawer */}
              <div className="border-t border-white/5 bg-zinc-900/40 p-4.5 px-6 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
                <span className="text-[10px] font-mono text-[#B3B3B3]/40">
                  © {new Date().getFullYear()} YUKON Live Traffic Diagnostic Suite
                </span>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={fetchVisitorStats}
                    disabled={isFetchingTrafficStats}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl px-4 py-2 text-xs font-mono transition-all cursor-pointer"
                  >
                    <RefreshCw size={12} className={`${isFetchingTrafficStats ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      triggerTrafficEmailDispatch();
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl px-5 py-2 text-xs font-mono transition-all cursor-pointer"
                  >
                    Email Replica
                  </button>
                  <button
                    onClick={() => setShowTrafficReport(false)}
                    className="flex-1 sm:flex-initial bg-white text-black font-semibold rounded-xl px-5 py-2 text-xs font-mono uppercase tracking-wider hover:bg-white/95 transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Dispatch Status Overlay */}
      <AnimatePresence>
        {emailStatus && emailStatus.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-5 bg-[#0A0A0A]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-xl border ${emailStatus.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {emailStatus.success ? <Sparkles size={18} /> : <ShieldAlert size={18} />}
              </div>
              <div className="flex-1 space-y-1.5">
                <h4 className="text-sm font-semibold text-white tracking-tight">
                  {emailStatus.success ? "System Log Dispatch" : "Dispatch Alert"}
                </h4>
                <p className="text-xs text-[#B3B3B3] leading-relaxed">
                  {emailStatus.message}
                </p>
                {emailStatus.warning === "SMTP_NOT_CONFIGURED" && (
                  <p className="text-[10px] text-white/45 font-mono pt-1">
                    Tip: Add your Gmail credentials to SMTP_USER/SMTP_PASS in the AI Studio environment variables panel to send real emails.
                  </p>
                )}
              </div>
              <button 
                onClick={() => setEmailStatus(null)}
                className="text-white/40 hover:text-white/80 p-0.5 rounded transition-colors"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

