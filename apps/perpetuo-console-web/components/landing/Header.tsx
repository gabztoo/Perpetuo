import React, { useState, useEffect } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  content: any;
  currentLang: 'en' | 'pt';
  onToggleLang: () => void;
}

const Header: React.FC<HeaderProps> = ({ content, currentLang, onToggleLang }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-dark-950/80 backdrop-blur-md border-b border-white/5 py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer group">
          <img src="/logo.png" alt="Perpetuo" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-base font-medium text-slate-300 hover:text-white transition-colors">{content.features}</a>
          <a href="#how-it-works" className="text-base font-medium text-slate-300 hover:text-white transition-colors">{content.howItWorks}</a>
          <a href="#pricing" className="text-base font-medium text-slate-300 hover:text-white transition-colors">{content.pricing}</a>
          <a href="#docs" className="text-base font-medium text-slate-300 hover:text-white transition-colors">{content.docs}</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-full border border-white/5 transition-colors uppercase"
          >
            <Globe size={14} />
            {currentLang}
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <Link href="/login">
            <button className="text-base font-medium text-slate-300 hover:text-white transition-colors">{content.login}</button>
          </Link>
          <Link href="/signup">
            <button className="bg-white text-dark-950 px-5 py-2.5 rounded-full text-base font-semibold hover:bg-slate-200 transition-colors">
              {content.getKey}
            </button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/5 text-slate-300 px-3 py-1.5 rounded-full border border-white/5 uppercase"
          >
            {currentLang}
          </button>
          <button className="text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-dark-950 border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
          <a href="#features" className="text-slate-300 hover:text-brand-400" onClick={() => setMobileMenuOpen(false)}>{content.features}</a>
          <a href="#how-it-works" className="text-slate-300 hover:text-brand-400" onClick={() => setMobileMenuOpen(false)}>{content.howItWorks}</a>
          <a href="#pricing" className="text-slate-300 hover:text-brand-400" onClick={() => setMobileMenuOpen(false)}>{content.pricing}</a>
          <hr className="border-white/10" />
          <Link href="/login">
            <button className="text-left text-slate-300 hover:text-white w-full">{content.login}</button>
          </Link>
          <Link href="/signup">
            <button className="bg-brand-500 text-white px-4 py-2 rounded-lg font-semibold text-center hover:bg-brand-600 w-full">
              {content.getKey}
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Header;