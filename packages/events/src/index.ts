import { EventSink, PerpetuoEvent } from './types';
import { FileSink, PostgresSink, ConsoleSink } from './sinks';

export * from './types';
export * from './sinks';

export class EventManager {
    private sinks: EventSink[] = [];

    constructor() {
        // Config logic usually happens outside, but here we can auto-configure based on ENV
        if (process.env.EVENT_LOG_FILE) {
            this.sinks.push(new FileSink(process.env.EVENT_LOG_FILE));
        }

        if (process.env.DATABASE_URL) {
            this.sinks.push(new PostgresSink(process.env.DATABASE_URL));
        }

        if (this.sinks.length === 0) {
            this.sinks.push(new ConsoleSink());
        }
    }

    async emit(event: PerpetuoEvent) {
        // Parallel emit, no await for performance? Or await?
        // "Fire and forget" usually for audit to not block latency, UNLESS strict audit requirement.
        // For V1 hardening, let's fire and forget but log errors.
        Promise.allSettled(this.sinks.map(s => s.emit(event))).catch(err => console.error('Event emit failed', err));
    }

    async close() {
        await Promise.all(this.sinks.map(s => s.close()));
    }
}
