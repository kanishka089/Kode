"use client";
import { motion } from "motion/react";

const data = [
  { task: "Web search agent", python: 340, js: 285, kode: 185 },
  { task: "Multi-agent collab", python: 420, js: 310, kode: 195 },
  { task: "Web API + database", python: 380, js: 320, kode: 215 },
  { task: "Error handling", python: 310, js: 250, kode: 155 },
  { task: "Data pipeline", python: 290, js: 245, kode: 155 },
];

export function TokenComparison() {
  const totalPython = data.reduce((s, d) => s + d.python, 0);
  const totalKode = data.reduce((s, d) => s + d.kode, 0);
  const savings = Math.round((1 - totalKode / totalPython) * 100);

  return (
    <section className="py-28 px-6">
      <div className="max-w-[1000px] mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            <span className="glow-text">{savings}% fewer tokens</span> than Python
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Less tokens means lower API costs, more logic per context window, and faster agent execution.
          </p>
        </motion.div>

        <motion.div
          className="glass-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left p-4 text-zinc-400 font-medium">Task</th>
                  <th className="text-right p-4 text-zinc-400 font-medium">Python</th>
                  <th className="text-right p-4 text-zinc-400 font-medium">JavaScript</th>
                  <th className="text-right p-4 text-[#00d4ff] font-semibold">Kode</th>
                  <th className="text-right p-4 text-zinc-400 font-medium">Savings</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-zinc-300">{row.task}</td>
                    <td className="p-4 text-right text-zinc-500 font-mono">{row.python}</td>
                    <td className="p-4 text-right text-zinc-500 font-mono">{row.js}</td>
                    <td className="p-4 text-right text-[#00d4ff] font-mono font-semibold">{row.kode}</td>
                    <td className="p-4 text-right">
                      <span className="text-emerald-400 font-mono text-xs px-2 py-0.5 rounded bg-emerald-400/10">
                        -{Math.round((1 - row.kode / row.python) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-white/[0.02]">
                  <td className="p-4 font-semibold">Total</td>
                  <td className="p-4 text-right text-zinc-400 font-mono font-semibold">{totalPython}</td>
                  <td className="p-4 text-right text-zinc-400 font-mono font-semibold">{data.reduce((s, d) => s + d.js, 0)}</td>
                  <td className="p-4 text-right text-[#00d4ff] font-mono font-bold">{totalKode}</td>
                  <td className="p-4 text-right">
                    <span className="text-emerald-400 font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-400/10">
                      -{savings}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
