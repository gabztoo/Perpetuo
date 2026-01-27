import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Server, Activity } from 'lucide-react';

interface HeroProps {
  content: any;
}

const Hero: React.FC<HeroProps> = ({ content }) => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden border-b border-white/5">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] bg-brand-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/50 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              {content.badge}
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
              {content.title} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">{content.titleHighlight}</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
              {content.subtitle}
            </p>
            
            <div className="flex flex-col items-center lg:items-start mb-12">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-4 w-full">
                <button className="w-full sm:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 border border-brand-500/20">
                  {content.ctaPrimary} <ArrowRight size={18} />
                </button>
                <button className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                  {content.ctaSecondary}
                </button>
              </div>
              {content.ctaMicrocopy && (
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                  {content.ctaMicrocopy}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-sm text-slate-500 font-medium">
               {content.badges.map((badge: string, i: number) => (
                 <span key={i} className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-brand-500"/> {badge}</span>
               ))}
            </div>
          </div>

          {/* Right Content - The Diagram */}
          <div className="flex-1 w-full flex flex-col items-center lg:items-end">
            {/* Fixed width container for pixel-perfect alignment, scaled on mobile */}
            <div className="relative w-[500px] h-[260px] scale-[0.7] sm:scale-100 origin-center lg:origin-right transition-transform mb-4">
              
              {/* Connection Lines Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                 <defs>
                    <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                 </defs>
                 
                 {/* Line: Client to Gateway (80,130) -> (194,130) */}
                 <path d="M 80 130 L 194 130" stroke="#334155" strokeWidth="2" strokeDasharray="6 6" className="animate-pulse" />
                 
                 {/* Line: Gateway to Llama (Top) (306,130) -> (340,52) */}
                 <path d="M 306 130 C 320 130, 320 52, 340 52" stroke="#334155" strokeWidth="2" fill="none" />
                 
                 {/* Line: Gateway to GPT-4o (Middle) (306,130) -> (340,130) */}
                 <path d="M 306 130 L 340 130" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4" fill="none" className="opacity-60" />
                 
                 {/* Line: Gateway to Claude (Bottom) (306,130) -> (340,208) */}
                 <path d="M 306 130 C 320 130, 320 208, 340 208" stroke="url(#active-gradient)" strokeWidth="2" fill="none" />
                 
                 {/* Moving data packet on active line */}
                 <circle r="3" fill="#10b981">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M 306 130 C 320 130, 320 208, 340 208" />
                 </circle>
              </svg>

              {/* Node 1: Client App (Left: 0, CenterY: 130) */}
              <div className="absolute left-0 top-[90px] z-10 flex flex-col items-center gap-3 w-20">
                  <div className="w-20 h-20 bg-dark-900 rounded-xl border border-slate-700 shadow-xl flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-blue-500/5 rounded-xl group-hover:bg-blue-500/10 transition-colors" />
                    <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center text-blue-400">
                        <Server size={24} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">{content.diagram.app}</span>
              </div>

              {/* Node 2: Perpetuo Gateway (CenterX: 250, CenterY: 130) -> Left: 194, Top: 74 */}
              <div className="absolute left-[194px] top-[74px] z-10 flex flex-col items-center justify-center w-28 h-28">
                  <div className="absolute inset-0 bg-dark-950 rounded-2xl border border-brand-500/40 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center backdrop-blur-sm z-20">
                    <div className="w-12 h-12 bg-brand-600 rounded-xl mb-2 flex items-center justify-center text-white shadow-lg">
                      <Activity size={28} />
                    </div>
                    <span className="text-[10px] font-extrabold text-white tracking-widest">{content.diagram.gateway}</span>
                  </div>
                  {/* Pulse Effect */}
                  <div className="absolute inset-0 bg-brand-500/20 rounded-2xl animate-pulse" />
              </div>

              {/* Node 3: Providers Stack (Right: 0 -> Left: 340) */}
              
              {/* Llama 3 - Top (CenterY: 52) -> Top: 24 */}
              <div className="absolute left-[340px] top-[24px] z-10 w-40 h-14 px-4 bg-dark-900 border border-slate-800 rounded-lg flex items-center justify-between opacity-60">
                 <span className="text-xs text-slate-400 font-mono font-medium">Llama 3</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              </div>
              
              {/* GPT-4o - Mid (CenterY: 130) -> Top: 102 */}
              <div className="absolute left-[340px] top-[102px] z-10 w-40 h-14 px-4 bg-red-950/10 border border-red-900/30 rounded-lg flex items-center justify-between relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50" />
                 <span className="text-xs text-slate-400 font-mono line-through decoration-red-500/50">GPT-4o</span>
                 <div className="px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/20 text-[9px] font-bold text-red-500">{content.diagram.fail}</div>
              </div>

              {/* Claude 3.5 - Bot (CenterY: 208) -> Top: 180 */}
              <div className="absolute left-[340px] top-[180px] z-10 w-40 h-14 px-4 bg-brand-950/30 border border-brand-500/50 rounded-lg flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                 <div className="flex flex-col">
                    <span className="text-xs text-white font-mono font-bold">Claude 3.5</span>
                    <span className="text-[9px] text-brand-400">{content.diagram.recovered}</span>
                 </div>
                 <div className="relative flex items-center justify-center w-4 h-4">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-20 animate-ping"></span>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                 </div>
              </div>

            </div>
            
            {/* Diagram Microcopy */}
            <p className="text-sm text-slate-500 italic">{content.diagram.microcopy}</p>
          </div>
        </div>

        {/* 3 Core Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 pt-12 border-t border-white/5">
            <div className="group">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2 group-hover:text-brand-400 transition-colors">
                    <Activity size={18} className="text-brand-500" /> 
                    {content.benefits[0].title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                    {content.benefits[0].desc}
                </p>
            </div>
            <div className="group">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2 group-hover:text-brand-400 transition-colors">
                    <ShieldCheck size={18} className="text-brand-500" /> 
                    {content.benefits[1].title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                    {content.benefits[1].desc}
                </p>
            </div>
            <div className="group">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2 group-hover:text-brand-400 transition-colors">
                    <Zap size={18} className="text-brand-500" /> 
                    {content.benefits[2].title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                    {content.benefits[2].desc}
                </p>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;