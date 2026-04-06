"use client";
import { motion } from "motion/react";

export function AgentShowcase() {
  return (
    <section id="agents" className="py-28 px-6">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Multi-agent <span className="glow-text">by default</span>
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Spawn agents, pass messages, build pipelines. No frameworks needed.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-6 items-start">
          <motion.div
            className="md:col-span-3 code-block p-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-mono">3-agent pipeline</div>
            <pre className="text-[13px] leading-[1.8]">
              <code>
{`ag Researcher {
  on "search" (p) {
    em "Writer" @{type|"write"
      data|"Found: " + p.query}
  }
}

ag Writer {
  on "write" (p) {
    em "Reviewer" @{type|"review"
      article|"Article: " + p.data}
  }
}

ag Reviewer {
  on "review" (p) {
    io.out("APPROVED: " + p.article)
  }
}

lt r = sp Researcher
lt w = sp Writer
lt v = sp Reviewer
em r @{type|"search" query|"AI agents"}`}
              </code>
            </pre>
          </motion.div>

          <motion.div
            className="md:col-span-2 flex flex-col gap-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="glass-card p-5">
              <div className="text-xs text-[#00d4ff] font-mono mb-2">ag</div>
              <h3 className="font-semibold mb-1">Define Agents</h3>
              <p className="text-sm text-zinc-400">Agents have their own state, event handlers, and memory.</p>
            </div>
            <div className="glass-card p-5">
              <div className="text-xs text-[#00d4ff] font-mono mb-2">sp</div>
              <h3 className="font-semibold mb-1">Spawn Instances</h3>
              <p className="text-sm text-zinc-400">Create agent instances that run independently.</p>
            </div>
            <div className="glass-card p-5">
              <div className="text-xs text-[#00d4ff] font-mono mb-2">em</div>
              <h3 className="font-semibold mb-1">Pass Messages</h3>
              <p className="text-sm text-zinc-400">Agents communicate via typed messages with TOON payloads.</p>
            </div>
            <div className="glass-card p-5">
              <div className="text-xs text-[#00d4ff] font-mono mb-2">st</div>
              <h3 className="font-semibold mb-1">State Machines</h3>
              <p className="text-sm text-zinc-400">Built-in state machines for workflow tracking.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
