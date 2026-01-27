import React from 'react';
import { Bot, LineChart, Code2, Users } from 'lucide-react';

interface UseCasesProps {
  content: any;
}

const UseCases: React.FC<UseCasesProps> = ({ content }) => {
  const icons = [
    <Bot size={24} className="text-blue-400" />,
    <Code2 size={24} className="text-purple-400" />,
    <LineChart size={24} className="text-green-400" />,
    <Users size={24} className="text-orange-400" />
  ];

  return (
    <section className="py-24 bg-dark-950 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">{content.title}</h2>
            <div className="h-1 w-20 bg-brand-500 rounded-full"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.cases.map((item: any, i: number) => (
            <div key={i} className="p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center mb-4 group-hover:border-brand-500/30 transition-colors">
                {icons[i]}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;