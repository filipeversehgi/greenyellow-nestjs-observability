import { RouteInfo } from "@nestjs/common/interfaces";

export type LoggerModuleConfig = {
  logFilePath: string;
  loggerExclusions?: (string | RouteInfo)[]
};

export const LoggerModuleConfig = Symbol('LoggerModuleConfig');
