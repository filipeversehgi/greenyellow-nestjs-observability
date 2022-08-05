# NestJs Observability Lib

[OpenTelemetry](https://opentelemetry.io/) module for [Nest](https://github.com/nestjs/nest).

This repository is based on a fork of [NestJs Otel](https://raw.githubusercontent.com/pragmaticivan/nestjs-otel), more tailored
for the use we make inside our organization.

## What's Included

- Pino Logger
- OpenTelemetry + Node Auto Instrumentation
- Prometheus Metric Endpoint

The general idea is to:
- Have Pino Logger providing JSON-Text logs to stdout that will be captured by Promtail
- Have a /metrics endpoint with prometheus metric data that will be captured by their Service Discovery system
- Have a Tracing framework that will publish traces in the Jeager format to Grafana Tempo

## Prerequisites

- Node 14+
- NestJs 7+

## How to Install

### Install

```bash
npm i @gy/nestjs-observability --save-dev
yarn add @gy/nestjs-observability
```

### Configure the Env Vars

You need to pass the Telemetry endpoint via environment variables.
The endpoint will depend on where your Jaeger Collection will be deployed.

```
OTEL_SERVICE_NAME=ams-backoffice-api
OTEL_EXPORTER_JAEGER_ENDPOINT=http://localhost:14268/api/traces%
```

## How to Use

Please refer to each module own documentation:

- [Telemetry (Tracing and Metrics)](./src/telemetry/README.md)
- [Logger](./src/logger/README.md)

## How to Contribute

- After the improovements are done, bump the version in `package.json`
- Run `npm publish`