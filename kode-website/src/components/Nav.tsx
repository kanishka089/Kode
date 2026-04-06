"use client";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04]" style={{ background: 'rgba(5, 5, 16, 0.8)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight glow-text">Kode</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-[#00d4ff] transition-colors duration-300">Features</a>
          <a href="#syntax" className="hover:text-[#00d4ff] transition-colors duration-300">Syntax</a>
          <a href="#agents" className="hover:text-[#00d4ff] transition-colors duration-300">Agents</a>
          <a href="#stdlib" className="hover:text-[#00d4ff] transition-colors duration-300">Stdlib</a>
          <a href="https://github.com/kanishka089/Kode" target="_blank" rel="noopener noreferrer" className="hover:text-[#00d4ff] transition-colors duration-300">GitHub</a>
        </div>
        <a href="#get-started" className="text-sm px-4 py-2 rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
          Get Started
        </a>
      </div>
    </nav>
  );
}
