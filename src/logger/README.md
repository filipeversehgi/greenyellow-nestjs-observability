# Logger Module

## Purpose

This lib aims to instrument the entire application logging, by providing Modules, Service and specific classes for logging.

## How to Use

### Import the Module in your Apps Module

```ts
import { configuration } from '@config/config';
import { LoggerModule } from '@gy/observability/logger';

const LoggerModuleConfig = LoggerModule.forRoot({
  logFilePath: configuration().logger.backofficeApiLogPath,
  exclusions: [{ method: RequestMethod.ALL, path: 'health' }] // Optional. By default, excludes all requests of the path HEALTH
});

@Module({
  imports: [LoggerModuleConfig],
})
export class YourAppModule {}
```

### Configure NestJs to use the Log

```ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { YourAppModule } from './your-app.module';
import { ApplyLoggerToNestApp } from '@gy/observability/logger';

async function bootstrap() {
  const app = await NestFactory.create(YourAppModule);
  
  ApplyLoggerToNestApp(app) // >> Add this

  await app.listen(3001);
}

bootstrap();
```

### Create your Log Message Class and Type

A LogMessage class is your log Data Dictionary. It will be use to provide a standarialized way of logging strict typed information.
Here, we have two examples of LogMessages implementation in the "Examples" folder of this project.

```ts
import { BaseLogFields, AbstractLogMessage } from '@gy/observability/logger';


export type TLogMessage = BaseLogFields & {
    userMail: string,
    userAge: number,

}

export class LogMessage extends AbstractLogMessage<TLogMessage> {
    constructor(message: string) {
        super(message)
    }

    /**
     * The System User Email
     * @param email 
     */
    userMail(email: string) {
        return this.set('userMail', email);
    }

    /**
     * The System User Age, in numbers
     * @param age
     */
    userAge(age: number) {
        return this.set('userAge', age)
    }
}
```

AbstractLogMessage already provides a strictly typed method called `set` to control the logged information.



### Use in your Services

```ts
import { GyLogger, LogMessage } from '@gy/observability/logger';
import { Injectable } from '@nestjs/common';
import { TLogMessage, LogMessage } from './somewhere/only/we/know'

@Injectable()
export class YourService {
  private _logger = new AmsLogger<TLogMessage>(YourService.name);

  async yourMethod(): Promise<string> {
    const message = new LogMessage('This is a Test Message').user('test@teste.com');
    this._logger.log(message);
    this._logger.debug(message);
    this._logger.error(message);
    this._logger.warn(message);
  }
}
```

## Log Levels

This library has 4 levels to use in your logs.
Those levels are also added as a key when you log.

- Log: For transactionals and important messages.
- Debug: For debug oriented log readings. We will only view this info when searching for problems.
- Error: For non captured errors. This level will be used by automated logged everytime somethings throws, for instance.
- Warn: For captured errors, when something happened but was not supposed to.age on a queue, for instance.
