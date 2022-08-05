import { BaseLogFields } from './gy-logger.types';

export class AbstractLogMessage<T extends BaseLogFields> {
  protected _fields = {
    msg: '',
  } as T

  constructor(message: string) {
    this._fields.msg = message
  }

  set(key: keyof T, value: T[keyof T]) {
    this._fields[key] = value
    return this;
  }

  level(level: BaseLogFields['level']) {
    this._fields.level = level;
    return this;
  }

  /**
   * Switches to Log mode. This enabled the methods that the Logger
   * will actually use to write the log
   */
  switchToLog(): LoggableLogMessage<T> {
    return new LoggableLogMessage<T>(this._fields);
  }
}

export class LoggableLogMessage<T extends BaseLogFields> {
  constructor(private readonly _fields: Partial<T> | BaseLogFields) { }

  getDetails() {
    return this._fields;
  }
}
