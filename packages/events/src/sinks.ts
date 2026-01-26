import fs from 'fs';
import { Pool } from 'pg';
import { EventSink, PerpetuoEvent } from './types';

// JSONL File Sink (Dev)
export class FileSink implements EventSink {
    private stream: fs.WriteStream;

    constructor(filePath: string) {
        this.stream = fs.createWriteStream(filePath, { flags: 'a' });
    }

    async emit(event: PerpetuoEvent): Promise<void> {
        const line = JSON.stringify(event) + '\n';
        if (!this.stream.write(line)) {
            await new Promise<void>(resolve => this.stream.once('drain', resolve));
        }
    }

    async close(): Promise<void> {
        return new Promise((resolve) => this.stream.end(resolve));
    }
}

// Postgres Sink (Prod)
export class PostgresSink implements EventSink {
    private pool: Pool;

    constructor(connectionString: string) {
        this.pool = new Pool({ connectionString });
    }

    async emit(event: PerpetuoEvent): Promise<void> {
        // We assume table 'events' exists.
        // Schema: id (uuid/text), tenant_id (text), type (text), payload (jsonb), created_at (timestamptz)
        try {
            await this.pool.query(
                `INSERT INTO events (id, tenant_id, type, payload, created_at) VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))`,
                [event.id, event.tenantId, event.type, event.meta || {}, event.timestamp]
            );
        } catch (err) {
            // Fallback or log? We don't want to crash the request loop if audit fails?
            // Ideally we queue these or have a circuit breaker for sink.
            console.error('Failed to emit event to Postgres', err);
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

// Console Sink (Fallback)
export class ConsoleSink implements EventSink {
    async emit(event: PerpetuoEvent): Promise<void> {
        console.log('[Audit]', JSON.stringify(event));
    }
    async close() { }
}
