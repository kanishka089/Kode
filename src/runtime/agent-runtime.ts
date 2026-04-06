// Kode Language — Agent Runtime
// Manages agent lifecycle, message queues, and cooperative scheduling

import { KodeValue, mkNull, mkStr, mkMap, stringify } from '../evaluator/values.js';
import { Environment } from '../evaluator/environment.js';

export interface AgentInstance {
  id: string;
  name: string;
  env: Environment;
  handlers: Map<string, { param?: string; body: any[] }>;
  messageQueue: { event: string; payload: KodeValue }[];
  running: boolean;
}

let agentCounter = 0;

export class AgentRuntime {
  private agents = new Map<string, AgentInstance>();
  private agentsByName = new Map<string, AgentInstance>();
  private evalCallback: ((stmts: any[], env: Environment) => KodeValue) | null = null;

  setEvalCallback(cb: (stmts: any[], env: Environment) => KodeValue): void {
    this.evalCallback = cb;
  }

  createAgent(name: string, env: Environment): AgentInstance {
    const id = `agent_${++agentCounter}`;
    const agent: AgentInstance = {
      id,
      name,
      env,
      handlers: new Map(),
      messageQueue: [],
      running: true,
    };
    this.agents.set(id, agent);
    this.agentsByName.set(name, agent);
    return agent;
  }

  getAgent(idOrName: string): AgentInstance | undefined {
    return this.agents.get(idOrName) ?? this.agentsByName.get(idOrName);
  }

  registerHandler(agentId: string, event: string, param: string | undefined, body: any[]): void {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`[Agent] Unknown agent ${agentId}`);
    agent.handlers.set(event, { param, body });
  }

  emit(target: string | AgentInstance, event: string, payload: KodeValue): void {
    const agent = typeof target === 'string'
      ? (this.agents.get(target) ?? this.agentsByName.get(target))
      : target;

    if (!agent) throw new Error(`[Agent] Unknown agent target '${typeof target === 'string' ? target : target.name}'`);
    agent.messageQueue.push({ event, payload });
  }

  broadcast(event: string, payload: KodeValue): void {
    for (const agent of this.agents.values()) {
      agent.messageQueue.push({ event, payload });
    }
  }

  /** Process all pending messages for all agents (cooperative round) */
  processMessages(): void {
    if (!this.evalCallback) return;

    // Process each agent's queue
    for (const agent of this.agents.values()) {
      if (!agent.running) continue;

      while (agent.messageQueue.length > 0) {
        const msg = agent.messageQueue.shift()!;
        const handler = agent.handlers.get(msg.event);
        if (!handler) continue; // No handler for this event, skip

        const handlerEnv = new Environment(agent.env);
        if (handler.param) {
          handlerEnv.define(handler.param, msg.payload, false);
        }

        try {
          this.evalCallback(handler.body, handlerEnv);
        } catch (e: any) {
          // Check for error handler
          const errHandler = agent.handlers.get('error');
          if (errHandler) {
            const errEnv = new Environment(agent.env);
            if (errHandler.param) {
              errEnv.define(errHandler.param, mkStr(e.message ?? String(e)), false);
            }
            try { this.evalCallback(errHandler.body, errEnv); } catch {}
          } else {
            console.error(`[Agent ${agent.name}] Unhandled error: ${e.message ?? e}`);
          }
        }
      }
    }
  }

  /** Check if any agents have pending messages */
  hasPendingMessages(): boolean {
    for (const agent of this.agents.values()) {
      if (agent.messageQueue.length > 0) return true;
    }
    return false;
  }

  stopAgent(idOrName: string): void {
    const agent = this.agents.get(idOrName) ?? this.agentsByName.get(idOrName);
    if (agent) {
      agent.running = false;
      // Fire stop handler if exists
      const stopHandler = agent.handlers.get('stop');
      if (stopHandler && this.evalCallback) {
        const env = new Environment(agent.env);
        try { this.evalCallback(stopHandler.body, env); } catch {}
      }
    }
  }

  getAllAgents(): AgentInstance[] {
    return [...this.agents.values()];
  }
}
