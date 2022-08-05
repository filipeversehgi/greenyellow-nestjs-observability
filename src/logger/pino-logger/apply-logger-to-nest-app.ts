import { INestApplication } from "@nestjs/common";
import { Logger } from "nestjs-pino";

export const ApplyLoggerToNestApp = (app: INestApplication) => {
    app.useLogger(app.get(Logger));
}