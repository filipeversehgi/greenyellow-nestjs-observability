import { Abstract, ModuleMetadata, Type } from '@nestjs/common';
import { Attributes } from '@opentelemetry/api-metrics';
import { RouteInfo } from '@nestjs/common/interfaces';

export type OpenTelemetryModuleOptions = {
  /**
   * OpenTelemetry Metrics Setup
   */
  metrics?: OpenTelemetryMetrics;
};

export interface IOpenTelemetryOptionsFactory {
  createOpenTelemetryOptions(): Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
}

/**
 * The options for the asynchronous Terminus module creation
 *
 * @publicApi
 */
export interface IOpenTelemetryModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * The name of the module
   */
  name?: string;
  /**
   * The class which should be used to provide the Terminus options
   */
  useClass?: Type<IOpenTelemetryOptionsFactory>;
  /**
   * Import existing providers from other module
   */
  useExisting?: Type<IOpenTelemetryOptionsFactory>;
  /**
   * The factory which should be used to provide the Terminus options
   */
  useFactory?: (...args: any[]) => Promise<OpenTelemetryModuleOptions> | OpenTelemetryModuleOptions;
  /**
   * The providers which should get injected
   */
  inject?: (string | symbol | ((...args: any[]) => any) | Type | Abstract<any>)[];
}

export type OpenTelemetryMetrics = {
  defaultMetrics?: boolean;
  hostMetrics?: boolean;
  apiMetrics?: {
    enable?: boolean;
    timeBuckets?: number[];
    requestSizeBuckets?: number[];
    responseSizeBuckets?: number[];
    defaultAttributes?: Attributes;
    ignoreRoutes?: (string | RouteInfo)[];
    ignoreUndefinedRoutes?: boolean;
  };
};
