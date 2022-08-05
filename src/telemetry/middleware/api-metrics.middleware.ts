import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import * as responseTime from 'response-time';
import * as urlParser from 'url';
import { Attributes, Counter, Histogram } from '@opentelemetry/api-metrics';
import { OpenTelemetryModuleOptions } from '../interfaces';
import { MetricService } from '../metrics/metric.service';
import { OPENTELEMETRY_MODULE_OPTIONS } from '../opentelemetry.constants';

export const DEFAULT_LONG_RUNNING_REQUEST_BUCKETS = [
  0.005,
  0.01,
  0.025,
  0.05,
  0.1,
  0.25,
  0.5,
  1,
  2.5,
  5,
  10, // standard
  30,
  60,
  120,
  300,
  600, // Sometimes requests may be really long-running
];
export const DEFAULT_REQUEST_SIZE_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
export const DEFAULT_RESPONSE_SIZE_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {
  private readonly _defaultLongRunningRequestBuckets = DEFAULT_LONG_RUNNING_REQUEST_BUCKETS;

  private readonly _defaultRequestSizeBuckets = DEFAULT_REQUEST_SIZE_BUCKETS;

  private readonly _defaultResponseSizeBuckets = DEFAULT_RESPONSE_SIZE_BUCKETS;

  private _requestTotal: Counter;

  private _responseTotal: Counter;

  private _responseSuccessTotal: Counter;

  private _responseErrorTotal: Counter;

  private _responseClientErrorTotal: Counter;

  private _responseServerErrorTotal: Counter;

  private _serverAbortsTotal: Counter;

  private _requestDuration: Histogram;

  private _requestSizeHistogram: Histogram;

  private _responseSizeHistogram: Histogram;

  private readonly _defaultAttributes: Attributes;

  private readonly _ignoreUndefinedRoutes: boolean;

  constructor(
    private readonly _metricService: MetricService,
    @Inject(OPENTELEMETRY_MODULE_OPTIONS)
    private readonly _options: OpenTelemetryModuleOptions = {},
  ) {
    this._requestTotal = this._metricService.getCounter('http_request_total', {
      description: 'Total number of HTTP requests',
    });

    this._responseTotal = this._metricService.getCounter('http_response_total', {
      description: 'Total number of HTTP responses',
    });

    this._responseSuccessTotal = this._metricService.getCounter('http_response_success_total', {
      description: 'Total number of all successful responses',
    });

    this._responseErrorTotal = this._metricService.getCounter('http_response_error_total', {
      description: 'Total number of all response errors',
    });

    this._responseClientErrorTotal = this._metricService.getCounter('http_client_error_total', {
      description: 'Total number of client error requests',
    });

    this._responseServerErrorTotal = this._metricService.getCounter('http_server_error_total', {
      description: 'Total number of server error requests',
    });

    this._serverAbortsTotal = this._metricService.getCounter('http_server_aborts_total', {
      description: 'Total number of data transfers aborted',
    });

    const { timeBuckets = [], requestSizeBuckets = [], responseSizeBuckets = [], defaultAttributes = {}, ignoreUndefinedRoutes = false } = _options?.metrics?.apiMetrics;

    this._defaultAttributes = defaultAttributes;
    this._ignoreUndefinedRoutes = ignoreUndefinedRoutes;

    this._requestDuration = this._metricService.getHistogram('http_request_duration_seconds', {
      boundaries: timeBuckets.length > 0 ? timeBuckets : this._defaultLongRunningRequestBuckets,
      description: 'HTTP latency value recorder in seconds',
    });

    this._requestSizeHistogram = this._metricService.getHistogram('http_request_size_bytes', {
      boundaries: requestSizeBuckets.length > 0 ? requestSizeBuckets : this._defaultRequestSizeBuckets,
      description: 'Current total of incoming bytes',
    });

    this._responseSizeHistogram = this._metricService.getHistogram('http_response_size_bytes', {
      boundaries: responseSizeBuckets.length > 0 ? responseSizeBuckets : this._defaultResponseSizeBuckets,
      description: 'Current total of outgoing bytes',
    });
  }

  private static _getStatusCodeClass(code: number): string {
    if (code < 200) return 'info';
    if (code < 300) return 'success';
    if (code < 400) return 'redirect';
    if (code < 500) return 'client_error';
    return 'server_error';
  }

  use(parentReq, parentRes, parentNext) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    responseTime((req, res, time) => {
      const { route, url, method } = req;
      let path;

      if (route) {
        path = route.path;
      } else if (this._ignoreUndefinedRoutes) {
        return;
      } else {
        path = new urlParser.URL(url).pathname;
      }

      this._requestTotal.add(1, { method, path });

      const requestLength = parseInt(req.headers['content-length'], 10) || 0;
      const responseLength: number = parseInt(res.getHeader('Content-Length'), 10) || 0;

      const status = res.statusCode || 500;
      const attributes: Attributes = {
        method,
        status,
        path,
        ...this._defaultAttributes,
      };

      this._requestSizeHistogram.record(requestLength, attributes);
      this._responseSizeHistogram.record(responseLength, attributes);

      this._responseTotal.add(1, attributes);
      this._requestDuration.record(time / 1000, attributes);

      const codeClass = ApiMetricsMiddleware._getStatusCodeClass(status);

      // eslint-disable-next-line default-case
      switch (codeClass) {
        case 'success':
          this._responseSuccessTotal.add(1);
          break;
        case 'redirect':
          // TODO: Review what should be appropriate for redirects.
          this._responseSuccessTotal.add(1);
          break;
        case 'client_error':
          this._responseErrorTotal.add(1);
          this._responseClientErrorTotal.add(1);
          break;
        case 'server_error':
          this._responseErrorTotal.add(1);
          this._responseServerErrorTotal.add(1);
          break;
      }

      req.on('end', () => {
        if (req.aborted === true) {
          this._serverAbortsTotal.add(1);
        }
      });
    })(parentReq, parentRes, parentNext);
  }
}
