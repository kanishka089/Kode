"use client";
import { motion } from "motion/react";

const stats = [
  { value: "179", label: "Tests Passing" },
  { value: "35+", label: "Stdlib Modules" },
  { value: "48%", label: "Fewer Tokens" },
  { value: "2.3", label: "Avg Keyword Length" },
  { value: "30", label: "Wiki-Style Docs" },
  { value: "5", label: "MCP Tools" },
];

export function Stats() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-[1000px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="glass-card p-6 text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="text-2xl sm:text-3xl font-bold glow-text mb-1">{stat.value}</div>
              <div className="text-xs text-zinc-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
