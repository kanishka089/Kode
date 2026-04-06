"use client";
import { motion } from "motion/react";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center px-6 pt-16">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)' }} />

      <div className="max-w-[900px] mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 mb-8 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
            v0.1.0 — Published on npm
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-[-0.03em] leading-[0.9] mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          The language built
          <br />
          <span className="glow-text">for AI agents</span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-zinc-400 max-w-[540px] mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          Kode uses <span className="text-[#00d4ff] font-medium">48% fewer tokens</span> than Python.
          Full-stack. Built-in agents, memory, and state machines.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          <a href="#get-started" className="px-8 py-3.5 rounded-xl bg-[#00d4ff] text-[#050510] font-semibold text-sm hover:bg-[#00e5ff] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_30px_rgba(0,212,255,0.2)]">
            Get Started
          </a>
          <a href="https://github.com/kanishka089/Kode" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 rounded-xl border border-white/[0.1] text-sm font-medium text-zinc-300 hover:border-white/[0.2] hover:bg-white/[0.03] transition-all duration-300">
            View on GitHub
          </a>
        </motion.div>

        <motion.div
          className="mt-16 code-block p-6 text-left max-w-[520px] mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
        >
          <pre className="text-[13px] leading-relaxed">
            <code>
              <span className="comment">-- A complete web API in 6 lines</span>{"\n"}
              <span className="keyword">lt</span> db = db.<span className="fn-name">open</span>(<span className="string">&quot;sqlite:app.db&quot;</span>){"\n"}
              {"\n"}
              web.<span className="fn-name">route</span>(<span className="string">&quot;GET&quot;</span>, <span className="string">&quot;/api&quot;</span>, <span className="operator">|</span>req<span className="operator">|</span> <span className="operator">-&gt;</span>{"\n"}
              {"  "}web.<span className="fn-name">json</span>(db.<span className="fn-name">query</span>(<span className="string">&quot;select * from users&quot;</span>)){"\n"}
              ){"\n"}
              web.<span className="fn-name">serve</span>(<span className="number">3000</span>)
            </code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
