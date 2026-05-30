import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased scroll-smooth">
      
      {/* 1. GLOBAL NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900">
              998<span className="text-indigo-600">webdesigns</span>
            </span>
          </div>

          {/* Core 5-Link Navigation Anchor */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#home" className="hover:text-indigo-600 transition-colors">Home</a>
            <a href="#directory" className="hover:text-indigo-600 transition-colors">Explore Directory</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#stories" className="hover:text-indigo-600 transition-colors">Success Stories</a>
            <a href="#portal" className="hover:text-indigo-600 transition-colors">Client Portal</a>
          </nav>

          {/* Clean Right Action Link */}
          <div>
            <a 
              href="#contact" 
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO HEADER SECTION */}
      <section id="home" className="relative bg-white pt-28 pb-24 border-b border-slate-200 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-6">
            ⚡ Web Automation for Local Service Businesses
          </span>
          
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-[1.15]">
            High-End Web Design <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Optimized for Local Growth
            </span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Affordable, high-conversion website templates engineered to capture local traffic, manage leads autonomously, and rank instantly.
          </p>

          {/* Visual Showcase Input (No functional client-side search logic) */}
          <div id="directory" className="max-w-2xl mx-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 gap-2">
              <span className="text-slate-400 text-lg">🔍</span>
              <input 
                type="text" 
                placeholder="Search local directory structures..." 
                className="w-full py-3 text-slate-900 placeholder-slate-400 focus:outline-none text-sm bg-transparent"
                disabled
              />
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shadow-sm">
              Showcase Demo
            </button>
          </div>

        </div>
      </section>

      {/* 3. CORE SERVICES & FEATURED WORK SHOWCASE */}
      <section id="stories" className="py-24 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 mb-4">
              ✨ Featured Deployments
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6">
              Engineered for High-Conversion Local Growth
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Explore our live framework structures optimized for regional search visibility, automated client onboarding, and seamless lead management.
            </p>
          </div>

          {/* 3-Column Visual Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Project 1: Home Services (Plumbing/HVAC) */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Home Services Framework</span>
                  <span className="text-xs font-medium bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">Live Deployment</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                  Plumbing & HVAC Suite
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  A high-speed, localized framework built to capture urgent service dispatch leads and route them instantly to field operators.
                </p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">⚡ Vercel Edge</span>
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">📈 Programmatic SEO</span>
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">📥 Lead Router</span>
                </div>
              </div>
              <div className="mt-8 pt-4">
                <span className="text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 inline-flex items-center gap-1.5 transition-colors">
                  View Architecture Layout →
                </span>
              </div>
            </div>

            {/* Project 2: Premium Aesthetics (Spa/Wellness) */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Luxury Wellness Framework</span>
                  <span className="text-xs font-medium bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">Live Deployment</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors">
                  Serenity Spa Platform
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  A premium, aesthetic-first interface featuring an intent-driven booking module and interactive palette preview tools.
                </p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">🎨 Premium UX</span>
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">📅 Intent Booking</span>
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">⚡ Next.js Caching</span>
                </div>
              </div>
              <div className="mt-8 pt-4">
                <span className="text-sm font-semibold text-violet-400 group-hover:text-violet-300 inline-flex items-center gap-1.5 transition-colors">
                  View Architecture Layout →
                </span>
              </div>
            </div>

            {/* Project 3: B2B Specialty (Digital Assets) */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Media & Content Framework</span>
                  <span className="text-xs font-medium bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full">Live Deployment</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  ReelPhone System
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Optimized digital layout architectures engineered for rapid content parsing, high-density graphics rendering, and scannable visual structures.
                </p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">📱 High-Density UI</span>
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">📊 Asset Engine</span>
                  <span className="text-xs bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md">🔍 Strict Guardrails</span>
                </div>
              </div>
              <div className="mt-8 pt-4">
                <span className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors">
                  View Architecture Layout →
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. GLOBAL AGENCY FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="text-lg font-black tracking-tight text-white">
              998<span className="text-indigo-400">webdesigns</span>
            </span>
            <p className="text-xs text-slate-500">
              Web automation for local service businesses.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-xs font-medium">
            <a href="#home" className="hover:text-white transition-colors">Back to Top</a>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500">© {new Date().getFullYear()} 998webdesigns.com. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}