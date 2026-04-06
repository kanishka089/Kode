// Kode Intelligence — Error & Usage Tracking
// Collects signals to auto-detect what needs improvement

interface ErrorRecord {
  message: string;
  line?: number;
  col?: number;
  feature?: string;
  timestamp: number;
}

interface UsageRecord {
  feature: string;
  count: number;
  errors: number;
}

class KodeIntelligence {
  private errors: ErrorRecord[] = [];
  private usage = new Map<string, UsageRecord>();
  private suggestions: string[] = [];
  private enabled = false;

  enable(): void { this.enabled = true; }
  disable(): void { this.enabled = false; }

  trackError(message: string, line?: number, col?: number): void {
    if (!this.enabled) return;
    // Extract feature from error message
    const feature = this.extractFeature(message);
    this.errors.push({ message, line, col, feature, timestamp: Date.now() });

    // Update usage error count
    if (feature) {
      const usage = this.usage.get(feature) ?? { feature, count: 0, errors: 0 };
      usage.errors++;
      this.usage.set(feature, usage);
    }
  }

  trackUsage(feature: string): void {
    if (!this.enabled) return;
    const usage = this.usage.get(feature) ?? { feature, count: 0, errors: 0 };
    usage.count++;
    this.usage.set(feature, usage);
  }

  addSuggestion(suggestion: string): void {
    this.suggestions.push(suggestion);
  }

  getReport(): {
    topErrors: { message: string; count: number }[];
    featureUsage: UsageRecord[];
    suggestions: string[];
  } {
    // Cluster errors by message
    const errorCounts = new Map<string, number>();
    for (const err of this.errors) {
      const key = err.message.replace(/line \d+/g, 'line N').replace(/col \d+/g, 'col N');
      errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
    }

    const topErrors = [...errorCounts.entries()]
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const featureUsage = [...this.usage.values()]
      .sort((a, b) => b.count - a.count);

    return { topErrors, featureUsage, suggestions: [...this.suggestions] };
  }

  private extractFeature(message: string): string | undefined {
    if (message.includes('pipe') || message.includes('|>')) return 'pipe';
    if (message.includes('agent') || message.includes('ag ')) return 'agents';
    if (message.includes('spawn') || message.includes('sp ')) return 'spawn';
    if (message.includes('emit') || message.includes('em ')) return 'emit';
    if (message.includes('state') || message.includes('st ')) return 'state_machine';
    if (message.includes('mem.')) return 'memory';
    if (message.includes('stream')) return 'streams';
    if (message.includes('@recover')) return 'self_healing';
    if (message.includes('pre:') || message.includes('post:')) return 'contracts';
    if (message.includes('budget')) return 'budget';
    if (message.includes('ext ')) return 'extensions';
    if (message.includes('#test')) return 'testing';
    return undefined;
  }
}

// Singleton
export const intelligence = new KodeIntelligence();
