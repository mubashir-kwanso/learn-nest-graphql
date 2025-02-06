import pino from 'pino';

export interface LoggerOptions {
  name: string;
  level?: pino.Level;
}

export class PinoLogger {
  static createLogger(options: LoggerOptions) {
    const {
      name,
      level = process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    } = options;

    return pino({
      name,
      level,
      // Development-friendly formatting
      ...(process.env.NODE_ENV !== 'production' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }),
    });
  }
}
