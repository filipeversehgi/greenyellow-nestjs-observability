import { LoggerModuleConfig } from './logger.type';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { Module, RequestMethod } from '@nestjs/common';
import { logger } from './pino-logger/logger';

@Module({})
export class LoggerModule {
  static forRoot(config: LoggerModuleConfig) {
    return {
      module: LoggerModule,
      imports: [
        PinoLoggerModule.forRoot({
          pinoHttp: {
            logger: logger(config),
          },
          exclude: config.loggerExclusions || [{ method: RequestMethod.ALL, path: 'health' }],
        }),
      ],
      controllers: [],
      providers: [
        {
          provide: LoggerModuleConfig,
          useValue: config,
        },
      ],
    };
  }
}
