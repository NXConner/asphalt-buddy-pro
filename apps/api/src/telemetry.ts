// Minimal OpenTelemetry skeleton (expand with SDK/exporters later)
import { trace } from '@opentelemetry/api';

export function initTelemetry() {
  // Initialize tracer provider in real setup; here we just ensure API import isn't tree-shaken
  trace.getTracer('api');
}

