import { DynamicModule, Global, Inject, MiddlewareConsumer, Module, OnApplicationBootstrap, Provider } from '@nestjs/common';
import { metrics } from '@opentelemetry/api-metrics';
import { HostMetrics } from '@opentelemetry/host-metrics';

import { IOpenTelemetryModuleAsyncOptions, IOpenTelemetryOptionsFactory, OpenTelemetryModuleOptions } from './interfaces';
import { MetricService } from './metrics/metric.service';
import { ApiMetricsMiddleware } from './middleware';
import { OPENTELEMETRY_MODULE_OPTIONS } from './opentelemetry.constants';
import { TraceService } from './tracing/trace.service';

/**
 * The internal OpenTelemetry Module which handles the integration
 * with the third party OpenTelemetry library and Nest
 *
 * @internal
 */
@Global()
@Module({})
class OpenTelemetryCoreModule implements OnApplicationBootstrap {
  constructor(
    @Inject(OPENTELEMETRY_MODULE_OPTIONS)
    private readonly _options: OpenTelemetryModuleOptions = {},
  ) {}

  /**
   * Bootstraps the internal OpenTelemetry Module with the given options
   * synchronously and sets the correct providers
   * @param options The options to bootstrap the module synchronously
   */
  static forRoot(options: OpenTelemetryModuleOptions = { metrics: {} }): DynamicModule {
    const openTelemetryModuleOptions = {
      provide: OPENTELEMETRY_MODULE_OPTIONS,
      useValue: options,
    };

    return {
      module: OpenTelemetryCoreModule,
      providers: [openTelemetryModuleOptions, TraceService, MetricService],
      exports: [TraceService, MetricService],
    };
  }

  /**
   * Bootstraps the internal OpenTelemetry Module with the given
   * options asynchronously and sets the correct providers
   * @param options The options to bootstrap the module
   */
  static forRootAsync(options: IOpenTelemetryModuleAsyncOptions): DynamicModule {
    const asyncProviders = this._createAsyncProviders(options);
    return {
      module: OpenTelemetryModule,
      imports: [...(options.imports || [])],
      providers: [...asyncProviders, TraceService, MetricService],
      exports: [TraceService, MetricService],
    };
  }

  /**
   * Returns the asynchrnous OpenTelemetry options providers depending on the
   * given module options
   * @param options Options for the asynchrnous OpenTelemetry module
   */
  private static _createAsyncOptionsProvider(options: IOpenTelemetryModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: OPENTELEMETRY_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    if (options.useClass || options.useExisting) {
      const inject = [options.useClass || options.useExisting];
      return {
        provide: OPENTELEMETRY_MODULE_OPTIONS,
        // eslint-disable-next-line max-len
        useFactory: async (optionsFactory: IOpenTelemetryOptionsFactory) => optionsFactory.createOpenTelemetryOptions(),
        inject,
      };
    }

    throw new Error();
  }

  /**
   * Returns the asynchrnous providers depending on the given module
   * options
   * @param options Options for the asynchrnous OpenTelemetry module
   */
  private static _createAsyncProviders(options: IOpenTelemetryModuleAsyncOptions): Provider[] {
    if (options.useFactory || options.useExisting) {
      return [this._createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass;
    return [
      this._createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
        inject: [...(options.inject || [])],
      },
    ];
  }

  configure(consumer: MiddlewareConsumer) {
    const { apiMetrics = { enable: false } } = this._options?.metrics;

    if (!apiMetrics.enable) return;

    consumer.apply(ApiMetricsMiddleware);

    if (apiMetrics?.ignoreRoutes && apiMetrics?.ignoreRoutes.length > 0) {
      consumer
        .apply(ApiMetricsMiddleware)
        .exclude(...apiMetrics.ignoreRoutes)
        .forRoutes('*');
      return;
    }

    consumer.apply(ApiMetricsMiddleware).forRoutes('*');
  }

  async onApplicationBootstrap() {
    let defaultMetrics = false;
    let hostMetrics = false;

    if (this._options?.metrics) {
      defaultMetrics = this._options.metrics.defaultMetrics !== undefined ? this._options.metrics.defaultMetrics : false;
      hostMetrics = this._options.metrics.hostMetrics !== undefined ? this._options.metrics.hostMetrics : false;
    }

    const meterProvider = metrics.getMeterProvider();

    if (defaultMetrics) {
      // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
      require('opentelemetry-node-metrics')(meterProvider);
    }

    if (hostMetrics) {
      // For some reason meterProvider type does not match here.
      const host = new HostMetrics({
        meterProvider: meterProvider as any,
        name: 'host-metrics',
      });
      host.start();
    }
  }
}

/**
 * The NestJS module for OpenTelemetry
 *
 * @publicApi
 */
@Module({})
export class OpenTelemetryModule {
  /**
   * Bootstraps the OpenTelemetry Module synchronously
   * @param options The options for the OpenTelemetry Module
   */
  static forRoot(options?: OpenTelemetryModuleOptions): DynamicModule {
    return {
      module: OpenTelemetryModule,
      imports: [OpenTelemetryCoreModule.forRoot(options)],
    };
  }

  /**
   * Bootstrap the OpenTelemetry Module asynchronously
   * @see https://dev.to/nestjs/advanced-nestjs-how-to-build-completely-dynamic-nestjs-modules-1370
   * @param options The options for the OpenTelemetry module
   */
  static forRootAsync(options: IOpenTelemetryModuleAsyncOptions): DynamicModule {
    return {
      module: OpenTelemetryModule,
      imports: [OpenTelemetryCoreModule.forRootAsync(options)],
    };
  }
}
