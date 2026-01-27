import React from 'react';

interface FAQProps {
  content: any;
}

const FAQ: React.FC<FAQProps> = ({ content }) => {
  return (
    <section className="py-24 bg-dark-900 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-white text-center mb-12">{content.title}</h2>
        
        <div className="space-y-6">
          {content.items.map((item: any, i: number) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <h3 className="text-lg font-medium text-white mb-2">{item.q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;