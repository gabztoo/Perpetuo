import React from 'react';
import logoSrc from './logo.png';

interface FooterProps {
  content: any;
}

const Footer: React.FC<FooterProps> = ({ content }) => {
  return (
    <footer className="py-12 bg-dark-900 border-t border-white/5 text-sm">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <img src={logoSrc} alt="Perpetuo" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-slate-500">{content.tagline}</p>
        </div>

        {content.cols.map((col: any, i: number) => (
          <div key={i}>
            <h4 className="text-white font-semibold mb-4">{col.title}</h4>
            <ul className="space-y-2 text-slate-400">
              {col.links.map((link: string, j: number) => (
                <li key={j}><a href="#" className="hover:text-brand-400">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 text-center text-slate-600">
        {content.copyright}
      </div>
    </footer>
  );
};

export default Footer;