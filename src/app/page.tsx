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

      {/* 3. CORE CONTENT ANCHOR SECTION */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
              Our Services
            </h2>
            <p className="text-slate-600">
              Customized digital assets built to scale your regional traffic and capture localized market share seamlessly.
            </p>
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