import { GyLogger } from './gy-logger';
import { BaseLogFields } from './gy-logger.types';
import { AbstractLogMessage } from './log-message';

type ExampleLogFields = BaseLogFields & {
  user?: string; // User E-mail
};

export class ExampleLogMessage extends AbstractLogMessage<ExampleLogFields> {
  constructor(message: string) {
    super(message)
  }

  user(userEmail: string) {
    this._fields.user = userEmail;
    return this;
  }
}

const mockLogger = (logger: GyLogger<ExampleLogFields>) => {
  (logger as any)._logger = {
    log: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
};
describe('GY Logger', () => {
  const logger = new GyLogger('TestLogger');
  mockLogger(logger);
  it('Should properly assign Log Level to Log Method', () => {
    const message = new ExampleLogMessage('');
    logger.log(message);
    expect(message.switchToLog().getDetails().level).toBe('log');
  });

  it('Should properly assign Debug Level to Debug Method', () => {
    const message = new ExampleLogMessage('');
    logger.debug(message);
    expect(message.switchToLog().getDetails().level).toBe('debug');
  });

  it('Should properly assign Error Level to Error Method', () => {
    const message = new ExampleLogMessage('');
    logger.error(message);
    expect(message.switchToLog().getDetails().level).toBe('error');
  });

  it('Should properly assign Warn Level to Warn Method', () => {
    const message = new ExampleLogMessage('');
    logger.warn(message);
    expect(message.switchToLog().getDetails().level).toBe('warn');
  });

  it('Should properly use log conversion methods', () => {
    const message = new ExampleLogMessage('Test Message').user('Test');
    expect(message.switchToLog().getDetails()).toEqual({
      user: 'Test',
      msg: 'Test Message',
    });
  });
});

describe('Log Message', () => {
  it('Should properly use log conversion methods', () => {
    const message = new ExampleLogMessage('Test Message').user('Test');
    expect(message.switchToLog().getDetails()).toEqual({
      user: 'Test',
      msg: 'Test Message',
    });
  });
});
