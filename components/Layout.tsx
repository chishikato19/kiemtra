
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBack }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-indigo-600 text-white shadow-xl sticky top-0 z-[60]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-indigo-500 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tighter leading-none">{title}</h1>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">v2.5 Evolution Edition</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-inner">
              PRO
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 fade-in">
        {children}
      </main>
      <footer className="py-6 text-center space-y-2">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">QuizMaster Pro &copy; {new Date().getFullYear()}</p>
        <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-300 uppercase">
          <span>Word Parsing</span>
          <span>LaTeX Support</span>
          <span>Cloud Ready</span>
        </div>
      </footer>
    </div>
  );
};
