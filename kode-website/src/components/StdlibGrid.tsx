"use client";
import { motion } from "motion/react";

const modules = [
  { name: "io", desc: "I/O" }, { name: "math", desc: "Math" }, { name: "str", desc: "Strings" },
  { name: "lst", desc: "Lists" }, { name: "mp", desc: "Maps" }, { name: "json", desc: "JSON" },
  { name: "csv", desc: "CSV" }, { name: "yaml", desc: "YAML" }, { name: "web", desc: "HTTP Server" },
  { name: "db", desc: "SQLite" }, { name: "fs", desc: "Files" }, { name: "env", desc: "Env Vars" },
  { name: "proc", desc: "Shell Exec" }, { name: "net", desc: "HTTP Client" }, { name: "crypto", desc: "Hashing" },
  { name: "enc", desc: "Encoding" }, { name: "uuid", desc: "UUID" }, { name: "re", desc: "Regex" },
  { name: "url", desc: "URL Parse" }, { name: "log", desc: "Logging" }, { name: "time", desc: "Time" },
  { name: "set", desc: "Sets" }, { name: "stream", desc: "Streams" }, { name: "ai", desc: "LLM Gateway" },
  { name: "mem.w", desc: "Working Mem" }, { name: "mem.s", desc: "Semantic Mem" },
  { name: "mem.e", desc: "Episodic Mem" }, { name: "mem.p", desc: "Procedural Mem" },
  { name: "kode", desc: "Self-Modify" },
];

export function StdlibGrid() {
  return (
    <section id="stdlib" className="py-28 px-6">
      <div className="max-w-[1000px] mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            <span className="glow-text">35+ modules</span> built in
          </h2>
          <p className="text-zinc-400">No npm install. No pip install. Everything you need, out of the box.</p>
        </motion.div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {modules.map((mod, i) => (
            <motion.div
              key={i}
              className="glass-card p-3 text-center group cursor-default"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.02, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="text-xs font-mono text-[#00d4ff] group-hover:text-[#00ffd4] transition-colors">{mod.name}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{mod.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
