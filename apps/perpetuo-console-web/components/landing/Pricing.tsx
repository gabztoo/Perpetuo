import React from 'react';
import { Check } from 'lucide-react';

interface PricingProps {
  content: any;
}

const Pricing: React.FC<PricingProps> = ({ content }) => {
  return (
    <section id="pricing" className="py-24 bg-dark-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{content.title}</h2>
          <p className="text-slate-400">
             {content.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {content.plans.map((plan: any, i: number) => {
             const isPopular = !!plan.popular;
             return (
              <div key={i} className={`p-8 rounded-2xl border ${isPopular ? 'border-brand-500/30 bg-brand-500/5' : 'border-white/10 bg-white/[0.02]'} relative`}>
                {isPopular && <div className="absolute top-0 right-0 bg-brand-500 text-dark-950 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">{plan.popular}</div>}
                
                <h3 className={`text-lg font-medium mb-2 ${isPopular ? 'text-brand-400' : 'text-slate-300'}`}>{plan.name}</h3>
                <div className="text-3xl font-bold text-white mb-6">{plan.price}<span className="text-sm font-normal text-slate-500">{plan.unit}</span></div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat: string, j: number) => (
                    <li key={j} className={`flex gap-2 text-sm ${isPopular ? 'text-slate-300' : 'text-slate-400'}`}>
                        <Check size={16} className={isPopular ? 'text-brand-500' : 'text-white'} /> {feat}
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-2.5 rounded-lg font-medium transition-colors ${isPopular ? 'bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                    {plan.btn}
                </button>
              </div>
             );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;