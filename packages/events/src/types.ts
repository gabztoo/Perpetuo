export type EventType =
    | 'request_received'
    | 'decision_made'
    | 'provider_attempt'
    | 'provider_failure'
    | 'request_succeeded'
    | 'request_failed'
    | 'quota_blocked';

export interface PerpetuoEvent {
    id: string;
    type: EventType;
    tenantId: string;
    requestId: string;
    timestamp: number;
    meta?: any;
}

export interface EventSink {
    emit(event: PerpetuoEvent): Promise<void>;
    close(): Promise<void>;
}
