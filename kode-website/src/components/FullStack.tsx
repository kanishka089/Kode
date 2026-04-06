"use client";
import { motion } from "motion/react";

export function FullStack() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-[900px] mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Build <span className="glow-text">complete apps</span>
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Web server, database, HTML, API — all in one language. No Python. No JavaScript. Just Kode.
          </p>
        </motion.div>

        <motion.div
          className="code-block p-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 font-mono">complete todo app — ~20 lines</div>
          <pre className="text-[13px] leading-[1.8]">
{`lt store = db.open("sqlite:todos.db")
store.exec("create table if not exists todos
  (id integer primary key autoincrement,
   title text, done integer default 0)")

web.route("GET", "/api/todos", |req| ->
  web.json(store.query("select * from todos"))
)

web.route("POST", "/api/todos", |req| {
  store.exec("insert into todos (title) values (?)",
    @[req.body.title])
  rt web.json(@{ok|tr}, 201)
})

web.route("POST", "/toggle/:id", |req| {
  store.exec("update todos set done =
    case when done=0 then 1 else 0 end
    where id = ?", @[req.params.id])
  rt web.json(@{ok|tr})
})

web.serve(3000)`}
          </pre>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {["Web Server", "SQLite DB", "HTML Pages", "JSON API"].map((label, i) => (
            <motion.div
              key={i}
              className="glass-card p-4 text-center text-sm text-zinc-300"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.05, ease: [0.32, 0.72, 0, 1] }}
            >
              {label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
