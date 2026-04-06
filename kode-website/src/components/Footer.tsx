export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] py-12 px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <span className="font-bold glow-text text-lg">Kode</span>
          <span className="text-xs text-zinc-500">The language built for AI agents</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <a href="https://github.com/kanishka089/Kode" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
          <a href="https://www.npmjs.com/package/kode-lang" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">npm</a>
          <span>MIT License</span>
        </div>
      </div>
    </footer>
  );
}
