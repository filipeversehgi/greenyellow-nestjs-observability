# Telemetry Module

[OpenTelemetry](https://opentelemetry.io/) module for [Nest](https://github.com/nestjs/nest).

This is a improvement on top of a fork of [NestJs Otel](https://raw.githubusercontent.com/pragmaticivan/nestjs-otel)

## How to Use

1. Create tracing file `tracer.ts` inside your app `src` folder:

```ts
import {
  createTracingSdk,
  hookSdkShutdown,
} from '@observability/observability';

const otelSDK = createTracingSdk({
  useNodeAutoInstrumentations: true,
  // metricEndpointPort: Defaults to 8081;
  // metricInterval: Defaults to 6000;
});

hookSdkShutdown(otelSDK);

export { otelSDK };
```

2. Import the metric file and start otel node SDK in your `src/main.ts` file:

```ts
import otelSDK from './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  // Start SDK before nestjs factory create
  await otelSDK.start();

  const app = await NestFactory.create(AppModule);

  // Enables NestJs Shutdown Hooks to Graceful shutdown the SDK
  app.enableShutdownHooks();

  await app.listen(3000);
}

bootstrap();
```

3. Configure the Module and import inside your AppModule:

```ts

const OtelModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true, // Includes Host Metrics
    defaultMetrics: true, // Includes Default Metrics
    apiMetrics: {
      enable: true, // Includes api metrics
      timeBuckets: [], // You can change the default time buckets
      defaultLabels: { // You can set default labels for api metrics
        custom: 'label'
      },
      ignoreRoutes: ['/favicon.ico'], // You can ignore specific routes (See https://docs.nestjs.com/middleware#excluding-routes for options)
      ignoreUndefinedRoutes: false, //Records metrics for all URLs, even undefined ones
    },
  },
});

@Module({
  imports: [
    OtelModuleConfig,
  ],
  controllers: [AmsBackofficeApiController],
  providers: [
    AmsBackofficeApiService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorsInterceptor,
    },
  ],
})
export class AmsBackofficeApiModule {}
```

# The Methods

## Span Decorator

If you need, you can define a custom Tracing Span for a method. It works async or sync. Span takes its name from the parameter; but by default, it is the same as the method's name

```ts
import { Span } from 'nestjs-otel';

@Span('CRITICAL_SECTION')
async getBooks() {
    return [`Harry Potter and the Philosopher's Stone`];
}
```

## Tracing Service

In case you need to access native span methods for special logics in the method block:

```ts
import { TraceService } from 'nestjs-otel';

@Injectable()
export class BookService {
  constructor(private readonly traceService: TraceService) {}

  @Span()
  async getBooks() {
    const currentSpan = this.traceService.getSpan(); // --> retrives current span, comes from http or @Span
    await this.doSomething();
    currentSpan.addEvent('event 1');
    currentSpan.end(); // current span end

    const span = this.traceService.startSpan('sub_span'); // start new span
    span.setAttributes({ userId: 1 });
    await this.doSomethingElse();
    span.end(); // new span ends
    return [`Harry Potter and the Philosopher's Stone`];
  }
}
```

## Metric Service

[OpenTelemetry Metrics](https://www.npmjs.com/package/@opentelemetry/api-metrics) allow a user to collect data and export it to metrics backend like Prometheus.

```ts
import { MetricService } from 'nestjs-otel';
import { Counter } from '@opentelemetry/api-metrics';

@Injectable()
export class BookService {
  private customMetricCounter: Counter;

  constructor(private readonly metricService: MetricService) {
    this.customMetricCounter = this.metricService.getCounter('custom_counter', {
      description: 'Description for counter',
    });
  }

  async getBooks() {
    this.customMetricCounter.add(1);
    return [`Harry Potter and the Philosopher's Stone`];
  }
}
```

## Metric Decorators

### Metric Class Instances

If you want to count how many instance of a specific class has been created:

```ts
@OtelInstanceCounter() // It will generate a counter called: app_MyClass_instances_total.
export class MyClass {

}
```

### Metric Class Method

If you want to increment a counter on each call of a specific method:

```ts
@Injectable()
export class MyService {
  @OtelMethodCounter()
  doSomething() {

  }
}
@Controller()
export class AppController {
  @Get()
  @OtelMethodCounter() // It will generate `app_AppController_doSomething_calls_total` counter.
  doSomething() {
    // do your stuff
  }
}
```

### Metric Param Decorator

You have the following decorators:

* `@OtelCounter()`
* `@OtelUpDownCounter()`
* `@OtelHistogram()`
* `@OtelObservableGauge()`
* `@OtelObservableCounter()`
* `@OtelObservableUpDownCounter()`

Example of usage:

```ts
import { OtelCounter } from 'nestjs-otel';
import { Counter } from '@opentelemetry/api-metrics';

@Controller()
export class AppController {

  @Get('/home')
  home(
    @OtelCounter('app_counter_1_inc', { description: 'counter 1 description' }) counter1: Counter,
  ) {
    counter1.add(1);
  }
}

```

## API Metrics with Middleware

Impl |Metric |Description| Labels | Metric Type
--- | --- | --- | --- | ---
| ✅ | http_request_total | Total number of HTTP requests.| method, path | Counter |
| ✅ | http_response_total| Total number of HTTP responses.| method, status, path | Counter |
| ✅ | http_response_success_total| Total number of all successful responses.| - | Counter |
| ✅ | http_response_error_total| Total number of all response errors.| - | Counter |
| ✅ | http_request_duration_seconds | HTTP latency value recorder in seconds. | method, status, path | Histogram |
| ✅ | http_client_error_total | Total number of client error requests. | - | Counter |
| ✅ | http_server_error_total | Total number of server error requests. | - | Counter |
| ✅ | http_server_aborts_total | Total number of data transfers aborted. | - | Counter |
| ✅ | http_request_size_bytes | Current total of incoming bytes. | - | Histogram|
| ✅ | http_response_size_bytes | Current total of outgoing bytes. | - | Histogram |

## Prometheus Metrics

When `metricExporter` is defined in otel SDK with a `PrometheusExporter`it will start a new process on port `8081` (default port) and metrics will be available at `http://localhost:8081/metrics`.

## Using with a logger

### Pino with instrumentation

This approach uses otel instrumentation to automatically inject spanId and traceId.

```ts
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';

const otelSDK = new NodeSDK({
  instrumentations: [new PinoInstrumentation()],
});
```

### Pino with custom formatter

This approach uses the global trace context for injecting SpanId and traceId as a property of your structured log.

```ts
import Pino, { Logger } from 'pino';
import { LoggerOptions } from 'pino';
import { trace, context } from '@opentelemetry/api';

export const loggerOptions: LoggerOptions = {
  formatters: {
    log(object) {
      const span = trace.getSpan(context.active());
      if (!span) return { ...object };
      const { spanId, traceId } = trace.getSpan(context.active())?.spanContext();
      return { ...object, spanId, traceId };
    },
  },
};

export const logger: Logger = Pino(loggerOptions);
```
