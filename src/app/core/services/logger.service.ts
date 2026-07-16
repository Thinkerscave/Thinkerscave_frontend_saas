import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Centralised logger that replaces direct console calls.
 * Production builds default to warn/error only.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private level: LogLevel = environment.production ? 'warn' : 'debug';

  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...data: unknown[]): void {
    this.log('debug', message, data);
  }

  info(message: string, ...data: unknown[]): void {
    this.log('info', message, data);
  }

  warn(message: string, ...data: unknown[]): void {
    this.log('warn', message, data);
  }

  error(message: string, ...data: unknown[]): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data: unknown[]): void {
    if (this.levels[level] < this.levels[this.level]) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug': console.debug(prefix, message, ...data); break;
      case 'info':  console.info(prefix, message, ...data);  break;
      case 'warn':  console.warn(prefix, message, ...data);  break;
      case 'error': console.error(prefix, message, ...data); break;
    }
  }
}
