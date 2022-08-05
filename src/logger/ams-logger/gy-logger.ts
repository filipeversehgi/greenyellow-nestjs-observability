import { Logger } from '@nestjs/common';
import { BaseLogFields } from './gy-logger.types';
import { AbstractLogMessage } from './log-message';

export class GyLogger<T extends BaseLogFields> {
  private readonly _logger = new Logger(this._name);

  constructor(private readonly _name: string) {}

  log(message: AbstractLogMessage<T>) {
    const log = message.level('log').switchToLog();
    this._logger.log(log.getDetails());
  }

  debug(message: AbstractLogMessage<T>) {
    const log = message.level('debug').switchToLog();
    this._logger.debug(log.getDetails());
  }

  error(message: AbstractLogMessage<T>) {
    const log = message.level('error').switchToLog();
    this._logger.error(log.getDetails());
  }

  warn(message: AbstractLogMessage<T>) {
    const log = message.level('warn').switchToLog();
    this._logger.warn(log.getDetails());
  }
}
