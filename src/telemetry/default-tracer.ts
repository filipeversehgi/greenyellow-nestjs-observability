import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { CompositePropagator, W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { NodeSDK as OriginalNodeSDK, NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import * as process from 'process';

type CreateTracingSdk = {
  metricEndpointPort: number;
  metricInterval: number;
  useNodeAutoInstrumentations: boolean;
};

export type NodeSDK = OriginalNodeSDK

export const createTracingSdk = (options: Partial<CreateTracingSdk>) => {
  const config: Partial<NodeSDKConfiguration> = {
    metricExporter: new PrometheusExporter({
      port: options.metricEndpointPort || 8081,
    }),
    metricInterval: options.metricEndpointPort || 6000,
    spanProcessor: new BatchSpanProcessor(new JaegerExporter()),
    contextManager: new AsyncLocalStorageContextManager(),
    textMapPropagator: new CompositePropagator({
      propagators: [
        new JaegerPropagator(),
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator(),
        new B3Propagator(),
        new B3Propagator({
          injectEncoding: B3InjectEncoding.MULTI_HEADER,
        }),
      ],
    }),
  };

  if (options.useNodeAutoInstrumentations) {
    config.instrumentations = [getNodeAutoInstrumentations()];
  }

  return new OriginalNodeSDK(config);
};

export const hookSdkShutdown = (sdk: NodeSDK) => {
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(
        () => console.log('SDK shut down successfully'),
        (err) => console.log('Error shutting down SDK', err),
      )
      .finally(() => process.exit(0));
  });
};

export const bootstrapSdk = (
  options: Partial<CreateTracingSdk> = {
    useNodeAutoInstrumentations: true,
  },
) => {
  const sdk = createTracingSdk(options);
  hookSdkShutdown(sdk);
  return sdk.start();
};
