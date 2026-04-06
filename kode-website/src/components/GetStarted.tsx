"use client";
import { motion } from "motion/react";
import { useState } from "react";

export function GetStarted() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npm install -g kode-lang");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="get-started" className="py-28 px-6">
      <div className="max-w-[700px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            Start writing <span className="glow-text">Kode</span>
          </h2>
          <p className="text-zinc-400 mb-10 text-lg">One command. Zero config. Ready in seconds.</p>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="code-block p-4 flex items-center justify-between group cursor-pointer" onClick={handleCopy}>
            <code className="text-sm">
              <span className="text-zinc-500">$</span>{" "}
              <span className="text-[#00d4ff]">npm</span> install -g kode-lang
            </code>
            <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">
              {copied ? "Copied" : "Click to copy"}
            </span>
          </div>

          <div className="code-block p-4 text-left">
            <pre className="text-sm">
              <span className="text-zinc-500">$</span> <span className="text-[#00d4ff]">kode</span> hello.kd{"\n"}
              <span className="text-emerald-400">Hello from Kode!</span>{"\n"}
              <span className="text-emerald-400">fib(10) = 55</span>
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <a
              href="https://github.com/kanishka089/Kode"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl bg-[#00d4ff] text-[#050510] font-semibold text-sm hover:bg-[#00e5ff] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_30px_rgba(0,212,255,0.15)]"
            >
              View on GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/kode-lang"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl border border-white/[0.1] text-sm font-medium text-zinc-300 hover:border-white/[0.2] hover:bg-white/[0.03] transition-all duration-300"
            >
              View on npm
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
