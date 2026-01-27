import React from 'react';
import { Shuffle, DollarSign, LineChart, Shield, Globe2 } from 'lucide-react';

interface FeaturesProps {
  content: any;
}

const Features: React.FC<FeaturesProps> = ({ content }) => {
  const icons = [
      <Shuffle className="text-blue-400" size={24} />,
      <DollarSign className="text-green-400" size={24} />,
      <LineChart className="text-purple-400" size={24} />
  ];

  return (
    <section id="features" className="py-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{content.title}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {content.list.map((f: any, i: number) => (
            <div key={i} className="glass-card p-8 rounded-2xl hover:bg-white/[0.03] transition-colors border border-white/5">
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6">
                {icons[i]}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{f.title}</h3>
              <ul className="space-y-3">
                {f.items.map((item: string, j: number) => (
                  <li key={j} className="flex items-center gap-2 text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Extra Enterprise Grid */}
        <div className="mt-20 grid md:grid-cols-2 gap-4">
            <div className="p-6 border border-white/5 rounded-xl bg-white/[0.01] flex items-center gap-4">
                <Globe2 className="text-slate-500" />
                <div>
                    <h4 className="text-white font-medium">{content.extra[0].title}</h4>
                    <p className="text-sm text-slate-500">{content.extra[0].desc}</p>
                </div>
            </div>
            <div className="p-6 border border-white/5 rounded-xl bg-white/[0.01] flex items-center gap-4">
                <Shield className="text-slate-500" />
                <div>
                    <h4 className="text-white font-medium">{content.extra[1].title}</h4>
                    <p className="text-sm text-slate-500">{content.extra[1].desc}</p>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Features;