import Pino, { LoggerOptions, destination, Logger } from 'pino';
import { trace, context } from '@opentelemetry/api';
import { LoggerModuleConfig } from '../logger.type';

const loggerOptions: LoggerOptions = {
  level: 'info',
  formatters: {
    level(label) {
      return { level: label };
    },

    log(object) {
      const span = trace.getSpan(context.active());
      if (!span) return { ...object };
      const { spanId, traceId } = trace.getSpan(context.active())?.spanContext();
      return { ...object, spanId, traceId };
    },
  },
  prettyPrint:
    process.env.NODE_ENV === 'local'
      ? {
          colorize: true,
          levelFirst: true,
          translateTime: true,
        }
      : false,
};

export const logger = (config: LoggerModuleConfig): Logger => {
  if (config.logFilePath) {
    return Pino(loggerOptions, destination(config.logFilePath));
  }

  return Pino(loggerOptions, destination(1));
};
