import {
  Counter,
  Histogram,
  MetricOptions,
  metrics,
  ObservableCounter,
  ObservableGauge,
  ObservableResult,
  ObservableUpDownCounter,
  UpDownCounter,
} from '@opentelemetry/api-metrics';
import { OTEL_METER_NAME } from '../opentelemetry.constants';

export type GenericMetric = Counter | UpDownCounter | Histogram | ObservableGauge | ObservableCounter | ObservableUpDownCounter;

type MeterMethods = 'createHistogram' | 'createCounter' | 'createUpDownCounter' | 'createObservableGauge' | 'createObservableCounter' | 'createObservableUpDownCounter';

export enum MetricType {
  COUNTER = 'Counter',
  UP_DOWN_COUNTER = 'UpDownCounter',
  HISTOGRAM = 'Histogram',
  OBSERVABLE_GAUGE = 'ObservableGauge',
  OBSERVABLE_COUNTER = 'ObservableCounter',
  OBSERVABLE_UP_DOWN_COUNTER = 'ObservableUpDownCounter',
}

export const meterData: Map<string, GenericMetric> = new Map();

export function getOrCreateHistogram(name: string, options: MetricOptions): Histogram {
  return _createMeter<Histogram>('createHistogram', name, options);
}

export function getOrCreateCounter(name: string, options: MetricOptions): Counter {
  return _createMeter<Counter>('createCounter', name, options);
}

export function getOrCreateUpDownCounter(name: string, options: MetricOptions): UpDownCounter {
  return _createMeter<UpDownCounter>('createUpDownCounter', name, options);
}

export function getOrCreateObservableGauge(name: string, options: MetricOptions, callback?: (observableResult: ObservableResult) => void): ObservableGauge {
  return _createMeter<ObservableGauge>('createObservableGauge', name, options, callback);
}

export function getOrCreateObservableCounter(name: string, options: MetricOptions, callback?: (observableResult: ObservableResult) => void): ObservableCounter {
  return _createMeter<ObservableCounter>('createObservableCounter', name, options, callback);
}

export function getOrCreateObservableUpDownCounter(name: string, options: MetricOptions, callback?: (observableResult: ObservableResult) => void): ObservableUpDownCounter {
  return _createMeter<ObservableUpDownCounter>('createObservableUpDownCounter', name, options, callback);
}

function _createMeter<T extends GenericMetric>(meterMethod: MeterMethods, name: string, options: MetricOptions, callback?: (observableResult: ObservableResult) => void): T {
  if (meterData.has(name)) {
    return meterData.get(name) as T;
  }

  const meter = metrics.getMeterProvider().getMeter(OTEL_METER_NAME);

  const metric = callback ? meter[meterMethod](name, options, callback) : meter[meterMethod](name, options);

  meterData.set(name, metric);

  return metric as T;
}
