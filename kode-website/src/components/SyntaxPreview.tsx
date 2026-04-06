"use client";
import { motion } from "motion/react";
import { useState } from "react";

const tabs = [
  { label: "Basics", code: `<span class="comment">-- Variables and functions</span>
<span class="keyword">lt</span> name = <span class="string">"Kode"</span>
<span class="keyword">vr</span> count = <span class="number">0</span>

<span class="keyword">fn</span> <span class="fn-name">add</span>(a, b) { <span class="keyword">rt</span> a + b }
<span class="keyword">fn</span> <span class="fn-name">double</span>(x) <span class="operator">-></span> x * <span class="number">2</span>

<span class="comment">-- Lambdas</span>
<span class="keyword">lt</span> sq = <span class="operator">|</span>x<span class="operator">|</span> <span class="operator">-></span> x * x

<span class="comment">-- Control flow</span>
<span class="keyword">if</span> x > <span class="number">0</span> { io.<span class="fn-name">out</span>(<span class="string">"positive"</span>) }
<span class="keyword">ef</span> x == <span class="number">0</span> { io.<span class="fn-name">out</span>(<span class="string">"zero"</span>) }
<span class="keyword">el</span> { io.<span class="fn-name">out</span>(<span class="string">"negative"</span>) }` },

  { label: "TOON Data", code: `<span class="comment">-- TOON: 30-45% fewer tokens than JSON</span>
<span class="keyword">lt</span> user = @{name<span class="operator">|</span><span class="string">"Ada"</span> age<span class="operator">|</span><span class="number">30</span> role<span class="operator">|</span><span class="string">"dev"</span>}
<span class="keyword">lt</span> nums = @[<span class="number">1 2 3 4 5</span>]

<span class="comment">-- Access</span>
io.<span class="fn-name">out</span>(user.name)     <span class="comment">-- Ada</span>
io.<span class="fn-name">out</span>(nums[<span class="number">0</span>])       <span class="comment">-- 1</span>

<span class="comment">-- Pipes</span>
<span class="keyword">lt</span> result = nums
  <span class="operator">|></span> lst.<span class="fn-name">filter</span>(<span class="operator">|</span>x<span class="operator">|</span> <span class="operator">-></span> x > <span class="number">2</span>)
  <span class="operator">|></span> lst.<span class="fn-name">map</span>(<span class="operator">|</span>x<span class="operator">|</span> <span class="operator">-></span> x * <span class="number">10</span>)
<span class="comment">-- @[30 40 50]</span>` },

  { label: "Agents", code: `<span class="keyword">ag</span> <span class="fn-name">Researcher</span> {
  <span class="keyword">vr</span> findings = @[]

  <span class="keyword">on</span> <span class="string">"search"</span> (p) {
    <span class="keyword">lt</span> result = <span class="string">"Found: "</span> + p.query
    findings = findings + @[result]
    <span class="keyword">em</span> <span class="string">"Writer"</span> @{type<span class="operator">|</span><span class="string">"write"</span> data<span class="operator">|</span>result}
  }
}

<span class="keyword">ag</span> <span class="fn-name">Writer</span> {
  <span class="keyword">on</span> <span class="string">"write"</span> (p) {
    io.<span class="fn-name">out</span>(<span class="string">"Article: "</span> + p.data)
  }
}

<span class="keyword">lt</span> r = <span class="keyword">sp</span> Researcher
<span class="keyword">em</span> r @{type<span class="operator">|</span><span class="string">"search"</span> query<span class="operator">|</span><span class="string">"AI"</span>}` },

  { label: "Full-Stack", code: `<span class="keyword">lt</span> db = db.<span class="fn-name">open</span>(<span class="string">"sqlite:app.db"</span>)
db.<span class="fn-name">exec</span>(<span class="string">"create table users (id integer primary key, name text)"</span>)

web.<span class="fn-name">route</span>(<span class="string">"GET"</span>, <span class="string">"/api/users"</span>, <span class="operator">|</span>req<span class="operator">|</span> <span class="operator">-></span>
  web.<span class="fn-name">json</span>(db.<span class="fn-name">query</span>(<span class="string">"select * from users"</span>))
)

web.<span class="fn-name">route</span>(<span class="string">"POST"</span>, <span class="string">"/api/users"</span>, <span class="operator">|</span>req<span class="operator">|</span> {
  db.<span class="fn-name">exec</span>(<span class="string">"insert into users (name) values (?)"</span>, @[req.body.name])
  <span class="keyword">rt</span> web.<span class="fn-name">json</span>(@{ok<span class="operator">|</span><span class="keyword">tr</span>})
})

web.<span class="fn-name">serve</span>(<span class="number">3000</span>)` },
];

export function SyntaxPreview() {
  const [active, setActive] = useState(0);

  return (
    <section id="syntax" className="py-28 px-6">
      <div className="max-w-[900px] mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Clean, <span className="glow-text">minimal syntax</span>
          </h2>
          <p className="text-zinc-400">2-char keywords. Zero boilerplate. Every character earns its place.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="flex gap-1 mb-0 bg-[#0a0a1a] rounded-t-xl border border-b-0 border-white/[0.06] p-1">
            {tabs.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                  active === i
                    ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="code-block rounded-t-none p-6 min-h-[320px]">
            <pre className="text-[13px] leading-[1.8]" dangerouslySetInnerHTML={{ __html: tabs[active].code }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
