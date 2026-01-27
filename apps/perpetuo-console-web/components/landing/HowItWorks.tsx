import React from 'react';
import { Copy } from 'lucide-react';

interface HowItWorksProps {
  content: any;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ content }) => {
  return (
    <section id="how-it-works" className="py-24 bg-dark-950 relative">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{content.title}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Steps */}
          <div className="space-y-12">
            {content.steps.map((step: any, i: number) => (
                <div key={i} className="relative pl-10 group">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-800 group-hover:bg-brand-500/50 transition-colors" />
                    <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-slate-700 group-hover:bg-brand-500 transition-colors" />
                    
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400">{step.desc}</p>
                </div>
            ))}
          </div>

          {/* Right: Code Block */}
          <div className="relative">
             {/* Glow behind code */}
             <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-blue-600 rounded-xl blur opacity-20" />
             
             <div className="relative bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
               <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                   <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                   <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                 </div>
                 <div className="text-xs text-slate-500 font-mono">terminal</div>
                 <Copy size={14} className="text-slate-500 cursor-pointer hover:text-white" />
               </div>
               
               <div className="p-6 overflow-x-auto">
                 <pre className="font-mono text-sm leading-relaxed whitespace-pre">
<span className="text-purple-400">curl</span> <span className="text-green-400">https://api.perpetuo.ai/v1/chat/completions</span> \
  <span className="text-blue-400">-H</span> <span className="text-yellow-200">"Authorization: Bearer $PERPETUO_KEY"</span> \
  <span className="text-blue-400">-d</span> <span className="text-slate-300">{`'{`}</span>
    <span className="text-blue-300">"model"</span>: <span className="text-green-300">"auto-routing"</span>,
    <span className="text-blue-300">"messages"</span>: [
      <span className="text-slate-300">{`{`}</span>
        <span className="text-blue-300">"role"</span>: <span className="text-green-300">"user"</span>, 
        <span className="text-blue-300">"content"</span>: <span className="text-green-300">"Extract sentiment..."</span> 
      <span className="text-slate-300">{`}`}</span>
    ],
    <span className="text-blue-300">"config"</span>: <span className="text-slate-300">{`{`}</span>
       <span className="text-blue-300">"fallback_strategy"</span>: <span className="text-green-300">["gpt-4", "claude-3-opus"]</span>
    <span className="text-slate-300">{`}`}</span>
  <span className="text-slate-300">{`}'`}</span>
                 </pre>
               </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowItWorks;