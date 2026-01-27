import React from 'react';

interface SocialProofProps {
  content: any;
}

const SocialProof: React.FC<SocialProofProps> = ({ content }) => {
  return (
    <section className="border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="text-center md:text-left flex-1">
            <p className="text-sm text-slate-500 font-medium mb-2 uppercase tracking-wider">{content.trusted}</p>
            <p className="text-lg md:text-xl text-slate-300 font-light leading-relaxed">
               {content.desc}
            </p>
          </div>

          <div className="h-12 w-px bg-white/10 hidden md:block" />

          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 text-center md:text-right">
             {content.metrics.map((metric: any, i: number) => (
                <div key={i}>
                    <div className={`text-2xl font-bold ${i === 1 ? 'text-brand-400' : 'text-white'}`}>{metric.val}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{metric.label}</div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;