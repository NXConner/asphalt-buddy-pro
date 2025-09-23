import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

let started = false;

export async function initTelemetry(): Promise<void> {
  if (started) return;

  const serviceName = process.env.OTEL_SERVICE_NAME || process.env.SERVICE_NAME || '@acme/api';
  const environment = process.env.NODE_ENV || 'development';
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
  });

  const traceExporter = new OTLPTraceExporter({
    // Accept both base endpoint and full traces path; SDK will append if only base provided
    url: otlpEndpoint.endsWith('/v1/traces') ? otlpEndpoint : `${otlpEndpoint.replace(/\/$/, '')}/v1/traces`,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();
  started = true;

  // Ensure clean shutdown
  const shutdown = async () => {
    try {
      await sdk.shutdown();
    } catch {
      // ignore
    }
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

